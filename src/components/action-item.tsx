import type { LucideIcon } from "lucide-react-native";
import { Pressable, View } from "react-native";

import { Icon } from "@/components/ui/icon";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { cn } from "@gluestack-ui/utils/nativewind-utils";

interface ActionItemProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  onPress: () => void;
  danger?: boolean;
  disabled?: boolean;
  /** Läuft gerade (z. B. Export): Spinner rechts, Tippen wirkt nicht. */
  loading?: boolean;
}

/**
 * Eintrag in Aktionen-Sheets (1e, 4f): runder Icon-Kreis auf `chip`, Titel, optional Beschreibung,
 * optional Spinner rechts.
 */
export function ActionItem({
  icon,
  title,
  description,
  onPress,
  danger,
  disabled,
  loading,
}: ActionItemProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      role="button"
      aria-disabled={disabled}
      aria-busy={loading}
      className={cn(
        "min-h-14 flex-row items-center gap-3.5 px-page py-2 active:bg-chip",
        disabled && "opacity-40"
      )}
    >
      <View className="size-9 items-center justify-center rounded-[999px] bg-chip">
        <Icon as={icon} className={cn("h-4.5 w-4.5", danger ? "text-danger" : "text-ink")} />
      </View>
      <View className="flex-1">
        <Text className={cn("text-base font-bold", danger && "text-danger")}>{title}</Text>
        {description ? <Text className="text-xs text-soft">{description}</Text> : null}
      </View>
      {loading ? <Spinner size="small" className="text-primary" /> : null}
    </Pressable>
  );
}
