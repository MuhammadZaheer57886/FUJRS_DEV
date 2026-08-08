// Where FUJRS is on social media. Pure config — no I/O.
//
// One place, so adding a real account is a one-line change rather than a hunt
// through components. A null URL means the account isn't live yet: the handle
// still renders (it's part of the brand), but as text rather than a link that
// goes nowhere. A dead `href="#"` is exactly what the "coming soon" convention
// in CLAUDE.md exists to prevent.

export interface SocialAccount {
  /** Shown to the reader, with the @. */
  handle: string;
  /** The profile URL, or null until the account exists. */
  url: string | null;
}

export const INSTAGRAM: SocialAccount = {
  handle: "@fujrs.luxury",
  url: null,
};
