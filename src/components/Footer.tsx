'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, MapPin, Phone, Loader2, Check } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useSettingsStore } from '@/store/settings'

const footerLinks = {
  boutique: [
    { name: 'Parfums', href: '/parfums' },
    { name: 'Marques', href: '/marques' },
    { name: 'Packs', href: '/packs' },
  ],
  services: [
    { name: 'Mon Compte', href: '/compte' },
    { name: 'Suivi de commande', href: '/compte/commandes' },
    { name: 'Contact', href: '/contact' },
    { name: 'Livraison', href: '/livraison' },
    { name: 'Retours', href: '/retours' },
    { name: 'FAQ', href: '/faq' },
  ],
}

export function Footer() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const { settings } = useSettingsStore()

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !email.includes('@')) {
      setStatus('error')
      setMessage('Veuillez entrer une adresse email valide')
      return
    }

    setStatus('loading')

    try {
      const { error } = await supabase
        .from('newsletter_subscribers')
        .insert({ email, source: 'footer' })

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          setStatus('error')
          setMessage('Cette adresse email est déjà inscrite')
        } else {
          throw error
        }
      } else {
        setStatus('success')
        setMessage('Merci ! Vous êtes maintenant inscrit à notre newsletter')
        setEmail('')
        setTimeout(() => {
          setStatus('idle')
          setMessage('')
        }, 5000)
      }
    } catch (error) {
      console.error('Newsletter subscription error:', error)
      setStatus('error')
      setMessage('Une erreur est survenue. Veuillez réessayer.')
    }
  }

  return (
    <footer className="bg-[#19110B] text-white">
      {/* Newsletter */}
      <div className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16">
          <div className="max-w-xl mx-auto text-center">
            <h3 className="text-2xl lg:text-3xl font-light tracking-[0.2em] uppercase mb-4">
              Newsletter
            </h3>
            <p className="text-gray-400 mb-6">
              Inscrivez-vous pour recevoir nos dernières nouveautés et offres exclusives
            </p>
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Votre adresse email"
                disabled={status === 'loading'}
                className="flex-1 px-4 py-3 bg-transparent border border-white/30 focus:border-[#C9A962] outline-none transition-colors text-sm tracking-wider disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                className="btn-luxury px-8 py-3 bg-[#C9A962] text-[#19110B] text-sm tracking-[0.15em] uppercase font-medium hover:bg-[#E8D5A3] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {status === 'loading' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : status === 'success' ? (
                  <Check className="w-4 h-4" />
                ) : null}
                {status === 'success' ? 'Inscrit !' : "S'inscrire"}
              </button>
            </form>
            {message && (
              <p className={`mt-3 text-sm ${status === 'error' ? 'text-red-400' : 'text-green-400'}`}>
                {message}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-block mb-6">
              <h2 className="text-2xl font-light tracking-[0.2em] uppercase">
                Braza Scent
              </h2>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed mb-6 max-w-sm">
              Boutique de parfums en petites quantités pour découvrir et tester les plus grandes fragrances.
              Trouvez votre signature olfactive sans vous ruiner.
            </p>

            {/* Contact */}
            <div className="space-y-3 text-sm text-gray-400">
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-[#C9A962]" />
                <span>{settings.storeAddress}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-[#C9A962]" />
                <span>{settings.storePhone}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-[#C9A962]" />
                <span>{settings.storeEmail}</span>
              </div>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-sm tracking-[0.2em] uppercase mb-6">Boutique</h4>
            <ul className="space-y-3">
              {footerLinks.boutique.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-400 hover:text-[#C9A962] transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm tracking-[0.2em] uppercase mb-6">Services</h4>
            <ul className="space-y-3">
              {footerLinks.services.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-400 hover:text-[#C9A962] transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Social links */}
            <div className="flex items-center gap-6">
              <a
                href="https://www.tiktok.com/@braza.scent?_r=1&_t=ZN-93DizAlYMis"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-[#C9A962] transition-colors"
                title="TikTok"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
              </a>
              <a
                href="https://snapchat.com/t/Ye5KOxwv"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-[#C9A962] transition-colors"
                title="Snapchat"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12 1.033-.301.165-.088.344-.104.464-.104.182 0 .359.029.509.09.45.149.734.479.734.838.015.449-.39.839-1.213 1.168-.089.029-.209.075-.344.119-.45.135-1.139.36-1.333.81-.09.224-.061.524.12.868l.015.015c.06.136 1.526 3.475 4.791 4.014.255.044.435.27.42.509 0 .075-.015.149-.045.225-.24.569-1.273.988-3.146 1.271-.059.091-.12.375-.164.57-.029.179-.074.36-.134.553-.076.271-.27.405-.555.405h-.03c-.135 0-.313-.031-.538-.074-.36-.075-.765-.135-1.273-.135-.3 0-.599.015-.913.074-.6.104-1.123.464-1.723.884-.853.599-1.826 1.288-3.294 1.288-.06 0-.119-.015-.18-.015h-.149c-1.468 0-2.427-.675-3.279-1.288-.599-.42-1.107-.779-1.707-.884-.314-.045-.629-.074-.928-.074-.54 0-.958.089-1.272.149-.211.043-.391.074-.54.074-.374 0-.523-.224-.583-.42-.061-.192-.09-.389-.135-.567-.046-.181-.105-.494-.166-.57-1.918-.222-2.95-.642-3.189-1.226-.031-.063-.052-.15-.055-.225-.015-.243.165-.465.42-.509 3.264-.54 4.73-3.879 4.791-4.02l.016-.029c.18-.345.224-.645.119-.869-.195-.434-.884-.658-1.332-.809-.121-.029-.24-.074-.346-.119-1.107-.435-1.257-.93-1.197-1.273.09-.479.674-.793 1.168-.793.146 0 .27.029.383.074.42.194.789.3 1.104.3.234 0 .384-.06.465-.105l-.046-.569c-.098-1.626-.225-3.651.307-4.837C7.392 1.077 10.739.807 11.727.807l.419-.015h.06z"/>
                </svg>
              </a>
            </div>

            {/* Copyright */}
            <p className="text-xs text-gray-500">
              © {new Date().getFullYear()} BrazaScent. Tous droits réservés.
            </p>

            {/* Legal links */}
            <div className="flex items-center gap-6 text-xs text-gray-500">
              <Link href="/mentions-legales" className="hover:text-[#C9A962] transition-colors">
                Mentions légales
              </Link>
              <Link href="/cgv" className="hover:text-[#C9A962] transition-colors">
                CGV
              </Link>
              <Link href="/confidentialite" className="hover:text-[#C9A962] transition-colors">
                Confidentialité
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
