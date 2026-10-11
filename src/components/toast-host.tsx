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
import { useWindowDimensions, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import {
  FadeInDown,
  FadeOutDown,
  interpolate,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { Icon } from "@/components/ui/icon";
import { Toast, ToastAction, ToastTitle } from "@/components/ui/toast";
import { StyledAnimatedView } from "@/components/ui/utils/animated";
import { useKeyboardHeight } from "@/hooks/use-keyboard";

const DEFAULT_DURATION = 2500;
/** Nach dem Loslassen bleibt ein angefasster Toast noch mindestens so lange stehen. */
const MIN_REMAINING_AFTER_DRAG = 1500;
/** Mehr Toasts gleichzeitig wären unübersichtlich – der älteste weicht. */
const MAX_TOASTS = 3;
/** Toasts sitzen 96 px über dem unteren Rand (Abstandhalter `h-24`); über der Tastatur bleiben 12 px Luft. */
const BOTTOM_OFFSET = 96;
const KEYBOARD_GAP = 12;
/**
 * Richtungserkennung: Seitlich startet der Wisch schon nach 10 px, nach unten erst nach 24 px.
 * Ein leicht schräger Wisch zählt damit als seitlich; die Achse steht danach fest.
 */
const ACTIVATE_X = 10;
const ACTIVATE_DOWN = 24;
/** Wegwischen: seitlich ab 30 % der Breite, nach unten ab 32 px – oder mit genug Schwung. */
const SWIPE_X_RATIO = 0.3;
const SWIPE_DOWN_DISTANCE = 32;
const SWIPE_VELOCITY = 700;
const SWIPE_OUT = { duration: 180 };

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

/** Auto-Schließen je Toast; pausiert, solange der Toast angefasst wird. */
type ToastTimer = { timeout?: ReturnType<typeof setTimeout>; endsAt: number; remaining: number };

const ToastContext = createContext<ToastApi | null>(null);

let nextToastId = 0;

/**
 * Eigener Toast-Host (Spezifikation → Globale Muster → Toast): ein einziger Stapel am unteren Rand,
 * neue Toasts unten, ältere darüber; hebt sich über die Tastatur. Wegwischen nach unten,
 * links oder rechts.
 *
 * Liegt AUSSERHALB von GluestackUIProvider und rendert nach ihm – damit über allen
 * Overlay-Portalen (Sheets, Dialoge), egal in welcher Reihenfolge sie eingehängt wurden.
 */
export function AppToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const timers = useRef(new Map<number, ToastTimer>());

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((timer) => clearTimeout(timer.timeout));
  }, []);

  const close = useCallback((id: number) => {
    clearTimeout(timers.current.get(id)?.timeout);
    timers.current.delete(id);
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const schedule = useCallback(
    (id: number, ms: number) => {
      const timer = timers.current.get(id);
      if (!timer) return;
      clearTimeout(timer.timeout);
      timer.endsAt = Date.now() + ms;
      timer.timeout = setTimeout(() => close(id), ms);
    },
    [close]
  );

  const pause = useCallback((id: number) => {
    const timer = timers.current.get(id);
    if (!timer) return;
    clearTimeout(timer.timeout);
    timer.timeout = undefined;
    timer.remaining = Math.max(timer.endsAt - Date.now(), 0);
  }, []);

  const resume = useCallback(
    (id: number) => {
      const timer = timers.current.get(id);
      if (timer) schedule(id, Math.max(timer.remaining, MIN_REMAINING_AFTER_DRAG));
    },
    [schedule]
  );

  const show = useCallback(
    ({ duration = DEFAULT_DURATION, ...options }: ShowToastOptions) => {
      const id = ++nextToastId;
      setToasts((current) => {
        const next = [...current, { ...options, id }];
        // Verdrängte Toasts brauchen keinen Timer mehr (die Löschung selbst läuft unabhängig weiter)
        next.slice(0, Math.max(next.length - MAX_TOASTS, 0)).forEach((old) => {
          clearTimeout(timers.current.get(old.id)?.timeout);
          timers.current.delete(old.id);
        });
        return next.slice(-MAX_TOASTS);
      });
      timers.current.set(id, { endsAt: 0, remaining: duration });
      schedule(id, duration);
      return id;
    },
    [schedule]
  );

  const { height: keyboardHeight } = useKeyboardHeight();
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
        {/* Bildschirmhoher Stapel, unten ausgerichtet: Seine Oberkante bleibt fest, wenn Toasts
            gehen – so blenden sie an Ort und Stelle aus, statt erst nach unten zu rutschen.
            Kein Padding/Gap am animierten Stapel (mit `pb-24` landeten die Toasts auf Android am
            unteren Rand): Den Abstand nach unten hält ein Platzhalter, die Abstände tragen die Toasts. */}
        <View pointerEvents="box-none" className="absolute inset-0">
          <StyledAnimatedView pointerEvents="box-none" className="flex-1 justify-end" style={liftStyle}>
            {toasts.map((toast) => (
              <SwipeableToast
                key={toast.id}
                toast={toast}
                onDismiss={() => close(toast.id)}
                onDragStart={() => pause(toast.id)}
                onDragCancel={() => resume(toast.id)}
              />
            ))}
          </StyledAnimatedView>
          <View pointerEvents="none" className="h-24" />
        </View>
      </View>
    </ToastContext.Provider>
  );
}

