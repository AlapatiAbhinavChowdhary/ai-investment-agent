const net = require("net");

const port = parseInt(process.argv[2], 10) || 5000;
const host = process.argv[3] || "127.0.0.1";
const timeout = 60000; // 60 seconds timeout
const start = Date.now();

console.log(`⏳ Waiting for backend server to start on http://${host}:${port}...`);

function check() {
  const socket = new net.Socket();
  socket.setTimeout(1000);

  socket.on("connect", () => {
    socket.destroy();
    console.log(`✅ Backend server on http://${host}:${port} is ready! Starting frontend dev server...`);
    process.exit(0);
  });

  socket.on("timeout", () => {
    socket.destroy();
    retry();
  });

  socket.on("error", () => {
    socket.destroy();
    retry();
  });

  socket.connect(port, host);
}

function retry() {
  if (Date.now() - start > timeout) {
    console.error(`❌ Timeout: Backend server at http://${host}:${port} did not start within ${timeout / 1000}s`);
    process.exit(1);
  }
  setTimeout(check, 500);
}

check();
