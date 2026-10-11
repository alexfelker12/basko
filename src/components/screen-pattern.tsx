import {
  Apple,
  Banana,
  Carrot,
  Cherry,
  Coffee,
  Cookie,
  Croissant,
  Egg,
  Fish,
  Grape,
  Milk,
  ShoppingBasket,
  Wheat,
  Wine,
  type LucideIcon,
} from "lucide-react-native";
import { styled } from "nativewind";
import type { ComponentType } from "react";
import { useWindowDimensions, View, type StyleProp, type ViewStyle } from "react-native";
import Svg, { Circle, Defs, Line, Path, Pattern, Rect } from "react-native-svg";

import { Icon } from "@/components/ui/icon";

/**
 * Dezentes Hintergrundmuster hinter Screens mit wenig Inhalt – VORLÄUFIG vier Varianten zum
 * Vergleich (Branch `ui-feinschliff`), danach bleibt eine.
 * - `doodles`: verstreute Einkaufs-Icons (Apfel, Brot, Milch …), ähnlich dem Chat-Hintergrund
 * - `dots`: Punkteraster
 * - `grid`: Karopapier wie ein Einkaufszettel
 * - `lines`: Linien wie ein Notizblock
 * Farbe ist der Token `line` – im hellen und dunklen Thema gleich zurückhaltend.
 */
export type PatternVariant = "doodles" | "dots" | "grid" | "lines";

type SvgVariant = Exclude<PatternVariant, "doodles">;

// Die Farbe der Klasse (`text-line`) kommt als `color`-Prop an und wird direkt als Füllung bzw.
// Strich gesetzt. Kein `currentColor`: in einem `<Pattern>` stürzt react-native-svg auf Android ab
// („DefsView cannot be cast to RenderableView“).
const StyledSvgPattern = styled(SvgPattern, {
  // @ts-expect-error -- react-native-css 3.0.x typt nativeStyleToProp bei StyleProp-Unions als undefined; zur Laufzeit korrekt
  className: { target: "style", nativeStyleToProp: { color: true } },
}) as ComponentType<{ variant: SvgVariant; className?: string }>;

/** Muster liegt hinter dem Inhalt und fängt keine Berührungen ab. */
export function ScreenPattern({ variant }: { variant: PatternVariant }) {
  return (
    <View pointerEvents="none" className="absolute inset-0 overflow-hidden">
      {variant === "doodles" ? (
        <Doodles />
      ) : (
        <StyledSvgPattern variant={variant} className="text-line" />
      )}
    </View>
  );
}

/** Kachelgrößen der SVG-Muster (in Punkten). */
const DOT_GAP = 18;
const GRID_GAP = 22;
const LINE_GAP = 30;

function SvgPattern({
  variant,
  color,
}: {
  variant: SvgVariant;
  color?: string;
  /** Kommt von `styled()` mit; das Muster füllt immer die ganze Fläche. */
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Svg width="100%" height="100%">
      <Defs>
        {variant === "dots" ? (
          <Pattern id="dots" width={DOT_GAP} height={DOT_GAP} patternUnits="userSpaceOnUse">
            <Circle cx={DOT_GAP / 2} cy={DOT_GAP / 2} r={1.6} fill={color} />
          </Pattern>
        ) : null}
        {variant === "grid" ? (
          <Pattern id="grid" width={GRID_GAP} height={GRID_GAP} patternUnits="userSpaceOnUse">
            <Path
              d={`M ${GRID_GAP} 0 L 0 0 0 ${GRID_GAP}`}
              fill="none"
              stroke={color}
              strokeWidth={1}
            />
          </Pattern>
        ) : null}
        {variant === "lines" ? (
          <Pattern id="lines" width={LINE_GAP} height={LINE_GAP} patternUnits="userSpaceOnUse">
            <Line
              x1={0}
              y1={LINE_GAP - 0.5}
              x2={LINE_GAP}
              y2={LINE_GAP - 0.5}
              stroke={color}
              strokeWidth={1}
            />
          </Pattern>
        ) : null}
      </Defs>
      <Rect width="100%" height="100%" fill={`url(#${variant})`} />
    </Svg>
  );
}

const DOODLE_ICONS: LucideIcon[] = [
  Apple,
  Croissant,
  Milk,
  Carrot,
  Egg,
  Cherry,
  Fish,
  Wine,
  Banana,
  Coffee,
  Grape,
  Wheat,
  Cookie,
  ShoppingBasket,
];

/** Kachel 140 × 140 mit fünf Icons; Nachbarkacheln nehmen jeweils andere Icons. */
const TILE = 140;
const SLOTS = [
  { x: 14, y: 12, rotate: -14 },
  { x: 84, y: 26, rotate: 10 },
  { x: 40, y: 64, rotate: 6 },
  { x: 102, y: 92, rotate: -8 },
  { x: 10, y: 106, rotate: 16 },
];

function Doodles() {
  const { width, height } = useWindowDimensions();
  const columns = Math.ceil(width / TILE);
  const rows = Math.ceil(height / TILE);

  const doodles = [];
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      // Versatz je Kachel, damit sich das Muster nicht sichtbar wiederholt
      const offset = (row * 3 + column * 5) % DOODLE_ICONS.length;
      for (let slot = 0; slot < SLOTS.length; slot++) {
        const { x, y, rotate } = SLOTS[slot];
        const icon = DOODLE_ICONS[(offset + slot) % DOODLE_ICONS.length];
        doodles.push(
          <View
            key={`${row}-${column}-${slot}`}
            className="absolute"
            style={{
              left: column * TILE + x,
              top: row * TILE + y,
              transform: [{ rotate: `${rotate}deg` }],
            }}
          >
            <Icon as={icon} className="h-6 w-6 text-line" />
          </View>
        );
      }
    }
  }
  return <>{doodles}</>;
}
