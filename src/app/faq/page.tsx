'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

const faqCategories = [
  {
    title: 'Commandes & Paiement',
    questions: [
      {
        question: 'Comment passer une commande ?',
        answer: 'Pour passer une commande, ajoutez simplement les produits souhaités à votre panier, puis cliquez sur "Valider le panier". Suivez ensuite les étapes du processus de paiement en renseignant vos informations de livraison et en choisissant votre mode de paiement.'
      },
      {
        question: 'Quels modes de paiement acceptez-vous ?',
        answer: 'Nous acceptons les cartes bancaires (Visa, Mastercard, American Express) ainsi que Apple Pay et Google Pay. Tous les paiements sont sécurisés via Stripe.'
      },
      {
        question: 'Ma commande a-t-elle bien été enregistrée ?',
        answer: 'Après validation de votre commande, vous recevrez un email de confirmation à l\'adresse renseignée. Vous pouvez également suivre vos commandes dans votre espace client, rubrique "Mes commandes".'
      },
      {
        question: 'Puis-je modifier ou annuler ma commande ?',
        answer: 'Une fois la commande validée, il n\'est pas possible de la modifier. Cependant, si votre commande n\'a pas encore été expédiée, contactez-nous rapidement par email et nous ferons notre possible pour l\'annuler.'
      }
    ]
  },
  {
    title: 'Livraison',
    questions: [
      {
        question: 'Quels sont les délais de livraison ?',
        answer: 'En livraison standard, comptez 3 à 5 jours ouvrés. En livraison express, comptez 1 à 2 jours ouvrés. Ces délais peuvent varier selon votre localisation et les périodes de forte activité.'
      },
      {
        question: 'Combien coûte la livraison ?',
        answer: 'La livraison standard est offerte à partir de 150€ d\'achat. En dessous de ce montant, elle est facturée 9,90€. La livraison express est disponible pour 14,90€.'
      },
      {
        question: 'Livrez-vous à l\'international ?',
        answer: 'Pour le moment, nous livrons uniquement en France métropolitaine. La livraison internationale sera bientôt disponible.'
      },
      {
        question: 'Comment suivre ma commande ?',
        answer: 'Dès l\'expédition de votre commande, vous recevrez un email avec un numéro de suivi. Vous pouvez également suivre l\'avancement de votre commande dans votre espace client.'
      }
    ]
  },
  {
    title: 'Produits',
    questions: [
      {
        question: 'Vos parfums sont-ils authentiques ?',
        answer: 'Absolument. Tous nos parfums sont 100% authentiques et proviennent directement des maisons de parfum ou de distributeurs officiels. Nous garantissons l\'authenticité de chaque produit.'
      },
      {
        question: 'Quelles tailles de flacons proposez-vous ?',
        answer: 'Nous proposons plusieurs formats : 2ml (échantillon), 5ml (découverte), 10ml (voyage) et parfois des formats plus grands selon les parfums. Cela vous permet de tester avant d\'investir dans un flacon complet.'
      },
      {
        question: 'Comment sont conditionnés les parfums ?',
        answer: 'Nos parfums sont soigneusement décantés dans des vaporisateurs en verre de qualité, puis emballés dans des packaging élégants pour garantir une livraison en parfait état.'
      },
      {
        question: 'Quelle est la durée de conservation des parfums ?',
        answer: 'Conservés à l\'abri de la lumière et de la chaleur, nos parfums gardent leurs qualités pendant plusieurs années. Nous recommandons de les utiliser dans les 12 à 24 mois après ouverture pour profiter de toutes leurs nuances.'
      }
    ]
  },
  {
    title: 'Retours & Remboursements',
    questions: [
      {
        question: 'Puis-je retourner un produit ?',
        answer: 'Non, les retours ne sont pas acceptés. Nos parfums étant des produits décantés, ils ne peuvent être renvoyés pour des raisons d\'hygiène, conformément à l\'article L.221-28 du Code de la consommation. C\'est pourquoi nous proposons des petits formats (2ml, 5ml, 10ml) pour vous permettre de découvrir les parfums sans risque.'
      },
      {
        question: 'Pourquoi les retours ne sont-ils pas possibles ?',
        answer: 'Nos parfums sont soigneusement décantés à partir de flacons authentiques et préparés individuellement pour chaque commande. Une fois le produit préparé, il ne peut être ni revendu ni réutilisé pour des raisons d\'hygiène évidentes. La loi française exclut ces produits du droit de rétractation.'
      },
      {
        question: 'Que faire si je reçois un produit endommagé ?',
        answer: 'Dans le cas rare où vous recevriez un produit endommagé ou cassé pendant le transport, contactez-nous dans les 48h suivant la livraison avec des photos du produit et de l\'emballage, ainsi que votre numéro de commande. Nous étudierons votre demande et procéderons à un remplacement si le dommage est avéré.'
      },
      {
        question: 'Comment être sûr de mon choix avant d\'acheter ?',
        answer: 'C\'est tout l\'avantage de nos petits formats ! Nos décants de 2ml, 5ml et 10ml vous permettent de tester un parfum sans investir dans un flacon complet. Vous pouvez ainsi découvrir plusieurs fragrances et trouver celle qui vous correspond vraiment.'
      }
    ]
  },
  {
    title: 'Compte Client',
    questions: [
      {
        question: 'Dois-je créer un compte pour commander ?',
        answer: 'La création d\'un compte n\'est pas obligatoire mais fortement recommandée. Elle vous permet de suivre vos commandes, de sauvegarder vos adresses et de profiter d\'offres exclusives.'
      },
      {
        question: 'Comment réinitialiser mon mot de passe ?',
        answer: 'Sur la page de connexion, cliquez sur "Mot de passe oublié". Vous recevrez un email avec un lien pour créer un nouveau mot de passe.'
      },
      {
        question: 'Comment modifier mes informations personnelles ?',
        answer: 'Connectez-vous à votre espace client, puis accédez à la section "Mon profil" pour modifier vos informations personnelles, adresses de livraison ou préférences.'
      }
    ]
  }
]

