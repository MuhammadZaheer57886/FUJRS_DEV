-- FUJRS catalogue seed — GENERATED, do not edit by hand.
-- Regenerate: node --experimental-strip-types scripts/generate-seed.mjs
--
-- Idempotent: re-running updates rows rather than duplicating them.
-- Product ids are derived from the slug so they are stable across runs.
--
-- KNOWN EXCEPTION: product_images.storage_path is documented as a bucket
-- path, never a URL. These rows hold absolute lh3.googleusercontent.com
-- URLs, because the current catalogue photography lives on a design-tool
-- preview host and was never uploaded to the bucket. The adapter treats a
-- value starting with http(s) as an absolute URL and anything else as a
-- bucket path.
--
-- This is transitional. Those URLs already fail intermittently and will
-- break for good; replacing them with real FUJRS photography in the
-- product-images bucket is what removes this exception.

begin;

insert into products (
  id, slug, title, description, price_paisa, compare_at_paisa,
  category_id, fabric_id, fabric_weight_gsm, gender, color_id, badge_id,
  size_scale_id, sku, stock,
  is_new_arrival, stitching_eligible, stitching_addon_paisa,
  heritage_story, meters_length, meters_note,
  dupatta_length, dupatta_fabric_id, dupatta_finish,
  rating, review_count
) values (
  md5('emerald-silk-unstitched-set')::uuid, 'emerald-silk-unstitched-set', 'Emerald Silk Unstitched Set', 'An unstitched three-piece suit in emerald green raw silk with heavy gold tilla work on the neckline and sleeves, paired with a diaphanous scalloped-edge organza dupatta.',
  4500000, NULL,
  (select id from product_categories where slug = '3-piece-suits'),
  (select id from fabrics where slug = 'raw-silk'),
  NULL,
  'Women',
  (select id from colors where slug = 'emerald'),
  NULL,
  (select id from size_scales where slug = 'unstitched'),
  NULL, 25,
  true,
  false,
  NULL,
  NULL, NULL, NULL,
  NULL,
  NULL,
  NULL,
  NULL, 0
)
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price_paisa = excluded.price_paisa,
  compare_at_paisa = excluded.compare_at_paisa,
  category_id = excluded.category_id,
  fabric_id = excluded.fabric_id,
  fabric_weight_gsm = excluded.fabric_weight_gsm,
  gender = excluded.gender,
  color_id = excluded.color_id,
  badge_id = excluded.badge_id,
  size_scale_id = excluded.size_scale_id,
  stock = excluded.stock,
  is_new_arrival = excluded.is_new_arrival,
  stitching_eligible = excluded.stitching_eligible,
  stitching_addon_paisa = excluded.stitching_addon_paisa,
  meters_length = excluded.meters_length,
  meters_note = excluded.meters_note,
  dupatta_length = excluded.dupatta_length,
  dupatta_fabric_id = excluded.dupatta_fabric_id,
  dupatta_finish = excluded.dupatta_finish,
  updated_at = now();

delete from product_embroidery where product_id = md5('emerald-silk-unstitched-set')::uuid;
delete from product_images where product_id = md5('emerald-silk-unstitched-set')::uuid;
insert into product_images (product_id, storage_path, alt, position, width, height, mime_type)
values (md5('emerald-silk-unstitched-set')::uuid, 'https://lh3.googleusercontent.com/aida-public/AB6AXuC153973zitgI_swm-jOPmrKtVPJMqxoanaxWcyKjhqUyNqRpAdq4wakT6KCJgJeaY93n80UCxDu3We6SpDREiq3ajxFTX_AogQ-dXkg8zIz-a1moTSgqPCWn1CRra0V9o2pIA2wGolQoFlg3i1FcDxjLyKwX0kiewfQLo_HmQXT71Pzp61fc-JFIcZQ5H16ZQXxAdmkdu4lGuNcDC88zYOBV8B4eFmX2bza_DYmQPejWdMbEY7XyJp3HuZXM4Zzz598xLjsF4qVkA', 'Emerald Silk Unstitched Set', 0, 1600, 2000, 'image/jpeg');
delete from product_variants where product_id = md5('emerald-silk-unstitched-set')::uuid;
insert into product_variants (product_id, size, stock) values (md5('emerald-silk-unstitched-set')::uuid, 'Unstitched', 10);

insert into products (
  id, slug, title, description, price_paisa, compare_at_paisa,
  category_id, fabric_id, fabric_weight_gsm, gender, color_id, badge_id,
  size_scale_id, sku, stock,
  is_new_arrival, stitching_eligible, stitching_addon_paisa,
  heritage_story, meters_length, meters_note,
  dupatta_length, dupatta_fabric_id, dupatta_finish,
  rating, review_count
) values (
  md5('midnight-zardozi-velvet')::uuid, 'midnight-zardozi-velvet', 'Midnight Zardozi Velvet', 'A midnight blue velvet shirt piece with heavy silver zardozi embroidery, matching silk trouser piece, and a net dupatta with silver sparkle motifs.',
  6250000, NULL,
  (select id from product_categories where slug = '3-piece-suits'),
  (select id from fabrics where slug = 'velvet'),
  NULL,
  'Women',
  (select id from colors where slug = 'midnight-blue'),
  NULL,
  (select id from size_scales where slug = 'unstitched'),
  NULL, 25,
  true,
  false,
  NULL,
  NULL, NULL, NULL,
  NULL,
  NULL,
  NULL,
  NULL, 0
)
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price_paisa = excluded.price_paisa,
  compare_at_paisa = excluded.compare_at_paisa,
  category_id = excluded.category_id,
  fabric_id = excluded.fabric_id,
  fabric_weight_gsm = excluded.fabric_weight_gsm,
  gender = excluded.gender,
  color_id = excluded.color_id,
  badge_id = excluded.badge_id,
  size_scale_id = excluded.size_scale_id,
  stock = excluded.stock,
  is_new_arrival = excluded.is_new_arrival,
  stitching_eligible = excluded.stitching_eligible,
  stitching_addon_paisa = excluded.stitching_addon_paisa,
  meters_length = excluded.meters_length,
  meters_note = excluded.meters_note,
  dupatta_length = excluded.dupatta_length,
  dupatta_fabric_id = excluded.dupatta_fabric_id,
  dupatta_finish = excluded.dupatta_finish,
  updated_at = now();

delete from product_embroidery where product_id = md5('midnight-zardozi-velvet')::uuid;
delete from product_images where product_id = md5('midnight-zardozi-velvet')::uuid;
insert into product_images (product_id, storage_path, alt, position, width, height, mime_type)
values (md5('midnight-zardozi-velvet')::uuid, 'https://lh3.googleusercontent.com/aida-public/AB6AXuBqNyA7FBck-mIRJdim0pHDmtQn0zBNiGabk-IaCZ_emUukwkBXj2lj0Yo4UHw76rD9QDTU-XXSrr_BbO0w9oY2YK8SjIme0HWX7Df2GPkabV4oD9wq2liXg5nAWjMnmwvXtauQBgvbBGnM8lE7EqoE7OtVAhE0v-tVRKvGqXcs2sTzWMaIWu9zfxN_P-whCH4FSTbThndM7eeloTlbJi2e7l3CJ_Dv1Fr6BPQ60j4vV500Wc8OzzfemjW0KomH2bLk77rwUPH1BKc', 'Midnight Zardozi Velvet', 0, 1600, 2000, 'image/jpeg');
delete from product_variants where product_id = md5('midnight-zardozi-velvet')::uuid;
insert into product_variants (product_id, size, stock) values (md5('midnight-zardozi-velvet')::uuid, 'Unstitched', 10);

