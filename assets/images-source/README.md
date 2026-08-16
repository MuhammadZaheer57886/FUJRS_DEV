# Source photography

Full-resolution originals. **Not served** — this directory is outside
`public/` on purpose, because everything under `public/` gets its own public
URL, and originals there would be downloadable at full weight.

Drop originals here, then run:

```bash
npm run images
```

Each file becomes a WebP in `public/images/`, resized to at most 2880px wide
at quality 82. That is the width a full-bleed hero needs on a
high-density display; the quality is where embroidery and gold thread still
hold together, which is what this catalogue is selling.

Originals stay here and are **not** what the site serves. Re-encoding a
re-encode loses detail every time, so keep them.

## Expected names

The components reference these by path, so the names matter:

| File | Becomes | Used by |
|---|---|---|
| `home-hero.*` | `public/images/home-hero.webp` | `src/components/home/HeroSection.tsx` |
| `men-hero.*` | `public/images/men-hero.webp` | `src/app/men/MenCollection.tsx` |
| `men-hero-2.*` | `public/images/men-hero-2.webp` | `src/app/men/MenCollection.tsx` |

The men's hero cross-fades between `men-hero` and `men-hero-2`, in that
order — the list lives in `menHeroSlides` at the top of `MenCollection.tsx`.
Adding a third frame is a matter of dropping `men-hero-3.*` here and adding
one entry to that array.

## Deploying

`npm run build` does **not** run this script and does **not** generate these
files. `public/images/*.webp` must be committed — it is what the server
actually serves. Re-run `npm run images` and commit the output whenever the
photography changes.

Any extension `sharp` reads is fine (`.jpg`, `.png`, `.webp`, `.avif`) — only
the name before the extension is used for the output.
