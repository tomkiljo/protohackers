import net from "node:net";
import * as readline from "node:readline/promises";
import { z } from "zod";

const port = 10001 as const;

const Request = z.object({
  method: z.literal("isPrime"),
  number: z.number(),
});
type Request = z.infer<typeof Request>;

const safeParse = (input: string) => {
  try {
    return Request.parse(JSON.parse(input));
  } catch (err) {
    return undefined;
  }
};

const isPrime = (data: number) => {
  if (!Number.isInteger(data) || data <= 1) {
    return false;
  }
  for (let i = 2, s = Math.sqrt(data); i <= s; i++) {
    if (data % i === 0) {
      return false;
    }
  }
  return true;
};

const server = net.createServer((socket) => {
  let closed = false;
  const rl = readline.createInterface(socket);
  rl.on("line", (input) => {
    if (closed) return;
    const request = safeParse(input);
    if (!request) {
      closed = true;
      socket.end("malformed");
      rl.close();
    } else {
      const prime = isPrime(request.number);
      const response = JSON.stringify({ method: "isPrime", prime });
      socket.write(`${response}\n`);
    }
  });
});

server.on("listening", () => console.log(`server running on port ${port}`));
server.on("connection", (socket) =>
  console.log(`connection from ${socket.remoteAddress}:${socket.remotePort}`)
);
server.on("error", console.error);

server.listen(port);
