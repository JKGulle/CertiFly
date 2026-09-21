// Stops (and removes) the Postgres container started by db-up.mjs. The
// named volume in docker-compose.yml keeps the data across restarts.
import { spawn } from "node:child_process";

const child = spawn("docker", ["compose", "down"], { stdio: "inherit" });
child.once("exit", (code) => {
  if (code === 0) {
    console.log("Postgres stopped.");
  } else {
    console.error(`docker compose down exited with code ${code}`);
  }
  process.exit(code ?? 1);
});
child.once("error", (err) => {
  console.error("Failed to run docker compose:", err.message);
  process.exit(1);
});
