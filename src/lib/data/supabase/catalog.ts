"use client";

// Catalogue CRUD against `products` + `product_images` + `product_variants`.
//
// Writes are gated by RLS (`products_staff_write`), so a signed-in Admin or
// Super Admin succeeds and everyone else is rejected by the database — not by
// the UI hiding a button.

import { slugify } from "@/lib/slug";
import type { CatalogStore } from "../ports";
import { StoreWriteError } from "../types";
import type { CatalogItem, ProductInput } from "../types";
import {
  PRODUCT_IMAGE_BUCKET,
  PRODUCT_SELECT,
  toCatalogItem,
  toPaisa,
  toPaisaOrNull,
  type ProductRow,
} from "./catalogRow";
import { getBrowserClient } from "./client";

/** PostgREST and Storage errors share enough shape to log the same way. */
function logStoreError(step: string, error: unknown) {
  if (error && typeof error === "object") {
    const driver = error as {
      code?: string;
      statusCode?: string;
      message?: string;
      details?: string;
      hint?: string;
    };
    console.error(`[catalog] ${step}`, {
      code: driver.code,
      statusCode: driver.statusCode,
      message: driver.message,
      details: driver.details,
      hint: driver.hint,
    });
    return;
  }
  console.error(`[catalog] ${step}`, error);
}

function driverDetail(error: unknown): string | null {
  if (!error || typeof error !== "object") return null;
  const driver = error as { message?: string; hint?: string };
  const parts = [driver.message, driver.hint].filter((part): part is string =>
    Boolean(part && part.trim())
  );
  return parts.length > 0 ? parts.join(": ") : null;
}

/** The admin form produces a data URL; Storage needs bytes. */
function dataUrlToBlob(dataUrl: string): { blob: Blob; extension: string } | null {
  const match = /^data:(image\/([a-z+]+));base64,(.+)$/i.exec(dataUrl);
  if (!match) return null;

  try {
    const [, mimeType, subtype, base64] = match;
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);

    return {
      blob: new Blob([bytes], { type: mimeType }),
      extension: subtype === "jpeg" ? "jpg" : subtype,
    };
  } catch {
    return null;
  }
}

type Client = ReturnType<typeof getBrowserClient>;

/** The scalar columns the form owns. Shared so create and update can't drift. */
function productColumns(input: ProductInput) {
  return {
    title: input.title,
    description: input.description,
    price_paisa: toPaisa(input.price),
    compare_at_paisa: toPaisaOrNull(input.compareAtPrice),
    category_id: input.categoryId,
    fabric_id: input.fabricId,
    fabric_weight_gsm: input.fabricWeightGsm,
    gender: input.gender,
    // LEGACY (migration 21): nothing reads it, but it is NOT NULL and
    // still holds the primary colour so a rollback finds its data.
    color_id: input.colorIds[0],
    badge_id: input.badgeId,
    size_scale_id: input.sizeScaleId,
    sku: input.sku,
    stock: input.stock,
    is_new_arrival: input.isNewArrival,
    stitching_eligible: input.stitchingEligible,
    stitching_addon_paisa: toPaisaOrNull(input.stitchingAddOn),
    heritage_story: input.heritageStory,
    meters_length: input.meters,
    meters_note: input.metersNote,
    dupatta_length: input.dupattaLength,
    dupatta_fabric_id: input.dupattaFabricId,
    dupatta_finish: input.dupattaFinish,
  };
}

/** Turns a write failure into the sentence that explains what to do about it. */
function writeFailure(error: { code?: string } | null, fallback: string): StoreWriteError {
  // 42501 is Postgres "insufficient privilege", i.e. RLS said no.
  // 23505 is a unique violation, which here can only be the SKU: the slug
  // carries a timestamp suffix, so it can't collide.
  // 23503 is a foreign key violation, a taxonomy option that was archived and
  // deleted, or a stale list in a tab left open since before a change.
  const detail = driverDetail(error);
  return new StoreWriteError(
    error?.code === "42501"
      ? "Your account isn't allowed to change products."
      : error?.code === "23505"
        ? "That SKU is already used by another product."
        : error?.code === "23503"
          ? "One of the options you picked no longer exists. Reload and try again."
          : detail
            ? `${fallback}: ${detail}`
            : `${fallback}.`
  );
}

/**
 * The junction rows and variants, written from scratch.
 *
 * Cleared and re-inserted rather than diffed. These are three-column rows with
 * no identity of their own, so a diff would be more code to get wrong for no
 * gain: what the form submits IS the intended set.
 */
