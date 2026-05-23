import type { Metadata } from 'next'
import { Package, Mail, AlertCircle, ShieldCheck, Droplets } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Retours & Échanges | Braza Scent',
  description: 'Politique de retours et échanges Braza Scent. Retournez votre commande sous 30 jours. Procédure simple et rapide.',
  robots: { index: false },
}

export default function RetoursPage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Hero */}
      <section className="bg-black text-white pt-32 lg:pt-40 pb-16 lg:pb-24">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-3xl lg:text-5xl font-light tracking-[0.2em] uppercase mb-4">
            Politique de Retour
          </h1>
          <p className="text-white text-lg">
            Informations importantes concernant nos produits
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-4xl mx-auto px-6 py-16 lg:py-24">
        {/* Important Notice */}
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-lg p-8 mb-12">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-8 h-8 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="text-xl font-medium text-amber-800 dark:text-amber-200 mb-3">
                Retours non acceptés
              </h2>
              <p className="text-amber-700 dark:text-amber-300/90 leading-relaxed">
                En raison de la nature de nos produits (parfums décantés), <strong>les retours et remboursements ne sont pas possibles</strong>.
                Conformément à l'article L.221-28 du Code de la consommation, le droit de rétractation ne peut être exercé
                pour les produits descellés après livraison qui ne peuvent être renvoyés pour des raisons d'hygiène.
              </p>
            </div>
          </div>
        </div>

        {/* Why no returns */}
        <div className="prose prose-lg max-w-none mb-16">
          <h2 className="text-xl font-medium tracking-[0.1em] uppercase mb-6 text-foreground">
            Pourquoi les retours ne sont pas possibles ?
          </h2>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-cream rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <Droplets className="w-6 h-6 text-primary" />
                <h3 className="font-medium text-foreground">Produits décantés</h3>
              </div>
              <p className="text-muted-foreground text-sm">
                Nos parfums sont soigneusement décantés à partir de flacons authentiques.
                Une fois le produit préparé pour vous, il ne peut être ni revendu ni réutilisé
                pour des raisons d'hygiène évidentes.
              </p>
            </div>
            <div className="bg-cream rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <Package className="w-6 h-6 text-primary" />
                <h3 className="font-medium text-foreground">Emballage soigné</h3>
              </div>
              <p className="text-muted-foreground text-sm">
                Chaque commande est emballée avec le plus grand soin pour garantir
                une livraison en parfait état. Nos vaporisateurs sont protégés individuellement
                et sécurisés pour le transport.
              </p>
            </div>
          </div>
        </div>

        {/* Our Guarantees */}
        <div className="border border-border rounded-lg p-8 mb-12">
          <div className="flex items-center gap-4 mb-6">
            <ShieldCheck className="w-8 h-8 text-primary" />
            <h2 className="text-xl font-medium text-foreground">Nos garanties</h2>
          </div>

          <p className="text-muted-foreground mb-6 leading-relaxed">
            Même si les retours ne sont pas possibles, nous nous engageons à vous offrir
            la meilleure expérience possible :
          </p>

          <ul className="space-y-4">
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <strong className="text-foreground">Authenticité garantie à 100%</strong>
                <p className="text-muted-foreground text-sm mt-1">
                  Tous nos parfums proviennent de sources officielles et sont 100% authentiques.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <strong className="text-foreground">Emballage premium</strong>
                <p className="text-muted-foreground text-sm mt-1">
                  Chaque flacon est soigneusement emballé et protégé pour éviter tout dommage pendant le transport.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <strong className="text-foreground">Petites quantités pour découvrir</strong>
                <p className="text-muted-foreground text-sm mt-1">
                  Nos formats (2ml, 5ml, 10ml) vous permettent de tester les parfums sans risque
                  d'investir dans un flacon complet que vous n'aimeriez pas.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <strong className="text-foreground">Service client réactif</strong>
                <p className="text-muted-foreground text-sm mt-1">
                  Notre équipe est disponible pour répondre à toutes vos questions avant et après votre achat.
                </p>
              </div>
            </li>
          </ul>
        </div>

        {/* Exception: Damaged Products */}
        <div className="bg-black rounded-lg p-8 mb-12 text-white">
          <h2 className="text-xl font-medium mb-4">
            Produit endommagé à la réception ?
          </h2>
          <p className="text-white/70 mb-6 leading-relaxed">
            Dans le cas exceptionnel où vous recevriez un produit endommagé ou cassé pendant le transport,
            contactez-nous dans les <strong className="text-white">48 heures</strong> suivant la livraison avec :
          </p>
          <ul className="space-y-2 text-white/70 mb-6">
            <li className="flex items-center gap-2">
              <span className="text-primary">•</span>
              Des photos du produit endommagé
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary">•</span>
              Des photos de l'emballage
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary">•</span>
              Votre numéro de commande
            </li>
          </ul>
          <p className="text-white/70">
            Nous étudierons votre demande et procéderons à un remplacement si le dommage est avéré.
          </p>
        </div>

        {/* Legal Notice */}
        <div className="prose prose-lg max-w-none mb-12">
          <h2 className="text-xl font-medium tracking-[0.1em] uppercase mb-4 text-foreground">
            Base légale
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Conformément à l'article L.221-28 du Code de la consommation français, le droit de rétractation
            ne peut être exercé pour :
          </p>
          <blockquote className="border-l-4 border-primary pl-4 my-4 italic text-muted-foreground">
            "La fourniture de biens qui ont été descellés par le consommateur après la livraison et
            qui ne peuvent être renvoyés pour des raisons d'hygiène ou de protection de la santé."
          </blockquote>
          <p className="text-muted-foreground leading-relaxed">
            Les parfums décantés entrent dans cette catégorie, ce qui explique notre politique de non-retour.
          </p>
        </div>

        {/* Contact CTA */}
        <div className="text-center bg-cream rounded-lg p-8">
          <Mail className="w-12 h-12 text-primary mx-auto mb-4" />
          <h3 className="text-xl font-medium text-foreground mb-3">
            Une question ?
          </h3>
          <p className="text-muted-foreground mb-6">
            Notre équipe est là pour vous aider avant votre achat
          </p>
          <a
            href="/contact"
            className="inline-block px-8 py-3 bg-primary text-white text-sm tracking-[0.15em] uppercase font-medium hover:bg-gold-light transition-colors"
          >
            Nous contacter
          </a>
        </div>
      </section>
    </main>
  )
}
