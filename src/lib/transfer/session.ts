import { Buffer } from "buffer";
import { AppState, type AppStateStatus } from "react-native";
import TcpSocket from "react-native-tcp-socket";
import Zeroconf from "react-native-zeroconf";

import { db } from "@/lib/db";
import { newId } from "@/lib/db/id";
import { addTransferHistory } from "@/lib/queries/transfer-history";
import { queryClient } from "@/lib/query-client";
import { queryKeys } from "@/lib/query-keys";
import { readSettings } from "@/lib/settings";

import { buildListTransfer } from "./build";
import { decodeTransfer, encodeTransfer, type DecodedTransfer } from "./format";
import {
  controlFrame,
  FrameReader,
  IDLE_TIMEOUT_MS,
  payloadHeader,
  REQUEST_TIMEOUT_MS,
  SERVICE_PROTOCOL,
  SERVICE_TYPE,
  TRANSFER_PORT,
  type ControlMessage,
  type PeerStatus,
} from "./protocol";

type Socket = ReturnType<typeof TcpSocket.createConnection>;
type Server = ReturnType<typeof TcpSocket.createServer>;

/*
 * Zustand des Netzwerk-Transfers (Spezifikation → 6) als Modul-Store außerhalb von React:
 * Sichtbarkeit im Netzwerk (Zeroconf + TCP-Server), Senden, Empfangen und die offene
 * Import-Vorschau (6h/6i, auch für `.basko`-Dateien). Es läuft immer nur ein Transfer.
 * React liest den Zustand über `useTransfer()` (`hooks/use-transfer.ts`).
 */

/** Gerät, an das gesendet wird (aus der Suche in 6b). */
export type Peer = { key: string; name: string; host: string; port: number };

export type SendState =
  | { phase: "idle" }
  /** 6c – Anfrage läuft (inkl. Übertragung nach dem Annehmen). */
  | { phase: "waiting"; listId: string; listName: string; peer: Peer }
  /** 6d · 6e · abgelehnt · beschäftigt */
  | {
      phase: "sent" | "failed" | "rejected" | "busy";
      listId: string;
      listName: string;
      peer: Peer;
    };

export type ReceiveState =
  | { phase: "off" }
  /** 6f – Empfang-Screen offen, Gerät ist „Bereit“. */
  | { phase: "visible" }
  /** 6g – Anfrage wartet auf Annehmen/Ablehnen. */
  | { phase: "request"; peerName: string; listName: string; itemCount: number }
  /** Angenommen, Daten kommen. */
  | { phase: "receiving"; peerName: string; listName: string };

export type ImportSource = { kind: "network"; peerName: string } | { kind: "file" };

/** Empfangene bzw. geöffnete Liste, die auf Vorschau (6h) und Speichern wartet. */
export type PendingImport = { id: string; decoded: DecodedTransfer; source: ImportSource };

export type TransferState = {
  /** Kennung dieses App-Starts im TXT-Eintrag – damit sich das Gerät nicht selbst findet. */
  sessionId: string;
  send: SendState;
  receive: ReceiveState;
  pendingImport: PendingImport | null;
};

/** Hinweise als Toast (`TransferNotices` im Root-Layout). */
export type TransferNotice =
  | { kind: "withdrawn" }
  | { kind: "receiveFailed" }
  | { kind: "notReady"; peerName: string }
  | { kind: "fileUnreadable" };

// ---------------------------------------------------------------------------------------------
// Store

let state: TransferState = {
  sessionId: newId(),
  send: { phase: "idle" },
  receive: { phase: "off" },
  pendingImport: null,
};

const listeners = new Set<() => void>();
const noticeListeners = new Set<(notice: TransferNotice) => void>();

export function getTransferState(): TransferState {
  return state;
}

