// The contract between the app and whatever is storing its data.
//
// Every method is async even though the current adapter is synchronous
// localStorage. That is deliberate: a network-backed adapter cannot be
// synchronous, so making the interface async now means components handle
// awaiting and loading states ONCE, rather than changing again when the
// backend lands. See BACKEND_SETUP.md.
//
// Implementations live in `local/` and (later) `supabase/`. Adding a custom
// REST backend means writing `http/` against these same interfaces — no
// component changes.

import type { AppRole } from "@/lib/auth/roles";
import type { CommissionRate } from "@/lib/commission";
import type { OrderStatus } from "@/lib/orderStatus";
import type { RefundRequestStatus } from "@/lib/refunds";
import type { StitchingStatus } from "@/lib/stitchingStatus";
import type { StoredUser } from "@/lib/auth/session";
import type { UploadedImage } from "@/lib/downscaleImage";
import type {
  AccessCategory,
  AccessGrant,
  AccessGrid,
  ManagedUser,
  Account,
  AffiliateLink,
  Author,
  CapturedReferral,
  CartLine,
  CatalogItem,
  ContactMessage,
  DashboardStats,
  ProductInput,
  NewOrderInput,
  NewTaxonomyOption,
  Order,
  PayoutRequest,
  ProductTaxonomy,
  TaxonomyKind,
  RefundRequest,
  ReferredSale,
  SavedAddress,
  ReferenceImage,
  Review,
  NewReview,
  StitchingJob,
  TailoringConfig,
  VendorPerformance,
} from "./types";

export interface AuthResult {
  user?: StoredUser;
  error?: string;
}

/**
 * Super Admin user management (REQUIREMENTS.md §4.1).
 *
 * Creating a user needs privileges the browser must never hold, so the
 * Supabase adapter goes through a server route rather than calling the
 * database directly. The port hides that difference.
 */
export interface UserAdminStore {
  list(): Promise<ManagedUser[]>;
  create(input: {
    name: string;
    email: string;
    password: string;
    role: AppRole;
  }): Promise<{ user?: ManagedUser; error?: string }>;
  setCommission(id: string, rate: CommissionRate): Promise<{ error?: string }>;
}

export interface AuthStore {
  /** The signed-in user, or null. */
  current(): Promise<StoredUser | null>;
  signIn(email: string, password: string): Promise<AuthResult>;
  signUp(input: { email: string; password: string; name: string }): Promise<AuthResult>;
  signOut(): Promise<void>;
  /** Null error on success. Password changes need a real auth provider. */
  updatePassword(newPassword: string): Promise<{ error?: string }>;
  updateName(name: string): Promise<AuthResult>;
  /**
   * Notifies when the session changes underneath the app — a token refresh, a
   * sign-out in another tab. Returns an unsubscribe function. The local
   * adapter has nothing to report and returns a no-op.
   */
  onChange(callback: (user: StoredUser | null) => void): () => void;
}

export interface OrderStore {
  /** Newest first. */
  list(): Promise<Order[]>;
  get(id: string): Promise<Order | null>;
  create(input: NewOrderInput): Promise<Order>;
  /** Null when the order is gone or the transition isn't legal. */
  updateStatus(id: string, status: OrderStatus): Promise<Order | null>;
}

/**
 * Customer-initiated refunds (`src/lib/refunds.ts`).
 *
 * There is no staff `create` on purpose. A refund starts with the customer
 * asking, and approving that request is what moves the order to REFUNDED, so
 * staff cannot refund an order that nobody asked to have refunded.
 */
export interface RefundStore {
  /**
   * Newest first. Who sees what is the backend's job, the same way orders
   * work: a customer gets their own requests, staff get every one.
   */
  list(): Promise<RefundRequest[]>;
  /** The latest request against one order, or null when there is none. */
  forOrder(orderId: string): Promise<RefundRequest | null>;
  /** Throws `StoreWriteError` when the order isn't eligible. */
  request(input: { orderId: string; reason: string }): Promise<RefundRequest>;
  /**
   * Staff ruling on a request. Approving also moves the order to REFUNDED,
   * which releases stock and reverses commission. Null when the request is
   * gone, already reviewed, or the caller isn't staff.
   */
  review(input: {
    id: string;
    decision: Exclude<RefundRequestStatus, "REQUESTED">;
    note?: string;
  }): Promise<RefundRequest | null>;
}