interface SwipeableToastProps {
  toast: ToastEntry;
  onDismiss: () => void;
  onDragStart: () => void;
  onDragCancel: () => void;
}

/** Ein Toast im Stapel: ein-/ausblenden, gleitet an seine Position, wegwischbar. */
function SwipeableToast({ toast, onDismiss, onDragStart, onDragCancel }: SwipeableToastProps) {
  const { width } = useWindowDimensions();
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  /** Achse des laufenden Wischs: 1 = seitlich, 2 = nach unten – beim Start festgelegt. */
  const axis = useSharedValue(0);
  /**
   * Bewegung zählt ab dem Aufsetzen des Fingers, über die absoluten Koordinaten: Android setzt
   * `translationX/Y` beim Aktivieren der Geste auf 0 zurück – darüber ließ sich die Richtung
   * nicht erkennen (jeder Wisch galt als „nach unten“).
   */
  const touchStartX = useSharedValue(0);
  const touchStartY = useSharedValue(0);
  /** Weg bis zum Start – wird abgezogen, damit der Toast nicht um die Schwelle springt. */
  const startOffset = useSharedValue(0);

  const pan = Gesture.Pan()
    .activeOffsetX([-ACTIVATE_X, ACTIVATE_X])
    .activeOffsetY(ACTIVATE_DOWN)
    .onBegin((event) => {
      touchStartX.set(event.absoluteX);
      touchStartY.set(event.absoluteY);
    })
    .onStart((event) => {
      const dx = event.absoluteX - touchStartX.get();
      const dy = event.absoluteY - touchStartY.get();
      // Seitlich gewinnt, sobald die Seitwärtsbewegung ihre (kleinere) Schwelle erreicht hat
      const horizontal = Math.abs(dx) >= ACTIVATE_X;
      axis.set(horizontal ? 1 : 2);
      startOffset.set(horizontal ? dx : dy);
      scheduleOnRN(onDragStart);
    })
    .onUpdate((event) => {
      if (axis.get() === 1) {
        translateX.set(event.absoluteX - touchStartX.get() - startOffset.get());
      } else {
        // Nach oben nur mit deutlichem Widerstand
        const y = event.absoluteY - touchStartY.get() - startOffset.get();
        translateY.set(y > 0 ? y : y * 0.15);
      }
    })
    .onEnd((event) => {
      const dismiss = (finished?: boolean) => {
        "worklet";
        if (finished) scheduleOnRN(onDismiss);
      };

      if (axis.get() === 1) {
        const x = translateX.get();
        if (Math.abs(x) > width * SWIPE_X_RATIO || Math.abs(event.velocityX) > SWIPE_VELOCITY) {
          const direction = x !== 0 ? Math.sign(x) : Math.sign(event.velocityX) || 1;
          translateX.set(withTiming(direction * width, SWIPE_OUT, dismiss));
          return;
        }
      } else if (translateY.get() > SWIPE_DOWN_DISTANCE || event.velocityY > SWIPE_VELOCITY) {
        translateY.set(withTiming(translateY.get() + 120, SWIPE_OUT, dismiss));
        return;
      }

      translateX.set(withSpring(0));
      translateY.set(withSpring(0));
      scheduleOnRN(onDragCancel);
    })
    .onFinalize(() => {
      axis.set(0);
    });

  const dragStyle = useAnimatedStyle(() => ({
    opacity: Math.min(
      interpolate(Math.abs(translateX.get()), [0, width * 0.6], [1, 0], "clamp"),
      interpolate(translateY.get(), [0, 120], [1, 0], "clamp")
    ),
    transform: [{ translateX: translateX.get() }, { translateY: translateY.get() }],
  }));

  return (
    // Außen: Ein-/Ausblenden und Nachrutschen; innen: Wischen (getrennt, sonst kollidieren die Transforms)
    <StyledAnimatedView
      entering={FadeInDown.duration(200)}
      exiting={FadeOutDown.duration(180)}
      layout={LinearTransition.duration(200)}
    >
      <GestureDetector gesture={pan}>
        <Toast style={dragStyle} className="mx-3 mt-2">
          {toast.withCheck ? <Icon as={CheckIcon} size="lg" className="text-bg" /> : null}
          <ToastTitle>{toast.title}</ToastTitle>
          {toast.action ? (
            <ToastAction
              label={toast.action.label}
              onPress={() => {
                toast.action?.onPress();
                onDismiss();
              }}
            />
          ) : null}
        </Toast>
      </GestureDetector>
    </StyledAnimatedView>
  );
}

export function useToastApi() {
  const api = useContext(ToastContext);
  if (!api) throw new Error("useToastApi muss innerhalb von AppToastProvider verwendet werden");
  return api;
}
