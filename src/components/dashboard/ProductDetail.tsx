"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button, LinkButton } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { LoadingScreen } from "@/components/ui/Loading";
import { ProductImage } from "@/components/ui/ProductImage";
import { StatusScreen } from "@/components/ui/StatusScreen";
import { Swatch } from "@/components/ui/OptionPickers";
import { ProductForm } from "@/components/dashboard/ProductForm";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/components/providers/AuthProvider";
import { useAsync } from "@/lib/useAsync";
import { COLOR_FAMILY_LABELS } from "@/lib/productTaxonomy";
import { catalog, StoreWriteError, type ProductInput } from "@/lib/data";

/** Stock at or below this reads as "nearly gone" rather than a plain number. */
const LOW_STOCK = 5;

/**
 * Everything the catalogue holds about one piece, on one screen.
 *
 * The table can only carry four columns, so the fields that decide whether a
 * product is actually ready to sell, stock, SKU, size scale, stitching charge,
 * the dupatta, are exactly the ones it cannot show. This is where they are
 * read, and the one place a piece can be checked against the shop before
 * anybody complains about it.
 */
export function ProductDetail({ slug }: { slug: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const { session } = useAuth();
  const [confirmingRemoval, setConfirmingRemoval] = useState(false);
  const [editing, setEditing] = useState(false);

  const load = useCallback(() => catalog.getBySlug(slug), [slug]);
  const { data: product, loading, error, reload } = useAsync(load, [slug]);

  // Only the first load blanks the page. A refresh after saving keeps the
  // piece on screen instead of flashing a spinner over work that succeeded.
  if (loading && !product) return <LoadingScreen />;

  if (error) {
    return (
      <StatusScreen
        icon="cloud_off"
        title="Couldn't load that piece"
        body="The catalogue didn't answer. Try again, or go back to the dashboard."
        actions={
          <LinkButton href="/dashboard" variant="secondary">
            Back to Dashboard
          </LinkButton>
        }
      />
    );
  }

  if (!product) {
    return (
      <StatusScreen
        icon="search_off"
        title="No such piece"
        body={`Nothing in the catalogue has the address “${slug}”. It may have been removed.`}
        actions={
          <LinkButton href="/dashboard" variant="secondary">
            Back to Dashboard
          </LinkButton>
        }
      />
    );
  }

  async function handleSave(input: ProductInput) {
    if (!product) return;
    try {
      await catalog.update(product.id, input);
      setEditing(false);
      reload();
      toast("Changes saved. The shop is showing them now.", "success");
    } catch (err) {
      console.error("[catalog.update]", err);
      // The row may be half-updated (photos failed after the columns landed),
      // so refresh either way rather than leaving a stale screen behind.
      reload();
      toast(err instanceof StoreWriteError ? err.message : "Couldn't save those changes.", "error");
      // Rethrown so the form keeps what was typed: a failed save must not cost
      // the user their edits.
      throw err;
    }
  }

  async function handleRemove() {
    if (!product) return;
    try {
      await catalog.remove(product.id);
      toast(`“${product.title}” removed from the catalogue.`, "info");
      router.push("/dashboard");
    } catch (err) {
      console.error("[catalog.remove]", err);
      toast(
        err instanceof StoreWriteError ? err.message : "Couldn't remove that product. Try again.",
        "error"
      );
      setConfirmingRemoval(false);
    }
  }

  const dupatta =
    [
      product.dupattaLength !== null ? `${product.dupattaLength} Meters` : null,
      product.dupattaFabric,
      product.dupattaFinish,
    ]
      .filter(Boolean)
      .join(" ") || null;

  return (
    <div className="container-luxe py-12">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 font-label-sm text-label-sm uppercase tracking-widest text-text-muted transition-colors hover:text-on-surface"
      >
        <span aria-hidden="true" className="material-symbols-outlined text-base">
          chevron_left
        </span>
        Dashboard
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-6">
        <div className="min-w-0">
          <p className="label-caps text-gold">{product.category}</p>
          <h1 className="mt-2 font-display text-headline-md">{product.title}</h1>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {product.badge && <Badge variant="gold">{product.badge}</Badge>}
            {product.isNewArrival && <Badge variant="dark">New Arrival</Badge>}
            {product.stitchingEligible && <Badge variant="outline">Stitching Offered</Badge>}
            <Badge variant="outline">{product.gender}</Badge>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {!editing && (
            <Button type="button" variant="primary" onClick={() => setEditing(true)}>
              Edit
            </Button>
          )}
          <LinkButton href={`/products/${product.slug}`} variant="secondary">
            View in Shop
          </LinkButton>
          <Button type="button" variant="ghost" onClick={() => setConfirmingRemoval(true)}>
            Remove
          </Button>
        </div>
      </div>

      {editing && (
        <div className="mt-8">
          <p className="mb-4 border border-outline-variant bg-surface-container-low px-4 py-3 font-body text-label-sm text-text-muted">
            The shop address stays <code>/products/{product.slug}</code> even if the name changes,
            so links already shared keep working.
          </p>
          <ProductForm
            initial={product}
            submitLabel="Save Changes"
            onSubmit={handleSave}
            onCancel={() => setEditing(false)}
            canManageOptions={session?.user.role === "SUPER_ADMIN"}
          />
        </div>
      )}

      <div
        className={`mt-10 grid gap-10 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] ${
          editing ? "hidden" : ""
        }`}
      >
        <div>
          <p className="font-body text-label-sm uppercase tracking-widest text-on-surface-variant">
            Photography · {product.images.length}
          </p>
          {product.images.length === 0 ? (
            <p className="mt-3 border border-outline-variant bg-surface-container-low px-4 py-3 font-body text-body-md text-text-muted">
              No photos. The shop shows a placeholder where this piece should be.
            </p>
          ) : (
            <ul className="mt-3 grid grid-cols-2 gap-3">
              {product.images.map((photo, i) => (
                <li
                  key={`${photo.url}-${i}`}
                  className="relative aspect-[4/5] overflow-hidden border border-border-subtle bg-surface-container-low"
                >
                  {/* The same crop the storefront applies, so what is checked
                      here is what a shopper sees. */}
                  <ProductImage
                    src={photo.url}
                    focal={photo}
                    alt={`${product.title}, photo ${i + 1}`}
                    fill
                    sizes="200px"
                    className="object-cover"
                  />
                  {i === 0 && (
                    <span className="absolute left-0 top-0 bg-primary px-2 py-1 font-label-sm text-[10px] uppercase tracking-widest text-on-primary">
                      Main
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-8">
          <Section title="Selling">
            <Fact label="Price" value={`PKR ${product.price.toLocaleString()}`} />
            <Fact
              label="Was"
              value={
                product.compareAtPrice !== null
                  ? `PKR ${product.compareAtPrice.toLocaleString()}`
                  : null
              }
            />
            <Fact
              label="Stock"
              value={product.stock}
              tone={product.stock === 0 ? "error" : product.stock <= LOW_STOCK ? "warn" : undefined}
              note={
                product.stock === 0
                  ? "Sold out"
                  : product.stock <= LOW_STOCK
                    ? "Nearly gone"
                    : undefined
              }
            />
            <Fact label="SKU" value={product.sku} />
            <Fact
              label="Stitching"
              value={
                product.stitchingEligible
                  ? product.stitchingAddOn !== null
                    ? `+ PKR ${product.stitchingAddOn.toLocaleString()}`
                    : "Offered"
                  : "Not offered"
              }
            />
            <Fact label="Rating" value={product.rating} note={`${product.reviewCount} reviews`} />
          </Section>

          <Section title="The cloth">
            <Fact
              label="Fabric"
              value={
                product.fabricWeightGsm !== null
                  ? `${product.fabric} · ${product.fabricWeightGsm}gm`
                  : product.fabric
              }
            />
            <Fact
              label="Length"
              value={product.meters !== null ? `${product.meters} m` : null}
              note={product.metersNote ?? undefined}
            />
            <Fact
              label="Embroidery"
              value={product.embroidery.length > 0 ? product.embroidery.join(", ") : null}
            />
            <Fact label="Dupatta" value={dupatta} />
          </Section>

          <Section title="Choices">
            <div className="sm:col-span-2">
              <FactLabel>Colours</FactLabel>
              {product.colors.length === 0 ? (
                <FactValue tone="error">None, so the colour filter never finds it</FactValue>
              ) : (
                <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-2">
                  {product.colors.map((color, i) => (
                    <li
                      key={color.id || color.label}
                      className="flex items-center gap-2 font-body text-body-md"
                    >
                      <Swatch hex={color.hex} size={18} />
                      {color.label}
                      <span className="font-label-sm text-label-sm uppercase tracking-widest text-text-muted">
                        {COLOR_FAMILY_LABELS[color.family]}
                        {i === 0 ? " · primary" : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="sm:col-span-2">
              <FactLabel>Sizes</FactLabel>
              <FactValue>{product.sizes.join(", ") || "-"}</FactValue>
            </div>
          </Section>

          <Section title="Copy">
            <div className="sm:col-span-2">
              <FactLabel>Description</FactLabel>
              <p className="mt-1 whitespace-pre-line font-body text-body-md text-on-surface-variant">
                {product.description || "-"}
              </p>
            </div>
            {product.heritageStory && (
              <div className="sm:col-span-2">
                <FactLabel>Heritage story</FactLabel>
                <p className="mt-1 whitespace-pre-line font-body text-body-md text-on-surface-variant">
                  {product.heritageStory}
                </p>
              </div>
            )}
          </Section>

          <Section title="Record">
            <Fact label="Added by" value={product.addedByName} note={product.addedByEmail} />
            <Fact
              label="Published"
              value={new Date(product.createdAt).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            />
            <Fact label="Shop address" value={`/products/${product.slug}`} />
            <Fact label="Row id" value={product.id} />
          </Section>
        </div>
      </div>

      <ConfirmDialog
        open={confirmingRemoval}
        title="Remove this product?"
        message={
          <>
            “{product.title}” comes off the shop straight away. This can’t be undone: the piece has
            to be added again from scratch.
          </>
        }
        confirmLabel="Remove Product"
        pendingLabel="Removing product"
        onConfirm={handleRemove}
        onCancel={() => setConfirmingRemoval(false)}
      />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="border-b border-border-subtle pb-2 font-body text-label-sm uppercase tracking-widest text-on-surface-variant">
        {title}
      </h2>
      <dl className="mt-4 grid gap-x-8 gap-y-5 sm:grid-cols-2">{children}</dl>
    </section>
  );
}

function FactLabel({ children }: { children: React.ReactNode }) {
  return (
    <dt className="font-label-sm text-label-sm uppercase tracking-widest text-text-muted">
      {children}
    </dt>
  );
}

function FactValue({ children, tone }: { children: React.ReactNode; tone?: "error" | "warn" }) {
  return (
    <dd
      className={`mt-1 font-body text-body-md ${
        tone === "error" ? "text-error" : tone === "warn" ? "text-marketplace-bronze" : ""
      }`}
    >
      {children}
    </dd>
  );
}

/** An empty value renders a plain "-", never a blank row that reads as broken. */
function Fact({
  label,
  value,
  note,
  tone,
}: {
  label: string;
  value: React.ReactNode;
  note?: string;
  tone?: "error" | "warn";
}) {
  return (
    <div>
      <FactLabel>{label}</FactLabel>
      <FactValue tone={tone}>
        {value === null || value === undefined || value === "" ? "-" : value}
        {note && (
          <span className="ml-2 font-label-sm text-label-sm uppercase tracking-widest text-text-muted">
            {note}
          </span>
        )}
      </FactValue>
    </div>
  );
}
