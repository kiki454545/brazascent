import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import { ArrowRight, BookOpen } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Blog Parfumerie | Braza Scent',
  description: 'Conseils, guides et inspirations autour de la parfumerie. Comment choisir son parfum, comprendre les familles olfactives, entretenir sa collection.',
  alternates: { canonical: 'https://brazascent.com/blog' },
  openGraph: {
    title: 'Blog | Braza Scent',
    description: 'Conseils et guides autour de la parfumerie d\'exception.',
    url: 'https://brazascent.com/blog',
    type: 'website',
    locale: 'fr_FR',
    siteName: 'Braza Scent',
  },
}

export const revalidate = 3600

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const CATEGORY_LABELS: Record<string, string> = {
  conseils: 'Conseils',
  education: 'Éducation',
  tendances: 'Tendances',
  actualites: 'Actualités',
}

export default async function BlogPage() {
  const { data: posts } = await supabase
    .from('blog_posts')
    .select('id, slug, title, excerpt, cover_image, category, author, published_at')
    .eq('is_published', true)
    .order('published_at', { ascending: false })

  const featured = posts?.[0]
  const rest = posts?.slice(1) || []

  return (
    <div className="min-h-screen pt-24 pb-24 bg-background">
      <div className="max-w-6xl mx-auto px-6 sm:px-10">

        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 text-primary text-xs tracking-[0.3em] uppercase mb-4">
            <BookOpen className="w-4 h-4" />
            Le journal
          </div>
          <h1 className="text-4xl font-light tracking-[0.15em] uppercase mb-3">
            Blog Parfumerie
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Conseils d&apos;experts, guides olfactifs et inspirations pour enrichir votre rapport au parfum
          </p>
        </div>

        {/* Article à la une */}
        {featured && (
          <Link href={`/blog/${featured.slug}`} className="group block mb-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="relative aspect-[16/9] bg-cream overflow-hidden">
                {featured.cover_image ? (
                  <Image
                    src={featured.cover_image}
                    alt={featured.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full bg-cream" />
                )}
                <div className="absolute top-4 left-4 px-3 py-1 bg-primary text-white text-xs tracking-wider uppercase">
                  À la une
                </div>
              </div>
              <div>
                {featured.category && (
                  <p className="text-primary text-xs tracking-[0.2em] uppercase mb-3">
                    {CATEGORY_LABELS[featured.category] || featured.category}
                  </p>
                )}
                <h2 className="text-2xl sm:text-3xl font-light tracking-[0.08em] uppercase mb-4 group-hover:text-primary transition-colors">
                  {featured.title}
                </h2>
                {featured.excerpt && (
                  <p className="text-muted-foreground leading-relaxed mb-6 line-clamp-3">
                    {featured.excerpt}
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {featured.published_at
                      ? new Date(featured.published_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
                      : ''}
                  </span>
                  <span className="inline-flex items-center gap-2 text-sm text-primary tracking-[0.1em] uppercase group-hover:gap-3 transition-all">
                    Lire l&apos;article
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </div>
          </Link>
        )}

        {/* Grille d'articles */}
        {rest.length > 0 && (
          <>
            <div className="border-t border-border mb-12" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {rest.map((post) => (
                <Link key={post.id} href={`/blog/${post.slug}`} className="group block">
                  <div className="relative aspect-[16/9] bg-cream mb-4 overflow-hidden">
                    {post.cover_image ? (
                      <Image
                        src={post.cover_image}
                        alt={post.title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full bg-cream" />
                    )}
                  </div>
                  {post.category && (
                    <p className="text-primary text-xs tracking-[0.2em] uppercase mb-2">
                      {CATEGORY_LABELS[post.category] || post.category}
                    </p>
                  )}
                  <h3 className="text-lg font-light tracking-[0.05em] uppercase mb-2 group-hover:text-primary transition-colors line-clamp-2">
                    {post.title}
                  </h3>
                  {post.excerpt && (
                    <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2 mb-3">
                      {post.excerpt}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {post.published_at
                      ? new Date(post.published_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
                      : ''}
                  </p>
                </Link>
              ))}
            </div>
          </>
        )}

        {(!posts || posts.length === 0) && (
          <div className="text-center py-20">
            <BookOpen className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">Aucun article pour le moment.</p>
          </div>
        )}
      </div>
    </div>
  )
}
