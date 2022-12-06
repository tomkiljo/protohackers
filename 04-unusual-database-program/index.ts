import udp from "node:dgram";

const port = 10004 as const;

const kv: Map<string, string> = new Map();
kv.set("version", "the kv Store 0.0");
const reserved = [...kv.keys()];

const server = udp.createSocket("udp4");
server.on("message", (message, rinfo) => {
  const data = message.toString();
  console.log("SERV:", `msg from ${rinfo.address}:${rinfo.port}:`, data);
  const index = data.indexOf("=");
  if (index >= 0) {
    const key = data.slice(0, index);
    const val = data.slice(index + 1);
    if (!reserved.includes(key)) {
      kv.set(key, val);
    }
  } else {
    const val = `${data}=${kv.get(data) ?? ""}`;
    server.send(val, rinfo.port, rinfo.address);
  }
});
server.on("error", (err) => console.error("SERV:", err));
server.on("listening", () => {
  const address = server.address();
  console.log("SERV:", `server listening ${address.address}:${address.port}`);
});

server.bind(port);
