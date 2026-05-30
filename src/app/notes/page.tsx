import type { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import Image from 'next/image'
import { noteToSlug } from '@/lib/notes'

const SITE_URL = 'https://brazascent.com'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Notes Olfactives — Explorer par note | Braza Scent',
  description: 'Découvrez nos décants de parfums classés par note olfactive. Rose, vanille, oud, ambre, musc, bergamote… explorez les fragrances selon les notes qui vous attirent.',
  alternates: { canonical: `${SITE_URL}/notes` },
  openGraph: {
    title: 'Notes Olfactives — Explorer par note | Braza Scent',
    description: 'Parcourez nos décants de parfums par note olfactive.',
    url: `${SITE_URL}/notes`,
    type: 'website',
    locale: 'fr_FR',
    siteName: 'Braza Scent',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Notes Olfactives — Explorer par note | Braza Scent',
    description: 'Parcourez nos décants de parfums par note olfactive.',
  },
}

export default async function NotesPage() {
  const [{ data }, { data: noteImages }] = await Promise.all([
    supabase
      .from('products')
      .select('notes_top, notes_heart, notes_base')
      .eq('is_active', true),
    supabase
      .from('note_images')
      .select('note_name, image_url'),
  ])

  // Map lowercase note name → image URL
  const imageByNote = new Map<string, string>()
  for (const row of (noteImages || [])) {
    if (row.note_name && row.image_url)
      imageByNote.set(row.note_name.toLowerCase(), row.image_url)
  }

  const noteMap = new Map<string, string>() // slug → display name
  const noteCount = new Map<string, number>() // slug → product count

  for (const p of (data || [])) {
    const allNotes = [
      ...(p.notes_top || []),
      ...(p.notes_heart || []),
      ...(p.notes_base || []),
    ]
    const seen = new Set<string>()
    for (const note of allNotes) {
      if (!note) continue
      const slug = noteToSlug(note)
      if (!noteMap.has(slug)) noteMap.set(slug, note)
      if (!seen.has(slug)) {
        seen.add(slug)
        noteCount.set(slug, (noteCount.get(slug) || 0) + 1)
      }
    }
  }

  const notes = Array.from(noteMap.entries())
    .map(([slug, name]) => ({
      slug,
      name,
      count: noteCount.get(slug) || 0,
      image: imageByNote.get(name.toLowerCase()) ?? null,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'fr'))

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Accueil', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Notes olfactives', item: `${SITE_URL}/notes` },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'Notes Olfactives — Braza Scent',
      description: 'Explorez nos décants de parfums classés par note olfactive.',
      url: `${SITE_URL}/notes`,
    },
  ]

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="min-h-screen">
        <section className="pt-32 pb-12 bg-background border-b border-border">
          <div className="max-w-5xl mx-auto px-6 sm:px-10 lg:px-20 text-center">
            <nav className="flex justify-center items-center gap-2 text-sm text-muted-foreground mb-8">
              <Link href="/" className="hover:text-primary transition-colors">Accueil</Link>
              <span className="text-muted-foreground/50">/</span>
              <span className="text-foreground">Notes olfactives</span>
            </nav>
            <h1 className="text-3xl lg:text-5xl font-light tracking-[0.15em] uppercase mb-6">
              Notes Olfactives
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed text-sm sm:text-base">
              Choisir un parfum par sa note dominante est l&apos;une des façons les plus directes
              d&apos;explorer la parfumerie. Vanille, rose, oud, ambre, musc — chaque note raconte
              une histoire, définit une ambiance. Nos décants vous permettent de tester chaque
              fragrance sur votre peau avant tout investissement dans un flacon complet.
            </p>
          </div>
        </section>

        <section className="py-16 bg-background">
          <div className="max-w-6xl mx-auto px-6 sm:px-10 lg:px-20">
            {notes.length === 0 ? (
              <p className="text-center text-muted-foreground py-20">
                Aucune note disponible pour le moment.
              </p>
            ) : (
              <>
                <p className="text-sm text-muted-foreground mb-8">
                  {notes.length} notes disponibles
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {notes.map(({ slug, name, count, image }) => (
                    <Link
                      key={slug}
                      href={`/notes/${slug}`}
                      className="group flex items-center gap-3 px-3 py-3 border border-border hover:border-primary transition-colors"
                    >
                      <div className="w-10 h-10 flex-shrink-0 overflow-hidden rounded-sm bg-muted">
                        {image ? (
                          <Image
                            src={image}
                            alt={name}
                            width={40}
                            height={40}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <div className="w-full h-full bg-muted" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="block truncate text-sm font-medium group-hover:text-primary transition-colors">
                          {name}
                        </span>
                        <span className="text-xs text-muted-foreground group-hover:text-primary/70 transition-colors">
                          {count} parfum{count > 1 ? 's' : ''}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>

        <section className="py-12 bg-cream">
          <div className="max-w-4xl mx-auto px-6 sm:px-10 lg:px-20 text-center">
            <p className="text-xs text-muted-foreground/70 italic">
              BrazaScent propose des décants préparés à partir de flacons authentiques.
              BrazaScent n&apos;est pas affilié aux marques citées. Les noms de marques sont
              utilisés uniquement à titre informatif.
            </p>
          </div>
        </section>
      </div>
    </>
  )
}
