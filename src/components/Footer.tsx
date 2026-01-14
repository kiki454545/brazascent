'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Instagram, Facebook, Youtube, Mail, MapPin, Phone, Loader2, Check } from 'lucide-react'
import { supabase } from '@/lib/supabase'

const footerLinks = {
  boutique: [
    { name: 'Parfums', href: '/parfums' },
    { name: 'Marques', href: '/marques' },
    { name: 'Packs', href: '/packs' },
  ],
  maison: [
    { name: 'Notre Histoire', href: '/maison' },
    { name: 'Savoir-faire', href: '/maison/savoir-faire' },
    { name: 'Nos Boutiques', href: '/boutiques' },
    { name: 'Carrières', href: '/carrieres' },
  ],
  services: [
    { name: 'Mon Compte', href: '/compte' },
    { name: 'Suivi de commande', href: '/compte/commandes' },
    { name: 'Livraison', href: '/livraison' },
    { name: 'Retours', href: '/retours' },
    { name: 'FAQ', href: '/faq' },
  ],
}

export function Footer() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

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
              Maison de parfumerie d&apos;exception, Braza Scent perpétue l&apos;art de la haute parfumerie
              française depuis 2024. Chaque création est une invitation au voyage.
            </p>

            {/* Contact */}
            <div className="space-y-3 text-sm text-gray-400">
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-[#C9A962]" />
                <span>123 Avenue des Champs-Élysées, Paris</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-[#C9A962]" />
                <span>+33 1 23 45 67 89</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-[#C9A962]" />
                <span>contact@brazascent.com</span>
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
            <h4 className="text-sm tracking-[0.2em] uppercase mb-6">La Maison</h4>
            <ul className="space-y-3">
              {footerLinks.maison.map((link) => (
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
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-[#C9A962] transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-[#C9A962] transition-colors"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-[#C9A962] transition-colors"
              >
                <Youtube className="w-5 h-5" />
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
