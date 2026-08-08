"use client";

import type { CatalogItem } from "@/lib/data";
import { LoadingRow } from "@/components/ui/Loading";
import { ProductImage } from "@/components/ui/ProductImage";

export function ProductThumb({ item }: { item: CatalogItem }) {
  // The first image is the primary one; the rest show on the product page.
  const primary = item.images[0];
  const extra = item.images.length - 1;

  return (
    <div className="relative h-14 w-11 shrink-0 overflow-hidden border border-border-subtle bg-surface-container-low">
      {primary ? (
        <>
          <ProductImage src={primary} alt="" fill unoptimized className="object-cover" />
          {extra > 0 && (
            <span
              className="absolute bottom-0 right-0 bg-primary px-1 font-label-sm text-[10px] leading-4 text-on-primary"
              title={`${item.images.length} images`}
            >
              +{extra}
            </span>
          )}
        </>
      ) : (
        <span className="absolute inset-0 flex items-center justify-center">
          <span
            aria-hidden="true"
            className="material-symbols-outlined text-lg text-outline-variant"
          >
            image
          </span>
        </span>
      )}
    </div>
  );
}

/** The published catalogue. `actions` renders per-row controls where allowed. */
export function CatalogTable({
  items,
  emptyMessage,
  actions,
}: {
  items: CatalogItem[] | null;
  emptyMessage: string;
  actions?: (item: CatalogItem) => React.ReactNode;
}) {
  const columnCount = 4 + (actions ? 1 : 0);

  return (
    <div className="overflow-x-auto border border-border-subtle">
      <table className="w-full text-left text-body-md">
        <thead className="bg-surface-container-low text-label-sm uppercase text-text-muted">
          <tr>
            <th className="px-4 py-3 font-medium">Product</th>
            <th className="px-4 py-3 font-medium">Category</th>
            <th className="px-4 py-3 font-medium">Added By</th>
            <th className="px-4 py-3 font-medium">Price</th>
            {actions && <th className="px-4 py-3 font-medium">Actions</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-border-subtle">
          {!items && <LoadingRow colSpan={columnCount} />}

          {items?.length === 0 && (
            <tr>
              <td className="px-4 py-6 text-text-muted" colSpan={columnCount}>
                {emptyMessage}
              </td>
            </tr>
          )}

          {items?.map((item) => (
            <tr key={item.id} className="align-middle">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <ProductThumb item={item} />
                  <div className="min-w-0">
                    <p className="truncate font-medium">{item.title}</p>
                    <p className="text-label-sm text-text-muted">
                      {item.fabric} · {item.gender}
                    </p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-text-muted">{item.category}</td>
              <td className="px-4 py-3 text-text-muted">{item.addedByName}</td>
              <td className="px-4 py-3 whitespace-nowrap">PKR {item.price.toLocaleString()}</td>
              {actions && <td className="px-4 py-3">{actions(item)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
