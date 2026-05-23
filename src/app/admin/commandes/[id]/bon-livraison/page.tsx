import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import PrintButton from './PrintButton'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function BonLivraisonPage({ params }: PageProps) {
  const { id } = await params

  const [{ data: order }, { data: items }] = await Promise.all([
    supabaseAdmin.from('orders').select('*').eq('id', id).single(),
    supabaseAdmin.from('order_items').select('*').eq('order_id', id),
  ])

  if (!order) notFound()

  const addr = order.shipping_address || {}
  const date = new Date(order.created_at).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric'
  })

  return (
    <html lang="fr">
      <head>
        <meta charSet="utf-8" />
        <title>Bon de livraison #{order.order_number}</title>
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1a1a1a; background: white; padding: 0; }
          .page { max-width: 800px; margin: 0 auto; padding: 40px; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; padding-bottom: 24px; border-bottom: 2px solid #19110B; }
          .brand { font-size: 22px; font-weight: 300; letter-spacing: 0.2em; text-transform: uppercase; color: #19110B; }
          .brand-sub { font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: #C9A962; margin-top: 4px; }
          .order-info { text-align: right; }
          .order-number { font-size: 18px; font-weight: 600; }
          .order-date { font-size: 12px; color: #666; margin-top: 4px; }
          .title { font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 20px; padding-bottom: 8px; border-bottom: 1px solid #e5e5e5; }
          .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 36px; }
          .address-block p { font-size: 13px; line-height: 1.7; color: #333; }
          .address-block .name { font-weight: 600; font-size: 14px; margin-bottom: 2px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
          thead th { background: #f5f5f5; padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #666; border-bottom: 2px solid #e5e5e5; }
          tbody td { padding: 12px 12px; font-size: 13px; border-bottom: 1px solid #f0f0f0; vertical-align: top; }
          tbody tr:last-child td { border-bottom: none; }
          .totals { margin-left: auto; width: 240px; }
          .totals-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; }
          .totals-row.total { border-top: 2px solid #19110B; padding-top: 10px; margin-top: 4px; font-size: 16px; font-weight: 700; }
          .tracking-box { background: #f9f6f1; border-left: 3px solid #C9A962; padding: 14px 16px; margin-top: 24px; }
          .tracking-box p { font-size: 12px; color: #666; margin-bottom: 4px; }
          .tracking-box strong { font-size: 14px; font-family: monospace; }
          .footer { margin-top: 48px; padding-top: 20px; border-top: 1px solid #e5e5e5; text-align: center; }
          .footer p { font-size: 11px; color: #999; margin-bottom: 4px; }
          .no-print { margin: 16px; display: flex; gap: 8px; }
          @media print {
            .no-print { display: none !important; }
            .page { padding: 20px; }
            body { padding: 0; }
          }
        `}</style>
      </head>
      <body>
        <div className="no-print">
          <PrintButton />
        </div>

        <div className="page">
          {/* Header */}
          <div className="header">
            <div>
              <div className="brand">Braza Scent</div>
              <div className="brand-sub">Maison de parfumerie d&apos;exception</div>
            </div>
            <div className="order-info">
              <div className="order-number">Commande #{order.order_number}</div>
              <div className="order-date">Date : {date}</div>
              <div className="order-date" style={{ marginTop: 8, fontWeight: 600 }}>BON DE LIVRAISON</div>
            </div>
          </div>

          {/* Adresses */}
          <div className="grid-2">
            <div>
              <div className="title">Expéditeur</div>
              <div className="address-block">
                <p className="name">Braza Scent</p>
                <p>brazascent@gmail.com</p>
                <p>brazascent.com</p>
              </div>
            </div>
            <div>
              <div className="title">Destinataire</div>
              <div className="address-block">
                <p className="name">{addr.firstName} {addr.lastName}</p>
                {addr.company && <p>{addr.company}</p>}
                <p>{addr.address}</p>
                {addr.address2 && <p>{addr.address2}</p>}
                <p>{addr.postalCode} {addr.city}</p>
                <p>{addr.country || 'France'}</p>
                {addr.phone && <p>Tél : {addr.phone}</p>}
                {addr.email && <p>{addr.email}</p>}
              </div>
            </div>
          </div>

          {/* Articles */}
          <div className="title">Articles commandés</div>
          <table>
            <thead>
              <tr>
                <th>Référence</th>
                <th>Désignation</th>
                <th>Taille</th>
                <th style={{ textAlign: 'center' }}>Qté</th>
                <th style={{ textAlign: 'right' }}>Prix unitaire</th>
                <th style={{ textAlign: 'right' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {(items || []).map((item, i) => {
                const unitPrice = item.quantity > 0 ? (item.price / item.quantity) : item.price
                return (
                  <tr key={item.id || i}>
                    <td style={{ color: '#999', fontSize: 11 }}>{item.product_id?.slice(0, 8).toUpperCase()}</td>
                    <td style={{ fontWeight: 500 }}>{item.product_name}</td>
                    <td>{item.size}</td>
                    <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                    <td style={{ textAlign: 'right' }}>{unitPrice.toFixed(2)} €</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{item.price.toFixed(2)} €</td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {/* Totaux */}
          <div className="totals">
            <div className="totals-row">
              <span>Sous-total</span>
              <span>{(order.subtotal || 0).toFixed(2)} €</span>
            </div>
            <div className="totals-row">
              <span>Livraison ({order.shipping_method || 'Standard'})</span>
              <span>{order.shipping === 0 ? 'Offerte' : `${(order.shipping || 0).toFixed(2)} €`}</span>
            </div>
            {order.discount && order.discount > 0 && (
              <div className="totals-row" style={{ color: '#16a34a' }}>
                <span>Remise {order.promo_code ? `(${order.promo_code})` : ''}</span>
                <span>-{order.discount.toFixed(2)} €</span>
              </div>
            )}
            <div className="totals-row total">
              <span>Total TTC</span>
              <span>{(order.total || 0).toFixed(2)} €</span>
            </div>
          </div>

          {/* Transporteur */}
          {(order.carrier || order.tracking_number) && (
            <div className="tracking-box">
              <p>Transporteur : <strong>{order.carrier || '—'}</strong></p>
              {order.tracking_number && (
                <p>Numéro de suivi : <strong>{order.tracking_number}</strong></p>
              )}
              {order.tracking_url && (
                <p style={{ marginTop: 6, fontSize: 11 }}>
                  Suivi en ligne : <span style={{ color: '#C9A962' }}>{order.tracking_url}</span>
                </p>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="footer">
            <p>Merci pour votre commande sur brazascent.com</p>
            <p>Pour toute question : brazascent@gmail.com</p>
            <p style={{ marginTop: 8 }}>© {new Date().getFullYear()} Braza Scent — Tous droits réservés</p>
          </div>
        </div>
      </body>
    </html>
  )
}
