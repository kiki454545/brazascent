'use client'

import { useState, useEffect, useMemo } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { m, AnimatePresence } from 'framer-motion'
import { Search, User, ShoppingBag, Heart, Package, Menu, X, ChevronRight, LogOut, Loader2 } from 'lucide-react'
import { useCartStore } from '@/store/cart'
import { useWishlistStore } from '@/store/wishlist'
import { useAuthStore } from '@/store/auth'
import { useSettingsStore } from '@/store/settings'
import dynamic from 'next/dynamic'
const CartDrawer = dynamic(
  () => import('./CartDrawer').then(m => m.CartDrawer),
  { ssr: false }
)
import { ThemeToggle } from './ThemeToggle'
import { supabase } from '@/lib/supabase'

interface SearchProduct {
  id: string
  name: string
  slug: string
  brand: string
  images: string[]
  price: number
  price_by_size?: Record<string, number>
  is_bestseller?: boolean
}

// Composant pour le carrousel d'annonces horizontal infini
function AnnouncementCarousel() {
  const { settings } = useSettingsStore()

  // Filtrer uniquement les messages actifs
  const activeMessages = useMemo(() => {
    return settings.announcementMessages?.filter(m => m.enabled) || []
  }, [settings.announcementMessages])

  if (activeMessages.length === 0) {
    return (
      <span>Livraison offerte dès {settings.freeShippingThreshold}€ d&apos;achat</span>
    )
  }

  // Durée de l'animation basée sur la vitesse (en secondes)
  const duration = (settings.announcementSpeed || 4) * 15

  // Dupliquer les messages plusieurs fois pour remplir l'écran
  const repeatedMessages = [
    ...activeMessages, ...activeMessages, ...activeMessages,
    ...activeMessages, ...activeMessages, ...activeMessages
  ]

  return (
    <div className="relative overflow-hidden w-full">
      <div className="flex">
        {/* Première bande */}
        <div
          className="flex shrink-0 animate-marquee-smooth"
          style={{ animationDuration: `${duration}s` }}
        >
          {repeatedMessages.map((message, index) => (
            <span key={`a-${index}`} className="mx-8 inline-flex items-center gap-2 whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              {message.text}
            </span>
          ))}
        </div>
        {/* Deuxième bande identique */}
        <div
          className="flex shrink-0 animate-marquee-smooth"
          style={{ animationDuration: `${duration}s` }}
        >
          {repeatedMessages.map((message, index) => (
            <span key={`b-${index}`} className="mx-8 inline-flex items-center gap-2 whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              {message.text}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

const navigation = [
  { name: 'Parfums', href: '/parfums' },
  { name: 'Marques', href: '/marques' },
  { name: 'Packs', href: '/packs' },
  { name: 'Promos 🔥', href: '/promos' },
  { name: 'Blog', href: '/blog' },
]

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchProduct[]>([])
  const [bestSellers, setBestSellers] = useState<SearchProduct[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isBannerDismissed, setIsBannerDismissed] = useState(false)

  useEffect(() => {
    setIsBannerDismissed(localStorage.getItem('banner-dismissed') === '1')
  }, [])

  const dismissBanner = () => {
    setIsBannerDismissed(true)
    localStorage.setItem('banner-dismissed', '1')
  }
  const { items, openCart } = useCartStore()
  const { items: wishlistItems } = useWishlistStore()
  const { user, profile, signOut } = useAuthStore()
  const { settings } = useSettingsStore()

  const cartCount = items.reduce((acc, item) => acc + item.quantity, 0)

  // Charger les best sellers au montage
  useEffect(() => {
    const fetchBestSellers = async () => {
      const { data } = await supabase
        .from('products')
        .select('id, name, slug, brand, images, price, price_by_size, is_bestseller')
        .eq('is_bestseller', true)
        .gt('stock', 0)
        .limit(6)

      if (data) {
        setBestSellers(data)
      }
    }
    fetchBestSellers()
  }, [])

  // Recherche en temps réel
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    const searchProducts = async () => {
      setIsSearching(true)
      const query = searchQuery.trim()

      const { data } = await supabase
        .from('products')
        .select('id, name, slug, brand, images, price, price_by_size')
        .gt('stock', 0)
        .or(`name.ilike.%${query}%,brand.ilike.%${query}%`)
        .limit(8)

      if (data) {
        setSearchResults(data)
      }
      setIsSearching(false)
    }

    const debounce = setTimeout(searchProducts, 300)
    return () => clearTimeout(debounce)
  }, [searchQuery])

  // Gérer la soumission de la recherche
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/parfums?search=${encodeURIComponent(searchQuery.trim())}`)
      setIsSearchOpen(false)
      setSearchQuery('')
    }
  }

  // Calculer le prix d'un produit
  const getProductPrice = (product: SearchProduct): number => {
    if (product.price_by_size) {
      const prices = Object.values(product.price_by_size).filter(p => p > 0)
      if (prices.length > 0) {
        return Math.min(...prices)
      }
    }
    return product.price
  }

  // Déterminer si on est sur une page avec hero (fond sombre)
  const isHeroPage = pathname === '/' || pathname === '/parfums' || pathname === '/marques' || pathname === '/packs'

  // Le header doit être sombre (texte noir) si on n'est pas sur une hero page OU si on a scrollé
  const isDarkHeader = !isHeroPage || isScrolled

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Bloquer le scroll quand le menu ou la recherche est ouvert
  useEffect(() => {
    if (isMenuOpen || isSearchOpen) {
      // Sauvegarder la position actuelle du scroll
      const scrollY = window.scrollY
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY}px`
      document.body.style.left = '0'
      document.body.style.right = '0'
      document.body.style.overflow = 'hidden'
    } else {
      // Restaurer la position du scroll
      const scrollY = document.body.style.top
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.left = ''
      document.body.style.right = ''
      document.body.style.overflow = ''
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1)
      }
    }
    return () => {
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.left = ''
      document.body.style.right = ''
      document.body.style.overflow = ''
    }
  }, [isMenuOpen, isSearchOpen])

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isDarkHeader
            ? 'bg-background shadow-sm'
            : 'bg-transparent'
        }`}
      >
        {/* Top bar - Carrousel d'annonces (toujours noir, indépendant du thème) */}
        {!isBannerDismissed && (
          <div className={`relative flex items-center py-2 text-xs tracking-[0.2em] uppercase transition-colors duration-500 text-white ${
            isScrolled ? 'bg-black' : 'bg-black/90'
          }`}>
            <div className="flex-1 overflow-hidden text-center">
              <AnnouncementCarousel />
            </div>
            <button
              onClick={dismissBanner}
              aria-label="Fermer"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Main header */}
        <div className="px-6 sm:px-10 lg:px-20">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Left side - Menu & Search */}
            <div className="flex items-center gap-4 lg:gap-6">
              <button
                onClick={() => setIsMenuOpen(true)}
                className={`min-w-[44px] min-h-[44px] flex items-center justify-center py-2 -ml-2 pl-2 pr-2 transition-colors duration-300 ${
                  isDarkHeader ? 'text-foreground hover:text-primary' : 'text-white hover:text-primary'
                }`}
                aria-label="Menu"
              >
                <Menu className="w-6 h-6" />
              </button>

              <button
                onClick={() => setIsSearchOpen(true)}
                className={`min-w-[44px] min-h-[44px] flex items-center justify-center p-2 transition-colors duration-300 ${
                  isDarkHeader ? 'text-foreground hover:text-primary' : 'text-white hover:text-primary'
                }`}
                aria-label="Rechercher"
              >
                <Search className="w-5 h-5" />
              </button>
            </div>

            {/* Logo - Center */}
            <Link href="/" className="absolute left-1/2 transform -translate-x-1/2">
              <h1 className={`text-xl lg:text-2xl font-light tracking-[0.2em] uppercase transition-colors duration-500 ${
                isDarkHeader ? 'text-foreground' : 'text-white'
              }`}>
                Braza Scent
              </h1>
            </Link>

            {/* Right side - Icons */}
            <div className="flex items-center gap-4 lg:gap-6">
              <ThemeToggle
                className={`hidden sm:block ${
                  isDarkHeader ? 'text-foreground hover:text-primary' : 'text-white hover:text-primary'
                }`}
              />

              <Link
                href="/compte"
                className={`hidden sm:block p-2 transition-colors duration-300 ${
                  isDarkHeader ? 'text-foreground hover:text-primary' : 'text-white hover:text-primary'
                }`}
                aria-label="Mon compte"
              >
                <User className="w-5 h-5" />
              </Link>

              <Link
                href="/favoris"
                className={`hidden sm:block p-2 transition-colors duration-300 relative ${
                  isDarkHeader ? 'text-foreground hover:text-primary' : 'text-white hover:text-primary'
                }`}
                aria-label="Mes favoris"
              >
                <Heart className="w-5 h-5" />
                {wishlistItems.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-white text-[10px] rounded-full flex items-center justify-center">
                    {wishlistItems.length}
                  </span>
                )}
              </Link>

              <Link
                href="/suivi"
                className={`hidden sm:block p-2 transition-colors duration-300 ${
                  isDarkHeader ? 'text-foreground hover:text-primary' : 'text-white hover:text-primary'
                }`}
                aria-label="Suivi de commande"
              >
                <Package className="w-5 h-5" />
              </Link>

              <button
                onClick={openCart}
                className={`min-w-[44px] min-h-[44px] flex items-center justify-center py-2 pl-2 -mr-2 pr-2 transition-colors duration-300 relative ${
                  isDarkHeader ? 'text-foreground hover:text-primary' : 'text-white hover:text-primary'
                }`}
                aria-label="Panier"
              >
                <ShoppingBag className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-white text-[10px] rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Menu panel - Style Louis Vuitton */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Overlay sombre */}
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-[60] bg-black/50"
              onClick={() => setIsMenuOpen(false)}
            />

            {/* Panel menu */}
            <m.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.4, ease: 'easeOut' }}
              className="fixed left-0 top-0 bottom-0 z-[70] w-full max-w-md bg-background shadow-2xl"
            >
              {/* Menu header */}
              <div className="flex items-center justify-between px-6 h-16 border-b">
                <span className="text-sm tracking-[0.2em] uppercase">Menu</span>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 hover:text-primary transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Menu content */}
              <div className="h-[calc(100%-4rem)] overflow-y-auto">
                <nav className="p-6">
                  {navigation.map((item, index) => (
                    <m.div
                      key={item.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Link
                        href={item.href}
                        onClick={() => setIsMenuOpen(false)}
                        className="group flex items-center justify-between py-4 text-xl tracking-[0.1em] hover:text-primary transition-colors border-b border-border"
                      >
                        {item.name}
                        <ChevronRight className="w-5 h-5 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                      </Link>
                    </m.div>
                  ))}
                </nav>

                {/* Secondary links */}
                <div className="px-6 py-8 border-t bg-muted">
                  <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground mb-4">
                    Mon compte
                  </p>
                  <div className="space-y-3">
                    {user ? (
                      <>
                        <Link
                          href="/compte"
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center gap-3 text-sm hover:text-primary transition-colors"
                        >
                          <User className="w-4 h-4" />
                          {profile?.first_name || 'Mon profil'}
                        </Link>
                        <Link
                          href="/favoris"
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center gap-3 text-sm hover:text-primary transition-colors"
                        >
                          <Heart className="w-4 h-4" />
                          Mes favoris
                        </Link>
                        <Link
                          href="/suivi"
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center gap-3 text-sm hover:text-primary transition-colors"
                        >
                          <Package className="w-4 h-4" />
                          Suivi de commande
                        </Link>
                        <Link
                          href="/panier"
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center gap-3 text-sm hover:text-primary transition-colors"
                        >
                          <ShoppingBag className="w-4 h-4" />
                          Mon panier
                        </Link>
                        <button
                          onClick={() => {
                            signOut()
                            setIsMenuOpen(false)
                          }}
                          className="flex items-center gap-3 text-sm text-red-600 hover:text-red-700 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Se déconnecter
                        </button>
                      </>
                    ) : (
                      <>
                        <Link
                          href="/compte"
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center gap-3 text-sm hover:text-primary transition-colors"
                        >
                          <User className="w-4 h-4" />
                          Se connecter
                        </Link>
                        <Link
                          href="/favoris"
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center gap-3 text-sm hover:text-primary transition-colors"
                        >
                          <Heart className="w-4 h-4" />
                          Mes favoris
                        </Link>
                        <Link
                          href="/suivi"
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center gap-3 text-sm hover:text-primary transition-colors"
                        >
                          <Package className="w-4 h-4" />
                          Suivi de commande
                        </Link>
                        <Link
                          href="/panier"
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center gap-3 text-sm hover:text-primary transition-colors"
                        >
                          <ShoppingBag className="w-4 h-4" />
                          Mon panier
                        </Link>
                      </>
                    )}
                  </div>
                </div>

                {/* Contact */}
                <div className="px-6 py-6">
                  <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground mb-3">
                    Service client
                  </p>
                  <p className="text-sm text-muted-foreground mb-1">{settings.storePhone}</p>
                  <p className="text-sm text-muted-foreground">{settings.storeEmail}</p>
                </div>

                {/* Réseaux sociaux */}
                <div className="px-6 pb-8 border-t pt-6">
                  <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground mb-4">
                    Nos Réseaux
                  </p>
                  <div className="flex items-center gap-5">
                    <a
                      href="https://www.tiktok.com/@braza.scent?_r=1&_t=ZN-93DizAlYMis"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                      </svg>
                      TikTok
                    </a>
                    <a
                      href="https://snapchat.com/t/RIDz6Z16"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12 1.033-.301.165-.088.344-.104.464-.104.182 0 .359.029.509.09.45.149.734.479.734.838.015.449-.39.839-1.213 1.168-.089.029-.209.075-.344.119-.45.135-1.139.36-1.333.81-.09.224-.061.524.12.868l.015.015c.06.136 1.526 3.475 4.791 4.014.255.044.435.27.42.509 0 .075-.015.149-.045.225-.24.569-1.273.988-3.146 1.271-.059.091-.12.375-.164.57-.029.179-.074.36-.134.553-.076.271-.27.405-.555.405h-.03c-.135 0-.313-.031-.538-.074-.36-.075-.765-.135-1.273-.135-.3 0-.599.015-.913.074-.6.104-1.123.464-1.723.884-.853.599-1.826 1.288-3.294 1.288-.06 0-.119-.015-.18-.015h-.149c-1.468 0-2.427-.675-3.279-1.288-.599-.42-1.107-.779-1.707-.884-.314-.045-.629-.074-.928-.074-.54 0-.958.089-1.272.149-.211.043-.391.074-.54.074-.374 0-.523-.224-.583-.42-.061-.192-.09-.389-.135-.567-.046-.181-.105-.494-.166-.57-1.918-.222-2.95-.642-3.189-1.226-.031-.063-.052-.15-.055-.225-.015-.243.165-.465.42-.509 3.264-.54 4.73-3.879 4.791-4.02l.016-.029c.18-.345.224-.645.119-.869-.195-.434-.884-.658-1.332-.809-.121-.029-.24-.074-.346-.119-1.107-.435-1.257-.93-1.197-1.273.09-.479.674-.793 1.168-.793.146 0 .27.029.383.074.42.194.789.3 1.104.3.234 0 .384-.06.465-.105l-.046-.569c-.098-1.626-.225-3.651.307-4.837C7.392 1.077 10.739.807 11.727.807l.419-.015h.06z"/>
                      </svg>
                      Snapchat
                    </a>
                    <a
                      href="https://api.whatsapp.com/send/?phone=33756939038&text&type=phone_number&app_absent=0&wame_ctl=1"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      WhatsApp
                    </a>
                  </div>
                </div>
              </div>
            </m.div>
          </>
        )}
      </AnimatePresence>

      {/* Search overlay - Style Louis Vuitton */}
      <AnimatePresence>
        {isSearchOpen && (
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[60] bg-background overflow-y-auto overscroll-contain touch-pan-y"
          >
            {/* Search header */}
            <div className="flex items-center justify-between px-6 sm:px-10 lg:px-20 h-16 lg:h-20 border-b">
              <button
                onClick={() => {
                  setIsSearchOpen(false)
                  setSearchQuery('')
                }}
                className="p-2 hover:text-primary transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              <span className="text-sm tracking-[0.2em] uppercase">Rechercher</span>

              <div className="w-10" />
            </div>

            {/* Search content */}
            <div className="max-w-3xl mx-auto px-6 pt-12 lg:pt-20 pb-12">
              <form onSubmit={handleSearchSubmit}>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher un parfum ou une marque..."
                    className="w-full py-4 pr-12 text-xl lg:text-2xl border-b-2 border-foreground focus:outline-none focus:border-primary transition-colors bg-transparent"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="absolute right-0 top-1/2 -translate-y-1/2 p-2 hover:text-primary transition-colors"
                  >
                    {isSearching ? (
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    ) : (
                      <Search className="w-6 h-6 text-muted-foreground" />
                    )}
                  </button>
                </div>
              </form>

              {/* Résultats de recherche */}
              {searchQuery.trim() ? (
                <div className="mt-8">
                  <p className="text-sm tracking-[0.2em] uppercase text-muted-foreground mb-6">
                    {searchResults.length > 0
                      ? `${searchResults.length} résultat${searchResults.length > 1 ? 's' : ''}`
                      : 'Aucun résultat'
                    }
                  </p>
                  {searchResults.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                      {searchResults.map((product) => (
                        <Link
                          key={product.id}
                          href={`/parfum/${product.slug}`}
                          onClick={() => {
                            setIsSearchOpen(false)
                            setSearchQuery('')
                          }}
                          className="group"
                        >
                          <div className="relative aspect-square bg-cream overflow-hidden mb-2">
                            <Image
                              src={product.images?.[0] || '/images/placeholder.jpg'}
                              alt={product.name}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider">{product.brand}</p>
                          <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{product.name}</p>
                          <p className="text-sm text-primary">À partir de {getProductPrice(product)} €</p>
                        </Link>
                      ))}
                    </div>
                  )}
                  {searchResults.length > 0 && (
                    <button
                      onClick={handleSearchSubmit}
                      className="mt-6 w-full py-3 bg-foreground text-background text-sm tracking-[0.15em] uppercase hover:bg-primary transition-colors"
                    >
                      Voir tous les résultats
                    </button>
                  )}
                </div>
              ) : (
                /* Best sellers par défaut */
                <div className="mt-8">
                  <p className="text-sm tracking-[0.2em] uppercase text-muted-foreground mb-6">
                    Best Sellers
                  </p>
                  {bestSellers.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                      {bestSellers.map((product) => (
                        <Link
                          key={product.id}
                          href={`/parfum/${product.slug}`}
                          onClick={() => {
                            setIsSearchOpen(false)
                            setSearchQuery('')
                          }}
                          className="group"
                        >
                          <div className="relative aspect-square bg-cream overflow-hidden mb-2">
                            <Image
                              src={product.images?.[0] || '/images/placeholder.jpg'}
                              alt={product.name}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider">{product.brand}</p>
                          <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{product.name}</p>
                          <p className="text-sm text-primary">À partir de {getProductPrice(product)} €</p>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Chargement...</p>
                  )}
                </div>
              )}

              {/* Catégories */}
              <div className="mt-12 pt-8 border-t">
                <p className="text-sm tracking-[0.2em] uppercase text-muted-foreground mb-6">
                  Catégories
                </p>
                <div className="flex flex-wrap gap-3">
                  {[
                    { name: 'Tous les parfums', href: '/parfums' },
                    { name: 'Marques', href: '/marques' },
                    { name: 'Packs', href: '/packs' },
                    { name: 'Promos 🔥', href: '/promos' },
                  ].map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => {
                        setIsSearchOpen(false)
                        setSearchQuery('')
                      }}
                      className="px-5 py-2.5 border border-foreground text-sm tracking-wider hover:bg-foreground hover:text-background transition-colors"
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </m.div>
        )}
      </AnimatePresence>

      {/* Cart drawer */}
      <CartDrawer />
    </>
  )
}
