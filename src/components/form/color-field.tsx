import { ColorSwatchPicker } from "@/components/color-swatch-picker";
import { useFieldContext } from "@/lib/form/form-context";
import type { ListColor } from "@/lib/list-colors";

/** Listenfarbe: 5 Farbkreise (1f, 3g). */
export function ColorFieldComponent() {
  const field = useFieldContext<ListColor>();
  return <ColorSwatchPicker value={field.state.value} onChange={field.handleChange} />;
}
