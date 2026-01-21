'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Users,
  Eye,
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  Clock,
  TrendingUp,
  RefreshCw,
  ChevronDown,
  ExternalLink,
  Search,
  Calendar,
  BarChart3
} from 'lucide-react'

interface Visitor {
  id: string
  visitor_id: string
  ip_address: string
  user_agent: string
  country: string | null
  city: string | null
  device_type: string
  browser: string
  os: string
  first_visit: string
  last_visit: string
  visit_count: number
  is_bot: boolean
}

interface PageView {
  id: string
  visitor_id: string
  page_url: string
  page_title: string
  referrer: string
  session_id: string
  created_at: string
}

interface Stats {
  visitorsToday: number
  visitsToday?: number
  pageviewsToday: number
  activeCarts: number
  totalCartValue: number
  totalVisitors: number
}

interface DailyStats {
  id: string
  date: string
  unique_visitors: number
  total_visits: number
  total_page_views: number
  new_visitors: number
  returning_visitors: number
  total_cart_value: number
  abandoned_carts: number
  converted_carts: number
  top_pages: { url: string; views: number }[]
  device_breakdown: Record<string, number>
  browser_breakdown: Record<string, number>
}

interface TopPage {
  page_url: string
  view_count: number
}

export default function AdminVisiteursPage() {
  const [visitors, setVisitors] = useState<Visitor[]>([])
  const [pageviews, setPageviews] = useState<PageView[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [topPages, setTopPages] = useState<TopPage[]>([])
  const [dailyHistory, setDailyHistory] = useState<DailyStats[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState<'visitors' | 'pageviews' | 'history'>('visitors')
  const [daysFilter, setDaysFilter] = useState(7)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedVisitor, setExpandedVisitor] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      const [visitorsRes, pageviewsRes, statsRes, topPagesRes, historyRes] = await Promise.all([
        fetch(`/api/tracking?type=visitors&days=${daysFilter}`),
        fetch(`/api/tracking?type=pageviews&days=${daysFilter}`),
        fetch('/api/tracking?type=stats'),
        fetch(`/api/tracking?type=top_pages&days=${daysFilter}`),
        fetch('/api/tracking?type=daily_history&days=30'),
      ])

      const [visitorsData, pageviewsData, statsData, topPagesData, historyData] = await Promise.all([
        visitorsRes.json(),
        pageviewsRes.json(),
        statsRes.json(),
        topPagesRes.json(),
        historyRes.json(),
      ])

      setVisitors(visitorsData.visitors || [])
      setPageviews(pageviewsData.pageviews || [])
      setStats(statsData.stats || null)
      setTopPages(topPagesData.topPages || [])
      setDailyHistory(historyData.history || [])
    } catch (error) {
      console.error('Error fetching tracking data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchData()
    // Rafraîchir toutes les 30 secondes
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [daysFilter])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchData()
  }

  const getDeviceIcon = (device: string) => {
    switch (device) {
      case 'mobile': return <Smartphone className="w-4 h-4" />
      case 'tablet': return <Tablet className="w-4 h-4" />
      default: return <Monitor className="w-4 h-4" />
    }
  }

  const getVisitorPageViews = (visitorId: string) => {
    return pageviews.filter(pv => pv.visitor_id === visitorId)
  }

  const filteredVisitors = visitors.filter(v => {
    if (!searchQuery) return true
    const search = searchQuery.toLowerCase()
    return (
      v.ip_address?.toLowerCase().includes(search) ||
      v.browser?.toLowerCase().includes(search) ||
      v.os?.toLowerCase().includes(search) ||
      v.city?.toLowerCase().includes(search) ||
      v.country?.toLowerCase().includes(search)
    )
  })

  const formatPageUrl = (url: string) => {
    if (url === '/') return 'Accueil'
    return url.replace(/^\//, '').replace(/-/g, ' ').replace(/\//g, ' > ')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-[#C9A962] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Visiteurs</h1>
          <p className="text-gray-500">
            Suivi en temps réel des visiteurs du site
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={daysFilter}
            onChange={(e) => setDaysFilter(Number(e.target.value))}
            className="px-3 py-2 border rounded-lg focus:outline-none focus:border-[#C9A962]"
          >
            <option value={1}>Aujourd&apos;hui</option>
            <option value={7}>7 derniers jours</option>
            <option value={30}>30 derniers jours</option>
          </select>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                <Users className="w-5 h-5" />
              </div>
              <span className="text-sm text-gray-500">Visiteurs uniques</span>
            </div>
            <p className="text-2xl font-semibold">{stats.visitorsToday}</p>
            <p className="text-xs text-gray-400">aujourd&apos;hui</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                <TrendingUp className="w-5 h-5" />
              </div>
              <span className="text-sm text-gray-500">Visites totales</span>
            </div>
            <p className="text-2xl font-semibold">{stats.visitsToday || 0}</p>
            <p className="text-xs text-gray-400">aujourd&apos;hui</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                <Eye className="w-5 h-5" />
              </div>
              <span className="text-sm text-gray-500">Pages vues</span>
            </div>
            <p className="text-2xl font-semibold">{stats.pageviewsToday}</p>
            <p className="text-xs text-gray-400">aujourd&apos;hui</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                <BarChart3 className="w-5 h-5" />
              </div>
              <span className="text-sm text-gray-500">Total visiteurs</span>
            </div>
            <p className="text-2xl font-semibold">{stats.totalVisitors}</p>
            <p className="text-xs text-gray-400">depuis le début</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-[#C9A962]/20 text-[#C9A962] rounded-lg">
                <Globe className="w-5 h-5" />
              </div>
              <span className="text-sm text-gray-500">Paniers actifs</span>
            </div>
            <p className="text-2xl font-semibold">{stats.activeCarts}</p>
            <p className="text-xs text-gray-400">{stats.totalCartValue.toFixed(2)} €</p>
          </div>
        </div>
      )}

      {/* Top Pages */}
      {topPages.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Pages les plus visitées</h2>
          <div className="space-y-2">
            {topPages.slice(0, 10).map((page, index) => (
              <div key={page.page_url} className="flex items-center gap-3">
                <span className="text-sm text-gray-400 w-6">{index + 1}.</span>
                <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                  <div
                    className="h-full bg-[#C9A962]/30 flex items-center px-3"
                    style={{ width: `${Math.min((page.view_count / topPages[0].view_count) * 100, 100)}%` }}
                  >
                    <span className="text-xs truncate">{formatPageUrl(page.page_url)}</span>
                  </div>
                </div>
                <span className="text-sm font-medium w-16 text-right">{page.view_count} vues</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('visitors')}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 text-sm font-medium transition-colors relative ${
              activeTab === 'visitors' ? 'text-[#C9A962]' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Users className="w-5 h-5" />
            Visiteurs ({filteredVisitors.length})
            {activeTab === 'visitors' && (
              <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C9A962]" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('pageviews')}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 text-sm font-medium transition-colors relative ${
              activeTab === 'pageviews' ? 'text-[#C9A962]' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Eye className="w-5 h-5" />
            Pages vues ({pageviews.length})
            {activeTab === 'pageviews' && (
              <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C9A962]" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 text-sm font-medium transition-colors relative ${
              activeTab === 'history' ? 'text-[#C9A962]' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Calendar className="w-5 h-5" />
            Historique ({dailyHistory.length})
            {activeTab === 'history' && (
              <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C9A962]" />
            )}
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par IP, navigateur, OS, ville..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:border-[#C9A962]"
            />
          </div>
        </div>

        {/* Visitors List */}
        {activeTab === 'visitors' && (
          <div className="divide-y max-h-[600px] overflow-auto">
            {filteredVisitors.length > 0 ? (
              filteredVisitors.map((visitor) => {
                const visitorPageViews = getVisitorPageViews(visitor.visitor_id)
                const isExpanded = expandedVisitor === visitor.id

                return (
                  <div key={visitor.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div
                      className="flex items-center gap-4 cursor-pointer"
                      onClick={() => setExpandedVisitor(isExpanded ? null : visitor.id)}
                    >
                      {/* Device Icon */}
                      <div className="p-2 bg-gray-100 rounded-lg">
                        {getDeviceIcon(visitor.device_type)}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-sm">{visitor.ip_address}</span>
                          <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">
                            {visitor.browser} / {visitor.os}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {visitor.visit_count} visites
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(visitor.last_visit).toLocaleString('fr-FR')}
                          </span>
                          {visitor.city && (
                            <span className="flex items-center gap-1">
                              <Globe className="w-3 h-3" />
                              {visitor.city}, {visitor.country}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Pages count */}
                      <div className="text-right">
                        <p className="text-sm font-medium">{visitorPageViews.length} pages</p>
                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </div>
                    </div>

                    {/* Expanded: Pages visitées */}
                    {isExpanded && visitorPageViews.length > 0 && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mt-4 pl-12"
                      >
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Pages visitées</p>
                        <div className="space-y-1 max-h-40 overflow-auto">
                          {visitorPageViews.slice(0, 20).map((pv) => (
                            <div key={pv.id} className="flex items-center justify-between text-sm py-1">
                              <span className="text-gray-700 truncate flex-1">{formatPageUrl(pv.page_url)}</span>
                              <span className="text-gray-400 text-xs ml-2">
                                {new Date(pv.created_at).toLocaleTimeString('fr-FR')}
                              </span>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </div>
                )
              })
            ) : (
              <div className="p-12 text-center">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Aucun visiteur trouvé</p>
              </div>
            )}
          </div>
        )}

        {/* PageViews List */}
        {activeTab === 'pageviews' && (
          <div className="divide-y max-h-[600px] overflow-auto">
            {pageviews.length > 0 ? (
              pageviews.map((pv) => (
                <div key={pv.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                      <ExternalLink className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{formatPageUrl(pv.page_url)}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(pv.created_at).toLocaleString('fr-FR')}
                      </p>
                    </div>
                    <span className="font-mono text-xs text-gray-400">
                      {pv.visitor_id.substring(0, 8)}...
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center">
                <Eye className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Aucune page vue</p>
              </div>
            )}
          </div>
        )}

        {/* History List */}
        {activeTab === 'history' && (
          <div className="divide-y max-h-[600px] overflow-auto">
            {dailyHistory.length > 0 ? (
              dailyHistory.map((day) => (
                <div key={day.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-[#C9A962]/10 text-[#C9A962] rounded-lg">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">
                        {new Date(day.date).toLocaleDateString('fr-FR', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                      <div className="flex flex-wrap gap-4 mt-2 text-sm">
                        <span className="flex items-center gap-1 text-blue-600">
                          <Users className="w-4 h-4" />
                          {day.unique_visitors} visiteurs uniques
                        </span>
                        <span className="flex items-center gap-1 text-indigo-600">
                          <TrendingUp className="w-4 h-4" />
                          {day.total_visits} visites
                        </span>
                        <span className="flex items-center gap-1 text-green-600">
                          <Eye className="w-4 h-4" />
                          {day.total_page_views} pages vues
                        </span>
                      </div>
                      {(day.new_visitors > 0 || day.returning_visitors > 0) && (
                        <div className="flex gap-4 mt-1 text-xs text-gray-500">
                          <span>{day.new_visitors} nouveaux</span>
                          <span>{day.returning_visitors} récurrents</span>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      {day.total_cart_value > 0 && (
                        <p className="text-sm font-medium text-[#C9A962]">
                          {day.total_cart_value.toFixed(2)} € en paniers
                        </p>
                      )}
                      {(day.abandoned_carts > 0 || day.converted_carts > 0) && (
                        <div className="text-xs text-gray-500 mt-1">
                          {day.converted_carts > 0 && (
                            <span className="text-green-600">{day.converted_carts} convertis</span>
                          )}
                          {day.abandoned_carts > 0 && (
                            <span className="text-orange-600 ml-2">{day.abandoned_carts} abandonnés</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Device breakdown */}
                  {day.device_breakdown && Object.keys(day.device_breakdown).length > 0 && (
                    <div className="mt-3 pt-3 border-t flex flex-wrap gap-2">
                      {Object.entries(day.device_breakdown).map(([device, count]) => (
                        <span
                          key={device}
                          className="px-2 py-1 bg-gray-100 rounded text-xs flex items-center gap-1"
                        >
                          {device === 'mobile' ? <Smartphone className="w-3 h-3" /> :
                           device === 'tablet' ? <Tablet className="w-3 h-3" /> :
                           <Monitor className="w-3 h-3" />}
                          {count}
                        </span>
                      ))}
                      {day.browser_breakdown && Object.entries(day.browser_breakdown).slice(0, 3).map(([browser, count]) => (
                        <span
                          key={browser}
                          className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs"
                        >
                          {browser}: {count}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="p-12 text-center">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">Aucun historique disponible</p>
                <p className="text-sm text-gray-400 mt-2">
                  Les statistiques journalières seront archivées chaque nuit à minuit.
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Assurez-vous d&apos;avoir exécuté le SQL pour créer les tables daily_stats et daily_visits.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
