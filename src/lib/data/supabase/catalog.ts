"use client";

// Catalogue CRUD against `products` + `product_images` + `product_variants`.
//
// Writes are gated by RLS (`products_staff_write`), so a signed-in Admin or
// Super Admin succeeds and everyone else is rejected by the database — not by
// the UI hiding a button.

import { slugify } from "@/lib/slug";
import type { CatalogStore } from "../ports";
import { StoreWriteError } from "../types";
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
  const parts = [driver.message, driver.hint].filter(
    (part): part is string => Boolean(part && part.trim())
  );
  return parts.length > 0 ? parts.join(" — ") : null;
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
    const base = slugify(input.title);
    const slug = `${base}-${Date.now().toString(36).slice(-4)}`;

    const { data: product, error } = await supabase
      .from("products")
      .insert({
        slug,
        title: input.title,
        description: input.description,
        price_paisa: toPaisa(input.price),
        compare_at_paisa: toPaisaOrNull(input.compareAtPrice),
        category_id: input.categoryId,
        fabric_id: input.fabricId,
        fabric_weight_gsm: input.fabricWeightGsm,
        gender: input.gender,
        color_id: input.colorId,
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
        created_by: auth.user.id,
      })
      .select("id, created_at")
      .single();

    if (error || !product) {
      logStoreError("products.insert", error);
      // 42501 is Postgres "insufficient privilege" — i.e. RLS said no.
      // 23505 is a unique violation, which here can only be the SKU: the slug
      // carries a timestamp suffix, so it can't collide.
      // 23503 is a foreign key violation — a taxonomy option that was archived
      // and deleted, or a stale list in a tab left open since before a change.
      const detail = driverDetail(error);
      throw new StoreWriteError(
        error?.code === "42501"
          ? "Your account isn't allowed to publish products."
          : error?.code === "23505"
            ? "That SKU is already used by another product."
            : error?.code === "23503"
              ? "One of the options you picked no longer exists. Reload and try again."
              : detail
                ? `Couldn't save that product: ${detail}`
                : "Couldn't save that product."
      );
    }

    // Sizes are rows in product_variants, which is also where per-size stock
    // will live. Until the form tracks stock per size, the product-level count
    // is the source of truth and variants carry zero.
    if (input.sizes.length > 0) {
      const { error: variantError } = await supabase
        .from("product_variants")
        .insert(input.sizes.map((size) => ({ product_id: product.id, size, stock: 0 })));
      if (variantError) {
        logStoreError("product_variants.insert", variantError);
        const detail = driverDetail(variantError);
        throw new StoreWriteError(
          detail
            ? `Product was saved but sizes weren't: ${detail}`
            : "Product was saved but sizes weren't. Check the catalogue, then remove it and try again."
        );
      }
    }

    // Embroidery is a many-to-many now rather than the CSV string it was, so
    // the techniques are junction rows.
    if (input.embroideryIds.length > 0) {
      const { error: embroideryError } = await supabase.from("product_embroidery").insert(
        input.embroideryIds.map((techniqueId) => ({
          product_id: product.id,
          technique_id: techniqueId,
        }))
      );
      if (embroideryError) {
        logStoreError("product_embroidery.insert", embroideryError);
        const detail = driverDetail(embroideryError);
        throw new StoreWriteError(
          detail
            ? `Product was saved but embroidery wasn't: ${detail}`
            : "Product was saved but embroidery wasn't. Check the catalogue, then remove it and try again."
        );
      }
    }

    // Upload each image, then record the ones that made it. Order is the
    // array order, so `position` is the index the admin arranged.
    const uploaded: {
      path: string;
      mimeType: string;
      position: number;
      bytes: number;
      width: number;
      height: number;
    }[] = [];
    const imageProblems: string[] = [];

    for (const [index, image] of input.images.entries()) {
      const decoded = dataUrlToBlob(image.dataUrl);
      if (!decoded) {
        imageProblems.push(`image ${index + 1} couldn't be read`);
        continue;
      }

      const path = `${product.id}/${index}-${base}.${decoded.extension}`;
      const { error: uploadError } = await supabase.storage
        .from(PRODUCT_IMAGE_BUCKET)
        .upload(path, decoded.blob, { contentType: decoded.blob.type, upsert: true });

      if (uploadError) {
        logStoreError(`storage.upload ${path}`, uploadError);
        imageProblems.push(`image ${index + 1}: ${uploadError.message}`);
        continue;
      }

      uploaded.push({
        path,
        mimeType: decoded.blob.type,
        position: index,
        bytes: decoded.blob.size,
        width: image.width,
        height: image.height,
      });
    }

    if (uploaded.length > 0) {
      const { error: imageRowError } = await supabase.from("product_images").insert(
        uploaded.map((image) => ({
          product_id: product.id,
          storage_path: image.path,
          alt: input.title,
          position: image.position,
          // Measured by the uploader as the file was downscaled, so next/image
          // can reserve the right space instead of reflowing on load.
          width: image.width,
          height: image.height,
          bytes: image.bytes,
          mime_type: image.mimeType,
        }))
      );
      if (imageRowError) {
        logStoreError("product_images.insert", imageRowError);
        const detail = driverDetail(imageRowError);
        throw new StoreWriteError(
          detail
            ? `Images uploaded but couldn't be attached: ${detail}`
            : "Images uploaded but couldn't be attached to the product. Check the catalogue, then remove it and try again."
        );
      }
    }

    if (imageProblems.length > 0) {
      throw new StoreWriteError(
        uploaded.length === 0
          ? `Product was saved but none of the images uploaded (${imageProblems.join("; ")}). Check the catalogue, then remove it and try again.`
          : `Product was saved but ${imageProblems.length} image${imageProblems.length === 1 ? "" : "s"} didn't upload (${imageProblems.join("; ")}).`
      );
    }

    // Read the row back rather than assembling the return value from `input`.
    // The form submits taxonomy IDS and a CatalogItem carries the LABELS, so
    // building it here would mean re-implementing every join `toCatalogItem`
    // already does — and the two would drift the first time a column moved.
    const { data: saved } = await supabase
      .from("products")
      .select(PRODUCT_SELECT)
      .eq("id", product.id)
      .single();

    if (saved) return toCatalogItem(saved as unknown as ProductRow);

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
      color: "",
      colorId: input.colorId,
      colorHex: "#808080",
      colorFamily: "MULTI",
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
      images: input.images.map((image) => image.dataUrl),
      rating: null,
      reviewCount: 0,
      addedByEmail: author.email,
      addedByName: author.name,
      createdAt: product.created_at,
    };
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