/**
 * The signed-in user's own profile.
 *
 * The methods below take no identity argument on purpose. Who "me" is comes
 * from the verified session inside the adapter — an email passed in from a
 * component is a value a client controls, and an adapter that trusted one
 * could be asked for somebody else's address. `find`/`create` are the
 * exception: they exist for the local adapter's sign-in, which has no session
 * yet at the point it calls them.
 */
export interface ProfileStore {
  find(email: string): Promise<Account | null>;
  /** `role` is only honoured when a Super Admin creates the account. */
  create(input: { name: string; email: string; role?: AppRole }): Promise<Account>;
  updateName(name: string): Promise<Account>;
  getAvatar(): Promise<string | null>;
  updateAvatar(avatar: string | null): Promise<Account>;
  getAddress(): Promise<SavedAddress | null>;
  updateAddress(address: SavedAddress): Promise<Account>;
}

/**
 * The read half of the catalogue, split out because the storefront only ever
 * reads — and reads on the SERVER, where the `local` adapter can't run. The
 * static array satisfies this interface too, which is what lets the shop pages
 * render identically on either backend.
 */
export interface CatalogReadStore {
  /** Newest first. Published products only — archived ones are excluded. */
  list(): Promise<CatalogItem[]>;
  /** Null when no published product has that slug. Backs the product page. */
  getBySlug(slug: string): Promise<CatalogItem | null>;
}

export interface CatalogStore extends CatalogReadStore {
  create(input: ProductInput, author: Author): Promise<CatalogItem>;
  /**
   * Replaces everything the form owns on an existing piece.
   *
   * A whole-input replace rather than a patch of changed fields: the form
   * submits its complete state, and a partial update would need every caller
   * to work out what moved, which is exactly how a cleared field ends up
   * silently keeping its old value. The slug, the author and the timestamps
   * are the store's, and survive untouched.
   */
  update(id: string, input: ProductInput): Promise<CatalogItem>;
  remove(id: string): Promise<void>;
}

/**
 * The managed lists the product form picks from — categories, fabrics, colours,
 * badges, size scales and embroidery techniques.
 *
 * `read` returns every list in ONE call rather than one method per kind. The
 * product form needs all six to render, and six round trips to draw one form is
 * the kind of thing that turns into a loading spinner per field.
 *
 * Reads include archived options (`TaxonomyOption.archived`) so a product that
 * references one still renders its label; callers filter for the pickers. Only
 * a Super Admin may write — on `supabase` the database enforces that, not the
 * UI hiding a button.
 */
export interface ProductTaxonomyStore {
  read(): Promise<ProductTaxonomy>;
  add(kind: TaxonomyKind, input: NewTaxonomyOption): Promise<ProductTaxonomy>;
  /** Archive/restore. Options are never deleted — products reference them. */
  setArchived(kind: TaxonomyKind, id: string, archived: boolean): Promise<ProductTaxonomy>;
  rename(kind: TaxonomyKind, id: string, label: string): Promise<ProductTaxonomy>;
}

/** The signed-in vendor's own links — see the note on ProfileStore. */
export interface AffiliateStore {
  /** Newest first. */
  listLinks(): Promise<AffiliateLink[]>;
  /** Taking the same link twice refreshes it rather than duplicating. */
  addLink(product: { slug: string; title: string; price: number }): Promise<AffiliateLink>;
  removeLink(id: string): Promise<void>;
  /**
   * Clicks, sales and commission for the signed-in vendor.
   *
   * On `local` these are dashboard fixtures — a browser cannot see traffic. On
   * `supabase` they are counted from `referral_clicks` and `commissions`.
   */
  performance(): Promise<VendorPerformance>;
  /** Sales credited to this vendor's links, newest first. */
  referredSales(): Promise<ReferredSale[]>;
}

