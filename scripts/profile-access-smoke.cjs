/* eslint-disable @typescript-eslint/no-require-imports */
// Smoke test for the account-gated profile pages. Run against a built
// app (`npm run build && npm start`) because it reads the server action
// manifest from .next.
//
//   PROFILE_TEST_URL    base URL of the running app (default 127.0.0.1:3047)
//   PROFILE_TEST_HANDLE the gated handle to probe (default neilmac555)
//   PROFILE_TEST_PATHS  comma-separated gated book paths to probe, e.g.
//                       "/handle/book-one,/handle/book-two". Defaults to
//                       the one public-facing book. Other book names are
//                       kept out of the repo on purpose: pass them here.
const fs = require("fs");

(async () => {
  const base = process.env.PROFILE_TEST_URL || "http://127.0.0.1:3047";
  const handle = process.env.PROFILE_TEST_HANDLE || "neilmac555";
  const extra = (process.env.PROFILE_TEST_PATHS || `/${handle}/sharpsidesoccer`)
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);

  for (const path of [`/${handle}`, ...extra]) {
    const res = await fetch(base + path);
    const html = await res.text();
    if (
      !res.ok ||
      !html.includes("Checking your session") ||
      html.includes("Lifetime P/L") ||
      html.includes("profile-pl-value") ||
      html.includes("equityPoints")
    ) {
      throw Error("Gate failed " + path);
    }
    console.log("PASS signed-out HTML contains gate, no report:", path);
  }

  const manifest = JSON.parse(
    fs.readFileSync(".next/server/server-reference-manifest.json", "utf8"),
  );
  const action = Object.entries(manifest.node).find(
    ([, v]) => v.exportedName === "loadProtectedReport",
  );
  if (!action) {
    console.log(
      "Action manifest keys",
      Object.values(manifest.node).map((x) => x.exportedName),
    );
    throw Error("Action missing");
  }
  const res = await fetch(base + `/${handle}`, {
    method: "POST",
    headers: {
      "Next-Action": action[0],
      "Content-Type": "text/plain;charset=UTF-8",
      Origin: base,
    },
    body: JSON.stringify(["invalid-token", handle]),
  });
  const text = await res.text();
  if (text.includes("profile-pl-value") || !text.includes("digest")) {
    throw Error("Invalid token not rejected");
  }
  console.log("PASS forged access token rejected");

  const sample = await fetch(base + "/sample");
  if (!(await sample.text()).includes("Lifetime P/L")) throw Error("Sample broken");
  console.log("PASS sample still accessible");
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
