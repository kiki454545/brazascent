'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Plus, Edit, Eye, EyeOff, Trash2, BookOpen } from 'lucide-react'

interface BlogPost {
  id: string
  slug: string
  title: string
  category: string
  is_published: boolean
  published_at: string | null
  created_at: string
}

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPosts = async () => {
    const { data } = await supabase
      .from('blog_posts')
      .select('id, slug, title, category, is_published, published_at, created_at')
      .order('created_at', { ascending: false })
    setPosts(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchPosts() }, [])

  const togglePublish = async (id: string, current: boolean) => {
    await supabase
      .from('blog_posts')
      .update({
        is_published: !current,
        published_at: !current ? new Date().toISOString() : null,
      })
      .eq('id', id)
    fetchPosts()
  }

  const deletePost = async (id: string) => {
    if (!confirm('Supprimer cet article définitivement ?')) return
    await supabase.from('blog_posts').delete().eq('id', id)
    fetchPosts()
  }

  const CATEGORY_LABELS: Record<string, string> = {
    conseils: 'Conseils',
    education: 'Éducation',
    tendances: 'Tendances',
    actualites: 'Actualités',
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-light tracking-[0.1em] uppercase">Blog</h1>
          <p className="text-muted-foreground text-sm mt-1">{posts.length} article{posts.length > 1 ? 's' : ''}</p>
        </div>
        <Link
          href="/admin/blog/nouveau"
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm tracking-[0.1em] uppercase hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nouvel article
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-20">
          <BookOpen className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">Aucun article pour le moment.</p>
          <Link href="/admin/blog/nouveau" className="text-primary hover:underline text-sm">
            Créer le premier article
          </Link>
        </div>
      ) : (
        <div className="border border-border">
          <table className="w-full">
            <thead className="bg-muted/30 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 text-xs tracking-[0.1em] uppercase text-muted-foreground">Titre</th>
                <th className="text-left px-4 py-3 text-xs tracking-[0.1em] uppercase text-muted-foreground hidden sm:table-cell">Catégorie</th>
                <th className="text-left px-4 py-3 text-xs tracking-[0.1em] uppercase text-muted-foreground hidden md:table-cell">Date</th>
                <th className="text-center px-4 py-3 text-xs tracking-[0.1em] uppercase text-muted-foreground">Statut</th>
                <th className="text-right px-4 py-3 text-xs tracking-[0.1em] uppercase text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post.id} className="border-b border-border hover:bg-muted/10 transition-colors">
                  <td className="px-4 py-4">
                    <p className="font-medium text-sm line-clamp-1">{post.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">/blog/{post.slug}</p>
                  </td>
                  <td className="px-4 py-4 hidden sm:table-cell">
                    <span className="text-xs px-2 py-1 bg-muted rounded">
                      {CATEGORY_LABELS[post.category] || post.category}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-muted-foreground hidden md:table-cell">
                    {post.published_at
                      ? new Date(post.published_at).toLocaleDateString('fr-FR')
                      : new Date(post.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <button
                      onClick={() => togglePublish(post.id, post.is_published)}
                      className={`inline-flex items-center gap-1 px-3 py-1 text-xs tracking-wider uppercase rounded-full transition-colors ${
                        post.is_published
                          ? 'bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-700'
                          : 'bg-muted text-muted-foreground hover:bg-green-100 hover:text-green-700'
                      }`}
                    >
                      {post.is_published ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      {post.is_published ? 'Publié' : 'Brouillon'}
                    </button>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/blog/${post.slug}`}
                        target="_blank"
                        className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                        title="Voir"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <Link
                        href={`/admin/blog/${post.id}`}
                        className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                        title="Modifier"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => deletePost(post.id)}
                        className="p-2 text-muted-foreground hover:text-red-600 transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
