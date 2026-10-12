import { Pressable } from "react-native";

import { RoundCheckbox } from "@/components/round-checkbox";
import { useFieldContext } from "@/lib/form/form-context";
import { cn } from "@gluestack-ui/utils/nativewind-utils";

interface CheckboxFieldProps {
  /** Accessibility-Label, z. B. „Garlic übernehmen“. */
  label: string;
  className?: string;
}

/** Runde Checkbox als Formularfeld (Zutat an-/abwählen, 7e); Touch-Fläche 44. */
export function CheckboxFieldComponent({ label, className }: CheckboxFieldProps) {
  const field = useFieldContext<boolean>();
  const checked = field.state.value;

  return (
    <Pressable
      onPress={() => field.handleChange(!checked)}
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      hitSlop={4}
      className={cn("size-11 items-center justify-center active:opacity-70", className)}
    >
      <RoundCheckbox checked={checked} faded={false} />
    </Pressable>
  );
}
