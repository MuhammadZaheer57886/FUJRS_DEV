/**
 * The Supabase Storage host that serves product images.
 *
 * Derived from the project URL rather than hard-coded, for the same reason
 * `product_images.storage_path` holds a path and not a full URL (see that
 * column's comment): the project ref belongs in one place, so moving projects
 * or putting a CDN in front is an env change, not a code change.
 *
 * Absent while `NEXT_PUBLIC_DATA_BACKEND=local`, where nothing is served from
 * Storage — hence the filter below rather than a placeholder entry.
 */
function supabaseImagePattern() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return null;

  try {
    const { protocol, hostname } = new URL(url);
    return {
      protocol: protocol.replace(":", ""),
      hostname,
      // Only the public bucket path. Signed and authenticated object URLs are
      // not something next/image should be fetching on a visitor's behalf.
      pathname: "/storage/v1/object/public/**",
    };
  } catch {
    return null;
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Internal/demo deploys: don't fail production builds on existing lint debt.
  eslint: { ignoreDuringBuilds: true },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      // Transitional: the seeded catalogue photography still lives on the old
      // design-tool preview host. See the note atop supabase/seed.sql.
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      supabaseImagePattern(),
    ].filter(Boolean),
  },
};

export default nextConfig;
