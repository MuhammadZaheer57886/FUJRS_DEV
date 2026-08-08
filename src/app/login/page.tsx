"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/Button";
import { isStaffRole } from "@/lib/auth/roles";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn } = useAuth();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/account";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await signIn(email, password);
    setLoading(false);

    if (result?.error) {
      setError(result.error);
      return;
    }

    // Staff land on their dashboard unless they asked for somewhere specific.
    const isDefaultTarget = callbackUrl === "/account";
    router.push(isStaffRole(result.role) && isDefaultTarget ? "/dashboard" : callbackUrl);
  }

  return (
    <div className="max-w-container-max mx-auto px-margin-mobile flex min-h-[70vh] items-center justify-center py-16">
      <div className="w-full max-w-sm">
        <h1 className="text-center font-display text-headline-md">Welcome Back</h1>
        <p className="mt-2 text-center font-body text-body-md text-on-surface-variant">
          Sign in to your FUJRS account
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label
              htmlFor="login-email"
              className="font-body text-label-sm uppercase tracking-widest text-on-surface-variant"
            >
              Email
            </label>
            <input
              id="login-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full border border-outline-variant bg-transparent px-4 py-3 font-body text-body-md focus:outline-none focus:border-marketplace-bronze"
            />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <label
                htmlFor="login-password"
                className="font-body text-label-sm uppercase tracking-widest text-on-surface-variant"
              >
                Password
              </label>
              <Link
                href="/forgot-password"
                className="font-body text-label-sm text-on-surface-variant underline hover:text-primary"
              >
                Forgot password?
              </Link>
            </div>
            <input
              id="login-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full border border-outline-variant bg-transparent px-4 py-3 font-body text-body-md focus:outline-none focus:border-marketplace-bronze"
            />
          </div>

          {error && <p className="font-label-sm text-error">{error}</p>}

          <Button type="submit" disabled={loading} variant="primary" className="w-full !py-4">
            {loading ? "Signing In…" : "Sign In"}
          </Button>
        </form>

        <p className="mt-6 text-center font-body text-body-md text-on-surface-variant">
          New here?{" "}
          <Link href="/register" className="text-primary underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
