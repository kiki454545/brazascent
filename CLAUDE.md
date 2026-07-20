# BrazaScent — règles de déploiement

## Preview only pendant les itérations

Un audit ISR (juillet 2026) a établi que des déploiements en production répétés
pendant des cycles de correction (jusqu'à 16 en une seule matinée le 3 juillet)
sont la cause principale de la consommation excessive de Vercel ISR Write
Units : chaque déploiement régénère l'intégralité des pages statiques
(`generateStaticParams` sur `/parfum/[slug]`, `/marques/[slug]`,
`/notes/[note]`, `/packs/[slug]`, `/blog/[slug]`, `/parfums/[famille]`).

**Règle** :
- Tous les tests et itérations passent par `vercel` (Preview), jamais par
  `vercel --prod`.
- Un seul déploiement Production, après validation complète du lot de
  travail — jamais Production comme environnement de test.
- Ne jamais déployer en Production avec des changements non commités destinés
  à rester expérimentaux (`gitDirty`).

## Note

`.claude/settings.local.json` ne doit plus contenir d'auto-approbation pour
`vercel --prod` — toute demande de déploiement Production doit passer par une
confirmation explicite.
