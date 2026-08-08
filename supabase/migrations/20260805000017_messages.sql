-- FUJRS — contact messages and newsletter signups.
--
-- Both forms rendered a success state ("Message Sent", "You're in") without
-- storing anything. That is the exact failure the convention in CLAUDE.md
-- names: show the real UI, show a coming-soon state if it isn't built, but
-- never fake success. A customer told their message was sent, when it went
-- nowhere, is worse than one told the form isn't ready.
--
-- These are the tables that make the success states true.

create table contact_messages (
  id         uuid primary key default gen_random_uuid(),

  -- Not a foreign key: most enquiries come from people with no account, and
  -- the message must survive the account being deleted anyway.
  name       text not null,
  email      citext not null,
  phone      text,
  subject    text,
  message    text not null,

  -- Set when a signed-in customer sends it, so staff can see their orders.
  user_id    uuid references users(id) on delete set null,

  handled_at timestamptz,
  created_at timestamptz not null default now()
);

create index contact_messages_unhandled_idx
  on contact_messages (created_at desc) where handled_at is null;

create table newsletter_subscribers (
  id             uuid primary key default gen_random_uuid(),
  email          citext not null unique,
  subscribed_at  timestamptz not null default now(),
  -- Kept rather than deleted on unsubscribe: re-adding someone who opted out
  -- is the mistake this column exists to prevent.
  unsubscribed_at timestamptz
);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
-- Write-only for the public, readable by staff. Anyone may send a message or
-- subscribe; nobody may read what anyone else sent, which would otherwise hand
-- a scraper every email address that ever touched the site.

alter table contact_messages enable row level security;
alter table newsletter_subscribers enable row level security;

create policy contact_messages_public_insert on contact_messages
  for insert with check (true);

create policy contact_messages_staff_read on contact_messages
  for select using (is_staff());

create policy contact_messages_staff_update on contact_messages
  for update using (is_staff()) with check (is_staff());

create policy newsletter_public_insert on newsletter_subscribers
  for insert with check (true);

create policy newsletter_staff_read on newsletter_subscribers
  for select using (is_staff());

comment on table contact_messages is
  'Public insert, staff read. NOTE: unauthenticated insert is a spam surface — enable CAPTCHA and edge rate limiting before launch, the same as anonymous sign-ins.';
