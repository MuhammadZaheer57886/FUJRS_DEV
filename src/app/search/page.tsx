import Link from "next/link";
import { ProductFilterGrid } from "@/components/ui/ProductFilterGrid";
import { catalogRead } from "@/lib/data/server";

async function searchProducts(query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const products = await catalogRead.list();
  return products.filter((p) =>
    [p.title, p.fabric, p.category, p.color].some((field) => field.toLowerCase().includes(q))
  );
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const query = resolvedSearchParams.q ?? "";
  const results = await searchProducts(query);

  return (
    <div className="container-luxe py-16">
      <p className="label-caps text-text-muted">
        {results.length} {results.length === 1 ? "Result" : "Results"}
      </p>
      <h1 className="mt-3 font-display text-headline-md">
        {query ? (
          <>
            Search results for <span className="text-gold">&ldquo;{query}&rdquo;</span>
          </>
        ) : (
          "Search"
        )}
      </h1>

      {query && results.length === 0 && (
        <div className="mx-auto mt-16 max-w-lg text-center">
          <span className="material-symbols-outlined text-5xl text-text-muted">search_off</span>
          <p className="mt-6 font-display text-headline-sm">
            Nothing matched &ldquo;{query}&rdquo;
          </p>
          <p className="mt-3 text-body-md text-text-muted">
            Try a broader term like a fabric or category — or browse a collection instead.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/men" className="label-caps border border-outline-variant px-6 py-3">
              Men
            </Link>
            <Link href="/women" className="label-caps border border-outline-variant px-6 py-3">
              Women
            </Link>
            <Link
              href="/new-arrivals"
              className="label-caps border border-outline-variant px-6 py-3"
            >
              New Arrivals
            </Link>
          </div>
        </div>
      )}

      {results.length > 0 && (
        <div className="mt-12">
          <ProductFilterGrid products={results} />
        </div>
      )}
    </div>
  );
}
