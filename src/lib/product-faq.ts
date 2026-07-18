export interface ProductFaqItem {
  q: string
  a: string
}

// Source unique : utilisée à la fois pour l'affichage (ProductClient) et le schema FAQPage (page.tsx).
export const PRODUCT_FAQ: ProductFaqItem[] = [
  {
    q: "C'est quoi un décant de parfum ?",
    a: "Un décant est un prélèvement effectué directement depuis le flacon d'origine de la marque. Vous recevez le parfum authentique, sans dilution ni reformulation, dans un vaporisateur soigneusement conditionné. La même fragrance qu'en boutique, en format découverte.",
  },
  {
    q: 'Le parfum est-il dilué ou modifié ?',
    a: "Non. Nos décants sont du parfum pur, dans la concentration exacte du flacon d'origine. Aucun ajout de solvant, d'alcool supplémentaire ou de modificateur. Ce que vous recevez est identique à ce que vous trouveriez dans une boutique officielle.",
  },
  {
    q: "Quelle est la durée d'un décant 5ml ?",
    a: 'Un 5ml représente environ 100 à 110 projections, soit 2 à 3 semaines d\'utilisation quotidienne (2 à 3 sprays par jour). Suffisant pour découvrir toutes les phases d\'évolution d\'une fragrance : note de tête, cœur, fond.',
  },
  {
    q: 'Puis-je retourner un décant ?',
    a: "Pour des raisons d'hygiène, les décants ne sont pas retournables une fois expédiés. C'est précisément pourquoi nous proposons des formats aussi petits que 2ml, pour minimiser votre investissement lors de la découverte.",
  },
]
