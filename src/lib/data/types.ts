// Domain shapes the app works in. Deliberately free of any storage detail:
// no localStorage keys, no database rows, no snake_case. Adapters translate
// at the boundary (CLAUDE.md), so a component never sees a raw row.

import type { AppRole } from "@/lib/auth/roles";
import type { ColorFamily } from "@/lib/productTaxonomy";
import type { CommissionRate, CommissionStatus } from "@/lib/commission";
import type { OrderStatus } from "@/lib/orderStatus";
import type { RefundRequestStatus } from "@/lib/refunds";
import type { StitchingStatus } from "@/lib/stitchingStatus";
import type { PayoutStatus } from "@/lib/payouts";
import type { MeasurementSet } from "@/lib/measurements";
import type { UploadedImage } from "@/lib/downscaleImage";
import type { FocalPoint } from "@/lib/productPhoto";
import type { LastSeen } from "@/lib/visits";

export type { UploadedImage, LastSeen };

// --- Accounts ---------------------------------------------------------------

export interface SavedAddress {
  street: string;
  city: string;
  postalCode: string;
}

export interface Account {
  email: string;
  name: string;
  role: AppRole;
  address: SavedAddress | null;
  /** Data URL today; an object path once Supabase Storage is wired in. */
  avatar: string | null;
}

// --- Orders -----------------------------------------------------------------

export type PaymentMethod = "card" | "cod";

export interface OrderItem {
  id: string;
  productSlug: string;
  title: string;
  image: string;
  price: number;
  qty: number;
  stitchingLabel: string | null;
  stitchingAddOn: number | null;
  stitcherSlug: string | null;
  stitchingStatus: StitchingStatus | null;
}

export interface Order {
  id: string;
  /**
   * The short code the customer is given, e.g. "2VVS7D5B". Show this, never
   * `id` — that's a uuid nobody can read back to you (`orders.order_number`).
   */
  orderNumber: string;
  createdAt: string;
  status: OrderStatus;
  /**
   * When the order was marked delivered, or null if it hasn't been (and on
   * orders placed before this was recorded). The return window is counted from
   * here, not from `createdAt` (`src/lib/refunds.ts`).
   */
  deliveredAt: string | null;
  items: OrderItem[];
  fabricTotal: number;
  stitchingTotal: number;
  shipping: number;
  total: number;
  firstName: string;
  lastName: string;
  street: string;
  city: string;
  postalCode: string;
  paymentMethod: PaymentMethod;
  /** Referral code credited with this order, or null when direct. */
  referralCode: string | null;
}

export interface NewOrderInput {
  items: Array<{
    productSlug: string;
    title: string;
    image: string;
    price: number;
    qty: number;
    stitchingLabel?: string;
    stitchingAddOn?: number;
    stitcherSlug?: string;
  }>;
  fabricTotal: number;
  stitchingTotal: number;
  shipping: number;
  total: number;
  firstName: string;
  lastName: string;
  street: string;
  city: string;
  postalCode: string;
  paymentMethod: PaymentMethod;
}

// --- Refunds ----------------------------------------------------------------

/**
 * A customer asking for their money back on a delivered order.
 *
 * Staff never create one of these: the request is the only route to a REFUNDED
 * order, so every refund carries a reason and a person who asked for it
 * (`src/lib/refunds.ts`).
 */
export interface RefundRequest {
  id: string;
  orderId: string;
  /** The short code the customer knows the order by, e.g. "2VVS7D5B". */
  orderNumber: string;
  /** Who asked, for the staff queue. Empty on the local backend's own view. */
  customerName: string;
  status: RefundRequestStatus;
  /** In the customer's words. Shown to staff, never rendered as HTML. */
  reason: string;
  /** What was asked back: the order total at the time of the request. */
  amount: number;
  /** Why staff ruled the way they did, once they have. */
  staffNote: string | null;
  createdAt: string;
  reviewedAt: string | null;
}

// --- Catalogue --------------------------------------------------------------

export const PRODUCT_GENDERS = ["Women", "Men", "Unisex"] as const;
export type ProductGender = (typeof PRODUCT_GENDERS)[number];

