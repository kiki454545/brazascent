import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { ArrowLeft, ArrowRight, BookOpen } from 'lucide-react'

export const revalidate = 3600

const SITE_URL = 'https://brazascent.com'

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

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const { data: post } = await supabase
    .from('blog_posts')
    .select('title, excerpt, cover_image')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  if (!post) return { title: 'Article introuvable' }

  return {
    title: `${post.title} | Blog Braza Scent`,
    description: post.excerpt || `Lire l'article "${post.title}" sur le blog Braza Scent.`,
    alternates: { canonical: `${SITE_URL}/blog/${slug}` },
    openGraph: {
      title: `${post.title} | Braza Scent`,
      description: post.excerpt || '',
      url: `${SITE_URL}/blog/${slug}`,
      type: 'article',
      locale: 'fr_FR',
      siteName: 'Braza Scent',
      ...(post.cover_image && {
        images: [{ url: post.cover_image, width: 1200, height: 630, alt: post.title }],
      }),
    },
  }
}

export default async function BlogArticlePage({ params }: PageProps) {
  const { slug } = await params

  const [{ data: post }, { data: related }] = await Promise.all([
    supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', slug)
      .eq('is_published', true)
      .single(),
    supabase
      .from('blog_posts')
      .select('slug, title, cover_image, category, published_at, excerpt')
      .eq('is_published', true)
      .neq('slug', slug)
      .order('published_at', { ascending: false })
      .limit(3),
  ])

  if (!post) notFound()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    image: post.cover_image,
    author: { '@type': 'Organization', name: post.author || 'Braza Scent' },
    publisher: { '@type': 'Organization', name: 'Braza Scent', url: SITE_URL },
    datePublished: post.published_at,
    dateModified: post.updated_at,
    url: `${SITE_URL}/blog/${slug}`,
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="min-h-screen pt-24 pb-24 bg-background">

        {/* Breadcrumb */}
        <div className="max-w-3xl mx-auto px-6 mb-8">
          <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Retour au blog
          </Link>
        </div>

        {/* Header article */}
        <div className="max-w-3xl mx-auto px-6 mb-10">
          {post.category && (
            <p className="text-primary text-xs tracking-[0.2em] uppercase mb-4">
              {CATEGORY_LABELS[post.category] || post.category}
            </p>
          )}
          <h1 className="text-3xl sm:text-4xl font-light tracking-[0.08em] uppercase mb-4">
            {post.title}
          </h1>
          {post.excerpt && (
            <p className="text-xl text-muted-foreground leading-relaxed mb-6">
              {post.excerpt}
            </p>
          )}
          <div className="flex items-center gap-4 text-sm text-muted-foreground border-t border-border pt-4">
            <span>{post.author || 'Braza Scent'}</span>
            <span>·</span>
            <span>
              {post.published_at
                ? new Date(post.published_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
                : ''}
            </span>
          </div>
        </div>

        {/* Image de couverture */}
        {post.cover_image && (
          <div className="max-w-4xl mx-auto px-6 mb-12">
            <div className="relative aspect-[16/9] overflow-hidden">
              <Image
                src={post.cover_image}
                alt={post.title}
                fill
                sizes="(max-width: 1024px) 100vw, 900px"
                className="object-cover"
                priority
              />
            </div>
          </div>
        )}

        {/* Contenu */}
        <div
          className="max-w-3xl mx-auto px-6 prose prose-sm sm:prose-base prose-headings:font-light prose-headings:tracking-wide prose-headings:uppercase prose-a:text-primary prose-strong:text-foreground prose-p:text-muted-foreground prose-p:leading-relaxed"
          dangerouslySetInnerHTML={{ __html: post.content || '' }}
        />

        {/* CTA */}
        <div className="max-w-3xl mx-auto px-6 mt-16">
          <div className="bg-cream p-8 text-center">
            <BookOpen className="w-8 h-8 text-primary mx-auto mb-3" />
            <h3 className="text-lg tracking-[0.1em] uppercase mb-2">Prêt à trouver votre parfum ?</h3>
            <p className="text-muted-foreground text-sm mb-5">
              Utilisez notre quiz olfactif pour découvrir la fragrance idéale selon vos préférences.
            </p>
            <Link
              href="/quiz"
              className="inline-flex items-center gap-2 px-6 py-3 bg-foreground text-background text-sm tracking-[0.1em] uppercase hover:bg-primary transition-colors"
            >
              Faire le quiz
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Articles liés */}
        {related && related.length > 0 && (
          <div className="max-w-6xl mx-auto px-6 sm:px-10 mt-20">
            <h2 className="text-xl font-light tracking-[0.15em] uppercase text-center mb-10">
              À lire aussi
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              {related.map((r) => (
                <Link key={r.slug} href={`/blog/${r.slug}`} className="group block">
                  <div className="relative aspect-[16/9] bg-cream mb-4 overflow-hidden">
                    {r.cover_image && (
                      <Image
                        src={r.cover_image}
                        alt={r.title}
                        fill
                        sizes="33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    )}
                  </div>
                  {r.category && (
                    <p className="text-primary text-xs tracking-[0.2em] uppercase mb-2">
                      {CATEGORY_LABELS[r.category] || r.category}
                    </p>
                  )}
                  <h3 className="font-light tracking-[0.05em] uppercase group-hover:text-primary transition-colors line-clamp-2">
                    {r.title}
                  </h3>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
