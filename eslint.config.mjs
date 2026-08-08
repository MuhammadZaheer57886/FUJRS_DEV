import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript", "prettier"),

  {
    // What keeps the backend swappable: Supabase may only be imported inside
    // the adapter directory, and an adapter may only be reached through
    // "@/lib/data". Without this the boundary erodes one "just this once" at a
    // time, and by the time you want to move off Supabase it's threaded
    // through the UI. See BACKEND_SETUP.md §1.
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@supabase/*"],
              message:
                "Supabase belongs in src/lib/data/supabase/ only. Components import from '@/lib/data'.",
            },
            {
              group: ["@/lib/data/local/*", "@/lib/data/supabase/*"],
              message:
                "Import the chosen adapter from '@/lib/data', never an implementation directly.",
            },
          ],
        },
      ],
    },
  },

  {
    // The adapters and the middleware ARE the boundary, so they're allowed to
    // reach for the driver.
    files: [
      "src/lib/data/supabase/**",
      "src/lib/data/local/**",
      "src/lib/data/index.ts",
      "src/middleware.ts",
      // Route handlers are server-side boundaries in their own right: they do
      // the work the browser must not be trusted with, so they reach for the
      // admin client directly.
      "src/app/api/**",
    ],
    rules: {
      "no-restricted-imports": "off",
    },
  },
];

export default eslintConfig;