// --- Taxonomy ---------------------------------------------------------------
//
// The managed lists a product picks from, instead of the free text the form
// used to collect. See migration 18 for why: typed values became storefront
// filter facets, so "2 pice" and "Deep Navy"/"Midnight Blue"/"Pastel Blue" were
// each their own permanent row in the filter panel.

/** Common to every list. `archived` options still render on products that already reference them — they just stop being offered. */
export interface TaxonomyOption {
  id: string;
  slug: string;
  label: string;
  archived: boolean;
}

export interface ColorOption extends TaxonomyOption {
  /** Lower-case `#rrggbb`. The swatch. */
  hex: string;
  /** The axis the storefront filters on — many labels share one. */
  family: ColorFamily;
}

/**
 * One colourway on a product: the taxonomy row, flattened.
 *
 * Carries the label AND the hex AND the family for the same reason the other
 * taxonomy fields on `CatalogItem` do: a listing renders the swatch, the
 * product page prints the name and the filter panel groups on the family, and
 * none of them should have to join anything to get there.
 */
export interface ProductColor {
  id: string;
  label: string;
  hex: string;
  family: ColorFamily;
}

/** An ordered set of sizes, e.g. Unstitched, Alpha (XS–XXL), Shoe (EU). */
export interface SizeScaleOption extends TaxonomyOption {
  values: string[];
}

/**
 * A category, plus the defaults a new product in it inherits.
 *
 * The defaults are what actually shortens the form: picking "3-Piece Suits"
 * pre-fills the stitching charge, size scale and meterage and reveals the
 * dupatta fields. Every one stays editable — a starting point, not a rule,
 * which is why nothing downstream reads them.
 */
export interface CategoryOption extends TaxonomyOption {
  /** Null = offered for every gender; otherwise it scopes the picker. */
  gender: ProductGender | null;
  defaultStitchingAddOn: number | null;
  defaultSizeScaleId: string | null;
  defaultMeters: number | null;
  hasDupatta: boolean;
}

/** Every list, read in one go — the product form needs all of them at once. */
export interface ProductTaxonomy {
  categories: CategoryOption[];
  fabrics: TaxonomyOption[];
  colors: ColorOption[];
  badges: TaxonomyOption[];
  sizeScales: SizeScaleOption[];
  embroideryTechniques: TaxonomyOption[];
}

export type TaxonomyKind = keyof ProductTaxonomy;

/** What the Super Admin screen submits to add an option. */
export interface NewTaxonomyOption {
  label: string;
  /** colors only. */
  hex?: string;
  family?: ColorFamily;
  /** sizeScales only. */
  values?: string[];
  /** categories only. */
  gender?: ProductGender | null;
  defaultStitchingAddOn?: number | null;
  defaultSizeScaleId?: string | null;
  defaultMeters?: number | null;
  hasDupatta?: boolean;
}

/**
 * One photo on a product, plus the point of it that must stay in frame.
 *
 * The focal point is stored with the photo because the storefront crops the
 * same file into several shapes: 4:5 grid tiles on Men, Women and New
 * Arrivals, a 16:9 feature tile at the top of the Women grid and a 16:10 one
 * at the top of the Men grid. `object-cover` centres what it crops, so a
 * portrait shot in a wide tile lost the top and bottom of the garment. Whoever
 * publishes the product sets the point once, in the storefront preview, and
 * every shape crops around it.
 */
export interface ProductPhoto extends FocalPoint {
  /**
   * The `product_images` row.
   *
   * Carried because an edit has to say "keep this one, it moved to position 2"
   * about a file it never downloaded. Empty string on the seeded catalogue,
   * which has no rows of its own.
   */
  id: string;
  url: string;
}

/**
 * A photo as the product form holds it: already on the product, or just picked
 * off the disk.
 *
 * One list rather than "existing" and "new" side by side, because the ordering
 * is the product of both and position 0 is the listing tile. Two lists would
 * make "make the photo I just added the main one" impossible to express.
 *
 * The two differ in what can be done to them. An upload still has its pixels
 * in the page, so it can be re-cropped; a stored photo is a URL on another
 * host, and re-cropping it would mean pulling it back through a canvas. Its
 * focal point is still editable, because that is two columns and no pixels.
 */
