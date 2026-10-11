import type { LucideIcon } from "lucide-react-native";
import type { ReactNode } from "react";
import { View } from "react-native";

import { Icon } from "@/components/ui/icon";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";

type StatusVisual =
  | { kind: "spinner" }
  | { kind: "success"; icon: LucideIcon }
  | { kind: "warning"; icon: LucideIcon };

interface TransferStatusScreenProps {
  visual: StatusVisual;
  title: string;
  text?: string;
  /** Zusätzlicher Inhalt unter dem Text, z. B. der Geräte-Chip (6f). */
  extra?: ReactNode;
  /** Knöpfe darunter. */
  children?: ReactNode;
}

/**
 * Transfer-Zustände ohne Kopfzeile (6c–6f, 6j): mittig Spinner, Erfolg (`primary`-Kreis) oder
 * Hinweis (amber-Kreis), Titel, Text und Knöpfe.
 */
export function TransferStatusScreen({
  visual,
  title,
  text,
  extra,
  children,
}: TransferStatusScreenProps) {
  return (
    <View className="flex-1 items-center justify-center bg-bg px-10 pb-safe pt-safe">
      {visual.kind === "spinner" ? (
        <View className="size-19 items-center justify-center">
          <Spinner size="large" className="text-primary" />
        </View>
      ) : (
        <View
          className={
            visual.kind === "success"
              ? "size-19 items-center justify-center rounded-[999px] bg-primary"
              : "size-19 items-center justify-center rounded-[999px] bg-amber/18"
          }
        >
          <Icon
            as={visual.icon}
            className={
              visual.kind === "success" ? "h-8 w-8 text-primary-ink" : "h-8 w-8 text-amber"
            }
          />
        </View>
      )}
      <Text role="heading" className="mt-5 text-center text-xl font-extrabold">
        {title}
      </Text>
      {text ? <Text className="mt-2 text-center text-sm text-soft">{text}</Text> : null}
      {extra ? <View className="mt-3.5">{extra}</View> : null}
      {children ? <View className="mt-7 flex-row justify-center gap-2.5">{children}</View> : null}
    </View>
  );
}