async function replaceRelations(supabase: Client, productId: string, input: ProductInput) {
  // Sizes are rows in product_variants, which is also where per-size stock
  // will live. Until the form tracks stock per size, the product-level count
  // is the source of truth and variants carry zero.
  await supabase.from("product_variants").delete().eq("product_id", productId);
  if (input.sizes.length > 0) {
    const { error } = await supabase
      .from("product_variants")
      .insert(input.sizes.map((size) => ({ product_id: productId, size, stock: 0 })));
    if (error) {
      logStoreError("product_variants.insert", error);
      throw writeFailure(error, "The product was saved but its sizes weren't");
    }
  }

  // Colourways are junction rows, in the order they were picked: position 0
  // is the primary, which is the swatch a listing tile shows.
  await supabase.from("product_colors").delete().eq("product_id", productId);
  const { error: colorError } = await supabase.from("product_colors").insert(
    input.colorIds.map((colorId, position) => ({
      product_id: productId,
      color_id: colorId,
      position,
    }))
  );
  if (colorError) {
    logStoreError("product_colors.insert", colorError);
    throw writeFailure(colorError, "The product was saved but its colours weren't");
  }

  // Embroidery is a many-to-many now rather than the CSV string it was, so
  // the techniques are junction rows.
  await supabase.from("product_embroidery").delete().eq("product_id", productId);
  if (input.embroideryIds.length > 0) {
    const { error } = await supabase.from("product_embroidery").insert(
      input.embroideryIds.map((techniqueId) => ({
        product_id: productId,
        technique_id: techniqueId,
      }))
    );
    if (error) {
      logStoreError("product_embroidery.insert", error);
      throw writeFailure(error, "The product was saved but its embroidery wasn't");
    }
  }
}

/**
 * The gallery, written from scratch, keeping the files that are staying.
 *
 * Every row is dropped and re-inserted rather than the positions being patched
 * in place, because `product_images_primary_idx` allows exactly one row at
 * position 0 per product: reordering row by row trips it halfway through. The
 * FILES are not touched, only the rows, so a photo that stays keeps its object
 * in the bucket and its bytes are never re-uploaded.
 *
 * Returns what went wrong per photo instead of throwing, so one unreadable
 * upload doesn't take the other five down with it.
 */