insert into products (
  id, slug, title, description, price_paisa, compare_at_paisa,
  category_id, fabric_id, fabric_weight_gsm, gender, color_id, badge_id,
  size_scale_id, sku, stock,
  is_new_arrival, stitching_eligible, stitching_addon_paisa,
  heritage_story, meters_length, meters_note,
  dupatta_length, dupatta_fabric_id, dupatta_finish,
  rating, review_count
) values (
  md5('blush-pearl-organza')::uuid, 'blush-pearl-organza', 'Blush Pearl Organza', 'Soft blush-colored organza with delicate 3D floral appliqués and pearl beadwork, sheer and light with graceful movement.',
  3800000, NULL,
  (select id from product_categories where slug = '3-piece-suits'),
  (select id from fabrics where slug = 'organza'),
  NULL,
  'Women',
  (select id from colors where slug = 'blush'),
  NULL,
  (select id from size_scales where slug = 'unstitched'),
  NULL, 25,
  true,
  false,
  NULL,
  NULL, NULL, NULL,
  NULL,
  NULL,
  NULL,
  NULL, 0
)
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price_paisa = excluded.price_paisa,
  compare_at_paisa = excluded.compare_at_paisa,
  category_id = excluded.category_id,
  fabric_id = excluded.fabric_id,
  fabric_weight_gsm = excluded.fabric_weight_gsm,
  gender = excluded.gender,
  color_id = excluded.color_id,
  badge_id = excluded.badge_id,
  size_scale_id = excluded.size_scale_id,
  stock = excluded.stock,
  is_new_arrival = excluded.is_new_arrival,
  stitching_eligible = excluded.stitching_eligible,
  stitching_addon_paisa = excluded.stitching_addon_paisa,
  meters_length = excluded.meters_length,
  meters_note = excluded.meters_note,
  dupatta_length = excluded.dupatta_length,
  dupatta_fabric_id = excluded.dupatta_fabric_id,
  dupatta_finish = excluded.dupatta_finish,
  updated_at = now();

delete from product_embroidery where product_id = md5('blush-pearl-organza')::uuid;
delete from product_images where product_id = md5('blush-pearl-organza')::uuid;
insert into product_images (product_id, storage_path, alt, position, width, height, mime_type)
values (md5('blush-pearl-organza')::uuid, 'https://lh3.googleusercontent.com/aida-public/AB6AXuDjOIChU7Ii8clI2padoRKIUCrk36xdQEeCM7iMEhm-o8cw2TbbnGtw62JhtBR66vZuLKZHp61yn6oRPJrb-gC101fcBSdWFRXDlJ1410Fp-B_uBcI1DhffqTJrm1X-oqYe91PlcKnOvP1cQ-5Kbn6D0fbmDBvGqGWNWhqOH8FYVKmoxdbkWBK_LE_WSC-fq9qdlF13E4xUrDPnKH7ACQuC0e0W7JEu2vz5kaSY8OpCSIHCq5nmToI6-ZWvB7KFYfSDqD3F8CYcvGM', 'Blush Pearl Organza', 0, 1600, 2000, 'image/jpeg');
delete from product_variants where product_id = md5('blush-pearl-organza')::uuid;
insert into product_variants (product_id, size, stock) values (md5('blush-pearl-organza')::uuid, 'Unstitched', 10);

insert into products (
  id, slug, title, description, price_paisa, compare_at_paisa,
  category_id, fabric_id, fabric_weight_gsm, gender, color_id, badge_id,
  size_scale_id, sku, stock,
  is_new_arrival, stitching_eligible, stitching_addon_paisa,
  heritage_story, meters_length, meters_note,
  dupatta_length, dupatta_fabric_id, dupatta_finish,
  rating, review_count
) values (
  md5('ivory-karandi-suiting')::uuid, 'ivory-karandi-suiting', 'Ivory Karandi Suiting', 'Classic off-white karandi fabric with a subtle geometric self-weave, presented with premium obsidian buttons for a modern, architectural finish.',
  1290000, NULL,
  (select id from product_categories where slug = 'formal-suiting'),
  (select id from fabrics where slug = 'karandi'),
  NULL,
  'Men',
  (select id from colors where slug = 'ivory'),
  NULL,
  (select id from size_scales where slug = 'unstitched'),
  NULL, 25,
  true,
  false,
  NULL,
  NULL, NULL, NULL,
  NULL,
  NULL,
  NULL,
  NULL, 0
)
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price_paisa = excluded.price_paisa,
  compare_at_paisa = excluded.compare_at_paisa,
  category_id = excluded.category_id,
  fabric_id = excluded.fabric_id,
  fabric_weight_gsm = excluded.fabric_weight_gsm,
  gender = excluded.gender,
  color_id = excluded.color_id,
  badge_id = excluded.badge_id,
  size_scale_id = excluded.size_scale_id,
  stock = excluded.stock,
  is_new_arrival = excluded.is_new_arrival,
  stitching_eligible = excluded.stitching_eligible,
  stitching_addon_paisa = excluded.stitching_addon_paisa,
  meters_length = excluded.meters_length,
  meters_note = excluded.meters_note,
  dupatta_length = excluded.dupatta_length,
  dupatta_fabric_id = excluded.dupatta_fabric_id,
  dupatta_finish = excluded.dupatta_finish,
  updated_at = now();

delete from product_embroidery where product_id = md5('ivory-karandi-suiting')::uuid;
delete from product_images where product_id = md5('ivory-karandi-suiting')::uuid;
insert into product_images (product_id, storage_path, alt, position, width, height, mime_type)
values (md5('ivory-karandi-suiting')::uuid, 'https://lh3.googleusercontent.com/aida-public/AB6AXuArYc4kTayTOl0OYDvrvWsNdVC4F42Hnu53PCOlzcU2QO5LlyXE594gujgpS0qMvXHlj-j7LbXK4cMlWdis_NQnfBwq2cHIfI_WBlww6f0J-mRt6KkrfqXFFZSLvDDBT1qREmcftGqEcEtRUudO53Hf2bR2qX2NQL8KcqTrpKb7X4DE6NUMFROBlqnhviiTp2u6QKNLR86JcXCA9-6Q3YsnLdR8GVhiuQZX6bFiToNWwVt4bGUI3kCw_vvU6sxdDeMhnD_jwyHn0RY', 'Ivory Karandi Suiting', 0, 1600, 2000, 'image/jpeg');
delete from product_variants where product_id = md5('ivory-karandi-suiting')::uuid;
insert into product_variants (product_id, size, stock) values (md5('ivory-karandi-suiting')::uuid, 'Unstitched', 10);

insert into products (
  id, slug, title, description, price_paisa, compare_at_paisa,
  category_id, fabric_id, fabric_weight_gsm, gender, color_id, badge_id,
  size_scale_id, sku, stock,
  is_new_arrival, stitching_eligible, stitching_addon_paisa,
  heritage_story, meters_length, meters_note,
  dupatta_length, dupatta_fabric_id, dupatta_finish,
  rating, review_count
) values (
  md5('supreme-egyptian-giza-87')::uuid, 'supreme-egyptian-giza-87', 'Supreme Egyptian Giza 87', 'Premium Egyptian Giza 87 cotton with a subtle, elegant sheen and a fine weave — our signature white, 4.5 meters.',
  1450000, NULL,
  (select id from product_categories where slug = 'kurta-fabric'),
  (select id from fabrics where slug = 'egyptian-cotton'),
  NULL,
  'Men',
  (select id from colors where slug = 'signature-white'),
  (select id from badges where slug = 'sold-by-fujrs'),
  (select id from size_scales where slug = 'unstitched'),
  NULL, 25,
  false,
  false,
  NULL,
  NULL, 4.5, NULL,
  NULL,
  NULL,
  NULL,
  NULL, 0
)
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price_paisa = excluded.price_paisa,
  compare_at_paisa = excluded.compare_at_paisa,
  category_id = excluded.category_id,
  fabric_id = excluded.fabric_id,
  fabric_weight_gsm = excluded.fabric_weight_gsm,
  gender = excluded.gender,
  color_id = excluded.color_id,
  badge_id = excluded.badge_id,
  size_scale_id = excluded.size_scale_id,
  stock = excluded.stock,
  is_new_arrival = excluded.is_new_arrival,
  stitching_eligible = excluded.stitching_eligible,
  stitching_addon_paisa = excluded.stitching_addon_paisa,
  meters_length = excluded.meters_length,
  meters_note = excluded.meters_note,
  dupatta_length = excluded.dupatta_length,
  dupatta_fabric_id = excluded.dupatta_fabric_id,
  dupatta_finish = excluded.dupatta_finish,
  updated_at = now();

