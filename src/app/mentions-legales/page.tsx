export default function MentionsLegalesPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-[#19110B] text-white py-16 lg:py-24">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-3xl lg:text-5xl font-light tracking-[0.2em] uppercase mb-4">
            Mentions Légales
          </h1>
          <p className="text-gray-400 text-lg">
            Informations légales obligatoires
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-4xl mx-auto px-6 py-16 lg:py-24">
        <div className="prose prose-lg max-w-none">
          <h2 className="text-xl font-medium tracking-[0.1em] uppercase mb-4 text-[#19110B]">
            1. Éditeur du site
          </h2>
          <div className="text-gray-600 mb-8 leading-relaxed space-y-2">
            <p><strong>Nom de l'entreprise :</strong> Braza Scent</p>
            <p><strong>Forme juridique :</strong> Micro-entreprise</p>
            <p><strong>Adresse :</strong> France</p>
            <p><strong>Email :</strong> <a href="mailto:brazascent@gmail.com" className="text-[#C9A962] hover:underline">brazascent@gmail.com</a></p>
            <p><strong>Site web :</strong> <a href="https://brazascent.com" className="text-[#C9A962] hover:underline">brazascent.com</a></p>
          </div>

          <h2 className="text-xl font-medium tracking-[0.1em] uppercase mb-4 text-[#19110B]">
            2. Directeur de la publication
          </h2>
          <p className="text-gray-600 mb-8 leading-relaxed">
            Le directeur de la publication est le représentant légal de la société Braza Scent.
          </p>

          <h2 className="text-xl font-medium tracking-[0.1em] uppercase mb-4 text-[#19110B]">
            3. Hébergement
          </h2>
          <div className="text-gray-600 mb-8 leading-relaxed space-y-2">
            <p><strong>Hébergeur :</strong> Vercel Inc.</p>
            <p><strong>Adresse :</strong> 340 S Lemon Ave #4133, Walnut, CA 91789, USA</p>
            <p><strong>Site web :</strong> <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-[#C9A962] hover:underline">vercel.com</a></p>
          </div>

          <h2 className="text-xl font-medium tracking-[0.1em] uppercase mb-4 text-[#19110B]">
            4. Propriété intellectuelle
          </h2>
          <p className="text-gray-600 mb-4 leading-relaxed">
            L'ensemble du contenu de ce site (textes, images, vidéos, logos, graphismes, icônes, etc.) est la propriété exclusive de Braza Scent ou de ses partenaires, et est protégé par les lois françaises et internationales relatives à la propriété intellectuelle.
          </p>
          <p className="text-gray-600 mb-8 leading-relaxed">
            Toute reproduction, représentation, modification, publication, transmission, ou dénaturation, totale ou partielle du site ou de son contenu, par quelque procédé que ce soit, et sur quelque support que ce soit est interdite sans autorisation écrite préalable de Braza Scent.
          </p>

          <h2 className="text-xl font-medium tracking-[0.1em] uppercase mb-4 text-[#19110B]">
            5. Données personnelles
          </h2>
          <p className="text-gray-600 mb-4 leading-relaxed">
            Conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi Informatique et Libertés, vous disposez d'un droit d'accès, de rectification, de suppression et d'opposition aux données personnelles vous concernant.
          </p>
          <p className="text-gray-600 mb-8 leading-relaxed">
            Pour plus d'informations sur la collecte et le traitement de vos données, consultez notre <a href="/confidentialite" className="text-[#C9A962] hover:underline">Politique de confidentialité</a>.
          </p>

          <h2 className="text-xl font-medium tracking-[0.1em] uppercase mb-4 text-[#19110B]">
            6. Cookies
          </h2>
          <p className="text-gray-600 mb-8 leading-relaxed">
            Ce site utilise des cookies pour améliorer l'expérience utilisateur et réaliser des statistiques de visites. En poursuivant votre navigation sur ce site, vous acceptez l'utilisation de cookies. Vous pouvez modifier les paramètres de votre navigateur pour refuser les cookies.
          </p>

          <h2 className="text-xl font-medium tracking-[0.1em] uppercase mb-4 text-[#19110B]">
            7. Limitation de responsabilité
          </h2>
          <p className="text-gray-600 mb-4 leading-relaxed">
            Braza Scent s'efforce d'assurer l'exactitude et la mise à jour des informations diffusées sur ce site. Toutefois, Braza Scent ne peut garantir l'exactitude, la précision ou l'exhaustivité des informations mises à disposition.
          </p>
          <p className="text-gray-600 mb-8 leading-relaxed">
            En conséquence, Braza Scent décline toute responsabilité pour tout dommage résultant notamment d'une imprécision ou inexactitude des informations disponibles sur ce site, ou de l'intrusion d'un tiers ayant entraîné une modification des informations.
          </p>

          <h2 className="text-xl font-medium tracking-[0.1em] uppercase mb-4 text-[#19110B]">
            8. Liens hypertextes
          </h2>
          <p className="text-gray-600 mb-8 leading-relaxed">
            Le site peut contenir des liens hypertextes vers d'autres sites. Braza Scent n'exerce aucun contrôle sur ces sites et décline toute responsabilité quant à leur contenu ou aux dommages pouvant résulter de leur utilisation.
          </p>

          <h2 className="text-xl font-medium tracking-[0.1em] uppercase mb-4 text-[#19110B]">
            9. Droit applicable
          </h2>
          <p className="text-gray-600 mb-8 leading-relaxed">
            Les présentes mentions légales sont régies par le droit français. En cas de litige, et après échec de toute tentative de recherche d'une solution amiable, les tribunaux français seront seuls compétents.
          </p>

          <h2 className="text-xl font-medium tracking-[0.1em] uppercase mb-4 text-[#19110B]">
            10. Crédits
          </h2>
          <p className="text-gray-600 mb-8 leading-relaxed">
            Site développé avec Next.js et hébergé sur Vercel. Les paiements sont sécurisés par Stripe.
          </p>

          <div className="mt-12 p-6 bg-[#FAF9F7] rounded-lg">
            <p className="text-sm text-gray-500">
              Pour toute question concernant ces mentions légales, vous pouvez nous contacter à l'adresse : <a href="mailto:brazascent@gmail.com" className="text-[#C9A962] hover:underline">brazascent@gmail.com</a>
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
