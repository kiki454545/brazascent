import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

// Client Supabase avec service role pour bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Liste des user agents de bots connus
const BOT_PATTERNS = [
  'googlebot', 'bingbot', 'slurp', 'duckduckbot', 'baiduspider',
  'yandexbot', 'sogou', 'exabot', 'facebot', 'facebookexternalhit',
  'ia_archiver', 'linkedinbot', 'twitterbot', 'pinterest', 'semrushbot',
  'ahrefsbot', 'mj12bot', 'dotbot', 'petalbot', 'bytespider',
  'gptbot', 'claudebot', 'anthropic', 'crawler', 'spider', 'bot',
  'headless', 'phantom', 'selenium', 'puppeteer', 'playwright'
]

// Détecter si c'est un bot
function isBot(userAgent: string): boolean {
  const ua = userAgent.toLowerCase()
  return BOT_PATTERNS.some(pattern => ua.includes(pattern))
}

// Parser le user agent pour extraire device, browser, OS
function parseUserAgent(userAgent: string): { device: string; browser: string; os: string } {
  const ua = userAgent.toLowerCase()

  // Device
  let device = 'desktop'
  if (/mobile|android|iphone|ipad|ipod|blackberry|windows phone/i.test(ua)) {
    device = /ipad|tablet/i.test(ua) ? 'tablet' : 'mobile'
  }

  // Browser
  let browser = 'Unknown'
  if (ua.includes('firefox')) browser = 'Firefox'
  else if (ua.includes('edg')) browser = 'Edge'
  else if (ua.includes('chrome')) browser = 'Chrome'
  else if (ua.includes('safari')) browser = 'Safari'
  else if (ua.includes('opera') || ua.includes('opr')) browser = 'Opera'

  // OS
  let os = 'Unknown'
  if (ua.includes('windows')) os = 'Windows'
  else if (ua.includes('mac')) os = 'macOS'
  else if (ua.includes('linux')) os = 'Linux'
  else if (ua.includes('android')) os = 'Android'
  else if (ua.includes('iphone') || ua.includes('ipad')) os = 'iOS'

  return { device, browser, os }
}

// Générer un ID visiteur unique basé sur IP + user agent
function generateVisitorId(ip: string, userAgent: string): string {
  const data = `${ip}-${userAgent}`
  return crypto.createHash('sha256').update(data).digest('hex').substring(0, 32)
}

