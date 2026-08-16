"use client";

import type { ReactNode } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { LinkButton } from "@/components/ui/Button";
import { LoadingScreen } from "@/components/ui/Loading";
import { StatusScreen } from "@/components/ui/StatusScreen";
import { STAFF_ROLES, type AppRole } from "@/lib/auth/roles";

/**
 * The staff check every internal screen has to make.
 *
 * Nothing here is a security boundary and it must not be mistaken for one: the
 * session is read in the browser, and on `supabase` it is RLS that actually
 * refuses the data. This is the difference between "you can't see this" and a
 * blank page or a driver error, which is worth having in exactly one place
 * rather than re-typed per route.
 *
 * `roles` narrows it further than "any staff account": the catalogue screens
 * are for the roles that can publish, and a Tailor landing on one should be
 * told so rather than shown controls the database will reject.
 */
export function StaffGate({
  roles = STAFF_ROLES,
  callbackUrl,
  deniedBody,
  children,
}: {
  roles?: readonly AppRole[];
  /** Where to return after signing in. */
  callbackUrl: string;
  /** Why this particular screen is closed, when "staff only" isn't the reason. */
  deniedBody?: ReactNode;
  children: ReactNode;
}) {
  const { session, status } = useAuth();

  if (status === "loading") return <LoadingScreen />;

  if (status === "unauthenticated") {
    return (
      <StatusScreen
        icon="lock"
        title="Staff Sign-In Required"
        body="This screen is for FUJRS Admin, Vendor, and Tailor accounts."
        actions={
          <LinkButton href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}>
            Sign In
          </LinkButton>
        }
      />
    );
  }

  if (!session || !roles.includes(session.user.role)) {
    return (
      <StatusScreen
        icon="block"
        title="Staff Access Only"
        body={
          deniedBody ??
          "This screen is for FUJRS staff accounts. Your account is a regular customer account."
        }
        actions={
          <LinkButton href="/account" variant="secondary">
            Back to My Account
          </LinkButton>
        }
      />
    );
  }

  return <>{children}</>;
}