export function subscribeTransfer(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Hinweise ohne Zuhörer (z. B. Datei beim Kaltstart) warten, bis der Toast-Host bereit ist. */
let queuedNotices: TransferNotice[] = [];

export function subscribeTransferNotices(listener: (notice: TransferNotice) => void) {
  noticeListeners.add(listener);
  const queued = queuedNotices;
  queuedNotices = [];
  for (const notice of queued) listener(notice);
  return () => {
    noticeListeners.delete(listener);
  };
}

function setState(patch: Partial<TransferState>) {
  state = { ...state, ...patch };
  for (const listener of listeners) listener();
  syncPresence();
}

function notify(notice: TransferNotice) {
  if (noticeListeners.size === 0) queuedNotices.push(notice);
  for (const listener of noticeListeners) listener(notice);
}

/** Status im Netzwerk: „Beschäftigt“ während eines Transfers bzw. einer offenen Vorschau. */
function currentStatus(): PeerStatus {
  if (
    state.send.phase === "waiting" ||
    state.receive.phase === "request" ||
    state.receive.phase === "receiving" ||
    state.pendingImport?.source.kind === "network"
  ) {
    return "busy";
  }
  return state.receive.phase === "visible" ? "ready" : "idle";
}

function deviceName(): string {
  return readSettings(db).deviceName;
}

function safeWrite(socket: Socket, data: Buffer) {
  try {
    socket.write(data);
  } catch {
    // Verbindung schon weg – das `close`-Ereignis räumt auf
  }
}

function safeEnd(socket: Socket, data?: Buffer) {
  try {
    socket.end(data);
  } catch {
    socket.destroy();
  }
}

// ---------------------------------------------------------------------------------------------
// Sichtbarkeit: Zeroconf-Dienst + TCP-Server, solange die App vorne ist oder ein Transfer läuft

const zeroconf = new Zeroconf();
let server: Server | null = null;
let presenceStarted = false;
let appActive = AppState.currentState === "active";
let appStateSubscription: { remove: () => void } | null = null;

type Published = { serviceName: string; deviceName: string; status: PeerStatus };
let published: Published | null = null;
let presenceQueue: Promise<void> = Promise.resolve();

function transferRunning(): boolean {
  return outgoing !== null || incoming !== null;
}

function syncPresence() {
  if (!presenceStarted) return;
  presenceQueue = presenceQueue.then(applyPresence).catch((error: unknown) => {
    console.warn("[transfer] presence", error);
  });
}

async function applyPresence() {
  const active = presenceStarted && (appActive || transferRunning());

  if (active && !server) startServer();
  if (!active && server) {
    server.close();
    server = null;
  }

  if (!active) {
    if (published) {
      const { serviceName } = published;
      published = null;
      await zeroconf.unpublishService(serviceName).catch(() => undefined);
    }
    return;
  }

  const name = deviceName();
  const status = currentStatus();
  const txt = { id: state.sessionId, name, status };

  if (published && published.deviceName !== name) {
    const { serviceName } = published;
    published = null;
    await zeroconf.unpublishService(serviceName).catch(() => undefined);
  }

  if (!published) {
    const service = await zeroconf.publishService({
      type: SERVICE_TYPE,
      protocol: SERVICE_PROTOCOL,
      name,
      port: TRANSFER_PORT,
      txt,
    });
    published = { serviceName: service.name, deviceName: name, status };
  } else if (published.status !== status) {
    await zeroconf.updateService(published.serviceName, { txt });
    published = { ...published, status };
  }
}

function startServer() {
  const created = TcpSocket.createServer(handleConnection);
  created.on("error", (error) => {
    console.warn("[transfer] server", error);
  });
  created.listen({ port: TRANSFER_PORT, host: "0.0.0.0", reuseAddress: true });
  server = created;
}

function onAppStateChange(next: AppStateStatus) {
  const active = next === "active";
  if (active === appActive) return;
  appActive = active;
  syncPresence();
}

/** Startet die Sichtbarkeit (einmal im Root-Layout). */
export function startTransferPresence() {
  if (presenceStarted) return;
  presenceStarted = true;
  appActive = AppState.currentState === "active";
  appStateSubscription = AppState.addEventListener("change", onAppStateChange);
  syncPresence();
}

export function stopTransferPresence() {
  if (!presenceStarted) return;
  appStateSubscription?.remove();
  appStateSubscription = null;
  presenceStarted = false;
  // Letzter Abgleich mit `presenceStarted = false` → Dienst weg, Server zu
  presenceQueue = presenceQueue.then(applyPresence).catch(() => undefined);
}

/** Nach einer Änderung des Gerätenamens neu veröffentlichen. */
export function refreshTransferPresence() {
  syncPresence();
}

// ---------------------------------------------------------------------------------------------
// Empfangen

type Incoming = { socket: Socket; peerName: string; listName: string; accepted: boolean };
let incoming: Incoming | null = null;

function finishIncoming(next: ReceiveState, patch: Partial<TransferState> = {}) {
  incoming = null;
  setState({ receive: next, ...patch });
}

function handleConnection(socket: Socket) {
  const reader = new FrameReader();
  let greeted = false;

  const isCurrent = () => incoming?.socket === socket;

  const onMessage = (message: ControlMessage) => {
    if (!greeted) {
      greeted = true;
      if (message.type !== "hello") return socket.destroy();

      const status = currentStatus();
      if (status !== "ready") {
        safeEnd(socket, controlFrame({ type: status === "busy" ? "busy" : "not_ready" }));
        return;
      }
      incoming = {
        socket,
        peerName: message.sender,
        listName: message.listName,
        accepted: false,
      };
      setState({
        receive: {
          phase: "request",
          peerName: message.sender,
          listName: message.listName,
          itemCount: message.itemCount,
        },
      });
      return;
    }

    if (message.type === "cancel" && isCurrent()) {
      socket.destroy();
      finishIncoming({ phase: "visible" });
      notify({ kind: "withdrawn" });
    }
  };

  const onPayload = (data: Buffer) => {
    if (!isCurrent() || !incoming?.accepted) return socket.destroy();
    const { peerName } = incoming;
    try {
      const decoded = decodeTransfer(data);
      safeEnd(socket, controlFrame({ type: "received" }));
      finishIncoming(
        { phase: "visible" },
        { pendingImport: { id: newId(), decoded, source: { kind: "network", peerName } } }
      );
    } catch {
      socket.destroy();
      finishIncoming({ phase: "visible" });
      notify({ kind: "receiveFailed" });
    }
  };

  socket.on("data", (data) => {
    let frames;
    try {
      frames = reader.push(data);
    } catch {
      socket.destroy();
      return;
    }
    for (const frame of frames) {
      if (frame.kind === "control") onMessage(frame.message);
      else onPayload(frame.data);
    }
  });

  socket.on("error", () => {
    // `close` folgt
  });

  socket.on("close", () => {
    if (!isCurrent() || !incoming) return;
    const wasAccepted = incoming.accepted;
    finishIncoming({ phase: "visible" });
    notify({ kind: wasAccepted ? "receiveFailed" : "withdrawn" });
  });
}

/** 6f öffnen: Gerät wird „Bereit“. */
export function startReceiving() {
  if (state.receive.phase !== "off") return;
  setState({ receive: { phase: "visible" } });
}

/** 6f verlassen: laufende Anfrage ablehnen, Vorschau aus dem Netzwerk verwerfen. */
export function stopReceiving() {
  if (incoming) {
    const { socket, accepted } = incoming;
    incoming = null;
    if (accepted) socket.destroy();
    else safeEnd(socket, controlFrame({ type: "reject" }));
  }
  setState({
    receive: { phase: "off" },
    pendingImport: state.pendingImport?.source.kind === "network" ? null : state.pendingImport,
  });
}

/** 6g „Annehmen“. */
export function acceptRequest() {
  if (!incoming || incoming.accepted || state.receive.phase !== "request") return;
  incoming.accepted = true;
  const { socket, peerName, listName } = incoming;
  socket.setTimeout(IDLE_TIMEOUT_MS, () => socket.destroy());
  safeWrite(socket, controlFrame({ type: "accept" }));
  setState({ receive: { phase: "receiving", peerName, listName } });
}

/** 6g „Ablehnen“. */
export function rejectRequest() {
  if (!incoming || incoming.accepted) return;
  const { socket } = incoming;
  incoming = null;
  safeEnd(socket, controlFrame({ type: "reject" }));
  setState({ receive: { phase: "visible" } });
}

// ---------------------------------------------------------------------------------------------
// Senden

/** Bytes pro Schreibvorgang – große Pakete gehen in Stücken über die Brücke. */
const WRITE_CHUNK = 256 * 1024;

type Outgoing = { attempt: number; socket: Socket | null };
let outgoing: Outgoing | null = null;
let sendAttempt = 0;

function finishSend(attempt: number, next: SendState) {
  if (outgoing?.attempt !== attempt) return;
  const { socket } = outgoing;
  outgoing = null;
  socket?.destroy();
  setState({ send: next });
}

function writeChunk(socket: Socket, chunk: Buffer): Promise<void> {
  return new Promise((resolve, reject) => {
    socket.write(chunk, undefined, (error) => (error ? reject(error) : resolve()));
  });
}

async function writePayload(attempt: number, socket: Socket, data: Buffer) {
  await writeChunk(socket, payloadHeader(data.length));
  for (let offset = 0; offset < data.length; offset += WRITE_CHUNK) {
    if (outgoing?.attempt !== attempt) return;
    const end = Math.min(offset + WRITE_CHUNK, data.length);
    await writeChunk(socket, Buffer.from(data.buffer, data.byteOffset + offset, end - offset));
  }
}

/**
 * Liste an ein Gerät senden (6b → 6c). Ergebnis landet in `state.send`: Gesendet (6d), Nicht
 * angekommen (6e, nach 30 s ohne Antwort oder bei Verbindungsfehlern), abgelehnt, beschäftigt.
 * „Nicht auf Empfang“ führt zurück zur Geräteauswahl mit Hinweis.
 */
export async function sendList(listId: string, listName: string, peer: Peer) {
  if (outgoing) return;
  const attempt = ++sendAttempt;
  outgoing = { attempt, socket: null };
  const base = { listId, listName, peer };
  setState({ send: { phase: "waiting", ...base } });

  const timeout = setTimeout(
    () => finishSend(attempt, { phase: "failed", ...base }),
    REQUEST_TIMEOUT_MS
  );
  const finish = (next: SendState) => {
    clearTimeout(timeout);
    finishSend(attempt, next);
  };

  let data: Buffer;
  let itemCount: number;
  try {
    const transfer = await buildListTransfer(listId);
    if (!transfer) return finish({ phase: "idle" });
    data = encodeTransfer(transfer.payload, transfer.images);
    itemCount = transfer.payload.items.length;
  } catch (error) {
    console.warn("[transfer] build", error);
    return finish({ phase: "failed", ...base });
  }
  if (outgoing?.attempt !== attempt) return clearTimeout(timeout);

  const reader = new FrameReader();
  const socket = TcpSocket.createConnection({ host: peer.host, port: peer.port }, () => {
    safeWrite(socket, controlFrame({ type: "hello", sender: deviceName(), listName, itemCount }));
  });
  outgoing.socket = socket;

  const onMessage = (message: ControlMessage) => {
    switch (message.type) {
      case "accept":
        // Ab jetzt zählt nicht mehr die Antwortzeit, sondern Stille auf der Leitung
        clearTimeout(timeout);
        socket.setTimeout(IDLE_TIMEOUT_MS, () => finish({ phase: "failed", ...base }));
        writePayload(attempt, socket, data).catch(() => finish({ phase: "failed", ...base }));
        break;
      case "received":
        addTransferHistory({ direction: "sent", listId, listName, peerName: peer.name });
        void queryClient.invalidateQueries({ queryKey: queryKeys.transferHistory });
        finish({ phase: "sent", ...base });
        break;
      case "reject":
        finish({ phase: "rejected", ...base });
        break;
      case "busy":
        finish({ phase: "busy", ...base });
        break;
      case "not_ready":
        finish({ phase: "idle" });
        notify({ kind: "notReady", peerName: peer.name });
        break;
      default:
        break;
    }
  };

  socket.on("data", (chunk) => {
    try {
      for (const frame of reader.push(chunk)) {
        if (frame.kind === "control") onMessage(frame.message);
      }
    } catch {
      finish({ phase: "failed", ...base });
    }
  });
  socket.on("error", () => finish({ phase: "failed", ...base }));
  socket.on("close", () => finish({ phase: "failed", ...base }));
}

/** 6c „Abbrechen“: zieht die Anfrage beim Empfänger zurück. */
export function cancelSend() {
  if (!outgoing) return;
  const { socket } = outgoing;
  outgoing = null;
  if (socket) safeEnd(socket, controlFrame({ type: "cancel" }));
  setState({ send: { phase: "idle" } });
}

/** Ende des Sendens (Fertig/Abbrechen in 6d/6e …): zurück auf Anfang. */
export function resetSend() {
  if (outgoing) return cancelSend();
  if (state.send.phase !== "idle") setState({ send: { phase: "idle" } });
}

// ---------------------------------------------------------------------------------------------
// Import-Vorschau (Netzwerk und Datei)

export function openFileImport(decoded: DecodedTransfer) {
  // Eine Vorschau aus dem Netzwerk hat Vorrang – sie gehört zu einem laufenden Empfang
  if (state.pendingImport?.source.kind === "network") return;
  setState({ pendingImport: { id: newId(), decoded, source: { kind: "file" } } });
}

export function notifyFileUnreadable() {
  notify({ kind: "fileUnreadable" });
}

/** Vorschau schließen (Verwerfen oder nach dem Speichern). */
export function clearPendingImport(id: string) {
  if (state.pendingImport?.id === id) setState({ pendingImport: null });
}