// Générer un ID de session
function generateSessionId(): string {
  return crypto.randomBytes(16).toString('hex')
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, data } = body

    // Récupérer l'IP depuis les headers
    const forwardedFor = request.headers.get('x-forwarded-for')
    const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : '127.0.0.1'
    const userAgent = request.headers.get('user-agent') || ''

    // Ignorer les bots
    if (isBot(userAgent)) {
      return NextResponse.json({ success: true, ignored: true })
    }

    const visitorId = generateVisitorId(ip, userAgent)
    const { device, browser, os } = parseUserAgent(userAgent)

    switch (action) {
      case 'visit': {
        // Obtenir la date du jour (format YYYY-MM-DD)
        const today = new Date().toISOString().split('T')[0]

        // 1. Enregistrer ou mettre à jour le visiteur global (pour l'historique total)
        const { data: existingVisitor } = await supabaseAdmin
          .from('visitors')
          .select('id, visit_count')
          .eq('visitor_id', visitorId)
          .single()

        if (existingVisitor) {
          await supabaseAdmin
            .from('visitors')
            .update({
              last_visit: new Date().toISOString(),
              visit_count: existingVisitor.visit_count + 1,
              user_agent: userAgent,
            })
            .eq('visitor_id', visitorId)
        } else {
          await supabaseAdmin
            .from('visitors')
            .insert({
              visitor_id: visitorId,
              ip_address: ip,
              user_agent: userAgent,
              device_type: device,
              browser,
              os,
              is_bot: false,
            })
        }

        // 2. Enregistrer dans daily_visits (incrémente les visites pour la même IP/jour)
        const { data: existingDailyVisit } = await supabaseAdmin
          .from('daily_visits')
          .select('id, visit_count')
          .eq('date', today)
          .eq('ip_address', ip)
          .single()

        if (existingDailyVisit) {
          // Même IP aujourd'hui → incrémenter le compteur de visites
          await supabaseAdmin
            .from('daily_visits')
            .update({
              visit_count: existingDailyVisit.visit_count + 1,
              last_visit_time: new Date().toISOString(),
              pages_viewed: (existingDailyVisit as { pages_viewed?: number }).pages_viewed || 0,
            })
            .eq('id', existingDailyVisit.id)
        } else {
          // Nouvelle IP pour aujourd'hui → créer une entrée
          await supabaseAdmin
            .from('daily_visits')
            .insert({
              date: today,
              ip_address: ip,
              visitor_id: visitorId,
              visit_count: 1,
              device_type: device,
              browser,
              os,
            })
        }

        return NextResponse.json({
          success: true,
          visitorId,
          sessionId: data?.sessionId || generateSessionId()
        })
      }

      case 'pageview': {
        const { pageUrl, pageTitle, referrer, sessionId, timeOnPage, scrollDepth } = data
        const today = new Date().toISOString().split('T')[0]

        await supabaseAdmin
          .from('page_views')
          .insert({
            visitor_id: visitorId,
            page_url: pageUrl,
            page_title: pageTitle,
            referrer,
            session_id: sessionId,
            time_on_page: timeOnPage,
            scroll_depth: scrollDepth,
          })

        // Incrémenter pages_viewed dans daily_visits
        const { data: dailyVisit } = await supabaseAdmin
          .from('daily_visits')
          .select('id, pages_viewed')
          .eq('date', today)
          .eq('ip_address', ip)
          .single()

        if (dailyVisit) {
          await supabaseAdmin
            .from('daily_visits')
            .update({
              pages_viewed: (dailyVisit.pages_viewed || 0) + 1,
              last_visit_time: new Date().toISOString(),
            })
            .eq('id', dailyVisit.id)
        }

        // Mettre à jour la session
        if (sessionId) {
          const { data: existingSession } = await supabaseAdmin
            .from('visitor_sessions')
            .select('id, page_count')
            .eq('session_id', sessionId)
            .single()

          if (existingSession) {
            await supabaseAdmin
              .from('visitor_sessions')
              .update({
                page_count: existingSession.page_count + 1,
                exit_page: pageUrl,
              })
              .eq('session_id', sessionId)
          } else {
            await supabaseAdmin
              .from('visitor_sessions')
              .insert({
                session_id: sessionId,
                visitor_id: visitorId,
                entry_page: pageUrl,
                exit_page: pageUrl,
                page_count: 1,
              })
          }
        }

        return NextResponse.json({ success: true })
      }

      case 'cart': {
        const { items, subtotal, sessionId, userEmail } = data
        const itemCount = items?.reduce((sum: number, item: { quantity: number }) => sum + item.quantity, 0) || 0

        // Upsert le panier
        await supabaseAdmin
          .from('active_carts')
          .upsert({
            visitor_id: visitorId,
            session_id: sessionId,
            items,
            subtotal,
            item_count: itemCount,
            last_activity: new Date().toISOString(),
            user_email: userEmail,
            abandoned_at: null, // Reset si le panier est mis à jour
          }, {
            onConflict: 'visitor_id'
          })

        return NextResponse.json({ success: true })
      }

      case 'cart_converted': {
        // Marquer le panier comme converti
        await supabaseAdmin
          .from('active_carts')
          .update({
            converted_at: new Date().toISOString(),
          })
          .eq('visitor_id', visitorId)

        return NextResponse.json({ success: true })
      }

      case 'end_session': {
        const { sessionId, duration } = data

        if (sessionId) {
          await supabaseAdmin
            .from('visitor_sessions')
            .update({
              ended_at: new Date().toISOString(),
              duration,
            })
            .eq('session_id', sessionId)
        }

        return NextResponse.json({ success: true })
      }

      default:
        return NextResponse.json({ error: 'Action inconnue' }, { status: 400 })
    }
  } catch (error) {
    console.error('Tracking error:', error)
    return NextResponse.json({ error: 'Erreur tracking' }, { status: 500 })
  }
}

