import { CheckIcon } from "lucide-react-native";
import { useCallback } from "react";
import { useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon } from "@/components/ui/icon";
import { Toast, ToastAction, ToastTitle, useToast } from "@/components/ui/toast";

/** Toasts sitzen 96 px über dem unteren Rand (Spezifikation → Globale Muster → Toast). */
const TOAST_BOTTOM_OFFSET = 96;
const DEFAULT_DURATION = 2500;

type ShowToastOptions = {
  title: string;
  /** Text-Aktion in amber, z. B. „Rückgängig“. */
  action?: { label: string; onPress: () => void };
  /** Haken vor dem Text, z. B. „Sicherung erstellt“ (8d). */
  withCheck?: boolean;
  duration?: number;
};

export function useAppToast() {
  const toast = useToast();
  const insets = useSafeAreaInsets();
  // Der Toast-Container passt sich dem Inhalt an – ohne feste Breite fällt der Titel (flex-1) auf 0
  const { width } = useWindowDimensions();
  const marginBottom = Math.max(TOAST_BOTTOM_OFFSET - insets.bottom, 0);

  return useCallback(
    ({ title, action, withCheck, duration = DEFAULT_DURATION }: ShowToastOptions) =>
      toast.show({
        placement: "bottom",
        duration,
        avoidKeyboard: true,
        render: ({ id }) => (
          <View className="px-3" style={{ width, marginBottom }}>
            <Toast nativeID={`toast-${id}`}>
              {withCheck ? <Icon as={CheckIcon} size="lg" className="text-bg" /> : null}
              <ToastTitle>{title}</ToastTitle>
              {action ? (
                <ToastAction
                  label={action.label}
                  onPress={() => {
                    action.onPress();
                    toast.close(id);
                  }}
                />
              ) : null}
            </Toast>
          </View>
        ),
      }),
    [toast, width, marginBottom]
  );
}
