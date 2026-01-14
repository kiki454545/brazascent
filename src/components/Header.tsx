'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, User, ShoppingBag, Heart, Menu, X, ChevronRight, LogOut } from 'lucide-react'
import { useCartStore } from '@/store/cart'
import { useWishlistStore } from '@/store/wishlist'
import { useAuthStore } from '@/store/auth'
import { useSettingsStore } from '@/store/settings'
import { CartDrawer } from './CartDrawer'

const navigation = [
  { name: 'Parfums', href: '/parfums' },
  { name: 'Marques', href: '/marques' },
  { name: 'Packs', href: '/packs' },
]

export function Header() {
  const pathname = usePathname()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const { items, openCart } = useCartStore()
  const { items: wishlistItems } = useWishlistStore()
  const { user, profile, signOut } = useAuthStore()
  const { settings } = useSettingsStore()

  const cartCount = items.reduce((acc, item) => acc + item.quantity, 0)

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

  // Bloquer le scroll quand le menu est ouvert
  useEffect(() => {
    if (isMenuOpen || isSearchOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isMenuOpen, isSearchOpen])

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isDarkHeader
            ? 'bg-white shadow-sm'
            : 'bg-transparent'
        }`}
      >
        {/* Top bar */}
        <div className={`text-center py-2 text-xs tracking-[0.2em] uppercase transition-colors duration-500 ${
          isScrolled ? 'bg-[#19110B] text-white' : 'bg-[#19110B]/90 text-white'
        }`}>
          Livraison offerte dès {settings.freeShippingThreshold}€ d&apos;achat
        </div>

        {/* Main header */}
        <div className="px-6 lg:px-12">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Left side - Menu & Search */}
            <div className="flex items-center gap-4 lg:gap-6">
              <button
                onClick={() => setIsMenuOpen(true)}
                className={`p-2 transition-colors duration-300 ${
                  isDarkHeader ? 'text-[#19110B] hover:text-[#C9A962]' : 'text-white hover:text-[#C9A962]'
                }`}
                aria-label="Menu"
              >
                <Menu className="w-6 h-6" />
              </button>

              <button
                onClick={() => setIsSearchOpen(true)}
                className={`p-2 transition-colors duration-300 ${
                  isDarkHeader ? 'text-[#19110B] hover:text-[#C9A962]' : 'text-white hover:text-[#C9A962]'
                }`}
                aria-label="Rechercher"
              >
                <Search className="w-5 h-5" />
              </button>
            </div>

            {/* Logo - Center */}
            <Link href="/" className="absolute left-1/2 transform -translate-x-1/2">
              <h1 className={`text-xl lg:text-2xl font-light tracking-[0.2em] uppercase transition-colors duration-500 ${
                isDarkHeader ? 'text-[#19110B]' : 'text-white'
              }`}>
                Braza Scent
              </h1>
            </Link>

            {/* Right side - Icons */}
            <div className="flex items-center gap-4 lg:gap-6">
              <Link
                href="/compte"
                className={`hidden sm:block p-2 transition-colors duration-300 ${
                  isDarkHeader ? 'text-[#19110B] hover:text-[#C9A962]' : 'text-white hover:text-[#C9A962]'
                }`}
                aria-label="Mon compte"
              >
                <User className="w-5 h-5" />
              </Link>

              <Link
                href="/favoris"
                className={`hidden sm:block p-2 transition-colors duration-300 relative ${
                  isDarkHeader ? 'text-[#19110B] hover:text-[#C9A962]' : 'text-white hover:text-[#C9A962]'
                }`}
                aria-label="Mes favoris"
              >
                <Heart className="w-5 h-5" />
                {wishlistItems.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#C9A962] text-white text-[10px] rounded-full flex items-center justify-center">
                    {wishlistItems.length}
                  </span>
                )}
              </Link>

              <button
                onClick={openCart}
                className={`p-2 transition-colors duration-300 relative ${
                  isDarkHeader ? 'text-[#19110B] hover:text-[#C9A962]' : 'text-white hover:text-[#C9A962]'
                }`}
                aria-label="Panier"
              >
                <ShoppingBag className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#C9A962] text-white text-[10px] rounded-full flex items-center justify-center">
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
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-[60] bg-black/50"
              onClick={() => setIsMenuOpen(false)}
            />

            {/* Panel menu */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.4, ease: 'easeOut' }}
              className="fixed left-0 top-0 bottom-0 z-[70] w-full max-w-md bg-white shadow-2xl"
            >
              {/* Menu header */}
              <div className="flex items-center justify-between px-6 h-16 border-b">
                <span className="text-sm tracking-[0.2em] uppercase">Menu</span>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 hover:text-[#C9A962] transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Menu content */}
              <div className="h-[calc(100%-4rem)] overflow-y-auto">
                <nav className="p-6">
                  {navigation.map((item, index) => (
                    <motion.div
                      key={item.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Link
                        href={item.href}
                        onClick={() => setIsMenuOpen(false)}
                        className="group flex items-center justify-between py-4 text-xl tracking-[0.1em] hover:text-[#C9A962] transition-colors border-b border-gray-100"
                      >
                        {item.name}
                        <ChevronRight className="w-5 h-5 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                      </Link>
                    </motion.div>
                  ))}
                </nav>

                {/* Secondary links */}
                <div className="px-6 py-8 border-t bg-gray-50">
                  <p className="text-xs tracking-[0.2em] uppercase text-gray-500 mb-4">
                    Mon compte
                  </p>
                  <div className="space-y-3">
                    {user ? (
                      <>
                        <Link
                          href="/compte"
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center gap-3 text-sm hover:text-[#C9A962] transition-colors"
                        >
                          <User className="w-4 h-4" />
                          {profile?.first_name || 'Mon profil'}
                        </Link>
                        <Link
                          href="/favoris"
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center gap-3 text-sm hover:text-[#C9A962] transition-colors"
                        >
                          <Heart className="w-4 h-4" />
                          Mes favoris
                        </Link>
                        <Link
                          href="/panier"
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center gap-3 text-sm hover:text-[#C9A962] transition-colors"
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
                          className="flex items-center gap-3 text-sm hover:text-[#C9A962] transition-colors"
                        >
                          <User className="w-4 h-4" />
                          Se connecter
                        </Link>
                        <Link
                          href="/favoris"
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center gap-3 text-sm hover:text-[#C9A962] transition-colors"
                        >
                          <Heart className="w-4 h-4" />
                          Mes favoris
                        </Link>
                        <Link
                          href="/panier"
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center gap-3 text-sm hover:text-[#C9A962] transition-colors"
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
                  <p className="text-xs tracking-[0.2em] uppercase text-gray-500 mb-3">
                    Service client
                  </p>
                  <p className="text-sm text-gray-600 mb-1">+33 1 23 45 67 89</p>
                  <p className="text-sm text-gray-600">contact@brazascent.com</p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Search overlay - Style Louis Vuitton */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[60] bg-white"
          >
            {/* Search header */}
            <div className="flex items-center justify-between px-6 lg:px-12 h-16 lg:h-20 border-b">
              <button
                onClick={() => setIsSearchOpen(false)}
                className="p-2 hover:text-[#C9A962] transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              <span className="text-sm tracking-[0.2em] uppercase">Rechercher</span>

              <div className="w-10" />
            </div>

            {/* Search content */}
            <div className="max-w-3xl mx-auto px-6 pt-12 lg:pt-20">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Que recherchez-vous ?"
                  className="w-full py-4 text-xl lg:text-3xl border-b-2 border-[#19110B] focus:outline-none focus:border-[#C9A962] transition-colors bg-transparent"
                  autoFocus
                />
                <Search className="absolute right-0 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
              </div>

              <div className="mt-12">
                <p className="text-sm tracking-[0.2em] uppercase text-gray-500 mb-6">
                  Recherches populaires
                </p>
                <div className="flex flex-wrap gap-3">
                  {['Oud Royal', 'Rose Éternelle', 'Noir Absolu', 'Coffrets', 'Nouveautés'].map((term) => (
                    <button
                      key={term}
                      className="px-5 py-2.5 border border-[#19110B] text-sm tracking-wider hover:bg-[#19110B] hover:text-white transition-colors"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-12">
                <p className="text-sm tracking-[0.2em] uppercase text-gray-500 mb-6">
                  Collections
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {['Signature', 'Les Absolus', 'Lumière'].map((collection) => (
                    <Link
                      key={collection}
                      href={`/collections/${collection.toLowerCase().replace(' ', '-')}`}
                      onClick={() => setIsSearchOpen(false)}
                      className="py-3 text-lg hover:text-[#C9A962] transition-colors"
                    >
                      {collection}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart drawer */}
      <CartDrawer />
    </>
  )
}
