// The app's only data entry point.
//
// Components import from here and never learn which backend is running:
//
//   import { orders } from "@/lib/data";
//   const list = await orders.list();
//
// Swapping to Supabase, or later to a custom REST backend, means writing an
// adapter against the interfaces in ./ports and changing the picks below.
// No component changes. See BACKEND_SETUP.md §1.

import { localAffiliate } from "./local/affiliate";
import { localAuth } from "./local/auth";
import { localCart } from "./local/cart";
import { localCatalog } from "./local/catalog";
import { localProductTaxonomy } from "./local/taxonomy";
import { localMessages } from "./local/messages";
import { localOrders } from "./local/orders";
import { localPayouts } from "./local/payouts";
import { localPermissions } from "./local/permissions";
import { localProfiles } from "./local/profile";
import { localReferrals } from "./local/referral";
import { localReviews } from "./local/reviews";
import { localStats } from "./local/stats";
import { localStitching } from "./local/stitching";
import { localTailoring } from "./local/tailoring";
import { localUsers } from "./local/users";
import { localWishlist } from "./local/wishlist";

import { supabaseAffiliate } from "./supabase/affiliate";
import { supabaseAuth } from "./supabase/auth";
import { supabaseCart } from "./supabase/cart";
import { supabaseCatalog } from "./supabase/catalog";
import { supabaseProductTaxonomy } from "./supabase/taxonomy";
import { supabaseMessages } from "./supabase/messages";
import { supabaseOrders } from "./supabase/orders";
import { supabasePayouts } from "./supabase/payouts";
import { supabasePermissions } from "./supabase/permissions";
import { supabaseProfiles } from "./supabase/profile";
import { supabaseReferrals } from "./supabase/referral";
import { supabaseReviews } from "./supabase/reviews";
import { supabaseStats } from "./supabase/stats";
import { supabaseStitching } from "./supabase/stitching";
import { supabaseTailoring } from "./supabase/tailoring";
import { supabaseUsers } from "./supabase/users";
import { supabaseWishlist } from "./supabase/wishlist";

import type {
  AffiliateStore,
  AuthStore,
  CartStore,
  CatalogStore,
  MessageStore,
  OrderStore,
  PayoutStore,
  PermissionStore,
  ProductTaxonomyStore,
  ProfileStore,
  ReferralStore,
  ReviewStore,
  StatsStore,
  StitchingStore,
  TailoringStore,
  UserAdminStore,
  WishlistStore,
} from "./ports";

/**
 * Which adapter set to use. `NEXT_PUBLIC_DATA_BACKEND` is inlined at build
 * time, so the unused branch is tree-shaken out of the bundle rather than
 * shipped and skipped.
 *
 * Keeping `local` working is deliberate: it's what lets the app stay demoable
 * with no database, and it's the fallback if Supabase is ever unreachable
 * during development.
 */
const backend = process.env.NEXT_PUBLIC_DATA_BACKEND ?? "local";

if (backend !== "local" && backend !== "supabase") {
  throw new Error(`NEXT_PUBLIC_DATA_BACKEND must be "local" or "supabase", got "${backend}".`);
}

const useSupabase = backend === "supabase";

// --- Migrated to Supabase ---------------------------------------------------

// Every store now has both implementations. `local` is kept working on
// purpose: it is what lets the app be demoed with no database, and the
// fallback if Supabase is unreachable during development.

export const auth: AuthStore = useSupabase ? supabaseAuth : localAuth;
export const catalog: CatalogStore = useSupabase ? supabaseCatalog : localCatalog;
export const productTaxonomy: ProductTaxonomyStore = useSupabase
  ? supabaseProductTaxonomy
  : localProductTaxonomy;
export const orders: OrderStore = useSupabase ? supabaseOrders : localOrders;
export const users: UserAdminStore = useSupabase ? supabaseUsers : localUsers;
export const profiles: ProfileStore = useSupabase ? supabaseProfiles : localProfiles;
export const affiliate: AffiliateStore = useSupabase ? supabaseAffiliate : localAffiliate;
export const referrals: ReferralStore = useSupabase ? supabaseReferrals : localReferrals;
export const payouts: PayoutStore = useSupabase ? supabasePayouts : localPayouts;
export const cart: CartStore = useSupabase ? supabaseCart : localCart;
export const wishlist: WishlistStore = useSupabase ? supabaseWishlist : localWishlist;
export const tailoring: TailoringStore = useSupabase ? supabaseTailoring : localTailoring;
export const stitching: StitchingStore = useSupabase ? supabaseStitching : localStitching;
export const stats: StatsStore = useSupabase ? supabaseStats : localStats;
export const permissions: PermissionStore = useSupabase ? supabasePermissions : localPermissions;
export const reviews: ReviewStore = useSupabase ? supabaseReviews : localReviews;
export const messages: MessageStore = useSupabase ? supabaseMessages : localMessages;

export * from "./types";
export type * from "./ports";
