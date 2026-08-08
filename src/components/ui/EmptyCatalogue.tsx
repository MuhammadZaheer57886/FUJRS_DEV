// What a shopper sees where products would be, when there are none.
//
// Deliberately distinct from "no pieces match those filters". An empty
// catalogue is not a filter problem, and telling someone to clear filters they
// never set is the kind of small dishonesty that makes a site feel broken.

export function EmptyCatalogue({
  /** What isn't there yet, e.g. "new arrivals". Defaults to the whole shop. */
  what = "pieces",
  className = "",
}: {
  what?: string;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center border border-dashed border-outline-variant py-24 text-center ${className}`}
    >
      <span aria-hidden="true" className="material-symbols-outlined text-4xl text-outline-variant">
        checkroom
      </span>
      <p className="mt-4 font-display text-headline-sm">No {what} yet</p>
      <p className="mt-2 max-w-sm font-body text-body-md text-text-muted">
        The collection is being prepared. Check back shortly — new pieces are added as they leave
        the atelier.
      </p>
    </div>
  );
}
