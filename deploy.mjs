import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const accountId = "f30bdf38ecd57f8bbeb2484923a90b8b";
const wrangler = fileURLToPath(new URL("./node_modules/wrangler/bin/wrangler.js", import.meta.url));
const result = spawnSync(process.execPath, [wrangler, "pages", "deploy", "dist", "--branch=2026.10"], {
  stdio: "inherit",
  env: { ...process.env, CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID ?? accountId },
});
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