export default function FAQPage() {
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({})

  const toggleItem = (id: string) => {
    setOpenItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  return (
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-[#19110B] text-white py-16 lg:py-24">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-3xl lg:text-5xl font-light tracking-[0.2em] uppercase mb-4">
            FAQ
          </h1>
          <p className="text-gray-400 text-lg">
            Questions fréquemment posées
          </p>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="max-w-4xl mx-auto px-6 py-16 lg:py-24">
        {faqCategories.map((category, categoryIndex) => (
          <div key={categoryIndex} className="mb-12 last:mb-0">
            <h2 className="text-xl font-medium tracking-[0.1em] uppercase mb-6 text-[#19110B] border-b border-gray-200 pb-4">
              {category.title}
            </h2>
            <div className="space-y-4">
              {category.questions.map((item, itemIndex) => {
                const itemId = `${categoryIndex}-${itemIndex}`
                const isOpen = openItems[itemId]
                return (
                  <div key={itemId} className="border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleItem(itemId)}
                      className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors"
                    >
                      <span className="font-medium text-[#19110B] pr-4">{item.question}</span>
                      <ChevronDown className={`w-5 h-5 text-[#C9A962] flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                    <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96' : 'max-h-0'}`}>
                      <p className="px-5 pb-5 text-gray-600 leading-relaxed">
                        {item.answer}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {/* Contact CTA */}
        <div className="mt-16 bg-[#FAF9F7] rounded-lg p-8 text-center">
          <h3 className="text-xl font-medium text-[#19110B] mb-3">
            Vous n'avez pas trouvé la réponse à votre question ?
          </h3>
          <p className="text-gray-600 mb-6">
            Notre équipe est là pour vous aider
          </p>
          <a
            href="/contact"
            className="inline-block px-8 py-3 bg-[#C9A962] text-white text-sm tracking-[0.15em] uppercase font-medium hover:bg-[#B8944F] transition-colors"
          >
            Nous contacter
          </a>
        </div>
      </section>
    </main>
  )
}
