-- ============================================================
-- Lot 1 — Système d'avis BrazaScent
-- Migration unique, rétrocompatible, aucune suppression de données.
-- Appliquée en production via Supabase MCP (apply_migration,
-- nom "add_reviews_system_lot1") — ce fichier est la copie de
-- référence versionnée dans le repo.
-- ============================================================

-- 1. Enums -------------------------------------------------------
create type review_status as enum ('pending', 'approved', 'rejected');
create type review_source as enum ('product_page', 'review_link', 'admin', 'public_page');
create type review_photo_status as enum ('pending', 'approved', 'rejected');

-- 2. Évolution de product_reviews ---------------------------------
alter table product_reviews
  add column status review_status not null default 'pending',
  add column verified_purchase boolean not null default false,
  add column order_id uuid references orders(id) on delete set null,
  add column order_item_id uuid references order_items(id) on delete set null,
  add column customer_email text,
  add column purchased_size text,
  add column shop_response text,
  add column shop_response_at timestamptz,
  add column updated_at timestamptz not null default now(),
  add column rejected_reason text,
  add column source review_source;

-- Backfill depuis is_approved (colonne conservée, non supprimée)
update product_reviews set status = 'approved' where is_approved = true;
update product_reviews set status = 'pending'  where is_approved = false or is_approved is null;
update product_reviews set source = 'product_page' where source is null;

create index idx_product_reviews_product_status on product_reviews(product_id, status);
create index idx_product_reviews_status on product_reviews(status);
create unique index uq_product_reviews_order_product
  on product_reviews(order_id, product_id) where order_id is not null;
create unique index uq_product_reviews_user_product
  on product_reviews(product_id, user_id) where user_id is not null;

-- 3. review_tokens (nouvelle table) --------------------------------
create table review_tokens (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  customer_email text not null,
  customer_phone_hash text,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now(),
  reminder_count int not null default 0,
  last_reminder_at timestamptz,
  last_reminder_channel text check (last_reminder_channel in ('email', 'whatsapp')),
  review_id uuid references product_reviews(id) on delete set null,
  unique (order_id, product_id, customer_email)
);
create index idx_review_tokens_order on review_tokens(order_id);
create index idx_review_tokens_expires on review_tokens(expires_at) where used_at is null;
create index idx_review_tokens_phone_hash
  on review_tokens(customer_phone_hash) where customer_phone_hash is not null;

alter table review_tokens enable row level security;
-- Aucune policy créée volontairement : verrouillé pour anon/authenticated.
-- Seule la fonction SECURITY DEFINER submit_verified_review() y accède.

-- 4. review_photos (nouvelle table, deux chemins de stockage) ------
create table review_photos (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references product_reviews(id) on delete cascade,
  private_storage_path text,
  public_storage_path text,
  status review_photo_status not null default 'pending',
  sort_order int not null default 0,
  copy_error text,
  last_copy_attempt_at timestamptz,
  created_at timestamptz not null default now(),
  constraint review_photos_public_path_required check (
    status <> 'approved' or public_storage_path is not null
  ),
  constraint review_photos_no_error_when_approved check (
    status <> 'approved' or copy_error is null
  )
);
create index idx_review_photos_review on review_photos(review_id, sort_order);
create index idx_review_photos_copy_errors
  on review_photos(review_id) where copy_error is not null and status = 'pending';

alter table review_photos enable row level security;

create policy review_photos_select_approved on review_photos
  for select using (
    status = 'approved'
    and exists (
      select 1 from product_reviews pr
      where pr.id = review_photos.review_id and pr.status = 'approved'
    )
  );

create policy review_photos_admin_all on review_photos
  for all using (
    exists (select 1 from user_profiles where id = auth.uid() and is_admin = true)
  );

-- 5. Extension de post_purchase_emails ------------------------------
alter table post_purchase_emails
  add column product_id uuid references products(id) on delete set null,
  add column review_token_id uuid references review_tokens(id) on delete set null,
  add column reminder_number int not null default 1,
  add column channel text not null default 'email' check (channel in ('email', 'whatsapp'));

