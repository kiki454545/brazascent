'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { faqCategories } from './_data'

export default function FAQClient() {
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({})

  const toggleItem = (id: string) => {
    setOpenItems(prev => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <main className="min-h-screen bg-background">
      <section className="bg-black text-white pt-32 lg:pt-40 pb-16 lg:pb-24">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-3xl lg:text-5xl font-light tracking-[0.2em] uppercase mb-4">FAQ</h1>
          <p className="text-white text-lg">Questions fréquemment posées</p>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-6 py-16 lg:py-24">
        {faqCategories.map((category, categoryIndex) => (
          <div key={categoryIndex} className="mb-12 last:mb-0">
            <h2 className="text-xl font-medium tracking-[0.1em] uppercase mb-6 text-foreground border-b border-border pb-4">
              {category.title}
            </h2>
            <div className="space-y-4">
              {category.questions.map((item, itemIndex) => {
                const itemId = `${categoryIndex}-${itemIndex}`
                const isOpen = openItems[itemId]
                return (
                  <div key={itemId} className="border border-border rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleItem(itemId)}
                      aria-expanded={isOpen}
                      aria-controls={`faq-answer-${itemId}`}
                      className="w-full flex items-center justify-between p-5 text-left hover:bg-muted transition-colors"
                    >
                      <span className="font-medium text-foreground pr-4">{item.question}</span>
                      <ChevronDown className={`w-5 h-5 text-primary flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                    <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96' : 'max-h-0'}`}>
                      <p className="px-5 pb-5 text-muted-foreground leading-relaxed">{item.answer}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        <div className="mt-16 bg-cream rounded-lg p-8 text-center">
          <h3 className="text-xl font-medium text-foreground mb-3">
            Vous n&apos;avez pas trouvé la réponse à votre question ?
          </h3>
          <p className="text-muted-foreground mb-6">Notre équipe est là pour vous aider</p>
          <a
            href="/contact"
            className="inline-block px-8 py-3 bg-primary text-white text-sm tracking-[0.15em] uppercase font-medium hover:bg-gold-light transition-colors"
          >
            Nous contacter
          </a>
        </div>
      </section>
    </main>
  )
}
