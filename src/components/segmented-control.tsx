import { Pressable, View } from "react-native";

import { Text } from "@/components/ui/text";
import { cn } from "@gluestack-ui/utils/nativewind-utils";

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Segmente teilen sich die volle Breite (6i) statt nur so breit wie ihr Text (8a). */
  stretch?: boolean;
  className?: string;
}

/**
 * SegmentedControl (Komponenten 10a): Pille auf `chip`, gewähltes Segment auf `surface` und
 * fett, die anderen in `soft` – z. B. Darstellung (8a) und Behalten/Überschreiben (6i).
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  stretch = false,
  className,
}: SegmentedControlProps<T>) {
  return (
    <View className={cn("flex-row rounded-[999px] bg-chip p-0.75", className)} role="radiogroup">
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            role="radio"
            aria-checked={selected}
            className={cn(
              "h-9.5 items-center justify-center rounded-[999px] px-3",
              stretch && "flex-1",
              selected && "bg-surface"
            )}
          >
            <Text className={cn("text-sm", selected ? "font-extrabold" : "font-bold text-soft")}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
