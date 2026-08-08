// Where a shopper last visited from, and on what.
//
// Pure rules, no I/O (CLAUDE.md): the parsing takes a user-agent string and
// the reads/writes live in /api/visits and the users adapter.
//
// A word on accuracy. User-agent strings are self-reported and every browser
// lies in one direction or another — Chrome claims to be Safari, Edge claims to
// be Chrome, and the whole string is trivially forged. This is display detail
// for a staff screen ("who was that, roughly?"), never an access decision. If
// anything ever needs to *depend* on the answer, this is the wrong source.

/** What a request tells us about the device that made it. */
export interface VisitSignature {
  browser: string | null;
  os: string | null;
  device: DeviceKind | null;
}

export const DEVICE_KINDS = ["Desktop", "Mobile", "Tablet"] as const;
export type DeviceKind = (typeof DEVICE_KINDS)[number];

/** The full picture stored against a user, as the dashboard reads it back. */
export interface LastSeen extends VisitSignature {
  at: string;
  city: string | null;
  /** ISO 3166-1 alpha-2, as the CDN reports it. */
  country: string | null;
}

/**
 * Order matters throughout: every Chromium browser carries "Chrome" in its
 * UA, and every one of them carries "Safari" too. So the specific tokens are
 * tested before the generic ones, and Safari is only Safari once Chrome has
 * been ruled out.
 */
const BROWSERS: { name: string; test: RegExp }[] = [
  { name: "Edge", test: /\bEdg(?:e|A|iOS)?\// },
  { name: "Opera", test: /\bOPR\/|\bOpera\b/ },
  { name: "Samsung Internet", test: /\bSamsungBrowser\// },
  { name: "Brave", test: /\bBrave\// },
  { name: "Firefox", test: /\bFirefox\/|\bFxiOS\// },
  { name: "Chrome", test: /\bChrome\/|\bCriOS\/|\bChromium\// },
  { name: "Safari", test: /\bSafari\// },
];

const OPERATING_SYSTEMS: { name: string; test: RegExp }[] = [
  // Before Android, which also contains "Linux".
  { name: "Android", test: /\bAndroid\b/ },
  { name: "iOS", test: /\biPhone\b|\biPad\b|\biPod\b/ },
  { name: "Windows", test: /\bWindows NT\b/ },
  { name: "macOS", test: /\bMac OS X\b|\bMacintosh\b/ },
  { name: "Linux", test: /\bLinux\b|\bX11\b/ },
];

function detectDevice(userAgent: string): DeviceKind | null {
  if (/\biPad\b/.test(userAgent)) return "Tablet";
  // "Android" WITHOUT "Mobile" is Android's own convention for a tablet.
  if (/\bTablet\b/.test(userAgent)) return "Tablet";
  if (/\bAndroid\b/.test(userAgent) && !/\bMobile\b/.test(userAgent)) return "Tablet";
  if (/\bMobi|\biPhone\b|\biPod\b|\bAndroid\b/.test(userAgent)) return "Mobile";
  if (/\bWindows NT\b|\bMac OS X\b|\bX11\b|\bLinux\b/.test(userAgent)) return "Desktop";
  return null;
}

/** Nulls rather than "Unknown": absent data is absent, and the UI says so once. */
export function parseUserAgent(userAgent: string): VisitSignature {
  if (!userAgent) return { browser: null, os: null, device: null };

  return {
    browser: BROWSERS.find((b) => b.test.test(userAgent))?.name ?? null,
    os: OPERATING_SYSTEMS.find((o) => o.test.test(userAgent))?.name ?? null,
    device: detectDevice(userAgent),
  };
}

/** "Chrome on Windows", "Safari on iOS", "Chrome", or null when nothing is known. */
export function formatDevice(signature: VisitSignature): string | null {
  const { browser, os } = signature;
  if (browser && os) return `${browser} on ${os}`;
  return browser ?? os;
}

/** "Karachi, PK", "PK", or null. */
export function formatLocation(city: string | null, country: string | null): string | null {
  if (city && country) return `${city}, ${country}`;
  return city ?? country;
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * "Just now" / "3 hours ago" / a date once it stops being useful as an
 * interval. Relative to `now` so this stays pure and testable.
 */
export function formatLastSeenAt(iso: string, now: Date = new Date()): string {
  const then = new Date(iso);
  const elapsed = now.getTime() - then.getTime();

  // A clock skewed forward would otherwise read as "-2 minutes ago".
  if (!Number.isFinite(elapsed) || elapsed < MINUTE) return "Just now";
  if (elapsed < HOUR) {
    const minutes = Math.floor(elapsed / MINUTE);
    return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  }
  if (elapsed < DAY) {
    const hours = Math.floor(elapsed / HOUR);
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  }
  if (elapsed < 7 * DAY) {
    const days = Math.floor(elapsed / DAY);
    return `${days} day${days === 1 ? "" : "s"} ago`;
  }
  return then.toLocaleDateString();
}

/**
 * How often a visit is re-recorded.
 *
 * The client reports once per full page load, which for a browsing session is
 * several times an hour. Writing each one would be a row update per navigation
 * for a column whose only consumer is a staff screen reading "roughly when".
 * Half an hour is fine granularity for that and cheap.
 */
export const VISIT_THROTTLE_MS = 30 * MINUTE;
