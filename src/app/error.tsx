"use client";

import { startTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, LinkButton } from "@/components/ui/Button";
import { StatusScreen } from "@/components/ui/StatusScreen";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();

  useEffect(() => {
    // Surface the real error to the console only — never to the customer.
    console.error(error);
  }, [error]);

  /**
   * `reset()` on its own only re-renders this boundary on the client. Most of
   * what throws here throws on the server (a page awaiting the data layer),
   * and the router still holds the failed RSC payload for that route, so the
   * retry re-renders the same broken response and the button reads as dead.
   *
   * `router.refresh()` is what discards that payload and asks the server for
   * the segment again. Both run inside one transition so the refetch and the
   * boundary clearing land in a single commit, rather than flashing the failed
   * tree in between.
   */
  const retry = () => {
    startTransition(() => {
      router.refresh();
      reset();
    });
  };

  return (
    <StatusScreen
      icon="report"
      eyebrow="Something went wrong"
      title="We couldn't load this page"
      body="An unexpected error interrupted the page. Trying again usually resolves it."
      actions={
        <>
          <Button variant="primary" onClick={retry} className="!px-10 !py-4">
            Try Again
          </Button>
          <LinkButton href="/" variant="secondary" className="!px-10 !py-4">
            Back to Home
          </LinkButton>
        </>
      }
    />
  );
}
