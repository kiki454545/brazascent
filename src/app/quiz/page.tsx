'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { m, AnimatePresence } from 'framer-motion'
import { ArrowRight, ArrowLeft, RotateCcw, Sparkles } from 'lucide-react'
import { supabase } from '@/lib/supabase'

// Mots-clés par famille olfactive (recherchés dans notes et accords)
const FAMILY_KEYWORDS: Record<string, string[]> = {
  florale: ['rose', 'jasmin', 'iris', 'pivoine', 'fleur', 'ylang', 'violet', 'magnolia', 'muguet', 'lilas', 'freesia', 'orchidée', 'géranium'],
  boisee: ['cèdre', 'santal', 'vétiver', 'bois', 'oud', 'patchouli', 'gaiac', 'chêne', 'mousse', 'cyprès', 'bambou'],
  orientale: ['ambre', 'musc', 'vanille', 'benjoin', 'résine', 'cannelle', 'cardamome', 'encens', 'fève', 'tonka', 'labdanum', 'myrrhe'],
  fraiche: ['bergamote', 'citron', 'mandarine', 'agrumes', 'menthe', 'aquatique', 'marine', 'gingembre', 'thé', 'herbe', 'fougère', 'lavande'],
}

const INTENSITY_CATEGORY: Record<string, string[]> = {
  legere: ['Eau de Toilette', 'Eau de Cologne'],
  moderee: ['Eau de Parfum'],
  intense: ['Extrait de Parfum', 'Parfum'],
}

const steps = [
  {
    id: 'occasion',
    title: 'Pour quelle occasion ?',
    subtitle: 'Votre parfum doit s\'adapter à votre vie',
    options: [
      { id: 'quotidien', label: 'Quotidien', emoji: '☀️', desc: 'Léger et discret', family: 'fraiche', intensity: 'legere' },
      { id: 'travail', label: 'Travail', emoji: '💼', desc: 'Professionnel et raffiné', family: 'florale', intensity: 'moderee' },
      { id: 'soiree', label: 'Soirée', emoji: '✨', desc: 'Marquant et séduisant', family: 'orientale', intensity: 'intense' },
      { id: 'romantique', label: 'Romantique', emoji: '🌹', desc: 'Sensuel et envoûtant', family: 'orientale', intensity: 'moderee' },
    ],
  },
  {
    id: 'famille',
    title: 'Quelle famille vous attire ?',
    subtitle: 'Choisissez l\'univers qui vous correspond',
    options: [
      { id: 'florale', label: 'Florale', emoji: '🌸', desc: 'Rose, jasmin, iris, pivoine' },
      { id: 'boisee', label: 'Boisée', emoji: '🌲', desc: 'Cèdre, santal, oud, vétiver' },
      { id: 'orientale', label: 'Orientale', emoji: '🪔', desc: 'Ambre, musc, vanille, épices' },
      { id: 'fraiche', label: 'Fraîche', emoji: '🍃', desc: 'Agrumes, menthe, aquatique' },
    ],
  },
  {
    id: 'intensite',
    title: 'Quelle intensité ?',
    subtitle: 'La concentration définit la durée de tenue',
    options: [
      { id: 'legere', label: 'Légère', emoji: '🌬️', desc: 'Eau de Toilette — fraîche et aérienne' },
      { id: 'moderee', label: 'Modérée', emoji: '💐', desc: 'Eau de Parfum — équilibrée et élégante' },
      { id: 'intense', label: 'Intense', emoji: '🔥', desc: 'Extrait — puissante et longue durée' },
    ],
  },
  {
    id: 'saison',
    title: 'Pour quelle saison ?',
    subtitle: 'Le climat influence la perception du parfum',
    options: [
      { id: 'printemps', label: 'Printemps', emoji: '🌷', desc: 'Frais et fleuri', family: 'florale' },
      { id: 'ete', label: 'Été', emoji: '🌞', desc: 'Léger et pétillant', family: 'fraiche' },
      { id: 'automne', label: 'Automne', emoji: '🍂', desc: 'Chaud et épicé', family: 'orientale' },
      { id: 'hiver', label: 'Hiver', emoji: '❄️', desc: 'Enveloppant et profond', family: 'boisee' },
    ],
  },
]