export type ProductFormPhoto =
  ({ kind: "stored" } & ProductPhoto) | ({ kind: "upload" } & UploadedImage);

/** Where to point an `<img>` at, whichever kind it is. */
export function photoSrc(photo: ProductFormPhoto): string {
  return photo.kind === "upload" ? photo.dataUrl : photo.url;
}

/**
 * A published product, as both the dashboard and the storefront read it.
 *
 * This is the full row, not a summary: the PDP renders the specs (fabric,
 * colour, embroidery, dupatta, meters) and the listings render the badge and
 * new-arrival flag, so anything the screens show has to be captured when the
 * product is created — see `ProductInput`.
 */
export interface CatalogItem {
  id: string;
  /** URL key. Derived from the title at creation; never edited afterwards. */
  slug: string;
  title: string;
  price: number;
  /** Was-price for a markdown. Null when the piece isn't discounted. */
  compareAtPrice: number | null;
  // The taxonomy fields are carried BOTH ways: the label, because that is what
  // every listing and the product page print, and the id, because that is what
  // the row actually references and what an edit form has to pre-select. The
  // adapter resolves one from the other — a component never joins anything.
  fabric: string;
  fabricId: string;
  /**
   * Fabric weight, split out of the name. "Pure Raw Silk (80gm)" used to be its
   * own fabric, separate from "Raw Silk" and "Silk"; the weight lives here so
   * all three collapse into one filter facet.
   */
  fabricWeightGsm: number | null;
  category: string;
  categoryId: string;
  gender: ProductGender;
  /**
   * Every colourway the piece is offered in, ordered; the first is the primary
   * one a listing tile shows. Never empty for a product created through the
   * form, but a row written before migration 21 can be, so read it defensively.
   */
  colors: ProductColor[];
  /** `["Unstitched"]` for fabric; real sizes for made-up pieces. */
  sizes: string[];
  /** Which scale `sizes` was chosen from. Null on rows predating the scales. */
  sizeScaleId: string | null;
  stock: number;
  sku: string | null;
  description: string;
  isNewArrival: boolean;
  /** Whether the piece can be sent for bespoke stitching at checkout. */
  stitchingEligible: boolean;
  /** Added to the price when stitching is chosen. Null when not eligible. */
  stitchingAddOn: number | null;
  badge: string | null;
  badgeId: string | null;
  /** Metres of fabric. A number now — it was "4.5 Meters (Standard Suit)". */
  meters: number | null;
  /** The parenthetical that used to be inside that string. */
  metersNote: string | null;
  /** Technique labels. Was the CSV string "Gold Tilla, Zardozi, Sequins". */
  embroidery: string[];
  /** The three fields "2.5 Meters Organza with Border" used to be. */
  dupattaLength: number | null;
  dupattaFabric: string | null;
  dupattaFabricId: string | null;
  dupattaFinish: string | null;
  heritageStory: string | null;
  /** Ordered; the first is the primary shown in listings. Empty is allowed. */
  images: ProductPhoto[];
  /**
   * Derived from reviews, never entered by hand — a product with no reviews
   * has a null rating rather than a zero, which would read as "rated badly".
   */
  rating: number | null;
  reviewCount: number;
  addedByEmail: string;
  addedByName: string;
  createdAt: string;
}

/**
 * What the product form collects, for a new piece and for an edit alike.
 *
 * Spelled out rather than derived from `CatalogItem`, because the two genuinely
 * differ now: the form submits taxonomy IDS, and the item carries the resolved
 * LABELS alongside them. Deriving this with `Omit` would let a form send a
 * label the database has no row for — the exact thing migration 18 removes.
 *
 * Left out are the fields the store owns: `id`, `slug`, `rating`/`reviewCount`
 * (derived from reviews) and the authorship/timestamp columns. `slug` in
 * particular is NOT editable: it is the product's address, and quietly moving
 * it would break every link anybody has already shared.
 */
export interface ProductInput {
  title: string;
  price: number;
  compareAtPrice: number | null;
  description: string;
  gender: ProductGender;