delete from product_embroidery where product_id = md5('supreme-egyptian-giza-87')::uuid;
delete from product_images where product_id = md5('supreme-egyptian-giza-87')::uuid;
insert into product_images (product_id, storage_path, alt, position, width, height, mime_type)
values (md5('supreme-egyptian-giza-87')::uuid, 'https://lh3.googleusercontent.com/aida-public/AB6AXuCT1Ge9S1sQF1vbqtlcbc5PfUy9-XefPG6ygirHZNFNAGW9c6q8yMON7sz5BmXJDuCwJC86ZOfwWJGKn84220her2MXTt5ykVQ3HUGhDqQLpkPBZOCqmURvxSkDZBVJTLsIb5tw1neD9z_e140JZvE_GnlskGhxEOE0vKydbSErVH4kS3Gjd8zjL7YO7QGP7MxTiHCg6CSuiXbla8uJ8zpgL8c4zDwq959PR7Ov0XuKaGrW6GGv3oYpj9_znSJFSaU-ahrLRnhHe6U', 'Supreme Egyptian Giza 87', 0, 1600, 2000, 'image/jpeg');
delete from product_variants where product_id = md5('supreme-egyptian-giza-87')::uuid;
insert into product_variants (product_id, size, stock) values (md5('supreme-egyptian-giza-87')::uuid, 'Unstitched', 10);

insert into products (
  id, slug, title, description, price_paisa, compare_at_paisa,
  category_id, fabric_id, fabric_weight_gsm, gender, color_id, badge_id,
  size_scale_id, sku, stock,
  is_new_arrival, stitching_eligible, stitching_addon_paisa,
  heritage_story, meters_length, meters_note,
  dupatta_length, dupatta_fabric_id, dupatta_finish,
  rating, review_count
) values (
  md5('indigo-latha-reserve')::uuid, 'indigo-latha-reserve', 'Indigo Latha Reserve', 'Deep navy Latha fabric, folded and finished for a modern, masculine wardrobe staple.',
  890000, NULL,
  (select id from product_categories where slug = 'kurta-fabric'),
  (select id from fabrics where slug = 'latha'),
  NULL,
  'Men',
  (select id from colors where slug = 'deep-navy'),
  (select id from badges where slug = 'sold-by-fujrs'),
  (select id from size_scales where slug = 'unstitched'),
  NULL, 25,
  false,
  false,
  NULL,
  NULL, 4.5, NULL,
  NULL,
  NULL,
  NULL,
  NULL, 0
)
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price_paisa = excluded.price_paisa,
  compare_at_paisa = excluded.compare_at_paisa,
  category_id = excluded.category_id,
  fabric_id = excluded.fabric_id,
  fabric_weight_gsm = excluded.fabric_weight_gsm,
  gender = excluded.gender,
  color_id = excluded.color_id,
  badge_id = excluded.badge_id,
  size_scale_id = excluded.size_scale_id,
  stock = excluded.stock,
  is_new_arrival = excluded.is_new_arrival,
  stitching_eligible = excluded.stitching_eligible,
  stitching_addon_paisa = excluded.stitching_addon_paisa,
  meters_length = excluded.meters_length,
  meters_note = excluded.meters_note,
  dupatta_length = excluded.dupatta_length,
  dupatta_fabric_id = excluded.dupatta_fabric_id,
  dupatta_finish = excluded.dupatta_finish,
  updated_at = now();

delete from product_embroidery where product_id = md5('indigo-latha-reserve')::uuid;
delete from product_images where product_id = md5('indigo-latha-reserve')::uuid;
insert into product_images (product_id, storage_path, alt, position, width, height, mime_type)
values (md5('indigo-latha-reserve')::uuid, 'https://lh3.googleusercontent.com/aida-public/AB6AXuBSttI1AW1CdmU9K8fXO8FnHdNL7LUyECuB0ASsf00qNURqf4mCJBc7obV5J2Ga1619P403hmMW5AsQOc3hKJPM2lcMd5TgA5TdzVmJY_L4b-nXJ4PYQL2mKBYeq4kqecmhwTxVQpppLSjGfoiZt4jQDcfuitDpdDAB_I5XlmrxaFpMV03RVdcH8gPQ-unAUzjf6Yjfr9UgZeQUbRr9zO5KDljGaTr5SiKaDjMPwsVXKk-O23eMVNMkGC6dbbig44pqFdVb9j9DIvk', 'Indigo Latha Reserve', 0, 1600, 2000, 'image/jpeg');
delete from product_variants where product_id = md5('indigo-latha-reserve')::uuid;
insert into product_variants (product_id, size, stock) values (md5('indigo-latha-reserve')::uuid, 'Unstitched', 10);

insert into products (
  id, slug, title, description, price_paisa, compare_at_paisa,
  category_id, fabric_id, fabric_weight_gsm, gender, color_id, badge_id,
  size_scale_id, sku, stock,
  is_new_arrival, stitching_eligible, stitching_addon_paisa,
  heritage_story, meters_length, meters_note,
  dupatta_length, dupatta_fabric_id, dupatta_finish,
  rating, review_count
) values (
  md5('winter-karandi-deluxe')::uuid, 'winter-karandi-deluxe', 'Winter Karandi Deluxe', 'Textured slub-weave karandi in slate gray, cut for winter formalwear.',
  1220000, NULL,
  (select id from product_categories where slug = 'kurta-fabric'),
  (select id from fabrics where slug = 'karandi'),
  NULL,
  'Men',
  (select id from colors where slug = 'slate-gray'),
  NULL,
  (select id from size_scales where slug = 'unstitched'),
  NULL, 25,
  false,
  false,
  NULL,
  NULL, 4, NULL,
  NULL,
  NULL,
  NULL,
  NULL, 0
)
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price_paisa = excluded.price_paisa,
  compare_at_paisa = excluded.compare_at_paisa,
  category_id = excluded.category_id,
  fabric_id = excluded.fabric_id,
  fabric_weight_gsm = excluded.fabric_weight_gsm,
  gender = excluded.gender,
  color_id = excluded.color_id,
  badge_id = excluded.badge_id,
  size_scale_id = excluded.size_scale_id,
  stock = excluded.stock,
  is_new_arrival = excluded.is_new_arrival,
  stitching_eligible = excluded.stitching_eligible,
  stitching_addon_paisa = excluded.stitching_addon_paisa,
  meters_length = excluded.meters_length,
  meters_note = excluded.meters_note,
  dupatta_length = excluded.dupatta_length,
  dupatta_fabric_id = excluded.dupatta_fabric_id,
  dupatta_finish = excluded.dupatta_finish,
  updated_at = now();

delete from product_embroidery where product_id = md5('winter-karandi-deluxe')::uuid;
delete from product_images where product_id = md5('winter-karandi-deluxe')::uuid;
insert into product_images (product_id, storage_path, alt, position, width, height, mime_type)
values (md5('winter-karandi-deluxe')::uuid, 'https://lh3.googleusercontent.com/aida-public/AB6AXuAtLWLnPSlOsf8xIWiedMxy6qsRfjYlJSdI98yGH0HploJm_t2186QEBeyA4USGjP5VtzUEob_zdvnClITXm1hJjI-5--8hzHYYWDzgTSbqnqPaebdGOs_tBIDnemLyTC8hiKLUstLU2E8O383JYj8FJMb7_Mj_XjNMjGQ8erbc5rSeOYTXtGatSzKMuyAB2EBNGggWLdLNwtELsQx8jpLgL4hca9PNAQPhWr84foXOgZTNsq3mkvndIpGLNkdYus4bkrmsP5qcqSA', 'Winter Karandi Deluxe', 0, 1600, 2000, 'image/jpeg');
delete from product_variants where product_id = md5('winter-karandi-deluxe')::uuid;
insert into product_variants (product_id, size, stock) values (md5('winter-karandi-deluxe')::uuid, 'Unstitched', 10);

