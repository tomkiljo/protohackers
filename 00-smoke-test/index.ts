import net from "node:net";

const port = 10000 as const;

const server = net.createServer((socket) => {
  socket.pipe(socket);
});

server.on("listening", () => console.log(`server running on port ${port}`));
server.on("connection", (socket) => console.log("connection"));
server.on("error", console.error);

server.listen(port);
