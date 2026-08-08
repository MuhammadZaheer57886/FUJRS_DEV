import { LinkButton } from "@/components/ui/Button";

/**
 * The screen a guest sees where an account screen would be.
 *
 * A guest has a session — that uuid owns their bag and any guest-checkout
 * order — but no account, so there is nothing to show them here and nothing to
 * sign them out of. Rather than a redirect, they get the page they asked for
 * with the reason on it: a redirect loses the fact that they arrived somewhere
 * deliberately, and lands them on a login form with no explanation.
 *
 * `callbackUrl` brings them back here once they've signed in.
 */
export function SignInRequired({
  title,
  message,
  callbackUrl,
}: {
  title: string;
  message: string;
  callbackUrl: string;
}) {
  return (
    <div className="max-w-container-max mx-auto flex min-h-[50vh] flex-col items-center justify-center px-margin-mobile md:px-margin-desktop py-24 text-center">
      <span className="material-symbols-outlined text-4xl text-on-surface-variant">lock</span>
      <h1 className="mt-6 font-display text-headline-md">{title}</h1>
      <p className="mt-3 max-w-sm font-body text-body-md text-on-surface-variant leading-relaxed">
        {message}
      </p>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
        <LinkButton
          href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}
          variant="primary"
          className="!px-10 !py-4"
        >
          Sign In
        </LinkButton>
        {/* No callbackUrl: the register page doesn't read one, and a parameter
            it ignores would promise a return trip that never happens. */}
        <LinkButton href="/register" variant="secondary" className="!px-10 !py-4">
          Create Account
        </LinkButton>
      </div>

      <p className="mt-8 max-w-sm font-label-sm text-on-surface-variant leading-relaxed">
        Your bag and wishlist are already saved and will carry over — signing up keeps them on the
        same account.
      </p>
    </div>
  );
}
