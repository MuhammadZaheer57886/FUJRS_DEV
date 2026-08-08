# FUJRS — Website & Dashboard Requirements (v1.0)

**FUJRS** — E-Commerce, Custom Stitching & Vendor Dashboard — Requirements Document

Prepared for: Malik Uzair Ahmad & [Friend's Name] | Date: 26 July 2026 | Status: Working Draft v1.0 (Phase 1 Scope)

For current build status against this spec, see [TASKS.md](./TASKS.md).

## 1. Project Overview

FUJRS is a clothing brand website that combines a standard e-commerce
storefront with a custom stitching (made-to-order) service. The platform is
managed through a permission-based admin dashboard controlled by a Super
Admin, and includes a vendor/affiliate system through which independent
sellers can promote products on other platforms and earn commission on
resulting sales.

This document is the first-project deliverable for [Company Name] and
defines the functional scope for the developer ([Friend's Name]) to build
against. Items not explicitly listed here are considered out of scope for
Phase 1 and will be addressed in future update rounds, as agreed.

## 2. User Roles

The system is role-based. The Super Admin is the only role with authority
to create other dashboard users and decide exactly which permissions each
one receives — permissions are not fixed by role name but assigned
individually.

| Role | Description | Permissions |
|---|---|---|
| Super Admin | Full control of the platform. Creates/removes dashboard users and assigns their permissions individually. | All — including permission management |
| Admin / Staff (optional) | Any dashboard user the Super Admin creates below full access — e.g. an order handler or content manager. | Custom — set per user by Super Admin |
| Vendor | External seller who promotes FUJRS products on other platforms using trackable links, and earns commission on resulting sales. | View products & their own links/stats only (Section 5) |
| Customer | End buyer on the storefront. Browses, purchases ready-made items, and/or submits custom stitching requests. | Storefront access only (no dashboard access) |

## 3. Public Storefront

### 3.1 Standard Shopping
- Product catalog with categories, filters (size, color, price, fabric, etc.), and search.
- Product detail page: images, description, size chart, price, stock/availability, add to cart.
- Cart, checkout, and order confirmation flow.
- Payment integration (method to be confirmed — see Section 8).
- Order tracking / order history for registered customers.

### 3.2 Custom Stitching Service
A parallel purchase path for customers who want a garment made/stitched to
their own specification rather than buying a ready-made item.

- Customer selects "Custom Stitching" on an eligible product or as a standalone service.
- Customer submits: measurements (with a guide/diagram), fabric choice, design/style preferences, and reference images (optional upload).
- System calculates or requests pricing for the custom order (base price + stitching charge — exact pricing logic to be confirmed).
- Order enters a distinct status flow (e.g., Submitted → Confirmed → In Progress → Ready → Shipped), separate from standard product orders, visible to the customer and to whichever dashboard role is assigned to fulfill it.

## 4. Admin Dashboard

### 4.1 Super Admin Capabilities
- Create, edit, deactivate dashboard user accounts (Admin/Staff, Vendor).
- Assign granular permissions per user — e.g., manage products, manage orders, manage stitching queue, manage vendors, view financial reports, set commission rates.
- Manage product catalog: add/edit/remove products, images, pricing, stock.
- Manage all orders (standard + custom stitching).
- Manage vendor commission rates and payouts.
- View sales, vendor performance, and stitching-queue reports.

### 4.2 Permission Model
Permissions should be modular (individually toggleable) rather than
hard-coded to a role, since the Super Admin decides what each user can
access. Suggested permission list to implement:

- Products: view / create / edit / delete
- Orders: view / update status / cancel / refund
- Stitching Requests: view / update status / assign to staff
- Vendors: view / create / edit commission rate / approve payout
- Reports & Analytics: view
- User & Permission Management: (Super Admin only, not delegable in Phase 1)

## 5. Vendor / Affiliate System

This is the sales-referral mechanism described for FUJRS: a vendor doesn't
manage products directly, but sells them on other platforms and earns
commission on resulting sales.

### 5.1 Vendor View
- A vendor, once created by the Super Admin, logs into a restricted dashboard view.
- They can see the product catalog available to them: product image, details, and a unique trackable link per product (or a unique general referral link, depending on final decision — see open question below).
- The vendor copies this link/image and posts it on their own platforms (social media, marketplaces, etc.).
- Vendors cannot edit products, pricing, or see other vendors' data.

### 5.2 Attribution & Commission
- When a customer buys through a vendor's link, the sale is attributed to that vendor (via link tracking / referral code).
- The vendor earns a decided commission (fixed amount or percentage — to be confirmed) on that sale.
- Commission is credited to the vendor's in-dashboard balance ("budget"/wallet).
- Vendor dashboard shows: their links, click/sale stats, current balance, and commission history.

### 5.3 Payout
- Process for a vendor to withdraw or request payout of their balance — method and minimum threshold to be confirmed with the Super Admin.

## 6. Data Model (Key Entities)

A starting point for the developer — not exhaustive, and to be refined
during technical planning.

| Entity | Key Fields / Notes |
|---|---|
| User | id, name, email, password, role, status, created_by (Super Admin) |
| Permission | id, name (e.g. products.edit), description |
| UserPermission | user_id, permission_id — join table for granular access control |
| Product | id, name, description, price, images[], category, stock, stitching_eligible (bool) |
| Order | id, customer_id, items[], type (standard/stitching), status, total, payment_status |
| StitchingRequest | id, order_id, measurements, fabric_choice, notes, reference_images[], status |
| VendorLink | id, vendor_id, product_id, unique_code/url, clicks, created_at |
| Commission | id, vendor_id, order_id, amount, status (pending/credited/paid) |
| VendorWallet | vendor_id, balance, last_payout_date |

## 7. Phase 1 Scope Summary

To keep the first build focused, Phase 1 is recommended to include:

- Storefront: browse, product detail, cart, checkout, standard orders.
- Custom stitching request flow (submission + status tracking).
- Admin dashboard: product management, order management, stitching queue.
- Super Admin user & permission management.
- Vendor dashboard: product links, click/sale tracking, commission balance.

Deferred to a later update round (per your note that updates will be scoped
after Phase 1 is done):

- Advanced analytics/reporting dashboards.
- Automated payout integrations (bank/wallet APIs).
- Customer accounts features beyond basic order history (wishlists, loyalty, etc.).

## 8. Open Questions for Decision

These need an answer from you and/or [Friend's Name] before or during build
— flagged here so nothing gets assumed silently:

> **Update 4 Aug 2026:** none of these block UI work. The build runs on a
> working default for each, and anything that needs a real backend shows a
> "coming soon" state rather than waiting on an answer. Only three affect the
> database structure — see [SCHEMA.md](./SCHEMA.md), where they're marked.

- Payment methods to support (bank transfer, card, JazzCash/Easypaisa, COD, etc.).
- Commission structure: flat amount vs. percentage, and whether it varies by product or vendor.
- Vendor link model: unique link per product, or one referral code usable across all products?
- Who fulfills stitching orders operationally (in-house tailor, external partner) — affects what dashboard fields are needed.
- Payout method and minimum withdrawal threshold for vendors.
- Hosting/domain and any existing brand assets (logo, color palette, fonts) for FUJRS.

## 9. Next Steps

- Confirm answers to Section 8 open questions.
- [Friend's Name] to propose a tech stack and rough timeline against this scope.
- Design/branding pass for storefront and dashboard UI.
- Build Phase 1 per Section 7, then review before scoping the next update round.

*Confidential Working Draft*