/**
 * The bespoke stitching queue.
 *
 * Unassigned ordered work sits in a pool any tailor can claim; claiming is
 * what `assigned_tailor_id` records. Staff can read the queue but not move a
 * garment through it — that is the tailor's call, and the audit trail should
 * say who actually did the work.
 */
export interface StitchingStore {
  /** Jobs assigned to the caller, plus anything unclaimed. Newest first. */
  queue(): Promise<StitchingJob[]>;
  /** Claims the job if it is unassigned, then sets the status. Null on refusal. */
  updateStatus(id: string, status: StitchingStatus): Promise<StitchingJob | null>;
}

/**
 * Product reviews.
 *
 * Reading is public. Writing needs a durable account — a guest can browse, buy
 * and check out, but a review nobody can be held to is a review anyone can
 * write in a loop (BACKEND_SETUP.md §7).
 */
export interface ReviewStore {
  /** Newest first. */
  listForProduct(productSlug: string): Promise<Review[]>;
  /** Creates or replaces the caller's own review of that product. */
  submit(productSlug: string, review: NewReview): Promise<Review[]>;
  remove(id: string): Promise<void>;
}

/**
 * Contact enquiries and newsletter signups.
 *
 * Write-only from the customer's side. Both used to render a success state
 * without storing anything, which is the one thing the "coming soon"
 * convention exists to prevent (CLAUDE.md).
 */
export interface MessageStore {
  sendContact(message: ContactMessage): Promise<void>;
  subscribe(email: string): Promise<void>;
}

/** Aggregates behind the Admin and Super Admin dashboards. */
export interface StatsStore {
  overview(): Promise<DashboardStats>;
}

/**
 * The role × category access grid.
 *
 * Role-level, not per-user: REQUIREMENTS.md §4.2 asks for per-user
 * permissions, and SCHEMA.md §9 recommends against it for a five-role app.
 * If per-user is ever needed the migration is additive — a `user_permissions`
 * table overriding this one — and this port doesn't change.
 */
export interface PermissionStore {
  read(): Promise<AccessGrid>;
  /** Super Admin only; the database refuses anyone else. */
  set(role: AppRole, category: AccessCategory, grant: AccessGrant): Promise<AccessGrid>;
}

export interface ReferralStore {
  /** The active referral, or null when there isn't one or it has aged out. */
  get(): Promise<CapturedReferral | null>;
  /** Null when the code isn't one FUJRS would have issued. */
  capture(code: string, productSlug: string | null): Promise<CapturedReferral | null>;
  clear(): Promise<void>;
}

/** The signed-in vendor's own payouts — see the note on ProfileStore. */
export interface PayoutStore {
  /** Newest first. */
  list(): Promise<PayoutRequest[]>;
  /**
   * Balance minus anything already sitting in an open request.
   *
   * `pendingBalance` is what the vendor has earned. On `supabase` that is
   * derived from credited commission and the argument is ignored; on `local`
   * it comes from the dashboard fixtures, which have no commission behind them.
   */
  availableToRequest(pendingBalance: number): Promise<number>;
  /** Throws PayoutValidationError when the amount isn't requestable. */
  request(amount: number, available: number): Promise<PayoutRequest>;
}

export interface CartStore {
  read(): Promise<CartLine[]>;
  write(lines: CartLine[]): Promise<void>;
}

export interface WishlistStore {
  /** Product slugs. */
  read(): Promise<string[]>;
  write(slugs: string[]): Promise<void>;
}

export interface TailoringStore {
  read(): Promise<TailoringConfig | null>;
  write(config: TailoringConfig): Promise<void>;
  /** Reference photos on the caller's open draft. Signed, short-lived URLs. */
  listReferences(): Promise<ReferenceImage[]>;
  addReferences(images: UploadedImage[]): Promise<ReferenceImage[]>;
  removeReference(id: string): Promise<void>;
}
