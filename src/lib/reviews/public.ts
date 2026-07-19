import { SupabaseClient } from '@supabase/supabase-js'

export interface ProductStats {
  avgRating: number
  reviewCount: number
}

export interface PublicReviewPhoto {
  id: string
  url: string
}

export interface PublicReview {
  id: string
  userName: string
  rating: number
  comment: string
  createdAt: string
  verifiedPurchase: boolean
  purchasedSize: string | null
  shopResponse: string | null
  shopResponseAt: string | null
  photos: PublicReviewPhoto[]
  product: { name: string; slug: string } | null
}

export type ReviewSort = 'recent' | 'top_rated' | 'with_photos'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const PUBLIC_PHOTO_PREFIX = `${SUPABASE_URL}/storage/v1/object/public/review-photos/`

/**
 * Statistiques (note moyenne, nombre d'avis) pour un lot de produits — une
 * seule requête groupée sur la vue product_review_stats (déjà filtrée sur
 * status='approved'), quel que soit le nombre de produits de la page.
 * Jamais une requête par produit.
 */
export async function getProductReviewStatsMap(
  supabase: SupabaseClient,
  productIds: string[]
): Promise<Map<string, ProductStats>> {
  const map = new Map<string, ProductStats>()
  if (productIds.length === 0) return map

  const { data } = await supabase
    .from('product_review_stats')
    .select('product_id, avg_rating, review_count')
    .in('product_id', productIds)

  for (const row of data || []) {
    map.set(row.product_id, { avgRating: Number(row.avg_rating), reviewCount: row.review_count })
  }
  return map
}

/** Répartition des notes (5→1 étoiles) pour un produit, ou sur tout le site si productId omis. */
export async function getRatingDistribution(
  supabase: SupabaseClient,
  productId?: string
): Promise<Record<1 | 2 | 3 | 4 | 5, number>> {
  let query = supabase.from('product_reviews').select('rating').eq('status', 'approved')
  if (productId) query = query.eq('product_id', productId)

  const { data } = await query
  const distribution: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  for (const row of data || []) {
    const r = row.rating as 1 | 2 | 3 | 4 | 5
    if (distribution[r] !== undefined) distribution[r]++
  }
  return distribution
}

export interface GetApprovedReviewsOptions {
  productId?: string
  sort?: ReviewSort
  minRating?: number
  withPhotosOnly?: boolean
  verifiedOnly?: boolean
  limit?: number
  offset?: number
}

/**
 * Avis approuvés (avec photos approuvées + réponse boutique), pour la fiche
 * produit ou pour /avis (productId omis). Toujours 2 requêtes maximum :
 * une pour les avis (page courante), une pour les photos des avis de cette
 * page — jamais une requête par avis.
 */
export async function getApprovedReviews(
  supabase: SupabaseClient,
  opts: GetApprovedReviewsOptions = {}
): Promise<{ reviews: PublicReview[]; total: number }> {
  const { productId, sort = 'recent', minRating, withPhotosOnly, verifiedOnly, limit = 10, offset = 0 } = opts

  let query = supabase
    .from('product_reviews')
    .select(
      'id, user_name, rating, comment, created_at, verified_purchase, purchased_size, shop_response, shop_response_at, product_id, products(name, slug)',
      { count: 'exact' }
    )
    .eq('status', 'approved')

  if (productId) query = query.eq('product_id', productId)
  if (minRating) query = query.eq('rating', minRating)
  if (verifiedOnly) query = query.eq('verified_purchase', true)

  if (sort === 'top_rated') {
    query = query.order('rating', { ascending: false }).order('created_at', { ascending: false })
  } else {
    // 'recent' et 'with_photos' trient par date — le filtre photo se fait après coup
    // (product_reviews n'a pas de colonne dénormalisée "has_photo" exploitable en tri SQL simple).
    query = query.order('created_at', { ascending: false })
  }

  // Pour le tri/filtre "avec photos", on sur-échantillonne puis on filtre et pagine en mémoire
  // sur une fenêtre bornée (jamais l'intégralité de la table) pour rester correct sans vue dédiée.
  const needsPhotoFilter = withPhotosOnly || sort === 'with_photos'
  const fetchLimit = needsPhotoFilter ? Math.max((offset + limit) * 4, 40) : limit
  const fetchOffset = needsPhotoFilter ? 0 : offset

  query = query.range(fetchOffset, fetchOffset + fetchLimit - 1)

  const { data, count } = await query
  const rows = data || []

  const reviewIds = rows.map((r) => r.id)
  const photosByReview = await getApprovedPhotosByReviewIds(supabase, reviewIds)

  let mapped: PublicReview[] = rows.map((r) => ({
    id: r.id,
    userName: r.user_name,
    rating: r.rating,
    comment: r.comment,
    createdAt: r.created_at,
    verifiedPurchase: r.verified_purchase,
    purchasedSize: r.purchased_size,
    shopResponse: r.shop_response,
    shopResponseAt: r.shop_response_at,
    photos: photosByReview.get(r.id) || [],
    product: Array.isArray(r.products) ? r.products[0] ?? null : (r.products as unknown as { name: string; slug: string } | null),
  }))

  let total = count ?? mapped.length

  if (needsPhotoFilter) {
    mapped = mapped.filter((r) => r.photos.length > 0)
    total = mapped.length // approximation : cohérent avec la fenêtre chargée, évite un COUNT(*) supplémentaire coûteux
    mapped = mapped.slice(offset, offset + limit)
  }

  return { reviews: mapped, total }
}

async function getApprovedPhotosByReviewIds(
  supabase: SupabaseClient,
  reviewIds: string[]
): Promise<Map<string, PublicReviewPhoto[]>> {
  const map = new Map<string, PublicReviewPhoto[]>()
  if (reviewIds.length === 0) return map

  const { data } = await supabase
    .from('review_photos')
    .select('id, review_id, public_storage_path, sort_order')
    .eq('status', 'approved')
    .in('review_id', reviewIds)
    .order('sort_order', { ascending: true })

  for (const row of data || []) {
    if (!row.public_storage_path) continue
    const list = map.get(row.review_id) || []
    list.push({ id: row.id, url: `${PUBLIC_PHOTO_PREFIX}${row.public_storage_path}` })
    map.set(row.review_id, list)
  }
  return map
}

/**
 * Sélection des avis mis en avant pour la homepage : achats vérifiés
 * d'abord, puis commentaire utile (assez long), puis photo, puis récence.
 * Aucune donnée inventée — uniquement des avis réellement approuvés.
 */
export async function getFeaturedReviews(supabase: SupabaseClient, limit = 12): Promise<PublicReview[]> {
  const { reviews } = await getApprovedReviews(supabase, { sort: 'recent', limit: 60, offset: 0 })

  const score = (r: PublicReview) => {
    let s = 0
    if (r.verifiedPurchase) s += 100
    if (r.comment.trim().length >= 40) s += 20
    if (r.photos.length > 0) s += 10
    return s
  }

  return [...reviews].sort((a, b) => score(b) - score(a)).slice(0, limit)
}