  categoryId: string;
  fabricId: string;
  fabricWeightGsm: number | null;
  /** Colour ids, ordered. The first is the primary. At least one. */
  colorIds: string[];
  badgeId: string | null;

  sizeScaleId: string | null;
  sizes: string[];

  stock: number;
  sku: string | null;
  isNewArrival: boolean;
  stitchingEligible: boolean;
  stitchingAddOn: number | null;

  meters: number | null;
  metersNote: string | null;
  /** Technique ids, not labels — the junction table takes ids. */
  embroideryIds: string[];
  dupattaLength: number | null;
  dupattaFabricId: string | null;
  dupattaFinish: string | null;
  heritageStory: string | null;

  /**
   * Ordered; the first is the primary. An upload carries intrinsic dimensions
   * because `product_images.width`/`.height` are NOT NULL and can only be
   * measured here, in the browser, at upload time.
   */
  images: ProductFormPhoto[];
}

export interface Author {
  email: string;
  name: string;
}

// --- Affiliate --------------------------------------------------------------

export interface AffiliateLink {
  id: string;
  productSlug: string;
  productTitle: string;
  /** Sale price when the link was taken, for the vendor's own reference. */
  productPrice: number;
  createdAt: string;
}

export interface CapturedReferral {
  code: string;
  productSlug: string | null;
  capturedAt: string;
}

export interface PayoutRequest {
  id: string;
  amount: number;
  requestedAt: string;
  status: PayoutStatus;
}

// --- Bag and wishlist -------------------------------------------------------

export interface StitchingSelection {
  label: string;
  addOn: number;
}

export interface CartLine {
  id: string;
  slug: string;
  title: string;
  image: string;
  price: number;
  qty: number;
  stitching?: StitchingSelection;
  /** Which Master Stitcher this line is assigned to; only set when stitched. */
  stitcherSlug?: string;
}

// --- Bespoke configuration --------------------------------------------------

export interface TailoringConfig {
  measurements: MeasurementSet;
  neckline: string;
  necklinePrice: number;
  sleeve: string;
  sleevePrice: number;
  hemline: string;
  hemlinePrice: number;
  garmentType: string;
  basePrice: number;
  stitcherSlug: string;
}

/**
 * A photo the customer supplied with a bespoke request.
 *
 * `url` is SIGNED and short-lived: the bucket is private because these are
 * pictures of a customer, and a permanent link that leaks would stay valid
 * forever. Re-read the list to refresh them rather than caching the URL.
 */
export interface ReferenceImage {
  id: string;
  url: string;
}

// --- Enquiries --------------------------------------------------------------

export interface ContactMessage {
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
}

// --- Reviews ----------------------------------------------------------------

export const MIN_REVIEW_RATING = 1;
export const MAX_REVIEW_RATING = 5;

export interface Review {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  authorName: string;
  createdAt: string;
  /** True when the reviewer's account has an order containing this product. */
  verifiedPurchase: boolean;
  /** True when this is the signed-in reader's own review, so it can be edited. */
  mine: boolean;
}

export interface NewReview {
  rating: number;
  title: string | null;
  body: string | null;
}

// --- Stitching queue --------------------------------------------------------

/** A bespoke garment as the tailor who has to cut it sees it. */
export interface StitchingJob {
  id: string;
  /** The order it belongs to, for quoting back to the customer. */
  orderNumber: string;
  customer: string;
  garment: string;
  neckline: string;
  sleeve: string;
  hemline: string;
  notes: string | null;
  measurements: MeasurementSet;
  status: StitchingStatus;
  /** False while the job is still in the pool, waiting to be claimed. */
  claimed: boolean;
  /** What the customer sent to show what they mean. Signed URLs. */
  references: ReferenceImage[];
}

// --- Vendor performance -----------------------------------------------------

/** What a vendor's referral links have actually done. */
export interface VendorPerformance {
  clicks: number;
  sales: number;
  /** Commission credited or paid, in PKR — what they can draw against. */
  earned: number;
  /** Commission on sales still inside the return window. */
  pending: number;
  /**
   * The rate a Super Admin set for them. Read here rather than assumed, so the
   * figure a vendor is quoted is the one their commission is calculated from.
   */
  commission: CommissionRate;
  /**
   * The code their links carry — ISSUED and stored, never derived.
   *
   * The browser build hashes the vendor's email to get one, which works only
   * because nothing else checks it. The order route matches on
   * `users.referral_code`, so a derived code would build links that credit
   * nobody. Null when no code has been issued yet.
   */
  referralCode: string | null;
}

