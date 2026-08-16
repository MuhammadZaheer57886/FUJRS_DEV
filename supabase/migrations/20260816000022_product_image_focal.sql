-- FUJRS — where a product photo is cropped.
--
-- The storefront renders one photo into several shapes. Men, Women and New
-- Arrivals all use 4:5 grid tiles, but the first piece in the Women grid gets
-- a 16:9 feature tile and the first in the Men grid a 16:10 one, and the PDP
-- gallery is 4:5 again. Every one of those is `object-cover`, which crops from
-- the centre outwards.
--
-- Centring is the wrong default for garment photography: a portrait shot of a
-- suit dropped into a 16:9 tile keeps the middle of the fabric and loses the
-- neckline and the hem, which are the two things the shot was framed around.
--
-- SHAPE: two percentages on the image, not a second cropped file per shape.
-- One point answers every shape at once, costs no extra storage, and stays
-- correct if the layout changes a ratio later. It is the same thing CSS
-- `object-position` takes, so rendering it is one style property.
--
-- Defaulted to dead centre so every existing row keeps rendering exactly as it
-- does today, and so an upload that needs no attention needs no clicks.

alter table product_images
  add column focal_x smallint not null default 50 check (focal_x between 0 and 100),
  add column focal_y smallint not null default 50 check (focal_y between 0 and 100);

comment on column product_images.focal_x is
  'Horizontal focal point, 0-100 left to right. Fed straight to CSS object-position.';
comment on column product_images.focal_y is
  'Vertical focal point, 0-100 top to bottom. 50/50 is the centred crop object-cover does on its own.';
