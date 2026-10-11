import type { LucideIcon } from "lucide-react-native";

import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { useFormContext } from "@/lib/form/form-context";

interface SubmitButtonProps {
  /** Text, bei `icon` nur als Accessibility-Label. */
  label: string;
  /** Runder Icon-Button (z. B. Haken beim Umbenennen, 1d). */
  icon?: LucideIcon;
  className?: string;
}

/** Absenden: ausgegraut, solange das Formular ungültig ist oder gerade speichert. */
export function SubmitButton({ label, icon, className }: SubmitButtonProps) {
  const form = useFormContext();

  return (
    <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting] as const}>
      {([canSubmit, isSubmitting]) => (
        <Button
          size={icon ? "icon" : "default"}
          className={className}
          isDisabled={!canSubmit || isSubmitting}
          onPress={() => form.handleSubmit()}
          aria-label={label}
        >
          {icon ? <ButtonIcon as={icon} /> : <ButtonText>{label}</ButtonText>}
        </Button>
      )}
    </form.Subscribe>
  );
}