/** A sale credited to a vendor's links. */
export interface ReferredSale {
  id: string;
  orderNumber: string;
  product: string;
  salePrice: number;
  date: string;
  /** Commission on this sale, as it was calculated at the time. */
  commission: number;
  /**
   * The rate that produced that figure, as it stood when the sale happened.
   *
   * Snapshotted rather than read live, for the same reason the amount is: a
   * Super Admin changing a vendor's rate must not relabel what they already
   * earned. It is on the row so "PKR 1,200" can be checked against "10% of
   * PKR 12,000" instead of being a number the vendor has to take on trust.
   */
  rate: CommissionRate;
  /**
   * Where this sale's commission has got to.
   *
   * Carried because a vendor reading "you earned PKR 20" under a headline of
   * "Earned To Date: PKR 0" has been told two different things. PENDING is the
   * hold in `src/lib/commission.ts` running, not a payment that failed.
   */
  status: CommissionStatus;
}

// --- Dashboard statistics ---------------------------------------------------

export interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  revenueByDay: { date: string; revenue: number }[];
  ordersByStatus: { status: OrderStatus; count: number }[];
  recentOrders: {
    id: string;
    orderNumber: string;
    customer: string;
    total: number;
    status: OrderStatus;
    itemCount: number;
  }[];
}

// --- Access control ---------------------------------------------------------

/**
 * The areas access is granted over. Matches the `access_category` enum, in
 * SCREAMING_SNAKE for the same reason the status enums are: the database
 * stores keys, and the wording on screen can change without a migration.
 */
export const ACCESS_CATEGORIES = ["PRODUCTS", "ORDERS", "STITCHING", "VENDORS", "REPORTS"] as const;
export type AccessCategory = (typeof ACCESS_CATEGORIES)[number];

export const ACCESS_CATEGORY_LABELS: Record<AccessCategory, string> = {
  PRODUCTS: "Products",
  ORDERS: "Orders",
  STITCHING: "Stitching",
  VENDORS: "Vendors",
  REPORTS: "Reports",
};

/**
 * What a role may do in one area.
 *
 * Two flags rather than one, because the table has two and collapsing them
 * would mean the screen couldn't express "can see orders, can't refund them" —
 * which is the main thing a permission grid is for.
 */
export interface AccessGrant {
  canView: boolean;
  canEdit: boolean;
}

/** Every role's grants. SUPER_ADMIN is absent: it bypasses the grid entirely. */
export type AccessGrid = Partial<Record<AppRole, Record<AccessCategory, AccessGrant>>>;

// --- Staff administration ---------------------------------------------------

/** A dashboard user as the Super Admin manages them. */
export interface ManagedUser {
  id: string;
  name: string;
  email: string;
  role: AppRole;
  isActive: boolean;
  /** True for a guest: a shopper with a bag but no account, so no email. */
  isAnonymous: boolean;
  /** Vendors only. */
  referralCode: string | null;
  /**
   * Vendors only — null on every other role.
   *
   * It used to be non-null for everyone, because the affiliate migration gave
   * the column a default of 10%. A rate on a customer is meaningless and was
   * only ever a display artefact; the guest_identity_and_visits migration drops
   * the defaults and adds a constraint so it stays null.
   */
  commission: CommissionRate | null;
  /** Where and on what they were last seen. Null until they visit again. */
  lastSeen: LastSeen | null;
}

// --- Errors -----------------------------------------------------------------

/**
 * Thrown when a store can't persist. Adapters catch driver-specific failures
 * (a localStorage quota error, a PostgrestError) and raise this instead, so a
 * component never has to know which backend is running.
 */
export class StoreWriteError extends Error {
  constructor(
    message: string,
    /** True when the cause was capacity rather than a transient fault. */
    readonly outOfSpace = false
  ) {
    super(message);
    this.name = "StoreWriteError";
  }
}