insert into products (
  id, slug, title, description, price_paisa, compare_at_paisa,
  category_id, fabric_id, fabric_weight_gsm, gender, color_id, badge_id,
  size_scale_id, sku, stock,
  is_new_arrival, stitching_eligible, stitching_addon_paisa,
  heritage_story, meters_length, meters_note,
  dupatta_length, dupatta_fabric_id, dupatta_finish,
  rating, review_count
) values (
  md5('liquid-microfiber')::uuid, 'liquid-microfiber', 'Liquid Microfiber', 'Wrinkle-resistant microfiber with a liquid-like drape, off-white, for effortless formal wear.',
  750000, NULL,
  (select id from product_categories where slug = 'formal-suiting'),
  (select id from fabrics where slug = 'wash-and-wear'),
  NULL,
  'Men',
  (select id from colors where slug = 'off-white'),
  NULL,
  (select id from size_scales where slug = 'unstitched'),
  NULL, 25,
  false,
  false,
  NULL,
  NULL, 4.5, NULL,
  NULL,
  NULL,
  NULL,
  NULL, 0
)
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price_paisa = excluded.price_paisa,
  compare_at_paisa = excluded.compare_at_paisa,
  category_id = excluded.category_id,
  fabric_id = excluded.fabric_id,
  fabric_weight_gsm = excluded.fabric_weight_gsm,
  gender = excluded.gender,
  color_id = excluded.color_id,
  badge_id = excluded.badge_id,
  size_scale_id = excluded.size_scale_id,
  stock = excluded.stock,
  is_new_arrival = excluded.is_new_arrival,
  stitching_eligible = excluded.stitching_eligible,
  stitching_addon_paisa = excluded.stitching_addon_paisa,
  meters_length = excluded.meters_length,
  meters_note = excluded.meters_note,
  dupatta_length = excluded.dupatta_length,
  dupatta_fabric_id = excluded.dupatta_fabric_id,
  dupatta_finish = excluded.dupatta_finish,
  updated_at = now();

delete from product_embroidery where product_id = md5('liquid-microfiber')::uuid;
delete from product_images where product_id = md5('liquid-microfiber')::uuid;
insert into product_images (product_id, storage_path, alt, position, width, height, mime_type)
values (md5('liquid-microfiber')::uuid, 'https://lh3.googleusercontent.com/aida-public/AB6AXuACQ_tku3fJjKQXukJUDTFSgZxU1Pi-zIA2HsVmLQBUY5gYjcXKoWBpVtGTuFc9tkipcs9KmtiwOXUha4RqgWvJj9W5LOV2i50m3w18NsXzw3ZoeChFogLHxJGAnehzBRUQ-pXRvi8HApOTAFuPrtgX-NPlyyLDoTba9xW9DiM395U0SIDlHnepUsSkOp8T_Sx-Fsdqj3cxNQB-MJI2iCkrKS8YKw1WVFA-AKPUOCzrgZQUAinUXG_wctD1Y8q-_vG1kzGVZQ8bJC4', 'Liquid Microfiber', 0, 1600, 2000, 'image/jpeg');
delete from product_variants where product_id = md5('liquid-microfiber')::uuid;
insert into product_variants (product_id, size, stock) values (md5('liquid-microfiber')::uuid, 'Unstitched', 10);

insert into products (
  id, slug, title, description, price_paisa, compare_at_paisa,
  category_id, fabric_id, fabric_weight_gsm, gender, color_id, badge_id,
  size_scale_id, sku, stock,
  is_new_arrival, stitching_eligible, stitching_addon_paisa,
  heritage_story, meters_length, meters_note,
  dupatta_length, dupatta_fabric_id, dupatta_finish,
  rating, review_count
) values (
  md5('emerald-self-print-cotton')::uuid, 'emerald-self-print-cotton', 'Emerald Self-Print Cotton', 'Deep emerald cotton with a subtle self-print pattern, for a refined everyday look.',
  1080000, NULL,
  (select id from product_categories where slug = 'kurta-fabric'),
  (select id from fabrics where slug = 'cotton'),
  NULL,
  'Men',
  (select id from colors where slug = 'forest-green'),
  NULL,
  (select id from size_scales where slug = 'unstitched'),
  NULL, 25,
  false,
  false,
  NULL,
  NULL, 4.5, NULL,
  NULL,
  NULL,
  NULL,
  NULL, 0
)
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price_paisa = excluded.price_paisa,
  compare_at_paisa = excluded.compare_at_paisa,
  category_id = excluded.category_id,
  fabric_id = excluded.fabric_id,
  fabric_weight_gsm = excluded.fabric_weight_gsm,
  gender = excluded.gender,
  color_id = excluded.color_id,
  badge_id = excluded.badge_id,
  size_scale_id = excluded.size_scale_id,
  stock = excluded.stock,
  is_new_arrival = excluded.is_new_arrival,
  stitching_eligible = excluded.stitching_eligible,
  stitching_addon_paisa = excluded.stitching_addon_paisa,
  meters_length = excluded.meters_length,
  meters_note = excluded.meters_note,
  dupatta_length = excluded.dupatta_length,
  dupatta_fabric_id = excluded.dupatta_fabric_id,
  dupatta_finish = excluded.dupatta_finish,
  updated_at = now();

delete from product_embroidery where product_id = md5('emerald-self-print-cotton')::uuid;
delete from product_images where product_id = md5('emerald-self-print-cotton')::uuid;
insert into product_images (product_id, storage_path, alt, position, width, height, mime_type)
values (md5('emerald-self-print-cotton')::uuid, 'https://lh3.googleusercontent.com/aida-public/AB6AXuBXMWLr_Gz9s2oNwzKUBPT_uuD_nemfvioj3retGJ_NrqqBTe3qO7bgJJPY7K0IClehgrUru7MgAHkc8c28-BlxSedctO8XMBRSF_WaTHj0LKSKB7VP4wRp3Pccy0tUMTm33BIBOnErDUTMf0HiFhqkaJtMCMl4dL1kg3kaW8fGkrWy1kM3N1pdbwVJGmw4D8wDs_1T6sE6UfwGMITz9ZWB23UAFVymdvnyAyIx_o8adf6wDkKxY5y0iwLyK5pU7WVUI9hEt5QXgyM', 'Emerald Self-Print Cotton', 0, 1600, 2000, 'image/jpeg');
delete from product_variants where product_id = md5('emerald-self-print-cotton')::uuid;
insert into product_variants (product_id, size, stock) values (md5('emerald-self-print-cotton')::uuid, 'Unstitched', 10);

