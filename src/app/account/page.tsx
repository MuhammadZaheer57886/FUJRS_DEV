"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { SignInRequired } from "@/components/auth/SignInRequired";
import { LinkButton } from "@/components/ui/Button";
import { formatOrderNumber } from "@/lib/orderNumber";
import { ORDER_STATUS_LABELS } from "@/lib/orderStatus";
import { orders as orderStore } from "@/lib/data";
import type { Order } from "@/lib/data";
import {
  ROLE_LABELS,
  ROLE_WORKSPACE,
  isStaffRole,
  type AppRole,
  type StaffRole,
} from "@/lib/auth/roles";

interface AccountUser {
  name: string;
  email: string;
  role: AppRole;
}

function AccountHeader({ eyebrow, user }: { eyebrow: string; user: AccountUser }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-6">
      <div>
        <p className="font-body text-label-sm uppercase tracking-widest text-marketplace-bronze">
          {eyebrow}
        </p>
        <h1 className="mt-2 font-display text-headline-md">Welcome back, {user.name}</h1>
      </div>
      <div className="flex items-center gap-6">
        <Link
          href="/account/settings"
          className="font-label-sm uppercase tracking-widest text-on-surface-variant hover:text-primary"
        >
          Account Settings
        </Link>
        <SignOutButton />
      </div>
    </div>
  );
}

function ProfilePanel({ user, showRole }: { user: AccountUser; showRole?: boolean }) {
  return (
    <div className="border border-outline-variant p-6 space-y-4">
      <div>
        <p className="font-label-sm uppercase text-on-surface-variant">Name</p>
        <p className="font-body text-body-md">{user.name}</p>
      </div>
      <div>
        <p className="font-label-sm uppercase text-on-surface-variant">Email</p>
        <p className="font-body text-body-md">{user.email}</p>
      </div>
      {showRole && (
        <div>
          <p className="font-label-sm uppercase text-on-surface-variant">Role</p>
          <p className="font-body text-body-md">{ROLE_LABELS[user.role]}</p>
        </div>
      )}
    </div>
  );
}

function StaffAccount({ user }: { user: AccountUser & { role: StaffRole } }) {
  const workspace = ROLE_WORKSPACE[user.role];
  const roleLabel = ROLE_LABELS[user.role];

  return (
    <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-16">
      <AccountHeader eyebrow="Staff Access" user={user} />

      <div className="mt-16 grid grid-cols-1 gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2 border border-outline-variant p-10">
          <div className="flex flex-wrap items-center gap-4">
            <h2 className="font-body text-label-md uppercase tracking-widest text-on-surface-variant">
              Your Workspace
            </h2>
            <span className="border border-primary px-3 py-1 font-label-sm uppercase tracking-widest">
              {roleLabel}
            </span>
          </div>

          <p className="mt-6 font-body text-body-lg text-on-surface-variant leading-relaxed">
            {workspace.summary}
          </p>

          <ul className="mt-8 space-y-3">
            {workspace.duties.map((duty) => (
              <li key={duty} className="flex items-start gap-3 font-body text-body-md">
                <span className="material-symbols-outlined text-xl text-marketplace-bronze">
                  check_small
                </span>
                {duty}
              </li>
            ))}
          </ul>

          <LinkButton href="/dashboard" variant="primary" className="mt-10 !px-10 !py-4">
            Go to Dashboard
          </LinkButton>
        </div>

        <div>
          <h2 className="font-body text-label-md uppercase tracking-widest text-on-surface-variant mb-6">
            Profile
          </h2>
          <ProfilePanel user={user} showRole />
          <p className="mt-8 font-label-sm text-on-surface-variant leading-relaxed">
            Update your name, email, or password in Account Settings. Role and permission changes
            are made by a Super Admin.
          </p>
        </div>
      </div>
    </div>
  );
}

function CustomerAccount({ user }: { user: AccountUser }) {
  const [orders, setOrders] = useState<Order[] | null>(null);

  useEffect(() => {
    let active = true;
    orderStore.list().then((list) => {
      if (active) setOrders(list);
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-16">
      <AccountHeader eyebrow="My Account" user={user} />

      <div className="mt-16 grid grid-cols-1 gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2 border border-outline-variant p-10">
          <h2 className="font-body text-label-md uppercase tracking-widest text-on-surface-variant mb-6">
            Order History
          </h2>

          {orders === null ? (
            <p className="py-12 text-center font-body text-body-md text-on-surface-variant">
              Loading orders…
            </p>
          ) : orders.length === 0 ? (
            <div className="text-center py-12">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant">
                receipt_long
              </span>
              <p className="mt-4 font-body text-body-md text-on-surface-variant">
                You haven&apos;t placed an order yet.
              </p>
              <LinkButton href="/new-arrivals" variant="primary" className="mt-6 !px-10 !py-4">
                Start Shopping
              </LinkButton>
            </div>
          ) : (
            <ul className="divide-y divide-outline-variant/30">
              {orders.map((order) => (
                <li
                  key={order.id}
                  className="flex flex-wrap items-center justify-between gap-4 py-6"
                >
                  <div>
                    <p className="font-body text-body-md">
                      Order {formatOrderNumber(order.orderNumber)}
                    </p>
                    <p className="font-label-sm text-on-surface-variant mt-1">
                      {new Date(order.createdAt).toLocaleDateString()} · {order.items.length} item
                      {order.items.length === 1 ? "" : "s"} · {ORDER_STATUS_LABELS[order.status]}
                    </p>
                  </div>
                  <div className="flex items-center gap-6">
                    <p className="font-label-md">PKR {order.total.toLocaleString()}</p>
                    <Link
                      href={`/account/orders/${order.id}`}
                      className="font-label-sm uppercase tracking-widest text-marketplace-bronze underline underline-offset-4"
                    >
                      View
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h2 className="font-body text-label-md uppercase tracking-widest text-on-surface-variant mb-6">
            Profile
          </h2>
          <ProfilePanel user={user} />
          <ul className="mt-6 space-y-3">
            <li>
              <Link
                href="/wishlist"
                className="font-body text-body-md hover:text-marketplace-bronze"
              >
                Wishlist
              </Link>
            </li>
            <li>
              <Link
                href="/tailoring/review"
                className="font-body text-body-md hover:text-marketplace-bronze"
              >
                Latest Bespoke Specification
              </Link>
            </li>
          </ul>
          <p className="mt-8 font-label-sm text-on-surface-variant leading-relaxed">
            Your wishlist, bag, orders, and saved Atelier measurements are stored on this device for
            now. Account sync arrives with the live backend.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AccountPage() {
  const { session, status, isGuest } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login?callbackUrl=/account");
  }, [status, router]);

  if (status === "loading" || !session) {
    return (
      <div className="max-w-container-max mx-auto px-margin-mobile py-16 text-center text-on-surface-variant">
        Loading your account…
      </div>
    );
  }

  // A guest reaches this route by typing it or following an old link. There is
  // no name, email or order history behind their session and nothing to sign
  // out of, so showing the account shell would be showing them blanks.
  if (isGuest) {
    return (
      <SignInRequired
        title="Sign In to See Your Account"
        message="You're browsing as a guest. Sign in, or create an account, to see your order history and profile."
        callbackUrl="/account"
      />
    );
  }

  const { role } = session.user;
  return isStaffRole(role) ? (
    <StaffAccount user={{ ...session.user, role }} />
  ) : (
    <CustomerAccount user={session.user} />
  );
}
