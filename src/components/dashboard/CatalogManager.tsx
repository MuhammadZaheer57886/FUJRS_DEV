"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ProductForm } from "@/components/dashboard/ProductForm";
import { CatalogTable } from "@/components/dashboard/CatalogTable";
import { catalog, StoreWriteError } from "@/lib/data";
import type { CatalogItem, NewCatalogItem } from "@/lib/data";

/**
 * Catalogue management for the roles that can publish — shared by the Admin
 * and Super Admin dashboards so the flow is identical for both. Pieces added
 * here go live immediately; there is no review queue.
 */
export function CatalogManager() {
  const { session } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<CatalogItem[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  /** The piece the confirmation dialog is asking about; null when closed. */
  const [pendingRemoval, setPendingRemoval] = useState<CatalogItem | null>(null);

  const refresh = useCallback(async () => {
    setItems(await catalog.list());
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function handleAdd(input: NewCatalogItem) {
    if (!session) {
      toast("You need to be signed in to publish a product.", "error");
      throw new StoreWriteError("You need to be signed in to publish a product.");
    }
    try {
      await catalog.create(input, { email: session.user.email, name: session.user.name });
      setShowForm(false);
      await refresh();
      toast("Product published to the catalogue.", "success");
    } catch (err) {
      console.error("[catalog.create]", err);
      // The product row may already exist (images/sizes failed after insert).
      // Refresh so the table matches the database rather than looking empty.
      try {
        await refresh();
      } catch (refreshErr) {
        console.error("[catalog.list]", refreshErr);
      }
      toast(err instanceof StoreWriteError ? err.message : "Couldn't save that product.", "error");
      // Rethrown so the form keeps what was typed — it only clears on a save.
      throw err;
    }
  }

  async function handleRemove() {
    if (!pendingRemoval) return;
    try {
      await catalog.remove(pendingRemoval.id);
      await refresh();
      toast(`“${pendingRemoval.title}” removed from the catalogue.`, "info");
      setPendingRemoval(null);
    } catch (err) {
      console.error("[catalog.remove]", err);
      toast(
        err instanceof StoreWriteError ? err.message : "Couldn't remove that product. Try again.",
        "error"
      );
    }
  }

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-headline-sm">Catalogue</h2>
          <p className="mt-1 text-label-sm text-marketplace-bronze">
            Pieces you add here publish immediately — they appear in the shop straight away.
          </p>
        </div>
        <Button variant="primary" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Close" : "+ Add Product"}
        </Button>
      </div>

      {showForm && (
        <div className="mt-6">
          <ProductForm
            submitLabel="Publish to Catalogue"
            onSubmit={handleAdd}
            onCancel={() => setShowForm(false)}
            // Only a Super Admin can change the lists (the database enforces
            // it); everyone else is told who to ask rather than shown a button
            // that would be refused.
            canManageOptions={session?.user.role === "SUPER_ADMIN"}
          />
        </div>
      )}

      <div className="mt-6">
        <CatalogTable
          items={items}
          emptyMessage="No products added yet."
          actions={(item) => (
            <button
              onClick={() => setPendingRemoval(item)}
              className="border border-outline-variant px-3 py-1.5 font-label-sm text-label-sm uppercase tracking-widest transition-colors hover:border-error hover:text-error"
            >
              Remove
            </button>
          )}
        />
      </div>

      <ConfirmDialog
        open={pendingRemoval !== null}
        title="Remove this product?"
        message={
          <>
            “{pendingRemoval?.title}” comes off the shop straight away. This can’t be undone — the
            piece has to be added again from scratch.
          </>
        }
        confirmLabel="Remove Product"
        pendingLabel="Removing product"
        onConfirm={handleRemove}
        onCancel={() => setPendingRemoval(null)}
      />
    </section>
  );
}