insert into products (
  id, slug, title, description, price_paisa, compare_at_paisa,
  category_id, fabric_id, fabric_weight_gsm, gender, color_id, badge_id,
  size_scale_id, sku, stock,
  is_new_arrival, stitching_eligible, stitching_addon_paisa,
  heritage_story, meters_length, meters_note,
  dupatta_length, dupatta_fabric_id, dupatta_finish,
  rating, review_count
) values (
  md5('aurelian-gold-unstitched-silk')::uuid, 'aurelian-gold-unstitched-silk', 'Aurelian Gold Unstitched Silk', 'Ivory embroidered silk with metallic tilla embroidery and pearl embellishments, draped over a minimalist boutique display.',
  4850000, NULL,
  (select id from product_categories where slug = '3-piece-suits'),
  (select id from fabrics where slug = 'raw-silk'),
  80,
  'Women',
  (select id from colors where slug = 'gold'),
  (select id from badges where slug = 'sold-by-fujrs'),
  (select id from size_scales where slug = 'unstitched'),
  'FJ-UNS-AG882', 25,
  false,
  true,
  1250000,
  'The ''Aurelian'' weave draws inspiration from the royal courts of the 17th-century Mughal era. Hand-woven on traditional looms in Banaras, this raw silk base undergoes a unique gold-dipping process before being meticulously embroidered by fourth-generation artisans. Every stitch tells a story of perseverance and refined luxury.', 4.5, 'Standard Suit',
  2.5,
  (select id from fabrics where slug = 'organza'),
  'with Border',
  NULL, 0
)
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price_paisa = excluded.price_paisa,
  compare_at_paisa = excluded.compare_at_paisa,
  category_id = excluded.category_id,
  fabric_id = excluded.fabric_id,
  fabric_weight_gsm = excluded.fabric_weight_gsm,
  gender = excluded.gender,
  color_id = excluded.color_id,
  badge_id = excluded.badge_id,
  size_scale_id = excluded.size_scale_id,
  stock = excluded.stock,
  is_new_arrival = excluded.is_new_arrival,
  stitching_eligible = excluded.stitching_eligible,
  stitching_addon_paisa = excluded.stitching_addon_paisa,
  meters_length = excluded.meters_length,
  meters_note = excluded.meters_note,
  dupatta_length = excluded.dupatta_length,
  dupatta_fabric_id = excluded.dupatta_fabric_id,
  dupatta_finish = excluded.dupatta_finish,
  updated_at = now();

delete from product_embroidery where product_id = md5('aurelian-gold-unstitched-silk')::uuid;
insert into product_embroidery (product_id, technique_id)
select md5('aurelian-gold-unstitched-silk')::uuid, id from embroidery_techniques where slug = 'gold-tilla'
on conflict do nothing;
insert into product_embroidery (product_id, technique_id)
select md5('aurelian-gold-unstitched-silk')::uuid, id from embroidery_techniques where slug = 'zardozi'
on conflict do nothing;
insert into product_embroidery (product_id, technique_id)
select md5('aurelian-gold-unstitched-silk')::uuid, id from embroidery_techniques where slug = 'sequins'
on conflict do nothing;
delete from product_images where product_id = md5('aurelian-gold-unstitched-silk')::uuid;
insert into product_images (product_id, storage_path, alt, position, width, height, mime_type)
values (md5('aurelian-gold-unstitched-silk')::uuid, 'https://lh3.googleusercontent.com/aida-public/AB6AXuAXsQm1EwULybG7vLT6BnXBgjzgq0q3St9SNhhIpmKJHzbtbOu_wcoJs67g4JSwr-JeKusviR7pTcIWfzF9NEkp_8yiWYyGstxAy5VODUvn1PX_eg47dgNF8uYqdirD3KKsOSbPTX1S4y3cc3G6awZzT4ekNxUYLxgymq6MUXIKXHcS-oOiff-yGVFH9i1xC_FtGDOrd3JJB9WdI1X7C2PtfCtmXO0egAB3K1DXjkA1xE0uLl22vXNK-Di8k4QkJh7dszEmf1I_XOw', 'Aurelian Gold Unstitched Silk', 0, 1600, 2000, 'image/jpeg');
insert into product_images (product_id, storage_path, alt, position, width, height, mime_type)
values (md5('aurelian-gold-unstitched-silk')::uuid, 'https://lh3.googleusercontent.com/aida-public/AB6AXuDroIAVaEflsJsKqOB-SGV3vmrILZf4UuB-oNl5vAiy0sWzA25w-TySCanwUNg8BELd9JA_DcmBFWNQFVeujgXBx0dU7AzpgHyNGFhZSpA2uP4ssUom3J7sReIf9iJO_kUbCEjzjpwfy_WfJTY16HDgP4Ztib2gfHqgv2U4qc13cK-4sP7isRPD877E5o1qZJpqhxXGHiKdAhtRxZ0iBsJwM16gZYijv0ZUOHh8UpBnAeJmJgtLhwzSaWg3bV6sHVpqvrkUaGJ4d_Q', 'Aurelian Gold Unstitched Silk', 1, 1600, 2000, 'image/jpeg');
insert into product_images (product_id, storage_path, alt, position, width, height, mime_type)
values (md5('aurelian-gold-unstitched-silk')::uuid, 'https://lh3.googleusercontent.com/aida-public/AB6AXuAm7taCbrmAPS52jvfiq75nkC7m8JAZys9-y1gKKLSIwPxdeUZmhUGUnJB3Fz53jZYR_UiTWFxznpY19sf16bKXWEsf9mpvYokplbfWOuNXAdZArAwO_mo5Fc4b5Uv8bj7iB3B7mvxkZZM3quvFnC8v1nBzXTB7wlirknPLjA_T6STpCBOJIve6K7lSAeZwabV8b0sPB3KhTRaaBtcNrdLVAvqh44fYZKK0tYV0pkNiUvWF4vbd_HhPPQksxgEWfNz5EZ6zh0HXLTo', 'Aurelian Gold Unstitched Silk', 2, 1600, 2000, 'image/jpeg');
delete from product_variants where product_id = md5('aurelian-gold-unstitched-silk')::uuid;
insert into product_variants (product_id, size, stock) values (md5('aurelian-gold-unstitched-silk')::uuid, 'Unstitched', 10);

insert into products (
  id, slug, title, description, price_paisa, compare_at_paisa,
  category_id, fabric_id, fabric_weight_gsm, gender, color_id, badge_id,
  size_scale_id, sku, stock,
  is_new_arrival, stitching_eligible, stitching_addon_paisa,
  heritage_story, meters_length, meters_note,
  dupatta_length, dupatta_fabric_id, dupatta_finish,
  rating, review_count
) values (
  md5('noir-elegance-lawn')::uuid, 'noir-elegance-lawn', 'Noir Elegance Lawn', 'Black embroidered lawn with crisp white threadwork across the neckline.',
  1490000, NULL,
  (select id from product_categories where slug = '2-piece-suits'),
  (select id from fabrics where slug = 'lawn'),
  NULL,
  'Women',
  (select id from colors where slug = 'black'),
  (select id from badges where slug = 'best-seller'),
  (select id from size_scales where slug = 'unstitched'),
  NULL, 25,
  false,
  false,
  NULL,
  NULL, NULL, NULL,
  NULL,
  NULL,
  NULL,
  NULL, 0
)
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price_paisa = excluded.price_paisa,
  compare_at_paisa = excluded.compare_at_paisa,
  category_id = excluded.category_id,
  fabric_id = excluded.fabric_id,
  fabric_weight_gsm = excluded.fabric_weight_gsm,
  gender = excluded.gender,
  color_id = excluded.color_id,
  badge_id = excluded.badge_id,
  size_scale_id = excluded.size_scale_id,
  stock = excluded.stock,
  is_new_arrival = excluded.is_new_arrival,
  stitching_eligible = excluded.stitching_eligible,
  stitching_addon_paisa = excluded.stitching_addon_paisa,
  meters_length = excluded.meters_length,
  meters_note = excluded.meters_note,
  dupatta_length = excluded.dupatta_length,
  dupatta_fabric_id = excluded.dupatta_fabric_id,
  dupatta_finish = excluded.dupatta_finish,
  updated_at = now();

delete from product_embroidery where product_id = md5('noir-elegance-lawn')::uuid;
delete from product_images where product_id = md5('noir-elegance-lawn')::uuid;
insert into product_images (product_id, storage_path, alt, position, width, height, mime_type)
values (md5('noir-elegance-lawn')::uuid, 'https://lh3.googleusercontent.com/aida-public/AB6AXuDDtLXmpEUmwz5bpffqXBGrKFry7lrFz9M8LsJsn3H_HtE3KxZP1KjVCM27Aj-TUR43rf1AwjJDIkZWpK_94TCoiadGtpZUOHJE0QXu_zg4_62OvQ35ghSGXIl90mcOOuElMf2VdE5UzQrh58goloqqn8LDzMqaCEQIASWLxkCEyYQmMtrf670aVu-NNjCs1PskTr0yM6LFqQOcEEfhiHLUSqE9NqNUF-Cj4qevQnanavFIwOu7qpX0ChVRNeCyTWYeKmq2ROwypiY', 'Noir Elegance Lawn', 0, 1600, 2000, 'image/jpeg');
delete from product_variants where product_id = md5('noir-elegance-lawn')::uuid;
insert into product_variants (product_id, size, stock) values (md5('noir-elegance-lawn')::uuid, 'Unstitched', 10);

