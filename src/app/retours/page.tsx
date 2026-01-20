import { Package, Mail, AlertCircle, ShieldCheck, Droplets } from 'lucide-react'

export default function RetoursPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-[#19110B] text-white py-16 lg:py-24">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-3xl lg:text-5xl font-light tracking-[0.2em] uppercase mb-4">
            Politique de Retour
          </h1>
          <p className="text-gray-400 text-lg">
            Informations importantes concernant nos produits
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-4xl mx-auto px-6 py-16 lg:py-24">
        {/* Important Notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-8 mb-12">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-8 h-8 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="text-xl font-medium text-amber-800 mb-3">
                Retours non acceptés
              </h2>
              <p className="text-amber-700 leading-relaxed">
                En raison de la nature de nos produits (parfums décantés), <strong>les retours et remboursements ne sont pas possibles</strong>.
                Conformément à l'article L.221-28 du Code de la consommation, le droit de rétractation ne peut être exercé
                pour les produits descellés après livraison qui ne peuvent être renvoyés pour des raisons d'hygiène.
              </p>
            </div>
          </div>
        </div>

        {/* Why no returns */}
        <div className="prose prose-lg max-w-none mb-16">
          <h2 className="text-xl font-medium tracking-[0.1em] uppercase mb-6 text-[#19110B]">
            Pourquoi les retours ne sont pas possibles ?
          </h2>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-[#FAF9F7] rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <Droplets className="w-6 h-6 text-[#C9A962]" />
                <h3 className="font-medium text-[#19110B]">Produits décantés</h3>
              </div>
              <p className="text-gray-600 text-sm">
                Nos parfums sont soigneusement décantés à partir de flacons authentiques.
                Une fois le produit préparé pour vous, il ne peut être ni revendu ni réutilisé
                pour des raisons d'hygiène évidentes.
              </p>
            </div>
            <div className="bg-[#FAF9F7] rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <Package className="w-6 h-6 text-[#C9A962]" />
                <h3 className="font-medium text-[#19110B]">Emballage soigné</h3>
              </div>
              <p className="text-gray-600 text-sm">
                Chaque commande est emballée avec le plus grand soin pour garantir
                une livraison en parfait état. Nos vaporisateurs sont protégés individuellement
                et sécurisés pour le transport.
              </p>
            </div>
          </div>
        </div>

        {/* Our Guarantees */}
        <div className="border border-gray-200 rounded-lg p-8 mb-12">
          <div className="flex items-center gap-4 mb-6">
            <ShieldCheck className="w-8 h-8 text-[#C9A962]" />
            <h2 className="text-xl font-medium text-[#19110B]">Nos garanties</h2>
          </div>

          <p className="text-gray-600 mb-6 leading-relaxed">
            Même si les retours ne sont pas possibles, nous nous engageons à vous offrir
            la meilleure expérience possible :
          </p>

          <ul className="space-y-4">
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 bg-[#C9A962] rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <strong className="text-[#19110B]">Authenticité garantie à 100%</strong>
                <p className="text-gray-600 text-sm mt-1">
                  Tous nos parfums proviennent de sources officielles et sont 100% authentiques.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 bg-[#C9A962] rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <strong className="text-[#19110B]">Emballage premium</strong>
                <p className="text-gray-600 text-sm mt-1">
                  Chaque flacon est soigneusement emballé et protégé pour éviter tout dommage pendant le transport.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 bg-[#C9A962] rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <strong className="text-[#19110B]">Petites quantités pour découvrir</strong>
                <p className="text-gray-600 text-sm mt-1">
                  Nos formats (2ml, 5ml, 10ml) vous permettent de tester les parfums sans risque
                  d'investir dans un flacon complet que vous n'aimeriez pas.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 bg-[#C9A962] rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <strong className="text-[#19110B]">Service client réactif</strong>
                <p className="text-gray-600 text-sm mt-1">
                  Notre équipe est disponible pour répondre à toutes vos questions avant et après votre achat.
                </p>
              </div>
            </li>
          </ul>
        </div>

        {/* Exception: Damaged Products */}
        <div className="bg-[#19110B] rounded-lg p-8 mb-12 text-white">
          <h2 className="text-xl font-medium mb-4">
            Produit endommagé à la réception ?
          </h2>
          <p className="text-gray-300 mb-6 leading-relaxed">
            Dans le cas exceptionnel où vous recevriez un produit endommagé ou cassé pendant le transport,
            contactez-nous dans les <strong className="text-white">48 heures</strong> suivant la livraison avec :
          </p>
          <ul className="space-y-2 text-gray-300 mb-6">
            <li className="flex items-center gap-2">
              <span className="text-[#C9A962]">•</span>
              Des photos du produit endommagé
            </li>
            <li className="flex items-center gap-2">
              <span className="text-[#C9A962]">•</span>
              Des photos de l'emballage
            </li>
            <li className="flex items-center gap-2">
              <span className="text-[#C9A962]">•</span>
              Votre numéro de commande
            </li>
          </ul>
          <p className="text-gray-300">
            Nous étudierons votre demande et procéderons à un remplacement si le dommage est avéré.
          </p>
        </div>

        {/* Legal Notice */}
        <div className="prose prose-lg max-w-none mb-12">
          <h2 className="text-xl font-medium tracking-[0.1em] uppercase mb-4 text-[#19110B]">
            Base légale
          </h2>
          <p className="text-gray-600 leading-relaxed">
            Conformément à l'article L.221-28 du Code de la consommation français, le droit de rétractation
            ne peut être exercé pour :
          </p>
          <blockquote className="border-l-4 border-[#C9A962] pl-4 my-4 italic text-gray-500">
            "La fourniture de biens qui ont été descellés par le consommateur après la livraison et
            qui ne peuvent être renvoyés pour des raisons d'hygiène ou de protection de la santé."
          </blockquote>
          <p className="text-gray-600 leading-relaxed">
            Les parfums décantés entrent dans cette catégorie, ce qui explique notre politique de non-retour.
          </p>
        </div>

        {/* Contact CTA */}
        <div className="text-center bg-[#FAF9F7] rounded-lg p-8">
          <Mail className="w-12 h-12 text-[#C9A962] mx-auto mb-4" />
          <h3 className="text-xl font-medium text-[#19110B] mb-3">
            Une question ?
          </h3>
          <p className="text-gray-600 mb-6">
            Notre équipe est là pour vous aider avant votre achat
          </p>
          <a
            href="mailto:brazascent@gmail.com"
            className="inline-block px-8 py-3 bg-[#C9A962] text-white text-sm tracking-[0.15em] uppercase font-medium hover:bg-[#B8944F] transition-colors"
          >
            Nous contacter
          </a>
        </div>
      </section>
    </main>
  )
}
