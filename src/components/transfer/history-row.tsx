import { ArrowDownIcon, ArrowUpIcon } from "lucide-react-native";
import { Pressable, View } from "react-native";

import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { t } from "@/lib/i18n";
import type { HistoryEntry } from "@/lib/queries/transfer-history";

const WEEKDAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/** Datum im Verlauf (6a): „heute“, „gestern“, innerhalb von 7 Tagen der Wochentag, sonst „TT.MM.“ bzw. „TT/MM“. */
export function formatHistoryDate(date: Date, now = new Date()): string {
  // Gerundet, damit Sommer-/Winterzeit (23 bzw. 25 Stunden) nicht stört
  const days = Math.round((startOfDay(now) - startOfDay(date)) / DAY_MS);
  if (days <= 0) return t("transfer.today");
  if (days === 1) return t("transfer.yesterday");
  if (days < 7) return t(`transfer.weekdays.${WEEKDAYS[date.getDay()]}`);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return t("transfer.shortDate", { day, month });
}

/** Verlaufseintrag (6a): Pfeil ↓ empfangen/importiert bzw. ↑ gesendet/exportiert, Name, Zeile darunter. */
export function HistoryRow({ entry, onPress }: { entry: HistoryEntry; onPress: () => void }) {
  const incoming = entry.direction === "received" || entry.direction === "imported";
  const detail = t(`transfer.historyEntry.${entry.direction}`, {
    peer: entry.peerName ?? "",
    date: formatHistoryDate(entry.createdAt),
  });

  return (
    // Deckend über die volle Breite: Das Punktraster füllt nur leere Flächen
    <View className="bg-bg">
      <Pressable
        onPress={onPress}
        className="mx-page flex-row items-center gap-3.5 border-b border-line py-row active:opacity-70"
      >
        <View
          className="size-9 items-center justify-center rounded-[999px] bg-chip"
          aria-label={t(
            incoming ? "transfer.historyDirection.in" : "transfer.historyDirection.out"
          )}
        >
          <Icon as={incoming ? ArrowDownIcon : ArrowUpIcon} className="h-4.5 w-4.5 text-soft" />
        </View>
        <View className="min-w-0 flex-1">
          <Text numberOfLines={1} className="text-base font-bold">
            {entry.listName}
          </Text>
          <Text numberOfLines={1} className="mt-0.5 text-xs text-soft">
            {detail}
          </Text>
        </View>
      </Pressable>
    </View>
  );
}