insert into products (
  id, slug, title, description, price_paisa, compare_at_paisa,
  category_id, fabric_id, fabric_weight_gsm, gender, color_id, badge_id,
  size_scale_id, sku, stock,
  is_new_arrival, stitching_eligible, stitching_addon_paisa,
  heritage_story, meters_length, meters_note,
  dupatta_length, dupatta_fabric_id, dupatta_finish,
  rating, review_count
) values (
  md5('celestial-blue-chiffon')::uuid, 'celestial-blue-chiffon', 'Celestial Blue Chiffon', 'Pastel blue chiffon with a shimmering beaded floral vine pattern in silver thread.',
  1820000, NULL,
  (select id from product_categories where slug = '2-piece-suits'),
  (select id from fabrics where slug = 'chiffon'),
  NULL,
  'Women',
  (select id from colors where slug = 'pastel-blue'),
  (select id from badges where slug = 'official-store'),
  (select id from size_scales where slug = 'unstitched'),
  NULL, 25,
  false,
  false,
  NULL,
  NULL, NULL, NULL,
  NULL,
  NULL,
  NULL,
  NULL, 0
)
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price_paisa = excluded.price_paisa,
  compare_at_paisa = excluded.compare_at_paisa,
  category_id = excluded.category_id,
  fabric_id = excluded.fabric_id,
  fabric_weight_gsm = excluded.fabric_weight_gsm,
  gender = excluded.gender,
  color_id = excluded.color_id,
  badge_id = excluded.badge_id,
  size_scale_id = excluded.size_scale_id,
  stock = excluded.stock,
  is_new_arrival = excluded.is_new_arrival,
  stitching_eligible = excluded.stitching_eligible,
  stitching_addon_paisa = excluded.stitching_addon_paisa,
  meters_length = excluded.meters_length,
  meters_note = excluded.meters_note,
  dupatta_length = excluded.dupatta_length,
  dupatta_fabric_id = excluded.dupatta_fabric_id,
  dupatta_finish = excluded.dupatta_finish,
  updated_at = now();

delete from product_embroidery where product_id = md5('celestial-blue-chiffon')::uuid;
delete from product_images where product_id = md5('celestial-blue-chiffon')::uuid;
insert into product_images (product_id, storage_path, alt, position, width, height, mime_type)
values (md5('celestial-blue-chiffon')::uuid, 'https://lh3.googleusercontent.com/aida-public/AB6AXuDdh87HWDsPO38bo1fV8MVzvic8AOkxYA316FZsKLeBsZZq61I0UXfOPnm14_JxtWJFy3zsaPGIe56Cy8i_ZgQEXZLaFmRLXIk5hSkrtkY5uz8QyTHNSOxbFm_lXjVp7sdINcFscrIxM_DvcUty-nNMpHdDjTSk-GSDAcwc2hA-bpdSUuFLrW40q-5PhEiKBccXkJYhSelp5JSOkFOD7dWF2OUBDGpAKWgroMOX1I7FmN10PKrQ2WUnqxxdMyfPDlZaLJWAa_T5OUI', 'Celestial Blue Chiffon', 0, 1600, 2000, 'image/jpeg');
delete from product_variants where product_id = md5('celestial-blue-chiffon')::uuid;
insert into product_variants (product_id, size, stock) values (md5('celestial-blue-chiffon')::uuid, 'Unstitched', 10);

insert into products (
  id, slug, title, description, price_paisa, compare_at_paisa,
  category_id, fabric_id, fabric_weight_gsm, gender, color_id, badge_id,
  size_scale_id, sku, stock,
  is_new_arrival, stitching_eligible, stitching_addon_paisa,
  heritage_story, meters_length, meters_note,
  dupatta_length, dupatta_fabric_id, dupatta_finish,
  rating, review_count
) values (
  md5('olive-tilla-embroidery')::uuid, 'olive-tilla-embroidery', 'Olive Tilla Embroidery', 'Olive green fabric with heavy golden border embroidery, for a warm-toned festive look.',
  2250000, NULL,
  (select id from product_categories where slug = '2-piece-suits'),
  (select id from fabrics where slug = 'lawn'),
  NULL,
  'Women',
  (select id from colors where slug = 'olive-green'),
  (select id from badges where slug = 'premium-collection'),
  (select id from size_scales where slug = 'unstitched'),
  NULL, 25,
  false,
  false,
  NULL,
  NULL, NULL, NULL,
  NULL,
  NULL,
  NULL,
  NULL, 0
)
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price_paisa = excluded.price_paisa,
  compare_at_paisa = excluded.compare_at_paisa,
  category_id = excluded.category_id,
  fabric_id = excluded.fabric_id,
  fabric_weight_gsm = excluded.fabric_weight_gsm,
  gender = excluded.gender,
  color_id = excluded.color_id,
  badge_id = excluded.badge_id,
  size_scale_id = excluded.size_scale_id,
  stock = excluded.stock,
  is_new_arrival = excluded.is_new_arrival,
  stitching_eligible = excluded.stitching_eligible,
  stitching_addon_paisa = excluded.stitching_addon_paisa,
  meters_length = excluded.meters_length,
  meters_note = excluded.meters_note,
  dupatta_length = excluded.dupatta_length,
  dupatta_fabric_id = excluded.dupatta_fabric_id,
  dupatta_finish = excluded.dupatta_finish,
  updated_at = now();

delete from product_embroidery where product_id = md5('olive-tilla-embroidery')::uuid;
delete from product_images where product_id = md5('olive-tilla-embroidery')::uuid;
insert into product_images (product_id, storage_path, alt, position, width, height, mime_type)
values (md5('olive-tilla-embroidery')::uuid, 'https://lh3.googleusercontent.com/aida-public/AB6AXuC6Bi5TM_A7xXE9_nlHxB_bIp10NfUapBqs3-Uu8zQgPZ5FbPSwyuIaCuXbPogZ3iNST5lVSZ3UUNCuxR299CTRZdInYStKLCeQ9OxdC1eLTTLPg0JeZQRTwPslCAeH63MRTPB2UmZRFdDcBVz2Zr4YiHYazenHYTEeqncB-g1rQK1Oe14pAz_BYLQ8XyE2VCoXDyu0KVbm0CoUgUveOf7K06GIaXBDnfpW8sItip4YJgG_cnA0CsWqwqij4NwbPyUBAB-WwEJb5B4', 'Olive Tilla Embroidery', 0, 1600, 2000, 'image/jpeg');
delete from product_variants where product_id = md5('olive-tilla-embroidery')::uuid;
insert into product_variants (product_id, size, stock) values (md5('olive-tilla-embroidery')::uuid, 'Unstitched', 10);

insert into products (
  id, slug, title, description, price_paisa, compare_at_paisa,
  category_id, fabric_id, fabric_weight_gsm, gender, color_id, badge_id,
  size_scale_id, sku, stock,
  is_new_arrival, stitching_eligible, stitching_addon_paisa,
  heritage_story, meters_length, meters_note,
  dupatta_length, dupatta_fabric_id, dupatta_finish,
  rating, review_count
) values (
  md5('ivory-pearl-net')::uuid, 'ivory-pearl-net', 'Ivory Pearl Net', 'White-on-white embroidered net with a relief-like threadwork texture, sheer and delicate.',
  3100000, NULL,
  (select id from product_categories where slug = '3-piece-suits'),
  (select id from fabrics where slug = 'net'),
  NULL,
  'Women',
  (select id from colors where slug = 'ivory'),
  (select id from badges where slug = 'limited-edition'),
  (select id from size_scales where slug = 'unstitched'),
  NULL, 25,
  false,
  false,
  NULL,
  NULL, NULL, NULL,
  NULL,
  NULL,
  NULL,
  NULL, 0
)
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price_paisa = excluded.price_paisa,
  compare_at_paisa = excluded.compare_at_paisa,
  category_id = excluded.category_id,
  fabric_id = excluded.fabric_id,
  fabric_weight_gsm = excluded.fabric_weight_gsm,
  gender = excluded.gender,
  color_id = excluded.color_id,
  badge_id = excluded.badge_id,
  size_scale_id = excluded.size_scale_id,
  stock = excluded.stock,
  is_new_arrival = excluded.is_new_arrival,
  stitching_eligible = excluded.stitching_eligible,
  stitching_addon_paisa = excluded.stitching_addon_paisa,
  meters_length = excluded.meters_length,
  meters_note = excluded.meters_note,
  dupatta_length = excluded.dupatta_length,
  dupatta_fabric_id = excluded.dupatta_fabric_id,
  dupatta_finish = excluded.dupatta_finish,
  updated_at = now();

