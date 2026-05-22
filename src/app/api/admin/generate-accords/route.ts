import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const { nom, marque } = await req.json()

  if (!nom) {
    return NextResponse.json({ error: 'nom requis' }, { status: 400 })
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY manquant' }, { status: 500 })
  }

  const prompt = `Tu es un expert en parfumerie.
Pour le parfum "${nom}" de la marque "${marque || 'inconnue'}", génère les 4-6 accords olfactifs principaux.

Réponds UNIQUEMENT avec un JSON valide, sans texte avant ou après :
[
  { "nom": "Accord", "intensite": 85, "couleur": "#hexcode" },
  ...
]

Règles :
- intensite entre 40 et 95
- Utilise EXACTEMENT ces couleurs officielles Fragrantica selon l'accord choisi :
  Boisé:#8B6914, Cèdre:#A0764A, Santal:#C4956A, Vétiver:#6B5C3E, Patchouli:#6B4C11, Oud:#4A2E0E,
  Floral:#E8A0BF, Rose:#E8607A, Jasmin:#F0E68C, Fleur blanche:#F5F0E8, Iris:#9B8EC4, Pivoine:#FF9EB5,
  Oriental:#C4541A, Ambré:#CC7722, Vanille:#F5C842, Gourmand:#8B4513, Caramel:#C68642, Miel:#D4A017,
  Musqué:#C4A882, Poudré:#D4A5A5, Doux:#E8C4C4, Crémeux:#F0D9B5,
  Épicé:#8B2500, Poivre:#5C3317, Cannelle:#8B4513, Cardamome:#6B4226,
  Frais:#4A9EBF, Agrume:#F4A523, Citron:#FFF44F, Bergamote:#D4E157, Aquatique:#2E86AB, Marin:#1A6B8A, Ozonic:#87CEEB,
  Vert:#5A8A3C, Aromatique:#7B9E5E, Fougère:#4A7B4F, Lavande:#967BB6, Herbal:#6B8E5E,
  Chypré:#6B8E23, Cuir:#8B4A2F, Fumé:#696969, Animalic:#7B5E3E,
  Fruité:#FF6B6B, Framboise:#C71585, Pêche:#FFCBA4, Cassis:#4B0082,
  Résineux:#8B6914, Encens:#704214, Myrrhe:#8B4513, Balsamique:#6B3A2A
- Les 4-6 accords les plus représentatifs du parfum
- Trié par intensité décroissante`

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Réponse IA invalide' }, { status: 500 })
    }

    const accords = JSON.parse(jsonMatch[0])
    return NextResponse.json({ accords })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('generate-accords error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
