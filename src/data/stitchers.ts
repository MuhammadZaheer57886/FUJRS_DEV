export interface PortfolioItem {
  title: string;
  subtitle: string;
  image: string;
  span: "large" | "medium" | "wide" | "square";
}

export interface Testimonial {
  quote: string;
  author: string;
}

export interface Stitcher {
  id: string;
  slug: string;
  name: string;
  title: string;
  specialty: string;
  rating: number;
  leadTime: string;
  tier: string;
  badge?: "In-House Master" | "Top Rated";
  bio: string;
  image: string;
  // Full profile fields — only populated for the featured artisan (Master
  // Zaid / Khyber Artisans) per source; others show a lighter profile.
  experience?: string;
  location?: string;
  workshopNote?: string;
  portfolio?: PortfolioItem[];
  philosophy?: { title: string; body: string }[];
  testimonials?: Testimonial[];
}

export const stitchers: Stitcher[] = [
  {
    id: "s1",
    slug: "abdul-rahim",
    name: "Master Abdul Rahim",
    title: "Master Abdul Rahim",
    specialty: "Bridal Zardozi Master",
    rating: 4.9,
    leadTime: "4-6 Weeks",
    tier: "Premium Tier",
    badge: "In-House Master",
    bio: "Specializing in intricate gold-work and heavy bridal silhouettes for over 30 years. Formerly chief artisan for heritage houses.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuB_fLjvhvEiK7ywKbTprzmciOLjlMZo3XntDLT11vAIfysBK9DcFKi14Zr55or0Gal3Wr4XMYFYfD9_N7fcrjrw1hjrgrOr8CJdz63cSSI3HFLntIlfCETHrlNfzQJVqXWhofsvKalTPmcCLoRA4UO1w21ZNKXZWRQBsb3KTRFmN7Mst4QQTDr-5IERPf2BzhXwAGaD8R6U66FfwbdFAtN4UD5grxldarPpAmW9mn6FBri4ybmEsB1Y5jCZluZhX6ifliukbC5korg",
  },
  {
    id: "s2",
    slug: "zahra-mansoor",
    name: "Zahra Mansoor",
    title: "Zahra Mansoor",
    specialty: "Classic Kameez Specialist",
    rating: 5.0,
    leadTime: "10-14 Days",
    tier: "Boutique Service",
    badge: "Top Rated",
    bio: "Expert in minimalist, high-precision cuts for unstitched luxury fabrics. Renowned for the 'Invisible Stitch' technique.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCpJSp_4cAIPpfJx__Gx_R6wLFLh9GWfcVftJ39nHsIMZUdfKPPtzT4aJ6rI1EkMlGZmD9xu6sEaO_HW0VXPj5qUvqHj0ul5l_KQo4od8XbvqG8tiywj7epRHMlokHuPPQmHuDMs_XSmtyWvpE2FJO7TdV6Kb6yPgibhnGH_G05DAXVF_84CntJtpcQOXJTieFnN6r_1ZqvnM6spzmQUBFjbkeMUWzvojnuc8M-HdTLR550G7QnlM5IpAfUjP2OOLTa5r0Lqt6npWg",
  },
  {
    id: "s3",
    slug: "karim-and-sons",
    name: "Karim & Sons",
    title: "Karim & Sons",
    specialty: "Groom's Sherwani Expert",
    rating: 4.8,
    leadTime: "5-7 Weeks",
    tier: "Heritage House",
    badge: "In-House Master",
    bio: "Generational expertise in structured menswear. Specializing in bespoke sherwanis and prince coats with antique metalwork.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCrYF_RAqYVHtHucxaQw2qtUCXtnCflTPBJpRRO98ablSxQKl4WxqS8hd5g3mXl5cMd3SelK2Z1L-RGMBkaaFg_qcbVieH_0iJJ9Lid37HAjA2du0GmPTW904Z3jiFeuCxGj5_IywseWog2mR0Mx3ag1d9isFaa1hbNACb6OVkoPzu6MhjZqkWSs5Qi9hwjidWoZq9mwaob7v9HdHrVhskZHkO-BH9ZEQwYsbPZD7MNyElRAD8_tpnSShW0Mvsyu4mdrBiuQoMADyI",
  },
  {
    id: "s4",
    slug: "afshas-embroidery-hub",
    name: "Afsha's Embroidery Hub",
    title: "Afsha's Embroidery Hub",
    specialty: "Mirror-Work Specialist",
    rating: 4.7,
    leadTime: "3 Weeks",
    tier: "Artisanal Workshop",
    bio: "Bringing contemporary flair to traditional mirror-work. Known for festive wear and fusion silhouettes.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCMi2Jgk7RXB1YWSttKBEzsf78OnpmXEKdthiY00KavAvozs5oIZSaJZiKaDk2_sfxZSLXeHG9icODDrlWJuqG1ilWCg2ZWKW3OZ-LNu6sP6_CyCZAGXbo6cxi9jbqOdjKukJe6lkYAB_3m0XUW8bYW7HrNt71XQ8qiYEXzR-amghmSx82GDlA-4nCyF3bEjn1qzEPQUixV-D9Oz8IyHbcKkafM-Zr274KLsif0xU36-CbmHR_5fvPA4q8AI_PDTZLIiTY9MjS5RTU",
  },
  {
    id: "s5",
    slug: "khyber-artisans",
    name: "Master Zaid",
    title: "Master Zaid — Khyber Artisans",
    specialty: "Heavy Bridal & Archival Silhouettes",
    rating: 4.9,
    leadTime: "14-21 Business Days",
    tier: "Atelier Select",
    badge: "In-House Master",
    bio: "Master Zaid specializes in archival Pakistani silhouettes, ensuring every stitch preserves the architectural integrity of the fabric while modernizing the fit for your unique proportions.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCXKZDXXEfFZjuThjIP4napqerP78QeSgUzp9BoNvkT3JMy3YnFEXGrHC8_SvqKvqAnYCSrFWbesKQi0l-qUrE3XltCso0GVKG3wd0mRORl8DHoUa8QGgOl9TJ4LK7EBxODxUa75egwjvCXkjb8nlP7na-ZvXNFxqTlRozIpH6DIy4Z45eVP0AQbUfOsGuHFgd4uustLRxtHzdOfuiuVPXVX2RA_Pi19RiBBWmkdttU0uXrwyVwXmrX2HSdAB8ach40bLZsGjz0-X0",
    experience: "28+ Years",
    location: "Old Anarkali Atelier, Lahore",
    workshopNote:
      "Guardian of Lahore's Couture Legacy — Master Zaid leads a curated workshop of 12 master craftsmen in the heart of Anarkali, specializing in the intricate fusion of Zardozi and contemporary silhouettes.",
    portfolio: [
      {
        title: "The Royal Crimson Suite",
        subtitle: "Bridal Collection 2023 · 640 Work Hours",
        span: "wide",
        image:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuCAv1W2cQslrVYymruD7cFDkfdNjf8LtRuasYhB-wr3f1mxsLRNSuuXjKKjOmm92uQjXFcw52FaX3RmjN2lsh8aNirU_7mN6jTL6lKP9G_0cBtYq4vPVho98YQVZ0u3meckStVGfs-l-LDuucrxIZH9vuspRFyc9bwmIkbUF8017d7IUUuaccDAYDaV7_GS1JqPrkWXuiypC_lyFBSXUhtYVOmJtj8Y9MZiw6-Try1_9VFqRDMClOjD8EVl35rWPv7Ay08Xb5TMd1g",
      },
      {
        title: "Lavender Formal Pret",
        subtitle: "Luxury Lawn Series",
        span: "medium",
        image:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuAJyinrWAeoxBj0k5mb5UYGF9_3DpxEGYUpZ9nLkbu75FdgAfUz0EpNI8Tsb4nVpPSJX4E2vt50BCcBb7mjbKOeFjwhqXS1X8MUDY5gqucicdG3kaR3dT_WKq0OkRERLfjkFpxuutbEoxCI8_ViWsei6-LWX38E5f-8CQRAibVeFjBPrYpZydrmrYuwV3oj-kSIpC-s6FIrXO8WccZ8Q_eVmV16rcYxOJaHhk30yq8AaH70LZqUq4bFyZabvFDRNzm9uLDaWaqorcQ",
      },
      {
        title: "Groom's Sherwani",
        subtitle: "Signature Tailoring",
        span: "square",
        image:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuCB_2cDzC7qrQQbushRjjXhNfEichxCG4GBKa266ft6yMu2B9m9Rq_v8KnjaVX3ihIAhK3XQk6QT7Da2wFHQviRYouXyc-rGMM1YL-qFS0jBfdzf9Vgg7CdUpQnfkraov2_IYGQjgkoWiN1mBlr5ZVgBzoi6oxD8G3_jinKAh8eF9RxhDRIkdRc_aTi5goN6n4QFXvaXD3fgPwyhlzSRJfZlAEC0CMq675S3O7Slz5Fsr0IpKeTE71Kimd5d8M_-EYrW-vCP8GEu08",
      },
      {
        title: "Sahara Sunset Capsule",
        subtitle: "Creative Collaboration",
        span: "wide",
        image:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuCwPcWunIy5JiUfOWp93u8S_6g7RqPkcHJzj6FVmw3j0p8Jf9YZvlUdonqem8F2vCgOag9q98-11eFNs-jVHq06h6XUcOxFwhSxYwvyACqC353F2GceYEVqKkRjap-FfTo3u_Q4htjlPy2AypTfzZirvTr5rEBx35GRREgsBZeFlczNxMVa-d4XKg5d0ZvvWey4yhUYvCk-yJTZxTFymwrHEpGgodsg5Q_rRyBOQNEqNfaHVxKwP2-B8Y-oF0KXQPrsR1BiysP-jKY",
      },
    ],
    philosophy: [
      {
        title: "Heritage Anatomy",
        body: "Every stitch follows traditional principles passed down through generations, ensuring the structural integrity of heavy fabrics while maintaining fluid grace.",
      },
      {
        title: "Precision Tailoring",
        body: 'We utilize 24 unique measurement points to create a "bespoke map" for each client, guaranteeing a fit that is as comfortable as it is flattering.',
      },
      {
        title: "Final Flourish",
        body: "Each garment undergoes a rigorous 4-step quality inspection before receiving the Master Zaid seal of approval.",
      },
    ],
    testimonials: [
      {
        quote:
          "Master Zaid transformed my mother's vintage sari into a contemporary bridal masterpiece. His eye for detail and understanding of fabric movement is unparalleled.",
        author: "Sarah Khan, London",
      },
      {
        quote:
          "The fit of the Sherwani was absolute perfection. I didn't need a single adjustment after the first trial. Truly a master of the craft.",
        author: "Omar Ali, Dubai",
      },
    ],
  },
];

/**
 * Who a stitching job goes to when the customer hasn't picked anyone.
 *
 * Products don't name a stitcher — that's an operational assignment, not a
 * property of the fabric — so this is the fallback both the bag and the
 * bespoke configurator use.
 */
export const DEFAULT_STITCHER_SLUG = "khyber-artisans";

export function getStitcherBySlug(slug: string) {
  return stitchers.find((s) => s.slug === slug);
}
