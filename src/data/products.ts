// The hand-authored catalogue FUJRS shipped with.
//
// NOT the app's product type any more. Components read `CatalogItem` from
// `@/lib/data`; this array reaches them two ways, and only two:
//
//   * `src/lib/data/static/catalog.ts` maps it to CatalogItem for the `local`
//     backend, the same way an adapter maps a database row
//   * `scripts/generate-seed.mjs` turns it into supabase/seed.sql
//
// Nothing else may import it — a component reaching in here is a component
// that would stop seeing products the moment the catalogue moved to the
// database.

export type Gender = "Men" | "Women";

export interface Product {
  id: string;
  slug: string;
  title: string;
  fabric: string;
  category: string;
  gender: Gender;
  color: string;
  price: number;
  compareAtPrice?: number;
  images: string[];
  isNewArrival: boolean;
  description: string;
  sizes: string[];
  meters?: string;
  badge?: string;
  sku?: string;
  heritageStory?: string;
  embroidery?: string;
  dupattaInfo?: string;
  /**
   * Present when the piece can be sent for bespoke stitching, and the charge
   * for it. Which Master Stitcher takes the job is an operational assignment
   * made later, never a column on the product.
   */
  stitchingAddOn?: number;
}

// Exact image URLs from the source Stitch homepage/PLP screens
// These are the design tool's own preview asset host — kept for fidelity per
// your "use the pages exactly" instruction, but flagging: this host is meant
// for design previews, not guaranteed long-term production hosting. Worth
// swapping to your own asset storage (Vercel Blob / Cloudinary / S3) before
// going live.
const src = {
  emeraldSilk:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuC153973zitgI_swm-jOPmrKtVPJMqxoanaxWcyKjhqUyNqRpAdq4wakT6KCJgJeaY93n80UCxDu3We6SpDREiq3ajxFTX_AogQ-dXkg8zIz-a1moTSgqPCWn1CRra0V9o2pIA2wGolQoFlg3i1FcDxjLyKwX0kiewfQLo_HmQXT71Pzp61fc-JFIcZQ5H16ZQXxAdmkdu4lGuNcDC88zYOBV8B4eFmX2bza_DYmQPejWdMbEY7XyJp3HuZXM4Zzz598xLjsF4qVkA",
  midnightZardozi:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuBqNyA7FBck-mIRJdim0pHDmtQn0zBNiGabk-IaCZ_emUukwkBXj2lj0Yo4UHw76rD9QDTU-XXSrr_BbO0w9oY2YK8SjIme0HWX7Df2GPkabV4oD9wq2liXg5nAWjMnmwvXtauQBgvbBGnM8lE7EqoE7OtVAhE0v-tVRKvGqXcs2sTzWMaIWu9zfxN_P-whCH4FSTbThndM7eeloTlbJi2e7l3CJ_Dv1Fr6BPQ60j4vV500Wc8OzzfemjW0KomH2bLk77rwUPH1BKc",
  blushPearl:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuDjOIChU7Ii8clI2padoRKIUCrk36xdQEeCM7iMEhm-o8cw2TbbnGtw62JhtBR66vZuLKZHp61yn6oRPJrb-gC101fcBSdWFRXDlJ1410Fp-B_uBcI1DhffqTJrm1X-oqYe91PlcKnOvP1cQ-5Kbn6D0fbmDBvGqGWNWhqOH8FYVKmoxdbkWBK_LE_WSC-fq9qdlF13E4xUrDPnKH7ACQuC0e0W7JEu2vz5kaSY8OpCSIHCq5nmToI6-ZWvB7KFYfSDqD3F8CYcvGM",
  ivoryKarandi:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuArYc4kTayTOl0OYDvrvWsNdVC4F42Hnu53PCOlzcU2QO5LlyXE594gujgpS0qMvXHlj-j7LbXK4cMlWdis_NQnfBwq2cHIfI_WBlww6f0J-mRt6KkrfqXFFZSLvDDBT1qREmcftGqEcEtRUudO53Hf2bR2qX2NQL8KcqTrpKb7X4DE6NUMFROBlqnhviiTp2u6QKNLR86JcXCA9-6Q3YsnLdR8GVhiuQZX6bFiToNWwVt4bGUI3kCw_vvU6sxdDeMhnD_jwyHn0RY",
  // Men's Atelier (source: men_s_unstitched_collections_elan_fabrics)
  giza87:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuCT1Ge9S1sQF1vbqtlcbc5PfUy9-XefPG6ygirHZNFNAGW9c6q8yMON7sz5BmXJDuCwJC86ZOfwWJGKn84220her2MXTt5ykVQ3HUGhDqQLpkPBZOCqmURvxSkDZBVJTLsIb5tw1neD9z_e140JZvE_GnlskGhxEOE0vKydbSErVH4kS3Gjd8zjL7YO7QGP7MxTiHCg6CSuiXbla8uJ8zpgL8c4zDwq959PR7Ov0XuKaGrW6GGv3oYpj9_znSJFSaU-ahrLRnhHe6U",
  indigoLatha:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuBSttI1AW1CdmU9K8fXO8FnHdNL7LUyECuB0ASsf00qNURqf4mCJBc7obV5J2Ga1619P403hmMW5AsQOc3hKJPM2lcMd5TgA5TdzVmJY_L4b-nXJ4PYQL2mKBYeq4kqecmhwTxVQpppLSjGfoiZt4jQDcfuitDpdDAB_I5XlmrxaFpMV03RVdcH8gPQ-unAUzjf6Yjfr9UgZeQUbRr9zO5KDljGaTr5SiKaDjMPwsVXKk-O23eMVNMkGC6dbbig44pqFdVb9j9DIvk",
  winterKarandi:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuAtLWLnPSlOsf8xIWiedMxy6qsRfjYlJSdI98yGH0HploJm_t2186QEBeyA4USGjP5VtzUEob_zdvnClITXm1hJjI-5--8hzHYYWDzgTSbqnqPaebdGOs_tBIDnemLyTC8hiKLUstLU2E8O383JYj8FJMb7_Mj_XjNMjGQ8erbc5rSeOYTXtGatSzKMuyAB2EBNGggWLdLNwtELsQx8jpLgL4hca9PNAQPhWr84foXOgZTNsq3mkvndIpGLNkdYus4bkrmsP5qcqSA",
  liquidMicrofiber:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuACQ_tku3fJjKQXukJUDTFSgZxU1Pi-zIA2HsVmLQBUY5gYjcXKoWBpVtGTuFc9tkipcs9KmtiwOXUha4RqgWvJj9W5LOV2i50m3w18NsXzw3ZoeChFogLHxJGAnehzBRUQ-pXRvi8HApOTAFuPrtgX-NPlyyLDoTba9xW9DiM395U0SIDlHnepUsSkOp8T_Sx-Fsdqj3cxNQB-MJI2iCkrKS8YKw1WVFA-AKPUOCzrgZQUAinUXG_wctD1Y8q-_vG1kzGVZQ8bJC4",
  emeraldSelfPrint:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuBXMWLr_Gz9s2oNwzKUBPT_uuD_nemfvioj3retGJ_NrqqBTe3qO7bgJJPY7K0IClehgrUru7MgAHkc8c28-BlxSedctO8XMBRSF_WaTHj0LKSKB7VP4wRp3Pccy0tUMTm33BIBOnErDUTMf0HiFhqkaJtMCMl4dL1kg3kaW8fGkrWy1kM3N1pdbwVJGmw4D8wDs_1T6sE6UfwGMITz9ZWB23UAFVymdvnyAyIx_o8adf6wDkKxY5y0iwLyK5pU7WVUI9hEt5QXgyM",
  // Women's Jardin Edit (source: women_s_unstitched_collections_elan_fabrics)
  aurelianGoldSilk:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuC6ORLxzwGZB4Z857isjTujgORVSRk9WdjOzLM9ae819i_yF36VFwom2kLtYeV2QorN2HhJV9lGqd5uak2ktAbmMiI1CUuLrUCGG8zK5tcTH2DO0pQrEYB1Tm2UX3uJ52NXUsAJSsXOe-PrB-NIWifchoCbamdmXOirJfUaXlHpWJQnDQr5DlJgY-QJMVC1J36Kpb7CJq825w_7Zwqe6vASdCLYrjScinrMpIcMCnmFzgY2I8U-UcFQqUn4RJioPczVPUe04TTqnT4",
  noirEleganceLawn:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuDDtLXmpEUmwz5bpffqXBGrKFry7lrFz9M8LsJsn3H_HtE3KxZP1KjVCM27Aj-TUR43rf1AwjJDIkZWpK_94TCoiadGtpZUOHJE0QXu_zg4_62OvQ35ghSGXIl90mcOOuElMf2VdE5UzQrh58goloqqn8LDzMqaCEQIASWLxkCEyYQmMtrf670aVu-NNjCs1PskTr0yM6LFqQOcEEfhiHLUSqE9NqNUF-Cj4qevQnanavFIwOu7qpX0ChVRNeCyTWYeKmq2ROwypiY",
  celestialBlueChiffon:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuDdh87HWDsPO38bo1fV8MVzvic8AOkxYA316FZsKLeBsZZq61I0UXfOPnm14_JxtWJFy3zsaPGIe56Cy8i_ZgQEXZLaFmRLXIk5hSkrtkY5uz8QyTHNSOxbFm_lXjVp7sdINcFscrIxM_DvcUty-nNMpHdDjTSk-GSDAcwc2hA-bpdSUuFLrW40q-5PhEiKBccXkJYhSelp5JSOkFOD7dWF2OUBDGpAKWgroMOX1I7FmN10PKrQ2WUnqxxdMyfPDlZaLJWAa_T5OUI",
  oliveTillaEmbroidery:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuC6Bi5TM_A7xXE9_nlHxB_bIp10NfUapBqs3-Uu8zQgPZ5FbPSwyuIaCuXbPogZ3iNST5lVSZ3UUNCuxR299CTRZdInYStKLCeQ9OxdC1eLTTLPg0JeZQRTwPslCAeH63MRTPB2UmZRFdDcBVz2Zr4YiHYazenHYTEeqncB-g1rQK1Oe14pAz_BYLQ8XyE2VCoXDyu0KVbm0CoUgUveOf7K06GIaXBDnfpW8sItip4YJgG_cnA0CsWqwqij4NwbPyUBAB-WwEJb5B4",
  ivoryPearlNet:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuCqB_8s8I4DKMHJ7VdNFjsLzvSFAPQubk15oeP863Qrt7f3sGpPETxzm94PNlxqhenw9JzdKlhGkHt5SY4LtgwPTg8Bk0t4GAmIWcAjNAucwTC3JfqVbjs0BozUNrAXQqVBTKYKvNYnG0X38iUP9CPoPeCSU0t-dYioQFDo6rZHI-2re4ie54e0yKLhzIPRYi3mTaXCqUu2x28klT_jbQRfUV7XHRcpJ0HOPIlMZkZxYP6O6m1bqxKO82JKl8xlNGws1bIVpaitsZs",
  // Aurelian Gold — dedicated PDP gallery (source: silk_embroidered_unstitched_pdp_detail_view)
  aurelianGoldDrape:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuAXsQm1EwULybG7vLT6BnXBgjzgq0q3St9SNhhIpmKJHzbtbOu_wcoJs67g4JSwr-JeKusviR7pTcIWfzF9NEkp_8yiWYyGstxAy5VODUvn1PX_eg47dgNF8uYqdirD3KKsOSbPTX1S4y3cc3G6awZzT4ekNxUYLxgymq6MUXIKXHcS-oOiff-yGVFH9i1xC_FtGDOrd3JJB9WdI1X7C2PtfCtmXO0egAB3K1DXjkA1xE0uLl22vXNK-Di8k4QkJh7dszEmf1I_XOw",
  aurelianGoldMacro:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuDroIAVaEflsJsKqOB-SGV3vmrILZf4UuB-oNl5vAiy0sWzA25w-TySCanwUNg8BELd9JA_DcmBFWNQFVeujgXBx0dU7AzpgHyNGFhZSpA2uP4ssUom3J7sReIf9iJO_kUbCEjzjpwfy_WfJTY16HDgP4Ztib2gfHqgv2U4qc13cK-4sP7isRPD877E5o1qZJpqhxXGHiKdAhtRxZ0iBsJwM16gZYijv0ZUOHh8UpBnAeJmJgtLhwzSaWg3bV6sHVpqvrkUaGJ4d_Q",
  aurelianGoldLifestyle:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuAm7taCbrmAPS52jvfiq75nkC7m8JAZys9-y1gKKLSIwPxdeUZmhUGUnJB3Fz53jZYR_UiTWFxznpY19sf16bKXWEsf9mpvYokplbfWOuNXAdZArAwO_mo5Fc4b5Uv8bj7iB3B7mvxkZZM3quvFnC8v1nBzXTB7wlirknPLjA_T6STpCBOJIve6K7lSAeZwabV8b0sPB3KhTRaaBtcNrdLVAvqh44fYZKK0tYV0pkNiUvWF4vbd_HhPPQksxgEWfNz5EZ6zh0HXLTo",
  // Complete the Look — accessories (source: same PDP file)
  khussa:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuD2VcNYHnxImQvjpDcxjn0so_tcNwzwUEvYLPnKVILxy8H1JfrRaBZqi3VOcaAjA9tPTKW_ruSxH8JhKBmVQqGyebkJAFIVtCWkK8MxzX0CxvJffceY06TkVV-NejMbN2JizaroU-8rx8hqF4El7Mpzd_ETtLqUL5cp9xhivTh6ZxmXfUY3X50NuxP99JkWniHDh3EnWdXlKWNMPQ-gecMpweATOevbWgJ1TRP3B3ufHONiBKUERMKTRA3OzpRrAeLYX_ASkxxOjeo",
  chandbali:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuC8LBZkNztJe09ZssecQdgXcbU6ETs5Wxd4qsx6wlbdjHh3x0TeVy3RuHXFXQpGKGy4LC2APzFMLw7CIHV4OBmKcZU8UiCM1ZD3vNUmEBHRc9wXcSUJXDBrANLtC6Vj9Y11qi3By2A_wxZ27wz97skJqSF4aH349yfUYmH0UvITOXbildMdDHMbI7SXKwbO2_u-5x2p2dB4bUVx9pxZMws9OyezyI-ttyTDapMVYRjY8FkbjOQ8YSU8komFKZwitkTqgMZ6McK9ILk",
  clutch:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuCJdBomWWQA1fHt7G1M9HLy4EfPUvNV3uM3r-k0210P0eZv_Zzij8Lne1QunAHjiWwgGd8vZ46nsEOOE22iWYS4HMeAMaBuZ0pYHUj74ERBIhlHMgVt9N1FpNsc6DY8vNJnxH8qdv1rcASy49jx3T6ZEZefo_njbpPxpu7YXYBYBh8s0TiQR-_u7hIqVEY2ogWSJaWsdtBXirXZnuFODGhvSg5XaI5f4LTysLl93mnA-8RChgyVuCZkrBDBLxyemLxRTiQAwU9OgUk",
  pashmina:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuAzh7DrFWF5l_2rm44V6IkLP0BJhbwFHJOp7F1NAYSNLndZci8LLkfubhvfFreKD3cy4xEeowdpaCH3Pcblo27AyZhYrI1hYXl2AG6KE7nNLauAdTz7G6YOEEciSU_PfdD6O0JFzKC52HLwQVPX_XG7-4z4bnj_GxNdjGKmgKwLqagRKcvf9KmULe6ADnEfIxLwEOnDVPvP3V5crLUhc3z9DifXmjOg4A1GKMT3jjOcVNvnI8qs0BmN01Ts_NktbKXZkfEgknUZdSY",
};

