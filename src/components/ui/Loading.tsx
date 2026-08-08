/**
 * The one loading indicator in the app.
 *
 * Deliberately wordless. "Loading your bag…", "Preparing your selection…" and
 * the rest were seven different sentences for the same half-second, and a
 * label that names what's missing draws attention to the wait instead of
 * covering it. A spinner says the same thing in every language.
 *
 * Screen readers still get an announcement via the visually-hidden label, so
 * losing the visible text costs nothing in accessibility.
 */
export function Loading({
  size = "md",
  className = "",
  label = "Loading",
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
  /** Announced to assistive tech; never rendered visibly. */
  label?: string;
}) {
  const dimension = size === "sm" ? "h-4 w-4" : size === "lg" ? "h-10 w-10" : "h-6 w-6";

  return (
    <span role="status" className={`inline-flex items-center justify-center ${className}`}>
      <span
        aria-hidden="true"
        className={`${dimension} animate-spin rounded-full border-2 border-outline-variant border-t-marketplace-bronze motion-reduce:animate-none`}
      />
      <span className="sr-only">{label}</span>
    </span>
  );
}

/** Centred in the page, for a route or a full section that has nothing yet. */
export function LoadingScreen({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex min-h-[60vh] w-full items-center justify-center">
      <Loading size="lg" label={label} />
    </div>
  );
}

/** Fills a table cell so a loading row keeps the column layout intact. */
export function LoadingRow({ colSpan, label = "Loading" }: { colSpan: number; label?: string }) {
  return (
    <tr>
      <td className="px-4 py-8" colSpan={colSpan}>
        <div className="flex justify-center">
          <Loading label={label} />
        </div>
      </td>
    </tr>
  );
}
