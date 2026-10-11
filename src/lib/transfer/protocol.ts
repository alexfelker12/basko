import { Buffer } from "buffer";
import { z } from "zod";

/**
 * Netzwerk-Protokoll zwischen zwei Basko-Geräten (Spezifikation → 6). Gefunden wird per Zeroconf
 * (`_basko._tcp`), übertragen per TCP auf Port 41234. Auf der Leitung laufen Rahmen
 * [u8 Art][u32 Länge][Inhalt] (Big Endian): Art 1 = Steuer-Nachricht als JSON, Art 2 = Paket im
 * Dateiformat (`format.ts`).
 *
 * Ablauf: Sender → `hello` · Empfänger → `accept` | `reject` | `busy` | `not_ready` ·
 * Sender → Paket · Empfänger → `received`. Bricht der Sender ab, schickt er `cancel`.
 */

export const TRANSFER_PORT = 41234;
export const SERVICE_TYPE = "basko";
export const SERVICE_PROTOCOL = "tcp";

/** Ohne Antwort des Empfängers gilt die Anfrage als „Nicht angekommen“ (6e). */
export const REQUEST_TIMEOUT_MS = 30_000;
/** Während der Übertragung: so lange darf die Leitung still sein. */
export const IDLE_TIMEOUT_MS = 30_000;

/** Status im TXT-Eintrag: Bereit (Empfang-Screen offen), Nicht auf Empfang, Beschäftigt. */
export const PEER_STATUSES = ["ready", "idle", "busy"] as const;
export type PeerStatus = (typeof PEER_STATUSES)[number];

const FRAME_CONTROL = 1;
const FRAME_PAYLOAD = 2;
const HEADER_LENGTH = 5;
const MAX_CONTROL_LENGTH = 64 * 1024;
/** Fotos haben keine Obergrenze (Spezifikation → Entschieden) – das hier schützt nur den Speicher. */
const MAX_PAYLOAD_LENGTH = 512 * 1024 * 1024;

const controlSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("hello"),
    sender: z.string().max(200),
    listName: z.string().max(200),
    itemCount: z.number().int().nonnegative(),
  }),
  z.object({ type: z.literal("accept") }),
  z.object({ type: z.literal("reject") }),
  z.object({ type: z.literal("busy") }),
  z.object({ type: z.literal("not_ready") }),
  z.object({ type: z.literal("cancel") }),
  z.object({ type: z.literal("received") }),
]);

export type ControlMessage = z.infer<typeof controlSchema>;
export type HelloMessage = Extract<ControlMessage, { type: "hello" }>;

export type Frame =
  { kind: "control"; message: ControlMessage } | { kind: "payload"; data: Buffer };

function header(kind: number, length: number): Buffer {
  const buffer = Buffer.alloc(HEADER_LENGTH);
  buffer.writeUInt8(kind, 0);
  buffer.writeUInt32BE(length, 1);
  return buffer;
}

export function controlFrame(message: ControlMessage): Buffer {
  const body = Buffer.from(JSON.stringify(message), "utf8");
  return Buffer.concat([header(FRAME_CONTROL, body.length), body]);
}

/** Kopf des Paket-Rahmens; der Inhalt wird danach in Stücken geschrieben. */
export function payloadHeader(length: number): Buffer {
  return header(FRAME_PAYLOAD, length);
}

/** Ausschnitt ohne Kopie (die `buffer`-Typen liefern bei `subarray` nur ein `Uint8Array`). */
function view(buffer: Buffer, start: number, end = buffer.length): Buffer {
  return Buffer.from(buffer.buffer, buffer.byteOffset + start, end - start);
}

export class ProtocolError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProtocolError";
  }
}

/**
 * Setzt Rahmen aus beliebig zerstückelten TCP-Daten zusammen. Große Pakete werden erst am Ende
 * einmal zusammengefügt.
 */
export class FrameReader {
  private chunks: Buffer[] = [];
  private buffered = 0;

  /** Neue Daten; liefert alle vollständigen Rahmen. Wirft `ProtocolError` bei Unsinn. */
  push(data: Uint8Array | string): Frame[] {
    const chunk = typeof data === "string" ? Buffer.from(data, "utf8") : Buffer.from(data);
    if (chunk.length > 0) {
      this.chunks.push(chunk);
      this.buffered += chunk.length;
    }

    const frames: Frame[] = [];
    while (this.buffered >= HEADER_LENGTH) {
      const head = this.peek(HEADER_LENGTH);
      const kind = head.readUInt8(0);
      const length = head.readUInt32BE(1);

      if (kind === FRAME_CONTROL ? length > MAX_CONTROL_LENGTH : kind !== FRAME_PAYLOAD) {
        throw new ProtocolError("invalid frame");
      }
      if (length > MAX_PAYLOAD_LENGTH) throw new ProtocolError("frame too large");
      if (this.buffered < HEADER_LENGTH + length) break;

      const body = view(this.take(HEADER_LENGTH + length), HEADER_LENGTH);
      if (kind === FRAME_PAYLOAD) {
        frames.push({ kind: "payload", data: body });
        continue;
      }

      let raw: unknown;
      try {
        raw = JSON.parse(body.toString("utf8"));
      } catch {
        throw new ProtocolError("invalid json");
      }
      const parsed = controlSchema.safeParse(raw);
      if (!parsed.success) throw new ProtocolError("invalid message");
      frames.push({ kind: "control", message: parsed.data });
    }
    return frames;
  }

  /** Die ersten `length` Bytes, ohne sie zu entnehmen. */
  private peek(length: number): Buffer {
    if (this.chunks[0].length >= length) return this.chunks[0];
    this.chunks = [Buffer.concat(this.chunks)];
    return this.chunks[0];
  }

  private take(length: number): Buffer {
    const all = this.chunks.length === 1 ? this.chunks[0] : Buffer.concat(this.chunks);
    const taken = view(all, 0, length);
    const rest = view(all, length);
    this.chunks = rest.length > 0 ? [Buffer.from(rest)] : [];
    this.buffered = rest.length;
    return taken;
  }
}
