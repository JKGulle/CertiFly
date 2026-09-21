// Starts the Postgres container defined in docker-compose.yml. Safe to run
// repeatedly: docker compose is a no-op if it's already up.
import { spawn } from "node:child_process";
import net from "node:net";

const PORT = 5432;

function isPortOpen(port, host = "127.0.0.1") {
  return new Promise((resolve) => {
    const socket = net.createConnection({ port, host });
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("error", () => resolve(false));
  });
}

await new Promise((resolve, reject) => {
  const child = spawn("docker", ["compose", "up", "-d", "db"], { stdio: "inherit" });
  child.once("exit", (code) => (code === 0 ? resolve() : reject(new Error(`docker compose exited with code ${code}`))));
  child.once("error", reject);
});

for (let attempt = 0; attempt < 30; attempt++) {
  if (await isPortOpen(PORT)) {
    console.log(`Postgres is up on localhost:${PORT}.`);
    process.exit(0);
  }
  await new Promise((resolve) => setTimeout(resolve, 500));
}

console.error(`Postgres didn't come up within 15s — check "docker compose logs db".`);
process.exit(1);