interface Answers {
  occasion?: string
  famille?: string
  intensite?: string
  saison?: string
}

interface ScoredProduct {
  product: any
  score: number
}

function scoreProduct(product: any, answers: Answers): number {
  let score = 0
  const allNotes = [
    ...(product.notes_top || []),
    ...(product.notes_heart || []),
    ...(product.notes_base || []),
    ...(product.main_accords || []),
    ...(product.accords?.map((a: any) => a.name || a) || []),
  ].map((n: string) => n.toLowerCase())

  // Famille principale de l'étape "famille"
  const primaryFamily = answers.famille
  if (primaryFamily && FAMILY_KEYWORDS[primaryFamily]) {
    const keywords = FAMILY_KEYWORDS[primaryFamily]
    const matches = allNotes.filter(note => keywords.some(kw => note.includes(kw))).length
    score += matches * 3
  }

  // Famille suggérée par l'occasion
  const occasionStep = steps[0].options.find(o => o.id === answers.occasion)
  if (occasionStep && 'family' in occasionStep) {
    const occFamily = (occasionStep as any).family as string
    if (occFamily && FAMILY_KEYWORDS[occFamily]) {
      const keywords = FAMILY_KEYWORDS[occFamily]
      const matches = allNotes.filter(note => keywords.some(kw => note.includes(kw))).length
      score += matches
    }
  }

  // Famille suggérée par la saison
  const saisonStep = steps[3].options.find(o => o.id === answers.saison)
  if (saisonStep && 'family' in saisonStep) {
    const saisonFamily = (saisonStep as any).family as string
    if (saisonFamily && FAMILY_KEYWORDS[saisonFamily]) {
      const keywords = FAMILY_KEYWORDS[saisonFamily]
      const matches = allNotes.filter(note => keywords.some(kw => note.includes(kw))).length
      score += matches
    }
  }

  // Intensité / catégorie
  const intensite = answers.intensite
  if (intensite && INTENSITY_CATEGORY[intensite]) {
    if (INTENSITY_CATEGORY[intensite].includes(product.category)) {
      score += 4
    }
  }

  // Bonus bestseller
  if (product.is_bestseller) score += 1
  if (product.is_new) score += 0.5
  if (product.stock > 0) score += 1

  return score
}

