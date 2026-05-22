// File parsing: CSV via a small RFC-4180-ish parser (handles quoted fields with
// commas and escaped quotes), XLSX via SheetJS. Output is a uniform ParsedFile.

import * as XLSX from "xlsx";
import type { ParsedFile } from "./types";

function parseCsv(text: string): string[][] {
  // Strip BOM
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cell += c;
      }
    } else {
      if (c === '"') {
        inQuotes = true;
      } else if (c === ",") {
        row.push(cell);
        cell = "";
      } else if (c === "\r") {
        // skip; \n handles the line break
      } else if (c === "\n") {
        row.push(cell);
        rows.push(row);
        row = [];
        cell = "";
      } else {
        cell += c;
      }
    }
  }
  // Flush trailing
  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  // Drop trailing entirely-empty rows
  while (rows.length && rows[rows.length - 1].every((c) => c.trim() === "")) {
    rows.pop();
  }
  return rows;
}

function pickHeaderRow(rows: string[][]): number {
  // First row with at least 2 non-empty cells and a "looks like header" feel
  // (most cells non-numeric).
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const r = rows[i];
    const nonEmpty = r.filter((c) => c.trim() !== "");
    if (nonEmpty.length < 2) continue;
    const numericCount = nonEmpty.filter((c) => !isNaN(parseFloat(c))).length;
    if (numericCount / nonEmpty.length < 0.5) return i;
  }
  return 0;
}

function buildParsedFile(
  rawRows: string[][],
  sourceName: string,
): ParsedFile {
  if (rawRows.length === 0) {
    return { headers: [], rows: [], totalRows: 0, sourceName };
  }
  const headerIdx = pickHeaderRow(rawRows);
  const headers = rawRows[headerIdx].map((h) => h.trim());
  const rows = rawRows.slice(headerIdx + 1).filter((r) =>
    r.some((c) => c.trim() !== ""),
  );
  // Normalise row widths to header count.
  const width = headers.length;
  const padded = rows.map((r) => {
    const out = r.slice(0, width);
    while (out.length < width) out.push("");
    return out.map((c) => c.trim());
  });
  return { headers, rows: padded, totalRows: padded.length, sourceName };
}

export async function parseFile(file: File): Promise<ParsedFile> {
  const name = file.name;
  const lower = name.toLowerCase();
  if (lower.endsWith(".csv") || lower.endsWith(".tsv") || lower.endsWith(".txt")) {
    const text = await file.text();
    let rawRows: string[][];
    if (lower.endsWith(".tsv")) {
      rawRows = text.split(/\r?\n/).map((line) => line.split("\t"));
      // strip trailing empty rows
      while (rawRows.length && rawRows[rawRows.length - 1].every((c) => c.trim() === "")) {
        rawRows.pop();
      }
    } else {
      rawRows = parseCsv(text);
    }
    return buildParsedFile(rawRows, name);
  }
  if (lower.endsWith(".xlsx") || lower.endsWith(".xls") || lower.endsWith(".xlsm")) {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array", cellDates: false });
    const sheetName = wb.SheetNames[0];
    const ws = wb.Sheets[sheetName];
    const aoa = XLSX.utils.sheet_to_json<string[]>(ws, {
      header: 1,
      raw: false,
      defval: "",
    });
    const rawRows = aoa.map((r) =>
      r.map((c) => (c == null ? "" : String(c))),
    );
    return buildParsedFile(rawRows, name);
  }
  throw new Error(
    `Unsupported file type: ${name}. Use .csv, .tsv, .xlsx, or .xls.`,
  );
}
