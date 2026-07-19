-- Lot 4 — Système d'avis : état transitoire 'sending'
-- Appliquée en production via Supabase MCP (apply_migration, nom
-- "add_sending_status_post_purchase_emails") — ce fichier est la copie de
-- référence versionnée dans le repo.
--
-- Ajoute 'sending' aux valeurs autorisées par post_purchase_emails_status_check.
-- Utilisé par le cron expéditeur (/api/cron/post-purchase-emails) pour
-- réclamer atomiquement une ligne avant traitement
-- (UPDATE ... WHERE status = 'pending' RETURNING id), ce qui protège contre
-- le double envoi en cas d'exécutions concurrentes du cron. Changement
-- additif et réversible : élargit uniquement la liste de valeurs autorisées,
-- aucune donnée existante modifiée.

alter table post_purchase_emails drop constraint post_purchase_emails_status_check;
alter table post_purchase_emails add constraint post_purchase_emails_status_check
  check (status = any (array['pending'::text, 'sending'::text, 'sent'::text, 'failed'::text, 'skipped'::text]));

-- Rollback :
-- alter table post_purchase_emails drop constraint post_purchase_emails_status_check;
-- alter table post_purchase_emails add constraint post_purchase_emails_status_check
--   check (status = any (array['pending'::text, 'sent'::text, 'failed'::text, 'skipped'::text]));
