import { CheckIcon, type LucideIcon } from "lucide-react-native";
import { Pressable, View } from "react-native";

import { Sheet } from "@/components/sheet";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";

export interface Choice<T extends string> {
  value: T;
  label: string;
  /** Symbol vor dem Label, z. B. Sonne für „Hell“. */
  icon?: LucideIcon;
  /** Flagge als Emoji vor dem Label, z. B. 🇩🇪 – statt `icon`. */
  flag?: string;
}

interface ChoiceSheetProps<T extends string> {
  isOpen: boolean;
  title: string;
  choices: readonly Choice<T>[];
  value: T;
  onClose: () => void;
  /** Nach der Schließ-Animation, z. B. um erst dann umzustellen. */
  onClosed?: () => void;
  onSelect: (value: T) => void;
}

/** Auswahl-Sheet der Einstellungen (8a: Darstellung, Sprache): Symbol, Label, Haken an der gewählten. */
export function ChoiceSheet<T extends string>({
  isOpen,
  title,
  choices,
  value,
  onClose,
  onClosed,
  onSelect,
}: ChoiceSheetProps<T>) {
  return (
    <Sheet isOpen={isOpen} onDismiss={onClose} onClosed={onClosed}>
      <Text role="heading" className="px-page pb-2 pt-1 text-xl font-extrabold">
        {title}
      </Text>
      <View className="px-page pb-4">
        {choices.map((choice) => {
          const selected = choice.value === value;
          return (
            <Pressable
              key={choice.value}
              onPress={() => onSelect(choice.value)}
              role="radio"
              aria-checked={selected}
              aria-label={choice.label}
              className="min-h-12.5 flex-row items-center gap-3 border-b border-line active:opacity-70"
            >
              <View className="size-6 items-center justify-center">
                {choice.flag ? (
                  <Text className="text-xl" importantForAccessibility="no">
                    {choice.flag}
                  </Text>
                ) : choice.icon ? (
                  <Icon as={choice.icon} size="lg" className="text-ink" />
                ) : null}
              </View>
              <Text className="flex-1 text-base font-bold">{choice.label}</Text>
              {selected ? <Icon as={CheckIcon} size="lg" className="text-primary" /> : null}
            </Pressable>
          );
        })}
      </View>
    </Sheet>
  );
}