delete from product_embroidery where product_id = md5('ivory-pearl-net')::uuid;
delete from product_images where product_id = md5('ivory-pearl-net')::uuid;
insert into product_images (product_id, storage_path, alt, position, width, height, mime_type)
values (md5('ivory-pearl-net')::uuid, 'https://lh3.googleusercontent.com/aida-public/AB6AXuCqB_8s8I4DKMHJ7VdNFjsLzvSFAPQubk15oeP863Qrt7f3sGpPETxzm94PNlxqhenw9JzdKlhGkHt5SY4LtgwPTg8Bk0t4GAmIWcAjNAucwTC3JfqVbjs0BozUNrAXQqVBTKYKvNYnG0X38iUP9CPoPeCSU0t-dYioQFDo6rZHI-2re4ie54e0yKLhzIPRYi3mTaXCqUu2x28klT_jbQRfUV7XHRcpJ0HOPIlMZkZxYP6O6m1bqxKO82JKl8xlNGws1bIVpaitsZs', 'Ivory Pearl Net', 0, 1600, 2000, 'image/jpeg');
delete from product_variants where product_id = md5('ivory-pearl-net')::uuid;
insert into product_variants (product_id, size, stock) values (md5('ivory-pearl-net')::uuid, 'Unstitched', 10);

insert into products (
  id, slug, title, description, price_paisa, compare_at_paisa,
  category_id, fabric_id, fabric_weight_gsm, gender, color_id, badge_id,
  size_scale_id, sku, stock,
  is_new_arrival, stitching_eligible, stitching_addon_paisa,
  heritage_story, meters_length, meters_note,
  dupatta_length, dupatta_fabric_id, dupatta_finish,
  rating, review_count
) values (
  md5('antique-gold-zardozi-khussa')::uuid, 'antique-gold-zardozi-khussa', 'Antique Gold Zardozi Khussa', 'Handcrafted gold Khussa shoes with intricate Zardozi embroidery, complementing a luxury silk suit.',
  850000, NULL,
  (select id from product_categories where slug = 'footwear'),
  (select id from fabrics where slug = 'leather-and-zardozi'),
  NULL,
  'Women',
  (select id from colors where slug = 'gold'),
  NULL,
  (select id from size_scales where slug = 'shoe-eu'),
  NULL, 25,
  false,
  false,
  NULL,
  NULL, NULL, NULL,
  NULL,
  NULL,
  NULL,
  NULL, 0
)
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price_paisa = excluded.price_paisa,
  compare_at_paisa = excluded.compare_at_paisa,
  category_id = excluded.category_id,
  fabric_id = excluded.fabric_id,
  fabric_weight_gsm = excluded.fabric_weight_gsm,
  gender = excluded.gender,
  color_id = excluded.color_id,
  badge_id = excluded.badge_id,
  size_scale_id = excluded.size_scale_id,
  stock = excluded.stock,
  is_new_arrival = excluded.is_new_arrival,
  stitching_eligible = excluded.stitching_eligible,
  stitching_addon_paisa = excluded.stitching_addon_paisa,
  meters_length = excluded.meters_length,
  meters_note = excluded.meters_note,
  dupatta_length = excluded.dupatta_length,
  dupatta_fabric_id = excluded.dupatta_fabric_id,
  dupatta_finish = excluded.dupatta_finish,
  updated_at = now();

delete from product_embroidery where product_id = md5('antique-gold-zardozi-khussa')::uuid;
delete from product_images where product_id = md5('antique-gold-zardozi-khussa')::uuid;
insert into product_images (product_id, storage_path, alt, position, width, height, mime_type)
values (md5('antique-gold-zardozi-khussa')::uuid, 'https://lh3.googleusercontent.com/aida-public/AB6AXuD2VcNYHnxImQvjpDcxjn0so_tcNwzwUEvYLPnKVILxy8H1JfrRaBZqi3VOcaAjA9tPTKW_ruSxH8JhKBmVQqGyebkJAFIVtCWkK8MxzX0CxvJffceY06TkVV-NejMbN2JizaroU-8rx8hqF4El7Mpzd_ETtLqUL5cp9xhivTh6ZxmXfUY3X50NuxP99JkWniHDh3EnWdXlKWNMPQ-gecMpweATOevbWgJ1TRP3B3ufHONiBKUERMKTRA3OzpRrAeLYX_ASkxxOjeo', 'Antique Gold Zardozi Khussa', 0, 1600, 2000, 'image/jpeg');
delete from product_variants where product_id = md5('antique-gold-zardozi-khussa')::uuid;
insert into product_variants (product_id, size, stock) values (md5('antique-gold-zardozi-khussa')::uuid, '36', 10);
insert into product_variants (product_id, size, stock) values (md5('antique-gold-zardozi-khussa')::uuid, '37', 10);
insert into product_variants (product_id, size, stock) values (md5('antique-gold-zardozi-khussa')::uuid, '38', 10);
insert into product_variants (product_id, size, stock) values (md5('antique-gold-zardozi-khussa')::uuid, '39', 10);
insert into product_variants (product_id, size, stock) values (md5('antique-gold-zardozi-khussa')::uuid, '40', 10);

insert into products (
  id, slug, title, description, price_paisa, compare_at_paisa,
  category_id, fabric_id, fabric_weight_gsm, gender, color_id, badge_id,
  size_scale_id, sku, stock,
  is_new_arrival, stitching_eligible, stitching_addon_paisa,
  heritage_story, meters_length, meters_note,
  dupatta_length, dupatta_fabric_id, dupatta_finish,
  rating, review_count
) values (
  md5('mughal-pearl-chandbalis')::uuid, 'mughal-pearl-chandbalis', 'Mughal Pearl Chandbalis', 'Oversized gold Chandbali earrings with pearl drops, perfect for a bridal or formal look.',
  1420000, NULL,
  (select id from product_categories where slug = 'jewelry'),
  (select id from fabrics where slug = 'gold-plated-metal-pearl'),
  NULL,
  'Women',
  (select id from colors where slug = 'gold'),
  NULL,
  (select id from size_scales where slug = 'one-size'),
  NULL, 25,
  false,
  false,
  NULL,
  NULL, NULL, NULL,
  NULL,
  NULL,
  NULL,
  NULL, 0
)
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price_paisa = excluded.price_paisa,
  compare_at_paisa = excluded.compare_at_paisa,
  category_id = excluded.category_id,
  fabric_id = excluded.fabric_id,
  fabric_weight_gsm = excluded.fabric_weight_gsm,
  gender = excluded.gender,
  color_id = excluded.color_id,
  badge_id = excluded.badge_id,
  size_scale_id = excluded.size_scale_id,
  stock = excluded.stock,
  is_new_arrival = excluded.is_new_arrival,
  stitching_eligible = excluded.stitching_eligible,
  stitching_addon_paisa = excluded.stitching_addon_paisa,
  meters_length = excluded.meters_length,
  meters_note = excluded.meters_note,
  dupatta_length = excluded.dupatta_length,
  dupatta_fabric_id = excluded.dupatta_fabric_id,
  dupatta_finish = excluded.dupatta_finish,
  updated_at = now();

