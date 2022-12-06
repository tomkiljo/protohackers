import { match } from "node:assert";
import net, { Socket } from "node:net";

const addressRegex = /(?<=^| )7[a-zA-Z0-9]{25,34}(?= |\r?\n)/g;
const tonysAddress = "7YWHMfk9JZe0LM0g1ZauHuiSxhI";

const port = 10005 as const;
const server = net.createServer();
server.on("listening", () => {
  const address = server.address();
  console.log("SERV:", `server listening ::${port}`);
});
server.on("connection", (client) => {
  console.log(
    "SERV:",
    `connection from ${client.remoteAddress}:${client.remotePort}`
  );

  let proxyData = "";
  const proxy = new Socket();
  proxy.on("error", (err) => console.error("SRV:", err));
  proxy.on("connect", () => console.log("SRV: connect"));
  proxy.on("close", () => {
    console.log("SRV: close");
    client.end();
  });
  proxy.on("data", (data) => {
    if (client.writableEnded) return;
    proxyData = proxyData + data.toString();
    const lineEnd = proxyData.indexOf("\n");
    if (lineEnd > 0) {
      const line = proxyData.slice(0, lineEnd + 1);
      proxyData = proxyData.slice(lineEnd + 1);
      console.log("SRV:", line.replace(/\r?\n/, ""));
      const addresses = [...line.matchAll(addressRegex)]
        .map((match) => match[0])
        .filter((address) => address !== tonysAddress);
      if (addresses.length > 0) {
        client.write(
          addresses.reduce((line, address) => {
            console.log(`💀 ${address}`);
            return line.replace(address, tonysAddress);
          }, line)
        );
      } else {
        client.write(line);
      }
    }
  });
  proxy.connect(16963, "chat.protohackers.com");

  let clientData = "";

  client.on("error", (err) => console.error("CLI:", err));
  client.on("close", () => {
    console.log("CLI: close");
    proxy.end();
  });
  client.on("data", (data) => {
    if (proxy.writableEnded) return;
    clientData = clientData + data.toString();
    const lineEnd = clientData.indexOf("\n");
    if (lineEnd > 0) {
      const line = clientData.slice(0, lineEnd + 1);
      clientData = clientData.slice(lineEnd + 1);
      console.log("CLI:", line.replace(/\r?\n/, ""));
      const addresses = [...line.matchAll(addressRegex)];
      if (addresses.length > 0) {
        proxy.write(
          addresses.reduce((line, [address]) => {
            console.log(`💀 ${address}`);
            return line.replace(address, tonysAddress);
          }, line)
        );
      } else {
        proxy.write(line);
      }
    }
  });
});
server.on("error", (err) => console.error("SERV:", err));

server.listen(port);
