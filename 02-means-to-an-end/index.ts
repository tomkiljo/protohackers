import net from "node:net";
import { EventEmitter } from "node:stream";

const port = 10002 as const;

const MessageLength = 9;

const MessageType = {
  Insert: "I",
  Query: "Q",
} as const;

const DataOffset = {
  Type: 0,
  Timestamp: 1,
  Price: 5,
  MinTime: 1,
  MaxTime: 5,
} as const;

type PriceData = {
  timestamp: number;
  price: number;
};

interface TypedEventEmitter<TEventMap> {
  on<TEventName extends keyof TEventMap>(
    name: TEventName,
    listener: (args: TEventMap[TEventName]) => void
  ): this;
  emit<TEventName extends keyof TEventMap>(
    event: TEventName,
    args: TEventMap[TEventName]
  ): boolean;
}

interface ChunkStreamEvents {
  chunk: Buffer;
}

class ChunkStream implements TypedEventEmitter<ChunkStreamEvents> {
  private readonly emitter = new EventEmitter();
  private readonly buffer: Buffer;
  private offset: number = 0;

  constructor(
    input: NodeJS.ReadableStream,
    private readonly chunkSize: number
  ) {
    this.buffer = Buffer.alloc(chunkSize);
    input.on("data", this.write.bind(this));
  }

  on<TEventName extends keyof ChunkStreamEvents>(
    name: TEventName,
    listener: (args: ChunkStreamEvents[TEventName]) => void
  ): this {
    this.emitter.on(name, listener);
    return this;
  }

  emit<TEventName extends keyof ChunkStreamEvents>(
    event: TEventName,
    args: ChunkStreamEvents[TEventName]
  ): boolean {
    return this.emitter.emit(event, args);
  }

  write(data: Buffer) {
    data.forEach((value) => {
      this.buffer[this.offset] = value;
      this.offset = this.offset + 1;
      if (this.offset === this.chunkSize) {
        this.emit("chunk", Buffer.from(this.buffer));
        this.offset = 0;
      }
    });
  }
}

const server = net.createServer((socket) => {
  const prices: PriceData[] = [];
  const stream = new ChunkStream(socket, MessageLength);
  stream.on("chunk", (data) => {
    const type = String.fromCharCode(data.readUInt8(DataOffset.Type));
    if (type === MessageType.Insert) {
      const timestamp = data.readInt32BE(DataOffset.Timestamp);
      const price = data.readInt32BE(DataOffset.Price);
      prices.push({ timestamp, price });
      console.log(type, timestamp, price);
    } else if (type === MessageType.Query) {
      const minTime = data.readInt32BE(DataOffset.MinTime);
      const maxTime = data.readInt32BE(DataOffset.MaxTime);

      let mean = 0;
      if (minTime <= maxTime) {
        mean = prices
          .filter(
            ({ timestamp }) => minTime <= timestamp && timestamp <= maxTime
          )
          .reduce((sum, { price }, index, { length }) => {
            if (index < length - 1) {
              return sum + price;
            }
            return Math.round((sum + price) / length);
          }, 0);
      }

      console.log(type, minTime, maxTime, mean);
      const buffer = Buffer.alloc(4);
      buffer.writeInt32BE(mean);
      socket.write(buffer);
    } else {
      console.error(`unknown type ${type}`);
    }
  });
});

server.on("listening", () => console.log(`server running on port ${port}`));
server.on("connection", (socket) =>
  console.log(`connection from ${socket.remoteAddress}:${socket.remotePort}`)
);
server.on("error", console.error);

server.listen(port);