delete from product_embroidery where product_id = md5('mughal-pearl-chandbalis')::uuid;
delete from product_images where product_id = md5('mughal-pearl-chandbalis')::uuid;
insert into product_images (product_id, storage_path, alt, position, width, height, mime_type)
values (md5('mughal-pearl-chandbalis')::uuid, 'https://lh3.googleusercontent.com/aida-public/AB6AXuC8LBZkNztJe09ZssecQdgXcbU6ETs5Wxd4qsx6wlbdjHh3x0TeVy3RuHXFXQpGKGy4LC2APzFMLw7CIHV4OBmKcZU8UiCM1ZD3vNUmEBHRc9wXcSUJXDBrANLtC6Vj9Y11qi3By2A_wxZ27wz97skJqSF4aH349yfUYmH0UvITOXbildMdDHMbI7SXKwbO2_u-5x2p2dB4bUVx9pxZMws9OyezyI-ttyTDapMVYRjY8FkbjOQ8YSU8komFKZwitkTqgMZ6McK9ILk', 'Mughal Pearl Chandbalis', 0, 1600, 2000, 'image/jpeg');
delete from product_variants where product_id = md5('mughal-pearl-chandbalis')::uuid;
insert into product_variants (product_id, size, stock) values (md5('mughal-pearl-chandbalis')::uuid, 'One Size', 10);

insert into products (
  id, slug, title, description, price_paisa, compare_at_paisa,
  category_id, fabric_id, fabric_weight_gsm, gender, color_id, badge_id,
  size_scale_id, sku, stock,
  is_new_arrival, stitching_eligible, stitching_addon_paisa,
  heritage_story, meters_length, meters_note,
  dupatta_length, dupatta_fabric_id, dupatta_finish,
  rating, review_count
) values (
  md5('gilded-silk-frame-clutch')::uuid, 'gilded-silk-frame-clutch', 'Gilded Silk Frame Clutch', 'A structured gold silk clutch bag with a traditional jewel-encrusted clasp.',
  1200000, NULL,
  (select id from product_categories where slug = 'accessories'),
  (select id from fabrics where slug = 'silk'),
  NULL,
  'Women',
  (select id from colors where slug = 'gold'),
  NULL,
  (select id from size_scales where slug = 'one-size'),
  NULL, 25,
  false,
  false,
  NULL,
  NULL, NULL, NULL,
  NULL,
  NULL,
  NULL,
  NULL, 0
)
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price_paisa = excluded.price_paisa,
  compare_at_paisa = excluded.compare_at_paisa,
  category_id = excluded.category_id,
  fabric_id = excluded.fabric_id,
  fabric_weight_gsm = excluded.fabric_weight_gsm,
  gender = excluded.gender,
  color_id = excluded.color_id,
  badge_id = excluded.badge_id,
  size_scale_id = excluded.size_scale_id,
  stock = excluded.stock,
  is_new_arrival = excluded.is_new_arrival,
  stitching_eligible = excluded.stitching_eligible,
  stitching_addon_paisa = excluded.stitching_addon_paisa,
  meters_length = excluded.meters_length,
  meters_note = excluded.meters_note,
  dupatta_length = excluded.dupatta_length,
  dupatta_fabric_id = excluded.dupatta_fabric_id,
  dupatta_finish = excluded.dupatta_finish,
  updated_at = now();

delete from product_embroidery where product_id = md5('gilded-silk-frame-clutch')::uuid;
delete from product_images where product_id = md5('gilded-silk-frame-clutch')::uuid;
insert into product_images (product_id, storage_path, alt, position, width, height, mime_type)
values (md5('gilded-silk-frame-clutch')::uuid, 'https://lh3.googleusercontent.com/aida-public/AB6AXuCJdBomWWQA1fHt7G1M9HLy4EfPUvNV3uM3r-k0210P0eZv_Zzij8Lne1QunAHjiWwgGd8vZ46nsEOOE22iWYS4HMeAMaBuZ0pYHUj74ERBIhlHMgVt9N1FpNsc6DY8vNJnxH8qdv1rcASy49jx3T6ZEZefo_njbpPxpu7YXYBYBh8s0TiQR-_u7hIqVEY2ogWSJaWsdtBXirXZnuFODGhvSg5XaI5f4LTysLl93mnA-8RChgyVuCZkrBDBLxyemLxRTiQAwU9OgUk', 'Gilded Silk Frame Clutch', 0, 1600, 2000, 'image/jpeg');
delete from product_variants where product_id = md5('gilded-silk-frame-clutch')::uuid;
insert into product_variants (product_id, size, stock) values (md5('gilded-silk-frame-clutch')::uuid, 'One Size', 10);

insert into products (
  id, slug, title, description, price_paisa, compare_at_paisa,
  category_id, fabric_id, fabric_weight_gsm, gender, color_id, badge_id,
  size_scale_id, sku, stock,
  is_new_arrival, stitching_eligible, stitching_addon_paisa,
  heritage_story, meters_length, meters_note,
  dupatta_length, dupatta_fabric_id, dupatta_finish,
  rating, review_count
) values (
  md5('cream-needlework-pashmina')::uuid, 'cream-needlework-pashmina', 'Cream Needlework Pashmina', 'A fine Pashmina shawl in muted cream with intricate gold needlework at the borders.',
  2800000, NULL,
  (select id from product_categories where slug = 'accessories'),
  (select id from fabrics where slug = 'pashmina-wool'),
  NULL,
  'Women',
  (select id from colors where slug = 'cream'),
  NULL,
  (select id from size_scales where slug = 'one-size'),
  NULL, 25,
  false,
  false,
  NULL,
  NULL, NULL, NULL,
  NULL,
  NULL,
  NULL,
  NULL, 0
)
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price_paisa = excluded.price_paisa,
  compare_at_paisa = excluded.compare_at_paisa,
  category_id = excluded.category_id,
  fabric_id = excluded.fabric_id,
  fabric_weight_gsm = excluded.fabric_weight_gsm,
  gender = excluded.gender,
  color_id = excluded.color_id,
  badge_id = excluded.badge_id,
  size_scale_id = excluded.size_scale_id,
  stock = excluded.stock,
  is_new_arrival = excluded.is_new_arrival,
  stitching_eligible = excluded.stitching_eligible,
  stitching_addon_paisa = excluded.stitching_addon_paisa,
  meters_length = excluded.meters_length,
  meters_note = excluded.meters_note,
  dupatta_length = excluded.dupatta_length,
  dupatta_fabric_id = excluded.dupatta_fabric_id,
  dupatta_finish = excluded.dupatta_finish,
  updated_at = now();

delete from product_embroidery where product_id = md5('cream-needlework-pashmina')::uuid;
delete from product_images where product_id = md5('cream-needlework-pashmina')::uuid;
insert into product_images (product_id, storage_path, alt, position, width, height, mime_type)
values (md5('cream-needlework-pashmina')::uuid, 'https://lh3.googleusercontent.com/aida-public/AB6AXuAzh7DrFWF5l_2rm44V6IkLP0BJhbwFHJOp7F1NAYSNLndZci8LLkfubhvfFreKD3cy4xEeowdpaCH3Pcblo27AyZhYrI1hYXl2AG6KE7nNLauAdTz7G6YOEEciSU_PfdD6O0JFzKC52HLwQVPX_XG7-4z4bnj_GxNdjGKmgKwLqagRKcvf9KmULe6ADnEfIxLwEOnDVPvP3V5crLUhc3z9DifXmjOg4A1GKMT3jjOcVNvnI8qs0BmN01Ts_NktbKXZkfEgknUZdSY', 'Cream Needlework Pashmina', 0, 1600, 2000, 'image/jpeg');
delete from product_variants where product_id = md5('cream-needlework-pashmina')::uuid;
insert into product_variants (product_id, size, stock) values (md5('cream-needlework-pashmina')::uuid, 'One Size', 10);

commit;
