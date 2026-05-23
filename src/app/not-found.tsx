import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen pt-32 pb-24 bg-background flex items-start justify-center">
      <div className="max-w-lg w-full mx-auto px-6 text-center">
        <p className="text-8xl font-light text-primary/30 tracking-widest mb-4">404</p>
        <h1 className="text-2xl font-light tracking-[0.2em] uppercase mb-4">
          Page introuvable
        </h1>
        <p className="text-muted-foreground mb-10 leading-relaxed">
          La page que vous recherchez n&apos;existe pas ou a été déplacée.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/parfums"
            className="px-8 py-3.5 bg-foreground text-background text-sm tracking-[0.15em] uppercase hover:bg-primary transition-colors"
          >
            Découvrir nos parfums
          </Link>
          <Link
            href="/"
            className="px-8 py-3.5 border border-border text-sm tracking-[0.15em] uppercase hover:border-primary hover:text-primary transition-colors"
          >
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    </div>
  )
}
