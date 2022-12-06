import { randomUUID } from "node:crypto";
import net, { Socket } from "node:net";
import readline, { Interface } from "node:readline";

const port = 10003 as const;

class Channel {
  private readonly sessions: Map<string, Session> = new Map();

  notify(message: string) {
    const content = `* ${message}`;
    console.log("CHAN:", content);
    this.sessions.forEach((session) => session.sendMessage(content));
  }

  message(message: string, sender: Session) {
    const content = `[${sender.name}] ${message}`;
    console.log("CHAN:", content);
    this.sessions.forEach((session) => {
      if (session.id !== sender.id) {
        session.sendMessage(content);
      }
    });
  }

  join(session: Session) {
    const presenceMessage = `* channel members: ${[...this.sessions.values()]
      .map(({ name }) => name)
      .join(", ")} `;
    const joinMessage = `${session.name} has joined the channel`;
    session.sendMessage(presenceMessage);
    this.notify(joinMessage);
    this.sessions.set(session.id, session);
  }

  leave(session: Session) {
    if (this.sessions.delete(session.id)) {
      const leaveMessage = `${session.name} has left the channel`;
      this.notify(leaveMessage);
    }
  }
}

class Session {
  readonly id = randomUUID();
  readonly rl: Interface;
  name: string = "";

  constructor(readonly channel: Channel, private socket: Socket) {
    socket.on("close", this.close.bind(this));
    this.rl = readline.createInterface(socket, socket);
    this.rl.question(
      "Welcome to SunsetChat! What shall I call you?\r\n",
      this.init.bind(this)
    );
  }

  private init(name: string) {
    if (name.length < 1 || name.length > 16) {
      this.socket.end("name must be 1 to 16 charactes\r\n");
      return;
    }

    this.name = name;
    this.channel.join(this);
    this.rl.setPrompt("");
    this.rl.prompt();
    this.rl.on("line", this.recvMessage.bind(this));
  }

  private close() {
    this.rl.pause();
    this.rl.close();
    channel.leave(this);
  }

  private recvMessage(message: string) {
    this.channel.message(message, this);
    this.rl.prompt();
  }

  public sendMessage(message: string) {
    if (!this.socket.writableEnded) {
      this.socket.write(`${message}\r\n`);
    }
  }
}

const channel = new Channel();

const server = net.createServer((socket) => {
  new Session(channel, socket);
});

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