// GET pour les stats admin
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')

    switch (type) {
      case 'visitors': {
        const days = parseInt(searchParams.get('days') || '7')
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - days)

        const { data: visitors, error } = await supabaseAdmin
          .from('visitors')
          .select('*')
          .eq('is_bot', false)
          .gte('last_visit', startDate.toISOString())
          .order('last_visit', { ascending: false })
          .limit(500)

        if (error) throw error

        return NextResponse.json({ visitors })
      }

      case 'pageviews': {
        const days = parseInt(searchParams.get('days') || '7')
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - days)

        const { data: pageviews, error } = await supabaseAdmin
          .from('page_views')
          .select('*')
          .gte('created_at', startDate.toISOString())
          .order('created_at', { ascending: false })
          .limit(1000)

        if (error) throw error

        return NextResponse.json({ pageviews })
      }

      case 'carts': {
        const { data: carts, error } = await supabaseAdmin
          .from('active_carts')
          .select('*')
          .gt('item_count', 0)
          .is('converted_at', null)
          .order('last_activity', { ascending: false })
          .limit(100)

        if (error) throw error

        // Enrichir les paniers avec les infos utilisateur si email présent
        const enrichedCarts = await Promise.all(
          (carts || []).map(async (cart) => {
            if (cart.user_email) {
              const { data: userProfile } = await supabaseAdmin
                .from('user_profiles')
                .select('id, first_name, last_name, email, phone, is_admin, created_at')
                .eq('email', cart.user_email)
                .single()

              if (userProfile) {
                return {
                  ...cart,
                  user_id: userProfile.id,
                  user_name: userProfile.first_name && userProfile.last_name
                    ? `${userProfile.first_name} ${userProfile.last_name}`
                    : userProfile.first_name || userProfile.email.split('@')[0],
                  user_profile: userProfile,
                }
              }
            }
            return cart
          })
        )

        return NextResponse.json({ carts: enrichedCarts })
      }

      case 'stats': {
        // Stats globales - utiliser daily_visits pour le jour actuel
        const todayStr = new Date().toISOString().split('T')[0]

        const [
          { data: dailyVisitsToday },
          { count: pageviewsToday },
          { data: activeCarts },
          { count: totalVisitors },
        ] = await Promise.all([
          // Visiteurs uniques aujourd'hui depuis daily_visits
          supabaseAdmin
            .from('daily_visits')
            .select('ip_address, visit_count, pages_viewed')
            .eq('date', todayStr),
          supabaseAdmin
            .from('page_views')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', `${todayStr}T00:00:00`),
          supabaseAdmin
            .from('active_carts')
            .select('subtotal, item_count')
            .gt('item_count', 0)
            .is('converted_at', null)
            .gte('last_activity', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
          supabaseAdmin
            .from('visitors')
            .select('*', { count: 'exact', head: true })
            .eq('is_bot', false),
        ])

        // Calculer les stats depuis daily_visits
        const uniqueVisitorsToday = dailyVisitsToday?.length || 0
        const totalVisitsToday = dailyVisitsToday?.reduce((sum, v) => sum + (v.visit_count || 0), 0) || 0

        const totalCartValue = activeCarts?.reduce((sum, cart) => sum + (cart.subtotal || 0), 0) || 0
        const totalCartItems = activeCarts?.reduce((sum, cart) => sum + (cart.item_count || 0), 0) || 0

        return NextResponse.json({
          stats: {
            visitorsToday: uniqueVisitorsToday,
            visitsToday: totalVisitsToday,
            pageviewsToday: pageviewsToday || 0,
            activeCarts: activeCarts?.length || 0,
            totalCartValue,
            totalCartItems,
            totalVisitors: totalVisitors || 0,
          }
        })
      }

      case 'daily_history': {
        // Récupérer l'historique des stats quotidiennes (table daily_stats)
        const days = parseInt(searchParams.get('days') || '30')

        const { data: history, error } = await supabaseAdmin
          .from('daily_stats')
          .select('*')
          .order('date', { ascending: false })
          .limit(days)

        if (error) throw error

        return NextResponse.json({ history: history || [] })
      }

      case 'today_details': {
        // Détails des visites d'aujourd'hui depuis daily_visits
        const todayStr = new Date().toISOString().split('T')[0]

        const { data: visits, error } = await supabaseAdmin
          .from('daily_visits')
          .select('*')
          .eq('date', todayStr)
          .order('last_visit_time', { ascending: false })

        if (error) throw error

        return NextResponse.json({ visits: visits || [] })
      }

      case 'top_pages': {
        const days = parseInt(searchParams.get('days') || '7')
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - days)

        const { data, error } = await supabaseAdmin
          .from('page_views')
          .select('page_url')
          .gte('created_at', startDate.toISOString())

        if (error) throw error

        // Compter manuellement les pages
        const pageCounts: Record<string, number> = {}
        data?.forEach(pv => {
          pageCounts[pv.page_url] = (pageCounts[pv.page_url] || 0) + 1
        })

        const topPages = Object.entries(pageCounts)
          .map(([url, count]) => ({ page_url: url, view_count: count }))
          .sort((a, b) => b.view_count - a.view_count)
          .slice(0, 20)

        return NextResponse.json({ topPages })
      }

      default:
        return NextResponse.json({ error: 'Type inconnu' }, { status: 400 })
    }
  } catch (error) {
    console.error('Tracking GET error:', error)
    return NextResponse.json({ error: 'Erreur' }, { status: 500 })
  }
}