export default function QuizPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState<Answers>({})
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const step = steps[currentStep]
  const totalSteps = steps.length

  const handleAnswer = async (optionId: string) => {
    const newAnswers = { ...answers, [step.id]: optionId }
    setAnswers(newAnswers)

    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      // Dernière réponse — calculer les résultats
      setLoading(true)
      const { data } = await supabase
        .from('products')
        .select('id, name, slug, images, price, price_by_size, category, brand, notes_top, notes_heart, notes_base, main_accords, accords, is_bestseller, is_new, stock, is_active')
        .eq('is_active', true)
        .gt('stock', 0)

      if (data) {
        const scored: ScoredProduct[] = data.map(p => ({ product: p, score: scoreProduct(p, newAnswers) }))
        scored.sort((a, b) => b.score - a.score)
        setResults(scored.slice(0, 6).map(s => s.product))
      }
      setLoading(false)
      setDone(true)
    }
  }

  const reset = () => {
    setCurrentStep(0)
    setAnswers({})
    setResults([])
    setDone(false)
  }

  const getPrice = (p: any) => {
    const priceBySize = typeof p.price_by_size === 'string' ? JSON.parse(p.price_by_size) : (p.price_by_size || {})
    const prices = Object.values(priceBySize).filter((v): v is number => typeof v === 'number' && v > 0)
    return prices.length > 0 ? Math.min(...prices) : p.price
  }

  return (
    <div className="min-h-screen pt-24 pb-24 bg-background">
      <div className="max-w-3xl mx-auto px-6">

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 text-primary text-xs tracking-[0.3em] uppercase mb-4">
            <Sparkles className="w-4 h-4" />
            Quiz olfactif
          </div>
          <h1 className="text-4xl font-light tracking-[0.15em] uppercase mb-3">
            Trouvez votre parfum
          </h1>
          <p className="text-muted-foreground">
            4 questions pour découvrir la fragrance qui vous correspond
          </p>
        </div>

        <AnimatePresence mode="wait">
          {loading && (
            <m.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-20">
              <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Analyse de vos préférences...</p>
            </m.div>
          )}

          {!loading && done && (
            <m.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="text-center mb-10">
                <div className="text-4xl mb-3">✨</div>
                <h2 className="text-2xl font-light tracking-[0.1em] uppercase mb-2">Vos parfums idéaux</h2>
                <p className="text-muted-foreground text-sm">Sélectionnés selon vos préférences</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-10">
                {results.map((p, i) => (
                  <m.div key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                    <Link href={`/parfum/${p.slug}`} className="group block">
                      <div className="relative aspect-[3/4] bg-cream mb-3 overflow-hidden">
                        {p.images?.[0] && (
                          <Image
                            src={p.images[0]}
                            alt={p.name}
                            fill
                            sizes="(max-width: 640px) 50vw, 33vw"
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        )}
                        {i === 0 && (
                          <div className="absolute top-3 left-3 px-2 py-1 bg-primary text-white text-[10px] tracking-wider uppercase">
                            Meilleur match
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-primary tracking-[0.15em] uppercase mb-1">{p.brand}</p>
                      <h3 className="text-sm font-light tracking-[0.05em] uppercase group-hover:text-primary transition-colors line-clamp-2 mb-1">{p.name}</h3>
                      <p className="text-sm">À partir de {getPrice(p)} €</p>
                    </Link>
                  </m.div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button onClick={reset} className="flex items-center justify-center gap-2 px-6 py-3 border border-border text-sm tracking-[0.1em] uppercase hover:border-foreground transition-colors">
                  <RotateCcw className="w-4 h-4" />
                  Recommencer
                </button>
                <Link href="/parfums" className="flex items-center justify-center gap-2 px-8 py-3 bg-foreground text-background text-sm tracking-[0.1em] uppercase hover:bg-primary transition-colors">
                  Voir tous les parfums
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </m.div>
          )}

          {!loading && !done && (
            <m.div key={currentStep} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }}>
              {/* Progress */}
              <div className="mb-10">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                  <span>Étape {currentStep + 1} sur {totalSteps}</span>
                  <span>{Math.round(((currentStep) / totalSteps) * 100)}%</span>
                </div>
                <div className="h-1 bg-muted rounded-full overflow-hidden">
                  <m.div
                    className="h-full bg-primary rounded-full"
                    initial={{ width: `${(currentStep / totalSteps) * 100}%` }}
                    animate={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
                    transition={{ duration: 0.4 }}
                  />
                </div>
              </div>

              {/* Question */}
              <div className="text-center mb-10">
                <h2 className="text-2xl sm:text-3xl font-light tracking-[0.1em] uppercase mb-2">{step.title}</h2>
                <p className="text-muted-foreground text-sm">{step.subtitle}</p>
              </div>

              {/* Options */}
              <div className="grid grid-cols-2 gap-4">
                {step.options.map(option => (
                  <button
                    key={option.id}
                    onClick={() => handleAnswer(option.id)}
                    className="group p-6 border border-border hover:border-primary hover:bg-primary/5 transition-all text-left"
                  >
                    <div className="text-3xl mb-3">{option.emoji}</div>
                    <p className="font-medium tracking-[0.05em] uppercase text-sm mb-1 group-hover:text-primary transition-colors">{option.label}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{option.desc}</p>
                  </button>
                ))}
              </div>

              {/* Back */}
              {currentStep > 0 && (
                <button
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="mt-8 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mx-auto"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Revenir
                </button>
              )}
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