async function replaceImages(
  supabase: Client,
  productId: string,
  input: ProductInput
): Promise<string[]> {
  const problems: string[] = [];

  // Read before anything is destroyed, and REFUSE to carry on if the read
  // failed. Treating an unreadable gallery as an empty one is how a save that
  // touched nothing but the price ends up deleting every photo on the product:
  // no row matches, every stored photo is dropped, and the delete below then
  // wipes the rows that were still perfectly good.
  const { data: existingRows, error: existingError } = await supabase
    .from("product_images")
    .select("id, storage_path, width, height, bytes, mime_type")
    .eq("product_id", productId);

  if (existingError) {
    logStoreError("product_images.select", existingError);
    throw writeFailure(existingError, "Couldn't read the product's photos, so nothing was changed");
  }

  const existing = new Map((existingRows ?? []).map((row) => [row.id, row]));
  const base = slugify(input.title) || "photo";
  // Every new object gets a unique path. Reusing `index-slug` would let a new
  // photo at position 0 upsert straight over the file of the photo that used
  // to be there and is still on the product.
  const stamp = Date.now().toString(36);

  type Row = {
    product_id: string;
    storage_path: string;
    alt: string;
    position: number;
    width: number;
    height: number;
    bytes: number | null;
    mime_type: string;
    focal_x: number;
    focal_y: number;
  };
  const rows: Row[] = [];
  const uploadedPaths: string[] = [];

  for (const [index, photo] of input.images.entries()) {
    if (photo.kind === "stored") {
      const row = existing.get(photo.id);
      if (!row) {
        // The photo was deleted by someone else while this form was open.
        problems.push(`image ${index + 1} is no longer on the product`);
        continue;
      }
      existing.delete(photo.id);
      rows.push({
        product_id: productId,
        storage_path: row.storage_path,
        alt: input.title,
        position: index,
        width: row.width,
        height: row.height,
        bytes: row.bytes,
        mime_type: row.mime_type,
        focal_x: photo.focalX,
        focal_y: photo.focalY,
      });
      continue;
    }

    const decoded = dataUrlToBlob(photo.dataUrl);
    if (!decoded) {
      problems.push(`image ${index + 1} couldn't be read`);
      continue;
    }

    const path = `${productId}/${stamp}-${index}-${base}.${decoded.extension}`;
    const { error: uploadError } = await supabase.storage
      .from(PRODUCT_IMAGE_BUCKET)
      .upload(path, decoded.blob, { contentType: decoded.blob.type, upsert: true });

    if (uploadError) {
      logStoreError(`storage.upload ${path}`, uploadError);
      problems.push(`image ${index + 1}: ${uploadError.message}`);
      continue;
    }

    uploadedPaths.push(path);
    rows.push({
      product_id: productId,
      storage_path: path,
      alt: input.title,
      position: index,
      // Measured by the uploader as the file was downscaled, so next/image
      // can reserve the right space instead of reflowing on load.
      width: photo.width,
      height: photo.height,
      bytes: decoded.blob.size,
      mime_type: decoded.blob.type,
      // Set in the storefront preview, so the tile shapes crop around the
      // part of the garment the photo was framed on.
      focal_x: photo.focalX,
      focal_y: photo.focalY,
    });
  }

  // The gallery is about to be rewritten from scratch, so a run that produced
  // no rows would empty it. Stop while the old rows are still there: a failed
  // save must leave the product exactly as it was, not stripped of its
  // photography.
  if (rows.length === 0 && input.images.length > 0) {
    // Anything that did upload before the run gave out is pointed at by no
    // row, so take it back out of the bucket rather than leaving it behind.
    if (uploadedPaths.length > 0) {
      const { error } = await supabase.storage.from(PRODUCT_IMAGE_BUCKET).remove(uploadedPaths);
      if (error) logStoreError("storage.remove", error);
    }
    throw new StoreWriteError(
      `The photos couldn't be saved, so none of them were changed (${problems.join("; ")}).`
    );
  }

  const { error: deleteError } = await supabase
    .from("product_images")
    .delete()
    .eq("product_id", productId);
  if (deleteError) {
    logStoreError("product_images.delete", deleteError);
    throw writeFailure(deleteError, "The product was saved but its photos weren't");
  }

  if (rows.length > 0) {
    const { error } = await supabase.from("product_images").insert(rows);
    if (error) {
      logStoreError("product_images.insert", error);
      throw writeFailure(error, "The product was saved but its photos weren't");
    }
  }

  // Whatever is left in `existing` was taken off the product. The rows are
  // already gone; clearing the files too keeps the bucket from filling with
  // photography nothing points at. A failure here is logged, not raised: the
  // save itself worked, and an orphaned file is not the user's problem.
  const orphaned = [...existing.values()].map((row) => row.storage_path);
  if (orphaned.length > 0) {
    const { error } = await supabase.storage.from(PRODUCT_IMAGE_BUCKET).remove(orphaned);
    if (error) logStoreError("storage.remove", error);
  }

  return problems;
}

/**
 * Reads the row back rather than assembling the return value from `input`.
 *
 * The form submits taxonomy IDS and a CatalogItem carries the LABELS, so
 * building it here would mean re-implementing every join `toCatalogItem`
 * already does, and the two would drift the first time a column moved.
 */
async function readBack(supabase: Client, productId: string): Promise<CatalogItem | null> {
  const { data } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("id", productId)
    .single();
  return data ? toCatalogItem(data as unknown as ProductRow) : null;
}

