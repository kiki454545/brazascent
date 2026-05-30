# Audit Sécurité & Performance Supabase — TODO

Audit réalisé le 2026-05-24.
Migrations appliquées :
- `20260524_harden_supabase_security_performance_safe.sql` — indexes FK, search_path, auth.uid() optim
- `20260524_fix_critical_rls_policies.sql` — 3 risques critiques corrigés
- `20260525_fix_high_rls_policies_phase2_safe.sql` — 5 risques hauts corrigés
- `20260525_phase3_finalize_rls.sql` — INSERT ouverts supprimés, newsletter_emails admin-only

---

## 1. Policies RLS — État après phase 1 + phase 2

### ~~`brands` — "Allow all operations on brands"~~ — ✅ CORRIGÉ 2026-05-25
- Migration `20260525_fix_high_rls_policies_phase2_safe.sql` — supprimée, remplacée par `"Admins can manage brands"` (is_admin check).

### ~~`orders` — "Lecture orders"~~ — ✅ CORRIGÉ 2026-05-24
- Migration `20260524_fix_critical_rls_policies.sql` — policy supprimée.

### ~~`orders` — "Modification orders"~~ — ✅ CORRIGÉ 2026-05-25
- Migration `20260525_fix_high_rls_policies_phase2_safe.sql` — supprimée. Admin UPDATE couvert par `"Admins can update all orders"`.

### ~~`order_items` — "Lecture order_items" et "Users can view own order items"~~ — ✅ CORRIGÉ 2026-05-25
- Migration `20260525_fix_high_rls_policies_phase2_safe.sql` — supprimées, remplacées par `"Users and admins can view order items"` (EXISTS sur orders.user_id ou is_admin).

### ~~`products` — "Allow update products"~~ — ✅ CORRIGÉ 2026-05-24
- Migration `20260524_fix_critical_rls_policies.sql` — policy supprimée.

### ~~`products` — "Modification products"~~ — ✅ CORRIGÉ 2026-05-24
- Migration `20260524_fix_critical_rls_policies.sql` — remplacée par `USING (EXISTS (... is_admin = true))`.

### ~~`home_videos` — "Admin full access"~~ — ✅ CORRIGÉ 2026-05-25
- Migration `20260525_fix_high_rls_policies_phase2_safe.sql` — supprimée, remplacée par `"Admins can manage home_videos"` (is_admin check).

### ~~`user_profiles` — "Lecture profil"~~ — ✅ CORRIGÉ 2026-05-24
- Migration `20260524_fix_critical_rls_policies.sql` — policy supprimée.

---

## 2. Risques restants (non corrigés)

### ~~`order_items` — INSERT trop ouvert~~ — ✅ CORRIGÉ 2026-05-25
- Migration `20260525_phase3_finalize_rls.sql` — `"Allow insert order_items"` et `"Insertion order_items"` supprimées.

### ~~`orders` — INSERT trop ouvert~~ — ✅ CORRIGÉ 2026-05-25
- Migration `20260525_phase3_finalize_rls.sql` — `"Allow insert orders"` et `"Insertion orders"` supprimées. `"Users can insert own orders"` conservée (filet de sécurité restrictif).

### ~~`newsletter_emails` — "Authenticated users can manage newsletter emails"~~ — ✅ CORRIGÉ 2026-05-25
- Migration `20260525_phase3_finalize_rls.sql` — remplacée par `"Admins can manage newsletter emails"` (is_admin check).

### `user_profiles` — "Insertion profil" (risque BAS)
- **Problème** : `INSERT with_check=true` → n'importe qui peut créer un profil quelconque (même avec un id arbitraire)
- **Note** : `"Users can insert own profile"` (uid=id) est plus restrictive mais coexiste
- **TODO** : supprimer `"Insertion profil"`, garder uniquement `"Users can insert own profile"`

---

## 3. Views — SECURITY DEFINER (signalé par advisor)

Le Supabase advisor signale 4 vues comme potentiellement SECURITY DEFINER.

- Vérifier avec : `SELECT viewname, definition FROM pg_views WHERE schemaname = 'public';`
- Si confirmé SECURITY DEFINER : recréer en SECURITY INVOKER ou documenter l'usage service_role

---

## 4. Policies en double (performance — risque BAS)

| Table | Doublon |
|-------|---------|
| `newsletter_subscribers` | "Anyone can subscribe" + "Insertion newsletter" (deux INSERT true) |
| `newsletter_subscribers` | "Authenticated users can view subscribers" + "Lecture newsletter" (même condition) |
| `order_items` | "Allow insert order_items" + "Insertion order_items" (deux INSERT true) — voir section 2 |
| `orders` | "Allow insert orders" + "Insertion orders" + "Users can insert own orders" (trois INSERT) — voir section 2 |
| `user_profiles` | "Users can read own profile" + "Users can view own profile" (identiques) |
| `settings` | "Anyone can read settings" + "Lecture settings" (identiques) |

---

## 5. Fonction `is_admin()` — SECURITY DEFINER

- `is_admin()` est SECURITY DEFINER, utilisée dans `user_profiles."Admins can read all profiles"`
- `search_path` fixé dans la migration phase 1 ✓
- Surveillance uniquement — aucune action requise

---

## Priorité restante

| Priorité | Item | Impact |
|----------|------|--------|
| 🟡 MOYEN | `newsletter_emails` trop large | Any auth user manage newsletter |
| 🟢 BAS | `order_items` INSERT with_check=true x2 | Théorique (service_role utilisé) |
| 🟢 BAS | `orders` INSERT with_check=true x2 | Idem |
| 🟢 BAS | `user_profiles."Insertion profil"` | Profil avec id arbitraire |
| 🟢 BAS | Policies en double | Performance uniquement |
| 🔵 INFO | Views SECURITY DEFINER | À vérifier manuellement |
