// The colourway line under a product title on a listing tile.
//
// A piece is offered in several colours (migration 21), and a tile has room for
// one line: the primary swatch and name, then how many others there are. The
// full list belongs on the product page, in the specs panel.

import { Swatch } from "@/components/ui/OptionPickers";
import type { ProductColor } from "@/lib/data";

/** Swatches then the primary name. A fragment, so the tile owns the line. */
export function ColorLine({ colors, size = 12 }: { colors: ProductColor[]; size?: number }) {
  const [primary, ...rest] = colors;
  if (!primary) return null;

  return (
    <>
      {colors.map((color) => (
        <Swatch key={color.id || color.label} hex={color.hex} size={size} />
      ))}
      <span>
        {primary.label}
        {rest.length > 0 && (
          <>
            {" "}
            <span aria-hidden>+{rest.length}</span>
            <span className="sr-only">and {rest.map((color) => color.label).join(", ")}</span>
          </>
        )}
      </span>
    </>
  );
}
