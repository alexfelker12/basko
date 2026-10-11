import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, useSyncExternalStore } from "react";
import { useZeroconf } from "react-native-zeroconf";

import { collator } from "@/lib/i18n";
import { queryKeys } from "@/lib/query-keys";
import { clearTransferHistory, getTransferHistory } from "@/lib/queries/transfer-history";
import { exportListFile } from "@/lib/transfer/file";
import { saveImport, type ConflictResolution } from "@/lib/transfer/import";
import {
  PEER_STATUSES,
  SERVICE_PROTOCOL,
  SERVICE_TYPE,
  type PeerStatus,
} from "@/lib/transfer/protocol";
import {
  getTransferState,
  subscribeTransfer,
  type Peer,
  type PendingImport,
} from "@/lib/transfer/session";

/** Zustand des Netzwerk-Transfers (Senden, Empfangen, offene Vorschau). */
export function useTransfer() {
  return useSyncExternalStore(subscribeTransfer, getTransferState);
}

export function useTransferHistory() {
  return useQuery({ queryKey: queryKeys.transferHistory, queryFn: getTransferHistory });
}

export function useClearTransferHistory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => clearTransferHistory(),
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.transferHistory }),
  });
}

/** „Als Datei exportieren“ – liefert `false`, wenn es die Liste nicht mehr gibt. */
export function useExportList() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (listId: string) => exportListFile(listId),
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.transferHistory }),
  });
}

/** 6h „Übernehmen“ bzw. 6i „Liste speichern“. */
export function useSaveImport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      pending,
      resolutions,
    }: {
      pending: PendingImport;
      resolutions: Record<string, ConflictResolution>;
    }) => {
      const { source } = pending;
      return saveImport(
        pending.decoded,
        resolutions,
        source.kind === "network"
          ? { direction: "received", peerName: source.peerName }
          : { direction: "imported" }
      );
    },
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.lists }),
        queryClient.invalidateQueries({ queryKey: queryKeys.products }),
        queryClient.invalidateQueries({ queryKey: queryKeys.transferHistory }),
      ]),
  });
}

/** Gefundenes Gerät in 6b. */
export type DiscoveredDevice = Peer & { status: PeerStatus };

/** So lange läuft eine Suche; danach „↻ Erneut suchen“ (6b). */
const SCAN_DURATION_MS = 8000;

function toStatus(value: string | undefined): PeerStatus {
  return PEER_STATUSES.find((status) => status === value) ?? "idle";
}

/**
 * Geräte im selben WLAN (6b): sucht einmal für einige Sekunden, danach erneut über `rescan`.
 * Das eigene Gerät wird über die Kennung im TXT-Eintrag ausgeblendet.
 */
export function useDiscoveredDevices() {
  const { sessionId } = useTransfer();
  const { services, stop, restart } = useZeroconf({
    type: SERVICE_TYPE,
    protocol: SERVICE_PROTOCOL,
  });
  const [round, setRound] = useState(0);
  const [searching, setSearching] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      stop();
      setSearching(false);
    }, SCAN_DURATION_MS);
    return () => clearTimeout(timer);
  }, [round, stop]);

  const rescan = () => {
    setSearching(true);
    restart();
    setRound((value) => value + 1);
  };

  const devices: DiscoveredDevice[] = services
    .filter((service) => service.txt?.id !== sessionId)
    .flatMap((service) => {
      const host = service.ipv4[0] ?? service.addresses[0];
      if (!host) return [];
      return [
        {
          key: service.name,
          name: service.txt?.name || service.name,
          host,
          port: service.port,
          status: toStatus(service.txt?.status),
        },
      ];
    })
    .sort((a, b) => collator.compare(a.name, b.name));

  return { devices, searching, rescan };
}