-- 6. product_reviews — policies (retire l'INSERT direct) ------------
drop policy if exists reviews_insert_auth on product_reviews;
drop policy if exists reviews_select_approved on product_reviews;
create policy reviews_select_approved on product_reviews
  for select using (status = 'approved');
-- reviews_admin_all conservée telle quelle (aucune modification)

-- 7. Vue agrégée (utilisée par ProductCard sur toutes les pages) ----
create view product_review_stats
  with (security_invoker = true) as
select product_id,
       count(*)::int as review_count,
       round(avg(rating)::numeric, 1) as avg_rating
from product_reviews
where status = 'approved'
group by product_id;

-- 8. Fonction submit_verified_review() — transaction atomique -------
create or replace function submit_verified_review(
  p_token_hash text,
  p_rating int,
  p_comment text,
  p_user_name text,
  p_photo_paths text[] default '{}',
  p_purchased_size text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_token review_tokens%rowtype;
  v_order_status text;
  v_review_id uuid;
  v_path text;
  v_sort int := 0;
begin
  if p_rating is null or p_rating < 1 or p_rating > 5 then
    raise exception 'REVIEW_INVALID_RATING';
  end if;
  if p_comment is null or char_length(trim(p_comment)) < 10 then
    raise exception 'REVIEW_INVALID_COMMENT';
  end if;
  if p_photo_paths is not null and array_length(p_photo_paths, 1) > 4 then
    raise exception 'REVIEW_TOO_MANY_PHOTOS';
  end if;

  select * into v_token
  from review_tokens
  where token_hash = p_token_hash
  for update;

  if not found then
    raise exception 'REVIEW_TOKEN_INVALID';
  end if;

  if v_token.expires_at < now() then
    raise exception 'REVIEW_TOKEN_EXPIRED';
  end if;

  if v_token.used_at is not null then
    raise exception 'REVIEW_TOKEN_USED';
  end if;

  select status into v_order_status
  from orders
  where id = v_token.order_id
  for update;

  if not found then
    raise exception 'REVIEW_ORDER_NOT_FOUND';
  end if;

  if v_order_status in ('cancelled', 'refunded') then
    raise exception 'REVIEW_ORDER_CANCELLED';
  end if;

  if not exists (select 1 from products where id = v_token.product_id) then
    raise exception 'REVIEW_PRODUCT_NOT_FOUND';
  end if;

  if exists (
    select 1 from product_reviews
    where order_id = v_token.order_id and product_id = v_token.product_id
  ) then
    raise exception 'REVIEW_ALREADY_EXISTS';
  end if;

  insert into product_reviews (
    product_id, user_id, user_name, rating, comment,
    status, verified_purchase, source,
    order_id, customer_email, purchased_size
  ) values (
    v_token.product_id, null, p_user_name, p_rating, trim(p_comment),
    'pending', true, 'review_link',
    v_token.order_id, v_token.customer_email, p_purchased_size
  )
  returning id into v_review_id;

  if p_photo_paths is not null then
    foreach v_path in array p_photo_paths loop
      insert into review_photos (review_id, private_storage_path, status, sort_order)
      values (v_review_id, v_path, 'pending', v_sort);
      v_sort := v_sort + 1;
    end loop;
  end if;

  update review_tokens
  set used_at = now(), review_id = v_review_id
  where id = v_token.id;

  return v_review_id;
end;
$$;

revoke execute on function submit_verified_review(text, int, text, text, text[], text) from public;
revoke execute on function submit_verified_review(text, int, text, text, text[], text) from anon;
revoke execute on function submit_verified_review(text, int, text, text, text[], text) from authenticated;
grant execute on function submit_verified_review(text, int, text, text, text[], text) to service_role;

-- 9. Storage — buckets et policies ----------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'review-uploads',
  'review-uploads',
  false,
  4194304, -- 4MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = false,
  file_size_limit = 4194304,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'review-photos',
  'review-photos',
  true,
  4194304,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 4194304,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

-- review-uploads : aucune policy pour anon/authenticated — accès
-- exclusivement via URL signées (upload) et service role (lecture/suppression).

-- review-photos : lecture publique seule, aucune écriture cliente.
drop policy if exists "Review photos are publicly accessible" on storage.objects;
create policy "Review photos are publicly accessible"
on storage.objects for select
using (bucket_id = 'review-photos');
