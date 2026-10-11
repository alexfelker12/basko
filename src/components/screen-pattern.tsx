import { useUnstableNativeVariable } from "nativewind";
import { useWindowDimensions, View } from "react-native";
import Svg, { Path } from "react-native-svg";

/**
 * Dezentes, unregelmäßiges Hintergrundmuster hinter Screens mit wenig Inhalt – VORLÄUFIG vier
 * Varianten zum Vergleich (Branch `ui-feinschliff`), danach bleibt eine.
 * - `scatter`: verstreute Punkte in leicht unterschiedlicher Größe
 * - `sprinkles`: kurze Striche in zufälliger Richtung, wie Streusel
 * - `stardust`: feine Punkte, dazwischen vereinzelt kleine Kreuze und Ringe
 * - `bubbles`: wenige Kreisringe in verschiedenen Größen
 *
 * Alle Formen entstehen aus einem festen Startwert (gleiches Bild bei jedem Öffnen) und werden
 * als ein einziger `Path` gezeichnet – kein `<Pattern>`, keine Hunderte Einzelelemente.
 * Farbe ist der Token `line`, leicht abgeschwächt.
 */
export type PatternVariant = "scatter" | "sprinkles" | "stardust" | "bubbles";

// Die Typen zeigen die Web-Variante (ohne Parameter); nativ liefert der Hook den aktuellen Wert
const useNativeVariable = useUnstableNativeVariable as unknown as (name: string) => unknown;

/** Deckkraft des Musters – so bleibt es auch hinter Text unaufdringlich. */
const PATTERN_OPACITY = 0.75;

/** Muster liegt hinter dem Inhalt und fängt keine Berührungen ab. */
export function ScreenPattern({ variant }: { variant: PatternVariant }) {
  const { width, height } = useWindowDimensions();
  // Kein `currentColor`: react-native-svg kann das auf Android nicht überall auflösen
  const color = useNativeVariable("--line");
  if (typeof color !== "string") return null;

  const { fill, stroke } = buildPattern(variant, width, height);

  return (
    <View pointerEvents="none" className="absolute inset-0 overflow-hidden">
      <Svg width={width} height={height} opacity={PATTERN_OPACITY}>
        {fill ? <Path d={fill} fill={color} /> : null}
        {stroke ? (
          <Path
            d={stroke}
            fill="none"
            stroke={color}
            strokeWidth={1.3}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : null}
      </Svg>
    </View>
  );
}

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

const round = (value: number) => Math.round(value * 10) / 10;

/** Kreis als zwei Bögen (für gefüllte Punkte und Ringe). */
function circle(x: number, y: number, r: number) {
  return `M${round(x - r)} ${round(y)}a${r} ${r} 0 1 0 ${round(2 * r)} 0a${r} ${r} 0 1 0 ${round(-2 * r)} 0`;
}

/**
 * Verteilung: ein Raster, in jeder Zelle höchstens eine Form an zufälliger Stelle. Das wirkt
 * unregelmäßig, lässt aber keine Klumpen oder großen Lücken entstehen.
 */
function eachCell(
  width: number,
  height: number,
  cell: number,
  skip: number,
  seed: number,
  draw: (x: number, y: number, next: () => number) => void
) {
  const next = random(seed);
  for (let y = 0; y < height; y += cell) {
    for (let x = 0; x < width; x += cell) {
      if (next() < skip) continue;
      draw(x + next() * cell, y + next() * cell, next);
    }
  }
}

function buildPattern(variant: PatternVariant, width: number, height: number) {
  let fill = "";
  let stroke = "";

  switch (variant) {
    case "scatter":
      eachCell(width, height, 26, 0.3, 11, (x, y, next) => {
        fill += circle(x, y, round(0.7 + next() * 1.1));
      });
      break;

    case "sprinkles":
      eachCell(width, height, 30, 0.4, 23, (x, y, next) => {
        const length = 3 + next() * 3;
        const angle = next() * Math.PI;
        const dx = round(Math.cos(angle) * length);
        const dy = round(Math.sin(angle) * length);
        stroke += `M${round(x - dx / 2)} ${round(y - dy / 2)}l${dx} ${dy}`;
      });
      break;

    case "stardust":
      eachCell(width, height, 24, 0.35, 37, (x, y, next) => {
        const kind = next();
        if (kind < 0.84) {
          fill += circle(x, y, round(0.6 + next() * 0.7));
        } else if (kind < 0.93) {
          const size = 2.5;
          stroke += `M${round(x - size)} ${round(y)}h${size * 2}M${round(x)} ${round(y - size)}v${size * 2}`;
        } else {
          stroke += circle(x, y, 2.2);
        }
      });
      break;

    case "bubbles":
      eachCell(width, height, 54, 0.45, 53, (x, y, next) => {
        stroke += circle(x, y, round(2 + next() * 5));
      });
      break;
  }

  return { fill, stroke };
}
