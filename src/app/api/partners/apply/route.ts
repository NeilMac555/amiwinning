import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Creator partner applications are closed." },
    { status: 410 },
  );
}
