import { useUnstableNativeVariable } from "nativewind";
import { memo } from "react";
import { useWindowDimensions, View } from "react-native";
import Svg, { Path } from "react-native-svg";

/**
 * Dezentes Hintergrundmuster hinter den Screens (Punktraster wie in einem Notizbuch): festes
 * Raster, jeder Punkt minimal verrutscht und unterschiedlich kräftig, manche fehlen – so wirkt es
 * gezeichnet statt gedruckt. Farbe ist der Token `line`, leicht abgeschwächt.
 *
 * Rendern: Die Punkte entstehen einmal je Bildschirmgröße (fester Startwert, Ergebnis im Cache)
 * und werden als drei `Path`s gezeichnet – je Punktgröße einer, jeder Punkt ein winziger Strich
 * mit runden Enden. Kein `<Pattern>` (stürzte mit `currentColor` auf Android ab), keine
 * Hunderte Einzelelemente.
 */

// Die Typen zeigen die Web-Variante (ohne Parameter); nativ liefert der Hook den aktuellen Wert
const useNativeVariable = useUnstableNativeVariable as unknown as (name: string) => unknown;

/** Abstand der Rasterpunkte. */
const GAP = 22;
/** Anteil fehlender Punkte. */
const SKIP = 0.18;
/** Wie weit ein Punkt höchstens von seinem Rasterplatz abweicht (in beide Richtungen). */
const JITTER = 0.7;
/** Durchmesser der drei Punktgrößen. */
const DOT_SIZES = [1.1, 1.5, 1.9] as const;
/** Deckkraft des Musters – so bleibt es auch hinter Text unaufdringlich. */
const OPACITY = 0.75;
/** Höhe/Breite auf diese Schritte aufrunden – kleine Größenänderungen nutzen den Cache. */
const SIZE_STEP = 200;
const SEED = 29;

/** Kleiner, fester Zufallsgenerator (mulberry32) – immer dasselbe Muster. */
function random(seed: number) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

const cache = new Map<string, string[]>();

/** Je Punktgröße ein Pfad aus winzigen Strichen („M x y h.01“). */
function dotPaths(width: number, height: number): string[] {
  const key = `${width}x${height}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const next = random(SEED);
  const paths: string[][] = DOT_SIZES.map(() => []);
  for (let y = GAP / 2; y < height; y += GAP) {
    for (let x = GAP / 2; x < width; x += GAP) {
      // Immer alle drei Zufallswerte ziehen, damit das Muster stabil bleibt
      const skip = next();
      const dx = (next() - 0.5) * 2 * JITTER;
      const dy = (next() - 0.5) * 2 * JITTER;
      const size = Math.floor(next() * DOT_SIZES.length);
      if (skip < SKIP) continue;
      paths[size].push(`M${Math.round((x + dx) * 10) / 10} ${Math.round((y + dy) * 10) / 10}h.01`);
    }
  }

  const result = paths.map((parts) => parts.join(""));
  cache.set(key, result);
  return result;
}

/** Muster liegt hinter dem Inhalt und fängt keine Berührungen ab. */
export const ScreenPattern = memo(function ScreenPattern() {
  const window = useWindowDimensions();
  // Kein `currentColor`: react-native-svg kann das auf Android nicht überall auflösen
  const color = useNativeVariable("--line");
  if (typeof color !== "string") return null;

  const width = Math.ceil(window.width / SIZE_STEP) * SIZE_STEP;
  const height = Math.ceil(window.height / SIZE_STEP) * SIZE_STEP;
  const paths = dotPaths(width, height);

  return (
    <View pointerEvents="none" className="absolute inset-0 overflow-hidden">
      <Svg width={width} height={height} opacity={OPACITY}>
        {paths.map((d, index) => (
          <Path
            key={DOT_SIZES[index]}
            d={d}
            stroke={color}
            strokeWidth={DOT_SIZES[index]}
            strokeLinecap="round"
          />
        ))}
      </Svg>
    </View>
  );
});
