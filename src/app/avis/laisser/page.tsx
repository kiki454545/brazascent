import type { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import { hashToken } from '@/lib/reviews/token'
import { ReviewSubmitForm } from '@/components/reviews/ReviewSubmitForm'

// Page privée, personnalisée par token — jamais indexée.
export const metadata: Metadata = {
  title: 'Laisser un avis | Braza Scent',
  robots: { index: false, follow: false },
}

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface PageProps {
  searchParams: Promise<{ token?: string }>
}

type Resolved =
  | { state: 'invalid' }
  | { state: 'expired' }
  | { state: 'used' }
  | {
      state: 'valid'
      product: { name: string; brand: string | null; image: string | null }
      firstName: string
      purchasedSize: string | null
    }

function extractFirstName(fullName: string | null | undefined): string {
  if (!fullName) return ''
  return fullName.trim().split(/\s+/)[0] || ''
}

async function resolveToken(rawToken: string): Promise<Resolved> {
  const tokenHash = hashToken(rawToken)

  const { data: reviewToken } = await supabaseAdmin
    .from('review_tokens')
    .select('id, order_id, product_id, expires_at, used_at')
    .eq('token_hash', tokenHash)
    .maybeSingle()

  if (!reviewToken) return { state: 'invalid' }
  if (new Date(reviewToken.expires_at) < new Date()) return { state: 'expired' }
  if (reviewToken.used_at) return { state: 'used' }

  const [{ data: product }, { data: order }, { data: orderItem }] = await Promise.all([
    supabaseAdmin
      .from('products')
      .select('name, brand, images')
      .eq('id', reviewToken.product_id)
      .maybeSingle(),
    supabaseAdmin
      .from('orders')
      .select('customer_name, shipping_address')
      .eq('id', reviewToken.order_id)
      .maybeSingle(),
    supabaseAdmin
      .from('order_items')
      .select('size')
      .eq('order_id', reviewToken.order_id)
      .eq('product_id', reviewToken.product_id)
      .maybeSingle(),
  ])

  if (!product) return { state: 'invalid' }

  const shippingName = (order?.shipping_address as { name?: string } | null)?.name
  const firstName = extractFirstName(order?.customer_name || shippingName)

  return {
    state: 'valid',
    product: {
      name: product.name,
      brand: product.brand,
      image: Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : null,
    },
    firstName,
    purchasedSize: orderItem?.size ?? null,
  }
}

function TerminalState({
  title,
  message,
  tone = 'muted',
}: {
  title: string
  message: string
  tone?: 'muted' | 'primary'
}) {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 pt-20 pb-20">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-light tracking-[0.1em] uppercase mb-4">{title}</h1>
        <p className={`text-sm ${tone === 'primary' ? 'text-primary' : 'text-muted-foreground'}`}>
          {message}
        </p>
      </div>
    </div>
  )
}

export default async function LaisserAvisPage({ searchParams }: PageProps) {
  const { token } = await searchParams

  if (!token) {
    return (
      <TerminalState
        title="Lien invalide"
        message="Ce lien d'avis est incomplet ou incorrect."
      />
    )
  }

  const resolved = await resolveToken(token)

  if (resolved.state === 'invalid') {
    return (
      <TerminalState
        title="Lien invalide"
        message="Ce lien d'avis n'existe pas ou n'est plus valide."
      />
    )
  }

  if (resolved.state === 'expired') {
    return (
      <TerminalState
        title="Lien expiré"
        message="Ce lien a expiré. Contactez-nous si vous souhaitez tout de même laisser un avis."
      />
    )
  }

  if (resolved.state === 'used') {
    return (
      <TerminalState
        title="Avis déjà déposé"
        message="Un avis a déjà été envoyé avec ce lien. Merci pour votre confiance !"
        tone="primary"
      />
    )
  }

  return (
    <div className="min-h-screen pt-28 pb-20 px-6">
      <div className="max-w-lg mx-auto">
        <ReviewSubmitForm
          token={token}
          product={resolved.product}
          initialFirstName={resolved.firstName}
          purchasedSize={resolved.purchasedSize}
        />
      </div>
    </div>
  )
}
