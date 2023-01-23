import net, { Socket } from "node:net";

const port = 10006 as const;
const server = net.createServer((socket) => {});

server.on("listening", () =>
  console.log("SERV:", `server running on port ${port}`)
);
server.on("connection", (socket) =>
  console.log(
    "SERV:",
    `connection from ${socket.remoteAddress}:${socket.remotePort}`
  )
);
server.on("error", (err) => console.error("SERV:", err));

server.listen(port);
