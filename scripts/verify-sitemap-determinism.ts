/**
 * Vérifie que src/app/sitemap.ts produit une sortie strictement identique
 * (octet par octet) sur deux générations successives sans changement de
 * données — condition nécessaire pour que Vercel ne compte pas une nouvelle
 * ISR Write Unit à chaque régénération programmée du sitemap.
 *
 * Usage: npx tsx scripts/verify-sitemap-determinism.ts
 */

import sitemap from '../src/app/sitemap'

async function main() {
  const first = await sitemap()
  const second = await sitemap()

  const a = JSON.stringify(first)
  const b = JSON.stringify(second)

  if (a === b) {
    console.log(`✅ Sitemap déterministe : ${first.length} URLs, sortie identique sur 2 générations.`)
    return
  }

  console.error('❌ Sitemap NON déterministe : les deux générations diffèrent.')
  console.error(`   Génération 1: ${first.length} URLs, ${a.length} octets (JSON)`)
  console.error(`   Génération 2: ${second.length} URLs, ${b.length} octets (JSON)`)

  const byUrl = (list: typeof first) => new Map(list.map((e) => [e.url, e]))
  const mapA = byUrl(first)
  const mapB = byUrl(second)

  for (const [url, entryA] of mapA) {
    const entryB = mapB.get(url)
    if (!entryB) {
      console.error(`   Présent en 1, absent en 2: ${url}`)
      continue
    }
    if (JSON.stringify(entryA) !== JSON.stringify(entryB)) {
      console.error(`   Diff sur ${url}:`)
      console.error(`     1: ${JSON.stringify(entryA)}`)
      console.error(`     2: ${JSON.stringify(entryB)}`)
    }
  }
  for (const url of mapB.keys()) {
    if (!mapA.has(url)) console.error(`   Présent en 2, absent en 1: ${url}`)
  }

  process.exitCode = 1
}

main().catch((err) => {
  console.error('Erreur pendant la vérification:', err)
  process.exitCode = 1
})
