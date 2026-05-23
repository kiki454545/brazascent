import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Quiz Olfactif — Trouvez Votre Parfum | Braza Scent',
  description: 'Répondez à 4 questions et découvrez les parfums faits pour vous. Quiz olfactif personnalisé par Braza Scent, maison de parfumerie d\'exception.',
  openGraph: {
    title: 'Quiz Olfactif — Trouvez Votre Parfum Idéal',
    description: '4 questions pour découvrir la fragrance qui vous correspond.',
    url: 'https://brazascent.com/quiz',
  },
}

export default function QuizLayout({ children }: { children: React.ReactNode }) {
  return children
}