export const products: Product[] = [
  // --- Homepage "New Arrivals" — exact match to source (names/prices/images).
  // Source attributed each piece to an external designer (Faraz Manan, Elan,
  // Zara Shahjahan, Ismail Farid) as part of the marketplace concept you
  // excluded — dropped those credit lines, kept everything else.
  {
    id: "p1",
    slug: "emerald-silk-unstitched-set",
    title: "Emerald Silk Unstitched Set",
    fabric: "Raw Silk",
    category: "3-Piece Suits",
    gender: "Women",
    color: "Emerald",
    price: 45000,
    images: [src.emeraldSilk],
    isNewArrival: true,
    description:
      "An unstitched three-piece suit in emerald green raw silk with heavy gold tilla work on the neckline and sleeves, paired with a diaphanous scalloped-edge organza dupatta.",
    sizes: ["Unstitched"],
  },
  {
    id: "p2",
    slug: "midnight-zardozi-velvet",
    title: "Midnight Zardozi Velvet",
    fabric: "Velvet",
    category: "3-Piece Suits",
    gender: "Women",
    color: "Midnight Blue",
    price: 62500,
    images: [src.midnightZardozi],
    isNewArrival: true,
    description:
      "A midnight blue velvet shirt piece with heavy silver zardozi embroidery, matching silk trouser piece, and a net dupatta with silver sparkle motifs.",
    sizes: ["Unstitched"],
  },
  {
    id: "p3",
    slug: "blush-pearl-organza",
    title: "Blush Pearl Organza",
    fabric: "Organza",
    category: "3-Piece Suits",
    gender: "Women",
    color: "Blush",
    price: 38000,
    images: [src.blushPearl],
    isNewArrival: true,
    description:
      "Soft blush-colored organza with delicate 3D floral appliqués and pearl beadwork, sheer and light with graceful movement.",
    sizes: ["Unstitched"],
  },
  {
    id: "p4",
    slug: "ivory-karandi-suiting",
    title: "Ivory Karandi Suiting",
    fabric: "Karandi",
    category: "Formal Suiting",
    gender: "Men",
    color: "Ivory",
    price: 12900,
    images: [src.ivoryKarandi],
    isNewArrival: true,
    description:
      "Classic off-white karandi fabric with a subtle geometric self-weave, presented with premium obsidian buttons for a modern, architectural finish.",
    sizes: ["Unstitched"],
  },

  // --- Men's Atelier (source: men_s_unstitched_collections_elan_fabrics)
  // "Sold by FUJRS" kept (single-brand friendly); dropped "Verified" badge
  // on one card since it implied third-party marketplace verification.
  {
    id: "p5",
    slug: "supreme-egyptian-giza-87",
    title: "Supreme Egyptian Giza 87",
    fabric: "Egyptian Cotton",
    category: "Kurta Fabric",
    gender: "Men",
    color: "Signature White",
    price: 14500,
    images: [src.giza87],
    isNewArrival: false,
    description:
      "Premium Egyptian Giza 87 cotton with a subtle, elegant sheen and a fine weave. Our signature white, 4.5 meters.",
    sizes: ["Unstitched"],
    meters: "4.5 Meters",
    badge: "Sold by FUJRS",
  },
  {
    id: "p6",
    slug: "indigo-latha-reserve",
    title: "Indigo Latha Reserve",
    fabric: "Latha",
    category: "Kurta Fabric",
    gender: "Men",
    color: "Deep Navy",
    price: 8900,
    images: [src.indigoLatha],
    isNewArrival: false,
    description:
      "Deep navy Latha fabric, folded and finished for a modern, masculine wardrobe staple.",
    sizes: ["Unstitched"],
    meters: "4.5 Meters",
    badge: "Sold by FUJRS",
  },
  {
    id: "p7",
    slug: "winter-karandi-deluxe",
    title: "Winter Karandi Deluxe",
    fabric: "Karandi",
    category: "Kurta Fabric",
    gender: "Men",
    color: "Slate Gray",
    price: 12200,
    images: [src.winterKarandi],
    isNewArrival: false,
    description: "Textured slub-weave karandi in slate gray, cut for winter formalwear.",
    sizes: ["Unstitched"],
    meters: "4.0 Meters",
  },
  {
    id: "p8",
    slug: "liquid-microfiber",
    title: "Liquid Microfiber",
    fabric: "Wash & Wear",
    category: "Formal Suiting",
    gender: "Men",
    color: "Off-White",
    price: 7500,
    images: [src.liquidMicrofiber],
    isNewArrival: false,
    description:
      "Wrinkle-resistant microfiber with a liquid-like drape, off-white, for effortless formal wear.",
    sizes: ["Unstitched"],
    meters: "4.5 Meters",
  },
  {
    id: "p9",
    slug: "emerald-self-print-cotton",
    title: "Emerald Self-Print Cotton",
    fabric: "Cotton",
    category: "Kurta Fabric",
    gender: "Men",
    color: "Forest Green",
    price: 10800,
    images: [src.emeraldSelfPrint],
    isNewArrival: false,
    description:
      "Deep emerald cotton with a subtle self-print pattern, for a refined everyday look.",
    sizes: ["Unstitched"],
    meters: "4.5 Meters",
  },

  // --- Women's Jardin Edit (source: women_s_unstitched_collections_elan_fabrics)
  // "Sold by ELAN Official" → "Sold by FUJRS"; "Verified Seller" label
  // dropped (marketplace signal), other labels (Best Seller, Official
  // Store, etc.) kept since they're not marketplace-specific.
  {
    id: "p10",
    slug: "aurelian-gold-unstitched-silk",
    title: "Aurelian Gold Unstitched Silk",
    fabric: "Pure Raw Silk (80gm)",
    category: "3-Piece Suits",
    gender: "Women",
    color: "Gold",
    // Source discrepancy: the PLP listed this at PKR 28,500 but the
    // dedicated PDP (silk_embroidered_unstitched_pdp_detail_view) lists
    // PKR 48,500 with a full spec sheet. Treating the PDP as authoritative
    // since it's the more detailed, single-purpose source.
    price: 48500,
    images: [src.aurelianGoldDrape, src.aurelianGoldMacro, src.aurelianGoldLifestyle],
    isNewArrival: false,
    description:
      "Ivory embroidered silk with metallic tilla embroidery and pearl embellishments, draped over a minimalist boutique display.",
    sizes: ["Unstitched"],
    badge: "Sold by FUJRS",
    sku: "FJ-UNS-AG882",
    embroidery: "Gold Tilla, Zardozi, Sequins",
    dupattaInfo: "2.5 Meters Organza with Border",
    meters: "4.5 Meters (Standard Suit)",
    heritageStory:
      "The 'Aurelian' weave draws inspiration from the royal courts of the 17th-century Mughal era. Hand-woven on traditional looms in Banaras, this raw silk base undergoes a unique gold-dipping process before being meticulously embroidered by fourth-generation artisans. Every stitch tells a story of perseverance and refined luxury.",
    stitchingAddOn: 12500,
  },
  {
    id: "p11",
    slug: "noir-elegance-lawn",
    title: "Noir Elegance Lawn",
    fabric: "Lawn",
    category: "2-Piece Suits",
    gender: "Women",
    color: "Black",
    price: 14900,
    images: [src.noirEleganceLawn],
    isNewArrival: false,
    description: "Black embroidered lawn with crisp white threadwork across the neckline.",
    sizes: ["Unstitched"],
    badge: "Best Seller",
  },
  {
    id: "p12",
    slug: "celestial-blue-chiffon",
    title: "Celestial Blue Chiffon",
    fabric: "Chiffon",
    category: "2-Piece Suits",
    gender: "Women",
    color: "Pastel Blue",
    price: 18200,
    images: [src.celestialBlueChiffon],
    isNewArrival: false,
    description:
      "Pastel blue chiffon with a shimmering beaded floral vine pattern in silver thread.",
    sizes: ["Unstitched"],
    badge: "Official Store",
  },
  {
    id: "p13",
    slug: "olive-tilla-embroidery",
    title: "Olive Tilla Embroidery",
    fabric: "Lawn",
    category: "2-Piece Suits",
    gender: "Women",
    color: "Olive Green",
    price: 22500,
    images: [src.oliveTillaEmbroidery],
    isNewArrival: false,
    description:
      "Olive green fabric with heavy golden border embroidery, for a warm-toned festive look.",
    sizes: ["Unstitched"],
    badge: "Premium Collection",
  },
  {
    id: "p14",
    slug: "ivory-pearl-net",
    title: "Ivory Pearl Net",
    fabric: "Net",
    category: "3-Piece Suits",
    gender: "Women",
    color: "Ivory",
    price: 31000,
    images: [src.ivoryPearlNet],
    isNewArrival: false,
    description:
      "White-on-white embroidered net with a relief-like threadwork texture, sheer and delicate.",
    sizes: ["Unstitched"],
    badge: "Limited Edition",
  },

  // --- Accessories ("Complete the Look" on the Aurelian Gold PDP)
  {
    id: "p15",
    slug: "antique-gold-zardozi-khussa",
    title: "Antique Gold Zardozi Khussa",
    fabric: "Leather & Zardozi",
    category: "Footwear",
    gender: "Women",
    color: "Gold",
    price: 8500,
    images: [src.khussa],
    isNewArrival: false,
    description:
      "Handcrafted gold Khussa shoes with intricate Zardozi embroidery, complementing a luxury silk suit.",
    sizes: ["36", "37", "38", "39", "40"],
  },
  {
    id: "p16",
    slug: "mughal-pearl-chandbalis",
    title: "Mughal Pearl Chandbalis",
    fabric: "Gold-Plated Metal & Pearl",
    category: "Jewelry",
    gender: "Women",
    color: "Gold",
    price: 14200,
    images: [src.chandbali],
    isNewArrival: false,
    description:
      "Oversized gold Chandbali earrings with pearl drops, perfect for a bridal or formal look.",
    sizes: ["One Size"],
  },
  {
    id: "p17",
    slug: "gilded-silk-frame-clutch",
    title: "Gilded Silk Frame Clutch",
    fabric: "Silk",
    category: "Accessories",
    gender: "Women",
    color: "Gold",
    price: 12000,
    images: [src.clutch],
    isNewArrival: false,
    description: "A structured gold silk clutch bag with a traditional jewel-encrusted clasp.",
    sizes: ["One Size"],
  },
  {
    id: "p18",
    slug: "cream-needlework-pashmina",
    title: "Cream Needlework Pashmina",
    fabric: "Pashmina Wool",
    category: "Accessories",
    gender: "Women",
    color: "Cream",
    price: 28000,
    images: [src.pashmina],
    isNewArrival: false,
    description:
      "A fine Pashmina shawl in muted cream with intricate gold needlework at the borders.",
    sizes: ["One Size"],
  },
];

export function getProductBySlug(slug: string) {
  return products.find((p) => p.slug === slug);
}
