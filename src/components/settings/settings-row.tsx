import { ChevronRightIcon, type LucideIcon } from "lucide-react-native";
import type { ReactNode } from "react";
import { Pressable, View } from "react-native";

import { Icon } from "@/components/ui/icon";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { cn } from "@gluestack-ui/utils/nativewind-utils";

interface SettingsRowProps {
  title: string;
  /** Zweite Zeile in `soft`, z. B. „Rezepte von API Ninjas“ (8a) oder die Erklärung in 8c. */
  subtitle?: string;
  /** Wert rechts in `soft`, z. B. der Gerätename oder die Version (8a). */
  value?: string;
  /** Runder Icon-Kreis auf `chip` links (8c). */
  icon?: LucideIcon;
  /** Mit `onPress` ist die Zeile tippbar und zeigt ›. */
  onPress?: () => void;
  /** Läuft gerade (z. B. Sichern): Spinner statt ›, Tippen wirkt nicht. */
  busy?: boolean;
  /** Steuerelement rechts statt Wert. */
  children?: ReactNode;
}

/**
 * Zeile der Einstellungen (8a, 8c): mind. 56 hoch, Trennlinie unten. Die Liste setzt die obere
 * Linie selbst (`border-t` am Container).
 */
export function SettingsRow({
  title,
  subtitle,
  value,
  icon,
  onPress,
  busy = false,
  children,
}: SettingsRowProps) {
  const content = (
    <>
      {icon ? (
        <View className="size-10 items-center justify-center rounded-[999px] bg-chip">
          <Icon as={icon} className="h-5 w-5 text-ink" />
        </View>
      ) : null}
      <View className="flex-1 gap-0.5">
        <Text className="text-base font-bold">{title}</Text>
        {subtitle ? <Text className="text-xs text-soft">{subtitle}</Text> : null}
      </View>
      {value ? (
        <Text className="shrink text-sm font-semibold text-soft" numberOfLines={1}>
          {value}
        </Text>
      ) : null}
      {children}
      {busy ? <Spinner size="small" className="text-primary" /> : null}
      {onPress && !busy ? <Icon as={ChevronRightIcon} size="md" className="text-soft" /> : null}
    </>
  );

  const className = cn(
    "min-h-14 flex-row items-center border-b border-line",
    icon ? "gap-3.5 py-row" : "gap-2.5 py-2.5"
  );

  if (!onPress) return <View className={className}>{content}</View>;

  return (
    <Pressable
      onPress={onPress}
      disabled={busy}
      role="button"
      aria-busy={busy}
      className={cn(className, "active:opacity-70")}
    >
      {content}
    </Pressable>
  );
}
