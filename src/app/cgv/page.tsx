export default function CGVPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-[#19110B] text-white py-16 lg:py-24">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-3xl lg:text-5xl font-light tracking-[0.2em] uppercase mb-4">
            Conditions Générales de Vente
          </h1>
          <p className="text-gray-400 text-lg">
            Dernière mise à jour : Janvier 2025
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-4xl mx-auto px-6 py-16 lg:py-24">
        <div className="prose prose-lg max-w-none">
          <h2 className="text-xl font-medium tracking-[0.1em] uppercase mb-4 text-[#19110B]">
            Article 1 - Objet
          </h2>
          <p className="text-gray-600 mb-8 leading-relaxed">
            Les présentes conditions générales de vente régissent les relations contractuelles entre la société Braza Scent (ci-après "le Vendeur") et toute personne physique ou morale (ci-après "le Client") souhaitant procéder à un achat via le site internet brazascent.com.
          </p>

          <h2 className="text-xl font-medium tracking-[0.1em] uppercase mb-4 text-[#19110B]">
            Article 2 - Produits
          </h2>
          <p className="text-gray-600 mb-4 leading-relaxed">
            Les produits proposés à la vente sont des parfums authentiques décantés en petites quantités (2ml, 5ml, 10ml). Chaque produit est accompagné d'une description détaillée permettant au Client de connaître ses caractéristiques essentielles.
          </p>
          <p className="text-gray-600 mb-8 leading-relaxed">
            Les photographies illustrant les produits n'entrent pas dans le champ contractuel et ne sauraient engager la responsabilité du Vendeur.
          </p>

          <h2 className="text-xl font-medium tracking-[0.1em] uppercase mb-4 text-[#19110B]">
            Article 3 - Prix
          </h2>
          <p className="text-gray-600 mb-4 leading-relaxed">
            Les prix sont indiqués en euros toutes taxes comprises (TTC). Ils ne comprennent pas les frais de livraison, facturés en supplément selon les modalités précisées lors de la commande.
          </p>
          <p className="text-gray-600 mb-8 leading-relaxed">
            Le Vendeur se réserve le droit de modifier ses prix à tout moment, étant entendu que le prix appliqué sera celui en vigueur au moment de la validation de la commande par le Client.
          </p>

          <h2 className="text-xl font-medium tracking-[0.1em] uppercase mb-4 text-[#19110B]">
            Article 4 - Commande
          </h2>
          <p className="text-gray-600 mb-4 leading-relaxed">
            Le Client passe commande en suivant le processus de commande en ligne. La vente est conclue dès la validation du paiement par le Client. Un email de confirmation récapitulant la commande est envoyé au Client.
          </p>
          <p className="text-gray-600 mb-8 leading-relaxed">
            Le Vendeur se réserve le droit de refuser ou d'annuler toute commande d'un Client avec lequel existerait un litige relatif au paiement d'une commande antérieure.
          </p>

          <h2 className="text-xl font-medium tracking-[0.1em] uppercase mb-4 text-[#19110B]">
            Article 5 - Paiement
          </h2>
          <p className="text-gray-600 mb-4 leading-relaxed">
            Le paiement s'effectue en ligne par carte bancaire (Visa, Mastercard, American Express) via la plateforme sécurisée Stripe. Apple Pay et Google Pay sont également acceptés.
          </p>
          <p className="text-gray-600 mb-8 leading-relaxed">
            Le paiement est exigible immédiatement à la commande. Les données de paiement sont cryptées et ne transitent pas par nos serveurs.
          </p>

          <h2 className="text-xl font-medium tracking-[0.1em] uppercase mb-4 text-[#19110B]">
            Article 6 - Livraison
          </h2>
          <p className="text-gray-600 mb-4 leading-relaxed">
            Les produits sont livrés à l'adresse indiquée par le Client lors de la commande. Les délais de livraison sont donnés à titre indicatif :
          </p>
          <ul className="list-disc pl-6 mb-4 text-gray-600 space-y-2">
            <li>Livraison standard : 3 à 5 jours ouvrés</li>
            <li>Livraison express : 1 à 2 jours ouvrés</li>
          </ul>
          <p className="text-gray-600 mb-4 leading-relaxed">
            La livraison standard est offerte à partir de 150€ d'achat. En dessous de ce montant, des frais de 9,90€ s'appliquent. La livraison express est facturée 14,90€.
          </p>
          <p className="text-gray-600 mb-8 leading-relaxed">
            En cas de retard de livraison, le Client sera informé dans les meilleurs délais.
          </p>

          <h2 className="text-xl font-medium tracking-[0.1em] uppercase mb-4 text-[#19110B]">
            Article 7 - Absence de droit de rétractation
          </h2>
          <p className="text-gray-600 mb-4 leading-relaxed">
            <strong>Conformément à l'article L.221-28 du Code de la consommation, le droit de rétractation ne s'applique pas</strong> aux produits vendus par Braza Scent.
          </p>
          <p className="text-gray-600 mb-4 leading-relaxed">
            En effet, nos parfums sont des produits décantés, préparés individuellement pour chaque commande. Ces produits ne peuvent être renvoyés pour des raisons d'hygiène et de protection de la santé, conformément à l'article L.221-28 3° du Code de la consommation qui exclut du droit de rétractation :
          </p>
          <p className="text-gray-600 mb-4 leading-relaxed italic border-l-4 border-[#C9A962] pl-4">
            "La fourniture de biens qui ont été descellés par le consommateur après la livraison et qui ne peuvent être renvoyés pour des raisons d'hygiène ou de protection de la santé."
          </p>
          <p className="text-gray-600 mb-8 leading-relaxed">
            <strong>En conséquence, aucun retour ni remboursement ne sera accepté.</strong> Le Client est informé de cette condition avant la validation de sa commande. Pour plus d'informations, consultez notre page <a href="/retours" className="text-[#C9A962] hover:underline">Politique de retour</a>.
          </p>

          <h2 className="text-xl font-medium tracking-[0.1em] uppercase mb-4 text-[#19110B]">
            Article 8 - Garanties
          </h2>
          <p className="text-gray-600 mb-4 leading-relaxed">
            Tous nos produits bénéficient de la garantie légale de conformité (articles L.217-4 et suivants du Code de la consommation) et de la garantie des vices cachés (articles 1641 et suivants du Code civil).
          </p>
          <p className="text-gray-600 mb-8 leading-relaxed">
            En cas de produit non conforme ou défectueux, le Client peut demander le remplacement ou le remboursement du produit.
          </p>

          <h2 className="text-xl font-medium tracking-[0.1em] uppercase mb-4 text-[#19110B]">
            Article 9 - Responsabilité
          </h2>
          <p className="text-gray-600 mb-8 leading-relaxed">
            Le Vendeur ne saurait être tenu responsable de l'inexécution du contrat en cas de force majeure, de perturbation ou grève totale ou partielle des services postaux et moyens de transport, ou en cas de rupture de stock imprévisible.
          </p>

          <h2 className="text-xl font-medium tracking-[0.1em] uppercase mb-4 text-[#19110B]">
            Article 10 - Propriété intellectuelle
          </h2>
          <p className="text-gray-600 mb-8 leading-relaxed">
            Tous les éléments du site brazascent.com (textes, images, logos, etc.) sont la propriété exclusive du Vendeur. Toute reproduction, représentation ou exploitation, totale ou partielle, est interdite sans autorisation préalable.
          </p>

          <h2 className="text-xl font-medium tracking-[0.1em] uppercase mb-4 text-[#19110B]">
            Article 11 - Données personnelles
          </h2>
          <p className="text-gray-600 mb-8 leading-relaxed">
            Les informations collectées lors de la commande font l'objet d'un traitement informatique destiné à la gestion des commandes et à la relation client. Pour plus d'informations, consultez notre <a href="/confidentialite" className="text-[#C9A962] hover:underline">Politique de confidentialité</a>.
          </p>

          <h2 className="text-xl font-medium tracking-[0.1em] uppercase mb-4 text-[#19110B]">
            Article 12 - Médiation
          </h2>
          <p className="text-gray-600 mb-8 leading-relaxed">
            En cas de litige, le Client peut recourir gratuitement au service de médiation de la consommation. Le médiateur tentera de trouver une solution amiable au différend. Pour plus d'informations sur la médiation, vous pouvez consulter le site officiel : <a href="https://www.economie.gouv.fr/mediation-conso" target="_blank" rel="noopener noreferrer" className="text-[#C9A962] hover:underline">economie.gouv.fr/mediation-conso</a>.
          </p>

          <h2 className="text-xl font-medium tracking-[0.1em] uppercase mb-4 text-[#19110B]">
            Article 13 - Droit applicable
          </h2>
          <p className="text-gray-600 mb-8 leading-relaxed">
            Les présentes conditions générales de vente sont soumises au droit français. En cas de litige, les tribunaux français seront seuls compétents.
          </p>

          <div className="mt-12 p-6 bg-[#FAF9F7] rounded-lg">
            <p className="text-sm text-gray-500">
              Pour toute question concernant ces conditions générales de vente, vous pouvez nous contacter à l'adresse : <a href="mailto:brazascent@gmail.com" className="text-[#C9A962] hover:underline">brazascent@gmail.com</a>
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
