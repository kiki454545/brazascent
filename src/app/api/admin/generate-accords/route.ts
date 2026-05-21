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
- couleur en hexadécimal cohérente avec l'accord :
  Boisé: #8B6B14, Frais: #4A9EBF, Floral: #E8A0BF,
  Musqué: #C4A882, Épicé: #C4541A, Vanillé: #F5C842,
  Oriental: #8B3A3A, Agrume: #F4A523, Aquatique: #2E86AB,
  Poudré: #D4A5A5, Vert: #5A8A3C, Gourmand: #8B4513,
  Ambré: #CC7722, Chypré: #6B8E23, Fougère: #4A7B4F
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