export const supabaseCatalog: CatalogStore = {
  async list() {
    const { data, error } = await getBrowserClient()
      .from("products")
      .select(PRODUCT_SELECT)
      .is("archived_at", null)
      .order("created_at", { ascending: false });

    if (error) {
      logStoreError("products.list", error);
      const detail = driverDetail(error);
      throw new StoreWriteError(
        detail ? `Couldn't load the catalogue: ${detail}` : "Couldn't load the catalogue."
      );
    }

    return (data as unknown as ProductRow[] | null)?.map(toCatalogItem) ?? [];
  },

  async getBySlug(slug) {
    const { data, error } = await getBrowserClient()
      .from("products")
      .select(PRODUCT_SELECT)
      .eq("slug", slug)
      .is("archived_at", null)
      .maybeSingle();

    if (error) {
      logStoreError("products.getBySlug", error);
      throw new StoreWriteError("Couldn't load that product.");
    }

    return data ? toCatalogItem(data as unknown as ProductRow) : null;
  },

  async create(input, author) {
    const supabase = getBrowserClient();

    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) throw new StoreWriteError("You need to be signed in to publish a product.");

    // Slug must be unique; a repeated title would otherwise fail on the
    // constraint with an opaque driver error.
    const slug = `${slugify(input.title)}-${Date.now().toString(36).slice(-4)}`;

    const { data: product, error } = await supabase
      .from("products")
      .insert({ ...productColumns(input), slug, created_by: auth.user.id })
      .select("id, created_at")
      .single();

    if (error || !product) {
      logStoreError("products.insert", error);
      throw writeFailure(error, "Couldn't save that product");
    }

    await replaceRelations(supabase, product.id, input);
    const problems = await replaceImages(supabase, product.id, input);

    if (problems.length > 0) {
      throw new StoreWriteError(
        `The product was published but ${problems.length} image${
          problems.length === 1 ? "" : "s"
        } didn't upload (${problems.join("; ")}).`
      );
    }

    const saved = await readBack(supabase, product.id);
    if (saved) return saved;

    // The product IS saved; only reading it back failed. Report the write as
    // the success it was and let the caller's refresh pick it up, rather than
    // raising an error that reads as "nothing was published".
    return {
      id: product.id,
      slug,
      title: input.title,
      price: input.price,
      compareAtPrice: input.compareAtPrice,
      fabric: "",
      fabricId: input.fabricId,
      fabricWeightGsm: input.fabricWeightGsm,
      category: "",
      categoryId: input.categoryId,
      gender: input.gender,
      // The labels live on the rows this fallback could not read back, so the
      // ids are all there is to say here.
      colors: input.colorIds.map((id) => ({
        id,
        label: "",
        hex: "#808080",
        family: "MULTI" as const,
      })),
      sizes: input.sizes,
      sizeScaleId: input.sizeScaleId,
      stock: input.stock,
      sku: input.sku,
      description: input.description,
      isNewArrival: input.isNewArrival,
      stitchingEligible: input.stitchingEligible,
      stitchingAddOn: input.stitchingAddOn,
      badge: null,
      badgeId: input.badgeId,
      meters: input.meters,
      metersNote: input.metersNote,
      embroidery: [],
      dupattaLength: input.dupattaLength,
      dupattaFabric: null,
      dupattaFabricId: input.dupattaFabricId,
      dupattaFinish: input.dupattaFinish,
      heritageStory: input.heritageStory,
      // Whatever the form is already holding: the caller only needs something
      // to render until the next read, and a public Storage URL is not
      // readable back the instant the object lands.
      images: input.images.map((photo, i) => ({
        id: photo.kind === "stored" ? photo.id : `pending-${i}`,
        url: photo.kind === "stored" ? photo.url : photo.dataUrl,
        focalX: photo.focalX,
        focalY: photo.focalY,
      })),
      rating: null,
      reviewCount: 0,
      addedByEmail: author.email,
      addedByName: author.name,
      createdAt: product.created_at,
    };
  },

  async update(id, input) {
    const supabase = getBrowserClient();

    // `slug` is deliberately absent: it is the product's public address, and a
    // retitled piece keeps it rather than breaking every link already shared.
    const { data: updated, error } = await supabase
      .from("products")
      .update(productColumns(input))
      .eq("id", id)
      .is("archived_at", null)
      // Selected back so a filter that matched nothing is distinguishable from
      // a write that worked. Without it, saving over a piece somebody else had
      // just removed would report success.
      .select("id")
      .maybeSingle();

    if (error) {
      logStoreError("products.update", error);
      throw writeFailure(error, "Couldn't save those changes");
    }
    if (!updated) {
      throw new StoreWriteError("That product no longer exists. Reload and try again.");
    }

    await replaceRelations(supabase, id, input);
    const problems = await replaceImages(supabase, id, input);

    if (problems.length > 0) {
      throw new StoreWriteError(
        `The changes were saved but ${problems.length} image${
          problems.length === 1 ? "" : "s"
        } didn't (${problems.join("; ")}).`
      );
    }

    const saved = await readBack(supabase, id);
    if (!saved) {
      throw new StoreWriteError(
        "The changes were saved, but reading them back failed. Refresh the page to see them."
      );
    }
    return saved;
  },

  async remove(id) {
    // Archive, never delete: orders reference products, and a hard delete
    // would orphan order history (SCHEMA.md §2).
    const { error } = await getBrowserClient()
      .from("products")
      .update({ archived_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      logStoreError("products.archive", error);
      const detail = driverDetail(error);
      throw new StoreWriteError(
        error.code === "42501"
          ? "Your account isn't allowed to remove products."
          : detail
            ? `Couldn't remove that product: ${detail}`
            : "Couldn't remove that product."
      );
    }
  },
};
