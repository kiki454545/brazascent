-- ============================================================
-- Lot 6.5 — Demandes d'avis manuelles (clients hors site)
-- Migration additive, ne modifie aucune table/colonne/fonction
-- existante des Lots 1 à 5. Table dédiée séparée de review_tokens
-- (order_id y est NOT NULL — incompatible avec des clients sans
-- commande). Aucune commande fictive créée.
-- ============================================================

-- 1. Nouvelle valeur d'enum ---------------------------------------
-- Non réversible simplement (voir note de rollback en fin de fichier).
alter type review_source add value if not exists 'social_manual';

-- 2. Table manual_review_requests ---------------------------------
create table manual_review_requests (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  first_name text not null,
  customer_email text,
  customer_phone_hash text,
  internal_note text,
  source_channel text check (source_channel in ('snapchat', 'instagram', 'tiktok', 'whatsapp', 'autre')),
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  disabled_at timestamptz,
  review_id uuid references product_reviews(id) on delete set null,
  created_at timestamptz not null default now(),
  created_by uuid references user_profiles(id) on delete set null,
  constraint manual_review_requests_first_name_not_blank
    check (char_length(trim(first_name)) > 0),
  constraint manual_review_requests_contact_required
    check (customer_email is not null or customer_phone_hash is not null),
  constraint manual_review_requests_expiry_after_creation
    check (expires_at > created_at)
);

create index idx_manual_review_requests_product on manual_review_requests(product_id);
create index idx_manual_review_requests_active
  on manual_review_requests(expires_at) where used_at is null and disabled_at is null;
create index idx_manual_review_requests_created on manual_review_requests(created_at desc);
create index idx_manual_review_requests_phone_hash
  on manual_review_requests(customer_phone_hash) where customer_phone_hash is not null;

alter table manual_review_requests enable row level security;
-- Aucune policy créée volontairement, comme review_tokens (Lot 1) :
-- verrouillé pour anon/authenticated. Seules la fonction SECURITY DEFINER
-- submit_social_review() et les routes admin (service role) y accèdent.
-- Pas de contrainte UNIQUE définitive sur (product_id, contact) : un même
-- client peut légitimement racheter le même produit hors site et être
-- resollicité — la prévention des demandes actives en double se fait côté
-- route API (vérification transactionnelle avant insertion), documentée
-- dans le code de la route de création.

-- 3. Fonction submit_social_review() — transaction atomique ---------
create or replace function submit_social_review(
  p_token_hash text,
  p_rating int,
  p_comment text,
  p_user_name text,
  p_photo_paths text[] default '{}'
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_request manual_review_requests%rowtype;
  v_review_id uuid;
  v_path text;
  v_sort int := 0;
begin
  if p_rating is null or p_rating < 1 or p_rating > 5 then
    raise exception 'MANUAL_REVIEW_INVALID_RATING';
  end if;
  if p_comment is null or char_length(trim(p_comment)) < 10 or char_length(p_comment) > 2000 then
    raise exception 'MANUAL_REVIEW_INVALID_COMMENT';
  end if;
  if p_photo_paths is not null and array_length(p_photo_paths, 1) > 4 then
    raise exception 'MANUAL_REVIEW_TOO_MANY_PHOTOS';
  end if;

  select * into v_request
  from manual_review_requests
  where token_hash = p_token_hash
  for update;

  if not found then
    raise exception 'MANUAL_REVIEW_TOKEN_INVALID';
  end if;

  if v_request.expires_at < now() then
    raise exception 'MANUAL_REVIEW_TOKEN_EXPIRED';
  end if;

  if v_request.used_at is not null then
    raise exception 'MANUAL_REVIEW_TOKEN_USED';
  end if;

  if v_request.disabled_at is not null then
    raise exception 'MANUAL_REVIEW_TOKEN_DISABLED';
  end if;

  if not exists (select 1 from products where id = v_request.product_id) then
    raise exception 'MANUAL_REVIEW_PRODUCT_NOT_FOUND';
  end if;

  insert into product_reviews (
    product_id, user_id, user_name, rating, comment,
    status, verified_purchase, source,
    order_id, customer_email
  ) values (
    v_request.product_id, null, p_user_name, p_rating, trim(p_comment),
    'pending', false, 'social_manual',
    null, v_request.customer_email
  )
  returning id into v_review_id;

  if p_photo_paths is not null then
    foreach v_path in array p_photo_paths loop
      insert into review_photos (review_id, private_storage_path, status, sort_order)
      values (v_review_id, v_path, 'pending', v_sort);
      v_sort := v_sort + 1;
    end loop;
  end if;

  update manual_review_requests
  set used_at = now(), review_id = v_review_id
  where id = v_request.id;

  return v_review_id;
end;
$$;

revoke execute on function submit_social_review(text, int, text, text, text[]) from public;
revoke execute on function submit_social_review(text, int, text, text, text[]) from anon;
revoke execute on function submit_social_review(text, int, text, text, text[]) from authenticated;
grant execute on function submit_social_review(text, int, text, text, text[]) to service_role;

-- ============================================================
-- Note de rollback (honnête, non simplifiée à l'excès) :
-- - `manual_review_requests` et `submit_social_review()` peuvent être
--   supprimées sans effet de bord (drop function / drop table), aucune
--   autre table n'y fait référence en dehors de product_reviews.review_id
--   qui est "on delete set null".
-- - La valeur d'enum 'social_manual' ajoutée à review_source par
--   `ALTER TYPE ... ADD VALUE` N'EST PAS réellement réversible par un simple
--   DROP : PostgreSQL ne permet pas de retirer une valeur d'un enum sans
--   recréer entièrement le type (renommer l'ancien, en créer un nouveau
--   sans la valeur, migrer toutes les colonnes qui l'utilisent, supprimer
--   l'ancien). Si aucune ligne product_reviews.source ne vaut jamais
--   'social_manual', la valeur reste inerte dans l'enum mais son retrait
--   complet nécessiterait cette opération lourde — non incluse ici.
-- ============================================================
