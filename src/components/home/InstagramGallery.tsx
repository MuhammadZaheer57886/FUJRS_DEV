import { INSTAGRAM } from "@/lib/social";

const images = [
  {
    alt: "A high-quality Instagram photo of a fashion influencer in a busy Lahore street, wearing a stylishly stitched suit.",
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuCsL97LGoxsccr-WC9AcFBimScvUfpjl2aZEybENpM9nUZpT8cU9aPNmcIyLo3QkyG824f1TkyrD7NlS-SmoKjS552VlUOJOFHTilSyeYZF4TUhrUqXiQUqaTY7AFznfoaBP1KYOnxO0lxe0yUolJNm1t55c4G5TaiViC63X3DCZWuoMb6KuYQiRhHxWBuRBRujBTPv-vqKm75lSeF7oFIP058j7qAFeM5sfm3VBgW3TH4v6UZmpBwx811SrEep8jlsFbi5iMpkvVU",
  },
  {
    alt: "Close up shot of a person's hands holding a premium gold-embossed shopping bag.",
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuAol7gqUm1fe5avlzt221BWCqtPCiBu0ccciVNI-1sfttZP8hSdvcd-_xq9faALGiFBp_99qH-CcKeBcP1cBAqJnMkwTOtkHEZhL3LuUhydcONVS5ukqHAPGooZNyrhL5MnVyPVFLTR8aYI9nQWGafvT8LBd5wnpq4mOrXrs9cJaPFEk2CMmQB0zi-mc5r7ckzl1w4yUYunKp5pX7W8zn8CGAauLaremwJYAsOVqTyXNFV8LR3XPkIGYSbcv5PnJipLXBAWPluoToM",
  },
  {
    alt: "A minimalist flat-lay of unstitched fabric pieces, a sewing pattern, and a pair of vintage gold scissors on a white linen sheet.",
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuBzhpk8N-tN1Zpe9h7ZX1vPLsGQU8uweQmyHffNoKiATm0zWc8d4P1MvlW0fGac18YKMQog1ujC_axYG668CZLk0CeQTX6cWeZBqqfoGte_B7kiBb9dke8Kp8AVxPhxzR4i982_QtvOZSxPGb21OO5TDlclT0qhioJ2Cput6--P0sUFUKC8Q_IF7oWKZ04iG_q2Ybr3I9gUUwc3Hhf4464A0B770TBbEp_Fikrk9jDeAWevI6ZjtO3JRFe3S0Loi94VbHibf_2H-Ss",
  },
  {
    alt: "An editorial shot of two models walking in an orchard, wearing beautifully stitched traditional attire.",
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuD4Ln7YNQmsyGvZhBIiinjYQaBvmhbReQhjzvt-tqpfsCCrQVfSrDzecr054on2fnBCvE5fYmmwD54IKuIQJLuPGNe9ie39HSXih3ueSQ7HfnzwyfoEO-ARPfnTKxrzFB-lWlwfg864YEH1yUTTAkrng0MiLk92Sz8o7HdwvywckMkaiHbRzO5NgjETPLu0S25WYln6D4BVqSZE0M5OlTggXIOGuLNEclmk8llxkH-J_S-y_K_4-OFvwZkxfjQg9W4UpazybkWj75w",
  },
  {
    alt: "A macro shot of intricate thread work on a velvet cuff, showing the precision of the stitching and the shine of the beads.",
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuALMpA0cmwBK3KxwAQ4Ax4JDKjzgwWvcAAMGmO-x6r_-Sk-u3ZRQwdCqqtBncEv5S4TMHY5WTHcgIjR0PEv1ePsYHKpv3LKK7NHZBnx6EH1ZzIL1s0hsorz3RwZ3Hz5kr31wpl56QPHY79aCBvX3qqlm9obDA-c0-JgwCEHus9srr38H42cMsocP-MJjE-p_fADzTKG8zY5UimiIM7L9v64z5V4ij_Ye84DMG6csjDv5Tk4904IAUs7IGUK9KpFW3VibOH_vuH2xJs",
  },
  {
    alt: "A black and white cinematic shot of a designer sketching in a studio with large windows. Rolls of fabric are seen in the background.",
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuAxbghQOb_5DfdsMXRd1wAFq-9p276YovI845_V1LppAIF8PZIGXEjLZzu3q6TzY_DnQ1rZRzq3E6FrDcsI5VAjzMVLdfXGs9YgLGRkjEjfwS0DLMHJ3Cx8YGhgCmVzdtFZu0ZVVumKySCJGFlVfClr2OzfiSecBjJRE4fnllbgh3fR_XyBhMiShcQ9BgqWbbn-y9WS3H5muzRlgONIXEWIJo1BtVyu7brxM30Zn207vWoAocO1z68XrffW-GdLk7AN4oXV7bRUbtQ",
  },
];

export function InstagramGallery() {
  return (
    <section className="py-margin-desktop border-t border-outline-variant">
      <div className="max-w-container-max mx-auto px-gutter mb-12 flex justify-between items-end">
        <h2 className="font-headline-sm text-headline-sm">#FUJRS on Instagram</h2>
        {/* Rendered as plain text until the account exists. See @/lib/social.
            A link with nowhere to go is worse than no link. */}
        {INSTAGRAM.url ? (
          <a
            className="font-label-md text-label-md text-on-surface-variant underline underline-offset-4 transition-colors hover:text-primary"
            href={INSTAGRAM.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            {INSTAGRAM.handle}
          </a>
        ) : (
          <span className="font-label-md text-label-md text-on-surface-variant">
            {INSTAGRAM.handle}
          </span>
        )}
      </div>
      <div className="grid grid-cols-3 md:grid-cols-6 h-[400px]">
        {images.map((image, i) => (
          <div key={i} className="overflow-hidden cursor-pointer group relative">
            <div
              className="w-full h-full bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
              style={{ backgroundImage: `url('${image.src}')` }}
              role="img"
              aria-label={image.alt}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
