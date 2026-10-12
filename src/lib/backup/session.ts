import { useSyncExternalStore } from "react";

import { newId } from "@/lib/db/id";
import { TransferFormatError } from "@/lib/transfer/format";

import type { DecodedBackup } from "./format";

/**
 * Offene Wiederherstellung (8e) als Modul-Store: Eine gewählte (Daten & Sicherung) oder von
 * außen geöffnete `.baskobackup`-Datei wartet hier auf „Daten ersetzen?“ – den Dialog zeigt
 * `RestoreHost` im Root-Layout, egal wo die App gerade steht. Fehler beim Lesen einer von außen
 * geöffneten oder in 8c gewählten Datei landen als `error` hier und erscheinen dort als Toast.
 */
export type PendingRestore = { id: string; backup: DecodedBackup };
export type RestoreError = "unreadable" | "newerVersion";

type RestoreState = { pending: PendingRestore | null; error: RestoreError | null };

let state: RestoreState = { pending: null, error: null };
const listeners = new Set<() => void>();

function setState(next: Partial<RestoreState>) {
  state = { ...state, ...next };
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useRestoreState(): RestoreState {
  return useSyncExternalStore(subscribe, () => state);
}

export function openRestore(backup: DecodedBackup) {
  setState({ pending: { id: newId(), backup }, error: null });
}

export function clearRestore(id: string) {
  if (state.pending?.id === id) setState({ pending: null });
}

/** Fehlerart beim Lesen einer Sicherung: neuere Version oder unlesbar. */
export function restoreErrorOf(error: unknown): RestoreError {
  return error instanceof TransferFormatError && error.reason === "newerVersion"
    ? "newerVersion"
    : "unreadable";
}

/** Lesefehler (Datei von außen oder in 8c gewählt) – `RestoreHost` zeigt ihn als Toast. */
export function reportRestoreError(error: RestoreError) {
  setState({ error });
}

export function clearRestoreError() {
  setState({ error: null });
}
