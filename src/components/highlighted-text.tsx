import { Text } from "@/components/ui/text";
import type { HighlightPart } from "@/lib/search";
import { cn } from "@gluestack-ui/utils/nativewind-utils";

interface HighlightedTextProps {
  parts: HighlightPart[];
  /** Größe/Gewicht des ganzen Texts, z. B. „text-base font-bold“. */
  className?: string;
}

/** Name mit leicht hervorgehobenem Suchtreffer (3c, 4a/4b): Treffer in `primary` und 800. */
export function HighlightedText({ parts, className }: HighlightedTextProps) {
  return (
    <Text numberOfLines={1} className={className}>
      {parts.map((part, index) => (
        <Text key={index} className={cn(className, part.match && "font-extrabold text-primary")}>
          {part.text}
        </Text>
      ))}
    </Text>
  );
}
