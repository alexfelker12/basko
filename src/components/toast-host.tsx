import { CheckIcon } from "lucide-react-native";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { View } from "react-native";
import { useReanimatedKeyboardAnimation } from "react-native-keyboard-controller";
import { LinearTransition, useAnimatedStyle } from "react-native-reanimated";

import { Icon } from "@/components/ui/icon";
import { Toast, ToastAction, ToastTitle } from "@/components/ui/toast";
import { StyledAnimatedView } from "@/components/ui/utils/animated";

const DEFAULT_DURATION = 2500;
/** Mehr Toasts gleichzeitig wären unübersichtlich – der älteste weicht. */
const MAX_TOASTS = 3;
/** Toasts sitzen 96 px über dem unteren Rand (`bottom-24`); über der Tastatur bleiben 12 px Luft. */
const BOTTOM_OFFSET = 96;
const KEYBOARD_GAP = 12;

export type ShowToastOptions = {
  title: string;
  /** Text-Aktion in amber, z. B. „Rückgängig“. */
  action?: { label: string; onPress: () => void };
  /** Haken vor dem Text, z. B. „Sicherung erstellt“ (8d). */
  withCheck?: boolean;
  duration?: number;
};

type ToastEntry = ShowToastOptions & { id: number };

type ToastApi = {
  show: (options: ShowToastOptions) => number;
  close: (id: number) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

let nextToastId = 0;

/**
 * Eigener Toast-Host (Spezifikation → Globale Muster → Toast): ein einziger Stapel am unteren Rand,
 * neue Toasts unten, ältere rücken mit gleichmäßigem Abstand nach oben; hebt sich über die Tastatur.
 *
 * Liegt AUSSERHALB von GluestackUIProvider und rendert nach ihm – damit über allen
 * Overlay-Portalen (Sheets, Dialoge), egal in welcher Reihenfolge sie eingehängt wurden.
 */
export function AppToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  const close = useCallback((id: number) => {
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback(
    ({ duration = DEFAULT_DURATION, ...options }: ShowToastOptions) => {
      const id = ++nextToastId;
      setToasts((current) => {
        const next = [...current, { ...options, id }];
        // Verdrängte Toasts brauchen keinen Timer mehr (die Löschung selbst läuft unabhängig weiter)
        next.slice(0, Math.max(next.length - MAX_TOASTS, 0)).forEach((old) => {
          clearTimeout(timers.current.get(old.id));
          timers.current.delete(old.id);
        });
        return next.slice(-MAX_TOASTS);
      });
      timers.current.set(
        id,
        setTimeout(() => close(id), duration)
      );
      return id;
    },
    [close]
  );

  const { height: keyboardHeight } = useReanimatedKeyboardAnimation();
  // keyboardHeight ist ≤ 0 (−Tastaturhöhe): erst anheben, wenn die Tastatur bis an den Toast reicht
  const liftStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: Math.min(0, keyboardHeight.get() + BOTTOM_OFFSET - KEYBOARD_GAP) },
    ],
  }));

  return (
    <ToastContext.Provider value={{ show, close }}>
      <View className="flex-1">
        {children}
        <StyledAnimatedView
          pointerEvents="box-none"
          className="absolute inset-x-0 bottom-24 gap-2 px-3"
          style={liftStyle}
        >
          {toasts.map((toast) => (
            <Toast key={toast.id} layout={LinearTransition.duration(200)}>
              {toast.withCheck ? <Icon as={CheckIcon} size="lg" className="text-bg" /> : null}
              <ToastTitle>{toast.title}</ToastTitle>
              {toast.action ? (
                <ToastAction
                  label={toast.action.label}
                  onPress={() => {
                    toast.action?.onPress();
                    close(toast.id);
                  }}
                />
              ) : null}
            </Toast>
          ))}
        </StyledAnimatedView>
      </View>
    </ToastContext.Provider>
  );
}

export function useToastApi() {
  const api = useContext(ToastContext);
  if (!api) throw new Error("useToastApi muss innerhalb von AppToastProvider verwendet werden");
  return api;
}
