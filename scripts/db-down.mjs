// Gracefully shuts down the local MySQL server started by db-up.mjs.
// Uses mysqladmin (not taskkill) so InnoDB flushes cleanly on shutdown.
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const MYSQLADMIN = String.raw`C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqladmin.exe`;

// Local dev-only credential, set up once by the native MySQL setup in
// README.md — not a production secret.
const ROOT_PASSWORD = "certifly_root";

try {
  await execFileAsync(MYSQLADMIN, ["-u", "root", `-p${ROOT_PASSWORD}`, "shutdown"]);
  console.log("MySQL stopped.");
} catch (err) {
  console.log("MySQL wasn't running (or already stopped).", err.message);
}
