import "reflect-metadata";

interface WriteContext {
  buffer: Buffer;
  offset: number;
}

interface ReadContext {
  buffer: Buffer;
  offset: number;
}

interface WriteResult {
  bytes: number;
}

interface ReadResult<Output> {
  value: Output;
  bytes: number;
}

interface PrimitiveOptions {}

interface ArrayOptions {}

abstract class Base<Input, Output> {
  abstract read(context: ReadContext): ReadResult<Output>;
  abstract write(value: Input, context: WriteContext): WriteResult;
}

type TypeInput<TType extends Base<any, any>> = TType extends Base<
  infer input,
  any
>
  ? input
  : never;
type TypeOutput<TType extends Base<any, any>> = TType extends Base<
  any,
  infer output
>
  ? output
  : never;

class Arr<TType extends Base<any, any>> extends Base<
  TypeInput<TType>[],
  TypeOutput<TType>[]
> {
  constructor(
    private readonly item: TType,
    private readonly options?: ArrayOptions
  ) {
    super();
  }
  static create<TType extends Base<any, any>>(
    item: TType,
    options?: ArrayOptions
  ) {
    return new Arr(item, options);
  }
  read(context: ReadContext): ReadResult<TypeOutput<TType>[]> {
    for ()
  }
  write(value: TypeInput<TType>[], context: WriteContext): WriteResult {
    throw new Error("Method not implemented.");
  }
}

class Str extends Base<string, string> {
  constructor(private options?: PrimitiveOptions) {
    super();
  }
  static create(options?: PrimitiveOptions) {
    return new Str(options);
  }
  read({buffer, offset}: ReadContext): ReadResult<string> {
    const buffer.readUint8(offset);
  }
  write(value: string, context: WriteContext): WriteResult {
    throw new Error("Method not implemented.");
  }
}

class Uint8 extends Base<number, number> {
  constructor(private options?: PrimitiveOptions) {
    super();
  }
  static create(options?: PrimitiveOptions) {
    return new Uint8(options);
  }
  read(context: ReadContext): ReadResult<number> {
    throw new Error("Method not implemented.");
  }
  write(value: number, context: WriteContext): WriteResult {
    throw new Error("Method not implemented.");
  }
}

class Uint16 extends Base<number, number> {
  constructor(private options?: PrimitiveOptions) {
    super();
  }
  static create(options?: PrimitiveOptions) {
    return new Uint16(options);
  }
  read(context: ReadContext): ReadResult<number> {
    throw new Error("Method not implemented.");
  }
  write(value: number, context: WriteContext): WriteResult {
    throw new Error("Method not implemented.");
  }
}

class Uint32 extends Base<number, number> {
  constructor(private options?: PrimitiveOptions) {
    super();
  }
  static create(options?: PrimitiveOptions) {
    return new Uint32(options);
  }
  read(context: ReadContext): ReadResult<number> {
    throw new Error("Method not implemented.");
  }
  write(value: number, context: WriteContext): WriteResult {
    throw new Error("Method not implemented.");
  }
}

const arr = Arr.create;
const str = Str.create;
const uint8 = Uint8.create;
const uint16 = Uint16.create;
const uint32 = Uint32.create;

type Types = Arr<any> | Str | Uint8 | Uint16 | Uint32;
type Shape = {
  readonly [key: string]: Types;
};

type Output<TShape extends Shape> = {
  [TKey in keyof TShape]: TShape[TKey] extends Base<any, infer TOutput>
    ? TOutput
    : never;
};

type Input<TShape extends Shape> = {
  [TKey in keyof TShape]: TShape[TKey] extends Base<infer TInput, any>
    ? TInput
    : never;
};

export const MessageType = {
  Error: 0x10,
  Plate: 0x20,
  Ticket: 0x21,
  WantHeartbeat: 0x40,
  Heartbeat: 0x41,
  IAmCamera: 0x80,
  IAmDispatcher: 0x81,
} as const;
type MessageType = typeof MessageType[keyof typeof MessageType];

abstract class Message<TShape extends Shape> {
  constructor(private readonly shape: TShape) {}
}

const ErrorShape = {
  type: uint8(),
  msg: str(),
} as const;
type ErrorShape = typeof ErrorShape;

export class Error extends Message<ErrorShape> {
  constructor() {
    super(ErrorShape);
  }
}

const PlateShape = {
  type: uint8(),
  plate: str(),
  timestamp: uint32(),
} as const;
type PlateShape = typeof PlateShape;

export class Plate extends Message<PlateShape> {
  constructor() {
    super(PlateShape);
  }
}

const TicketShape = {
  type: uint8(),
  plate: str(),
  road: uint16(),
  mile1: uint16(),
  timestamp1: uint32(),
  mile2: uint16(),
  timestamp2: uint32(),
  speed: uint16(),
} as const;
type TicketShape = typeof TicketShape;

export class Ticket extends Message<TicketShape> {
  constructor() {
    super(TicketShape);
  }
}

const WantHeartbeatShape = {
  type: uint8(),
  interval: uint32(),
} as const;
type WantHeartbeatShape = typeof WantHeartbeatShape;

export class WantHeartbeat extends Message<WantHeartbeatShape> {
  constructor() {
    super(WantHeartbeatShape);
  }
}

const HeartbeatShape = {
  type: uint8(),
} as const;
type HeartbeatShape = typeof HeartbeatShape;

export class Heartbeat extends Message<HeartbeatShape> {
  constructor() {
    super(HeartbeatShape);
  }
}

const IAmCameraShape = {
  type: uint8(),
  road: uint16(),
  mile: uint16(),
  limit: uint16(),
} as const;
type IAmCameraShape = typeof IAmCameraShape;

export class IAmCamera extends Message<IAmCameraShape> {
  constructor() {
    super(IAmCameraShape);
  }
}

const IAmDispatcherShape = {
  type: uint8(),
  numroads: uint8(),
  roads: arr(uint16()),
} as const;
type IAmDispatcherShape = typeof IAmDispatcherShape;

export class IAmDispatcher extends Message<IAmDispatcherShape> {
  constructor() {
    super(IAmDispatcherShape);
  }
}

export default {
  str,
  uint8,
  uint16,
  uint32,
};
