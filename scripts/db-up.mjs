// Starts the local MySQL server as a plain background process (not a
// Windows service — registering one needs admin elevation). Safe to run
// repeatedly: it's a no-op if MySQL is already listening on 3306.
import { spawn } from "node:child_process";
import net from "node:net";

const MYSQLD = String.raw`C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqld.exe`;
const CONFIG = String.raw`C:\ProgramData\MySQL\MySQL Server 8.4\my.ini`;
const PORT = 3306;

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

if (await isPortOpen(PORT)) {
  console.log(`MySQL is already running on localhost:${PORT}.`);
  process.exit(0);
}

const child = spawn(MYSQLD, [`--defaults-file=${CONFIG}`], {
  detached: true,
  stdio: "ignore",
});
child.unref();
console.log(`Starting MySQL (pid ${child.pid})...`);

for (let attempt = 0; attempt < 20; attempt++) {
  await new Promise((resolve) => setTimeout(resolve, 500));
  if (await isPortOpen(PORT)) {
    console.log(`MySQL is up on localhost:${PORT}.`);
    process.exit(0);
  }
}

console.error(
  `MySQL didn't come up within 10s — check "C:\\ProgramData\\MySQL\\MySQL Server 8.4" for error logs.`
);
process.exit(1);
