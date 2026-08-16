"use client";

import { use } from "react";
import { StaffGate } from "@/components/dashboard/StaffGate";
import { ProductDetail } from "@/components/dashboard/ProductDetail";

/**
 * A catalogue row, opened.
 *
 * A route rather than a panel inside the dashboard, because this is the thing
 * one staff member sends another: "have a look at this piece". A dialog has no
 * URL to send, and loses the piece being looked at on a refresh.
 *
 * Publishing roles only. A Vendor takes referral links from the shop and a
 * Tailor works a stitching queue; neither has a reason to read stock levels
 * and cost lines, and on `supabase` the row-level policies say the same thing.
 */
export default function DashboardProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);

  return (
    <StaffGate
      roles={["ADMIN", "SUPER_ADMIN"]}
      callbackUrl={`/dashboard/products/${slug}`}
      deniedBody="Catalogue details are for Admin and Super Admin accounts."
    >
      <ProductDetail slug={slug} />
    </StaffGate>
  );
}
