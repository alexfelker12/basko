import { useUnstableNativeVariable } from "nativewind";
import { useWindowDimensions, View } from "react-native";
import Svg, { Path } from "react-native-svg";

/**
 * Dezentes, unregelmäßiges Hintergrundmuster hinter Screens mit wenig Inhalt – VORLÄUFIG vier
 * Varianten zum Vergleich (Branch `ui-feinschliff`), danach bleibt eine.
 * - `scatter`: verstreute Punkte in leicht unterschiedlicher Größe
 * - `dotgrid`: Punktraster wie in einem Notizbuch, leicht unregelmäßig und mit Lücken
 * - `fibers`: feine, kurze Fasern wie in Recyclingpapier
 * - `pencil`: vereinzelte Bleistift-Spuren eines Einkaufszettels – Häkchen, Striche, Kringel
 *
 * Alle Formen entstehen aus einem festen Startwert (gleiches Bild bei jedem Öffnen) und werden
 * als ein einziger `Path` gezeichnet – kein `<Pattern>`, keine Hunderte Einzelelemente.
 * Farbe ist der Token `line`, leicht abgeschwächt.
 */
export type PatternVariant = "scatter" | "dotgrid" | "fibers" | "pencil";

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

  const { fill, stroke, strokeWidth } = buildPattern(variant, width, height);

  return (
    <View pointerEvents="none" className="absolute inset-0 overflow-hidden">
      <Svg width={width} height={height} opacity={PATTERN_OPACITY}>
        {fill ? <Path d={fill} fill={color} /> : null}
        {stroke ? (
          <Path
            d={stroke}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
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
  let strokeWidth = 1.2;

  switch (variant) {
    case "scatter":
      eachCell(width, height, 26, 0.3, 11, (x, y, next) => {
        fill += circle(x, y, round(0.7 + next() * 1.1));
      });
      break;

    case "dotgrid": {
      // Festes Raster, aber jeder Punkt minimal verrutscht, unterschiedlich kräftig, manche fehlen
      const gap = 22;
      const next = random(29);
      for (let y = gap / 2; y < height; y += gap) {
        for (let x = gap / 2; x < width; x += gap) {
          if (next() < 0.18) continue;
          const jitter = () => (next() - 0.5) * 1.4;
          fill += circle(x + jitter(), y + jitter(), round(0.55 + next() * 0.45));
        }
      }
      break;
    }

    case "fibers":
      // Kurze, leicht gebogene Härchen in zufälliger Richtung, dazu einzelne Pünktchen
      strokeWidth = 0.8;
      eachCell(width, height, 26, 0.35, 41, (x, y, next) => {
        if (next() < 0.25) {
          fill += circle(x, y, 0.6);
          return;
        }
        const length = 4 + next() * 7;
        const angle = next() * Math.PI * 2;
        const dx = Math.cos(angle) * length;
        const dy = Math.sin(angle) * length;
        // Kontrollpunkt seitlich versetzt → sanfte Krümmung
        const bend = (next() - 0.5) * length * 0.8;
        const cx = x + dx / 2 - Math.sin(angle) * bend;
        const cy = y + dy / 2 + Math.cos(angle) * bend;
        stroke += `M${round(x)} ${round(y)}Q${round(cx)} ${round(cy)} ${round(x + dx)} ${round(y + dy)}`;
      });
      break;

    case "pencil":
      // Wenige, leicht schiefe Zeichen wie mit Bleistift auf einem Einkaufszettel
      strokeWidth = 1.2;
      eachCell(width, height, 48, 0.45, 67, (x, y, next) => {
        const kind = next();
        const tilt = (next() - 0.5) * 0.6;
        const cos = Math.cos(tilt);
        const sin = Math.sin(tilt);
        /** Punkt relativ zu (x, y), um `tilt` gedreht. */
        const at = (px: number, py: number) =>
          `${round(x + px * cos - py * sin)} ${round(y + px * sin + py * cos)}`;
        if (kind < 0.4) {
          // Häkchen
          stroke += `M${at(-3, 0)}L${at(-1, 2.5)}L${at(4, -3)}`;
        } else if (kind < 0.75) {
          // kurzer Strich (Spiegelstrich)
          const half = 2.5 + next() * 2;
          stroke += `M${at(-half, 0)}L${at(half, 0)}`;
        } else {
          // kleiner Kringel (Aufzählungspunkt)
          stroke += circle(x, y, round(1.6 + next() * 0.8));
        }
      });
      break;
  }

  return { fill, stroke, strokeWidth };
}
