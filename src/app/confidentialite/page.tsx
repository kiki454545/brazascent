export default function ConfidentialitePage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-[#19110B] text-white py-16 lg:py-24">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-3xl lg:text-5xl font-light tracking-[0.2em] uppercase mb-4">
            Politique de Confidentialité
          </h1>
          <p className="text-gray-400 text-lg">
            Dernière mise à jour : Janvier 2025
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-4xl mx-auto px-6 py-16 lg:py-24">
        <div className="prose prose-lg max-w-none">
          <p className="text-gray-600 mb-8 leading-relaxed text-lg">
            Chez Braza Scent, nous accordons une grande importance à la protection de vos données personnelles. Cette politique de confidentialité vous informe sur la manière dont nous collectons, utilisons et protégeons vos informations.
          </p>

          <h2 className="text-xl font-medium tracking-[0.1em] uppercase mb-4 text-[#19110B]">
            1. Responsable du traitement
          </h2>
          <p className="text-gray-600 mb-8 leading-relaxed">
            Le responsable du traitement des données personnelles est la société Braza Scent, joignable à l'adresse email : brazascent@gmail.com.
          </p>

          <h2 className="text-xl font-medium tracking-[0.1em] uppercase mb-4 text-[#19110B]">
            2. Données collectées
          </h2>
          <p className="text-gray-600 mb-4 leading-relaxed">
            Nous collectons les données suivantes :
          </p>
          <ul className="list-disc pl-6 mb-8 text-gray-600 space-y-2">
            <li><strong>Données d'identification :</strong> nom, prénom, adresse email, numéro de téléphone</li>
            <li><strong>Données de livraison :</strong> adresse postale</li>
            <li><strong>Données de transaction :</strong> historique des commandes, montants</li>
            <li><strong>Données de navigation :</strong> cookies, adresse IP, pages visitées</li>
            <li><strong>Données de compte :</strong> identifiants de connexion</li>
          </ul>

          <h2 className="text-xl font-medium tracking-[0.1em] uppercase mb-4 text-[#19110B]">
            3. Finalités du traitement
          </h2>
          <p className="text-gray-600 mb-4 leading-relaxed">
            Vos données sont collectées pour les finalités suivantes :
          </p>
          <ul className="list-disc pl-6 mb-8 text-gray-600 space-y-2">
            <li>Gestion et traitement de vos commandes</li>
            <li>Livraison des produits</li>
            <li>Gestion de votre compte client</li>
            <li>Service client et réponse à vos demandes</li>
            <li>Envoi de newsletters et offres promotionnelles (avec votre consentement)</li>
            <li>Amélioration de nos services et de votre expérience utilisateur</li>
            <li>Respect de nos obligations légales et réglementaires</li>
          </ul>

          <h2 className="text-xl font-medium tracking-[0.1em] uppercase mb-4 text-[#19110B]">
            4. Base légale du traitement
          </h2>
          <p className="text-gray-600 mb-4 leading-relaxed">
            Le traitement de vos données repose sur :
          </p>
          <ul className="list-disc pl-6 mb-8 text-gray-600 space-y-2">
            <li><strong>L'exécution du contrat :</strong> pour le traitement et la livraison de vos commandes</li>
            <li><strong>Votre consentement :</strong> pour l'envoi de communications marketing</li>
            <li><strong>Notre intérêt légitime :</strong> pour l'amélioration de nos services</li>
            <li><strong>Nos obligations légales :</strong> pour la conservation des données de facturation</li>
          </ul>

          <h2 className="text-xl font-medium tracking-[0.1em] uppercase mb-4 text-[#19110B]">
            5. Destinataires des données
          </h2>
          <p className="text-gray-600 mb-4 leading-relaxed">
            Vos données peuvent être transmises à :
          </p>
          <ul className="list-disc pl-6 mb-8 text-gray-600 space-y-2">
            <li><strong>Nos prestataires de paiement :</strong> Stripe, pour le traitement sécurisé des paiements</li>
            <li><strong>Nos transporteurs :</strong> pour la livraison de vos commandes</li>
            <li><strong>Nos sous-traitants techniques :</strong> hébergement (Vercel), base de données (Supabase)</li>
          </ul>
          <p className="text-gray-600 mb-8 leading-relaxed">
            Ces prestataires sont soumis à des obligations de confidentialité et ne peuvent utiliser vos données qu'aux fins prévues.
          </p>

          <h2 className="text-xl font-medium tracking-[0.1em] uppercase mb-4 text-[#19110B]">
            6. Durée de conservation
          </h2>
          <p className="text-gray-600 mb-4 leading-relaxed">
            Nous conservons vos données pour les durées suivantes :
          </p>
          <ul className="list-disc pl-6 mb-8 text-gray-600 space-y-2">
            <li><strong>Données de compte :</strong> tant que votre compte est actif, puis 3 ans après la dernière activité</li>
            <li><strong>Données de commande :</strong> 10 ans à des fins comptables et fiscales</li>
            <li><strong>Données de prospection :</strong> 3 ans à compter de votre dernière interaction</li>
            <li><strong>Cookies :</strong> 13 mois maximum</li>
          </ul>

          <h2 className="text-xl font-medium tracking-[0.1em] uppercase mb-4 text-[#19110B]">
            7. Vos droits
          </h2>
          <p className="text-gray-600 mb-4 leading-relaxed">
            Conformément au RGPD, vous disposez des droits suivants :
          </p>
          <ul className="list-disc pl-6 mb-4 text-gray-600 space-y-2">
            <li><strong>Droit d'accès :</strong> obtenir une copie de vos données personnelles</li>
            <li><strong>Droit de rectification :</strong> corriger des données inexactes ou incomplètes</li>
            <li><strong>Droit à l'effacement :</strong> demander la suppression de vos données</li>
            <li><strong>Droit à la limitation :</strong> limiter le traitement de vos données</li>
            <li><strong>Droit à la portabilité :</strong> recevoir vos données dans un format structuré</li>
            <li><strong>Droit d'opposition :</strong> vous opposer au traitement de vos données</li>
            <li><strong>Droit de retirer votre consentement :</strong> à tout moment pour les traitements basés sur le consentement</li>
          </ul>
          <p className="text-gray-600 mb-8 leading-relaxed">
            Pour exercer ces droits, contactez-nous à : <a href="mailto:brazascent@gmail.com" className="text-[#C9A962] hover:underline">brazascent@gmail.com</a>
          </p>

          <h2 className="text-xl font-medium tracking-[0.1em] uppercase mb-4 text-[#19110B]">
            8. Cookies
          </h2>
          <p className="text-gray-600 mb-4 leading-relaxed">
            Notre site utilise des cookies pour :
          </p>
          <ul className="list-disc pl-6 mb-4 text-gray-600 space-y-2">
            <li><strong>Cookies essentiels :</strong> nécessaires au fonctionnement du site (panier, authentification)</li>
            <li><strong>Cookies analytiques :</strong> pour comprendre comment vous utilisez notre site</li>
            <li><strong>Cookies de personnalisation :</strong> pour mémoriser vos préférences</li>
          </ul>
          <p className="text-gray-600 mb-8 leading-relaxed">
            Vous pouvez gérer vos préférences de cookies via les paramètres de votre navigateur.
          </p>

          <h2 className="text-xl font-medium tracking-[0.1em] uppercase mb-4 text-[#19110B]">
            9. Sécurité des données
          </h2>
          <p className="text-gray-600 mb-8 leading-relaxed">
            Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données contre tout accès non autorisé, perte ou altération. Les paiements sont sécurisés via Stripe et les communications sont chiffrées via HTTPS.
          </p>

          <h2 className="text-xl font-medium tracking-[0.1em] uppercase mb-4 text-[#19110B]">
            10. Transferts internationaux
          </h2>
          <p className="text-gray-600 mb-8 leading-relaxed">
            Certains de nos prestataires peuvent être situés en dehors de l'Union Européenne. Dans ce cas, nous nous assurons que des garanties appropriées sont en place (clauses contractuelles types, certification Privacy Shield, etc.).
          </p>

          <h2 className="text-xl font-medium tracking-[0.1em] uppercase mb-4 text-[#19110B]">
            11. Modifications
          </h2>
          <p className="text-gray-600 mb-8 leading-relaxed">
            Nous pouvons être amenés à modifier cette politique de confidentialité. En cas de modification substantielle, nous vous en informerons par email ou via une notification sur notre site.
          </p>

          <h2 className="text-xl font-medium tracking-[0.1em] uppercase mb-4 text-[#19110B]">
            12. Réclamation
          </h2>
          <p className="text-gray-600 mb-8 leading-relaxed">
            Si vous estimez que le traitement de vos données n'est pas conforme à la réglementation, vous pouvez introduire une réclamation auprès de la CNIL (Commission Nationale de l'Informatique et des Libertés) : <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-[#C9A962] hover:underline">www.cnil.fr</a>.
          </p>

          <div className="mt-12 p-6 bg-[#FAF9F7] rounded-lg">
            <p className="text-sm text-gray-500">
              Pour toute question concernant cette politique de confidentialité, vous pouvez nous contacter à l'adresse : <a href="mailto:brazascent@gmail.com" className="text-[#C9A962] hover:underline">brazascent@gmail.com</a>
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
