/* ─────────────────────────────────────────────────────────────────────────────
   BrazaScent — Génération de contenu SEO dynamique
   Rendu côté serveur (SSG) : appelé uniquement dans des Server Components.
───────────────────────────────────────────────────────────────────────────── */

/* ── Types ──────────────────────────────────────────────────────────────── */

export interface ProductForSeo {
  name: string
  slug: string
  brand?: string
  category?: string
  notes: { top: string[]; heart: string[]; base: string[] }
}

export interface BrandSeoInput {
  brandName: string
  description: string | null
  products: ProductForSeo[]
}

export interface NoteSeoInput {
  noteName: string
  products: ProductForSeo[]
}

export interface BrandSeoContent {
  heading: string
  intro: string
  styleOlfactif: string
  pourquoiDecant: string
  productLinks: Array<{ name: string; slug: string }>
  brazen: string
  disclaimer: string
  faq: Array<{ q: string; a: string }>
}

// FAQ statique ajoutée après la FAQ générée sur les pages marques
// (source commune : MarqueClient.tsx pour l'affichage, marques/[slug]/page.tsx pour le schema FAQPage)
export const BRAND_EXTRA_FAQ = {
  q: "C'est quoi un décant de parfum ?",
  a: "Un décant est un prélèvement du parfum original effectué directement depuis le flacon de la marque. Vous recevez la même fragrance que le flacon plein — sans dilution — dans un format de 2ml, 5ml ou 10ml. Idéal pour tester avant d'acheter.",
}

export interface NoteSeoContent {
  heading: string
  explication: string
  sensations: string
  familles: string
  surLeSite: string
}

/* ── Helpers internes ───────────────────────────────────────────────────── */

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
}

/** Retourne les N notes les plus fréquentes parmi tous les produits. */
function topNotes(products: ProductForSeo[], n = 5): string[] {
  const freq = new Map<string, number>()
  for (const p of products) {
    const all = [...p.notes.top, ...p.notes.heart, ...p.notes.base]
    for (const note of all) {
      if (!note) continue
      const k = note.toLowerCase()
      freq.set(k, (freq.get(k) ?? 0) + 1)
    }
  }
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([n]) => n)
    .map(n => n.charAt(0).toUpperCase() + n.slice(1))
}

/** Catégories dominantes dans la collection d'une marque. */
function dominantCategories(products: ProductForSeo[]): string[] {
  const counts: Record<string, number> = {}
  for (const p of products) {
    const c = (p.category ?? 'unisexe').toLowerCase()
    counts[c] = (counts[c] ?? 0) + 1
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([c]) => c)
}

/** Formule la liste des catégories de façon naturelle. */
function formatCategories(cats: string[]): string {
  const labels: Record<string, string> = {
    homme: 'masculines',
    femme: 'féminines',
    unisexe: 'mixtes',
    mixte: 'mixtes',
  }
  const fr = cats.slice(0, 3).map(c => labels[c] ?? c)
  if (fr.length === 1) return `fragrances ${fr[0]}`
  const last = fr.pop()
  return `fragrances ${fr.join(', ')} et ${last}`
}

/** Formule une liste de notes de façon naturelle. */
function formatNotes(notes: string[]): string {
  if (notes.length === 0) return 'des notes variées'
  if (notes.length === 1) return notes[0].toLowerCase()
  const copy = [...notes.map(n => n.toLowerCase())]
  const last = copy.pop()!
  return copy.join(', ') + ' et ' + last
}

/* ── Classification des notes ───────────────────────────────────────────── */

type NoteFamily =
  | 'floral' | 'woody' | 'oriental' | 'spicy'
  | 'citrus' | 'fruity' | 'gourmand' | 'aquatic'
  | 'aromatic' | 'leather' | 'generic'

const NOTE_FAMILY_MAP: [string, NoteFamily][] = [
  // Floraux
  ['rose', 'floral'], ['jasmin', 'floral'], ['pivoine', 'floral'],
  ['iris', 'floral'], ['violette', 'floral'], ['muguet', 'floral'],
  ['ylang', 'floral'], ['freesia', 'floral'], ['gardenia', 'floral'],
  ['tuberose', 'floral'], ['magnolia', 'floral'], ['neroli', 'floral'],
  ['orchidee', 'floral'], ['heliotrope', 'floral'], ['fleur', 'floral'],
  ['narcisse', 'floral'], ['mimosa', 'floral'],
  // Boisés
  ['cedre', 'woody'], ['santal', 'woody'], ['patchouli', 'woody'],
  ['vetiver', 'woody'], ['oud', 'woody'], ['gaiac', 'woody'],
  ['encens', 'woody'], ['myrrhe', 'woody'], ['bois', 'woody'],
  ['benjoin', 'woody'], ['labdanum', 'woody'],
  // Orientaux / Ambrés
  ['vanille', 'oriental'], ['ambre', 'oriental'], ['musc', 'oriental'],
  ['tonka', 'oriental'], ['feve', 'oriental'],
  // Épicés
  ['poivre', 'spicy'], ['gingembre', 'spicy'], ['cardamome', 'spicy'],
  ['cannelle', 'spicy'], ['safran', 'spicy'], ['clou', 'spicy'],
  ['muscade', 'spicy'],
  // Agrumes
  ['bergamote', 'citrus'], ['citron', 'citrus'], ['orange', 'citrus'],
  ['mandarine', 'citrus'], ['pamplemousse', 'citrus'], ['yuzu', 'citrus'],
  ['lime', 'citrus'], ['citrus', 'citrus'],
  // Fruités
  ['peche', 'fruity'], ['framboise', 'fruity'], ['mure', 'fruity'],
  ['poire', 'fruity'], ['pomme', 'fruity'], ['cassis', 'fruity'],
  ['figue', 'fruity'], ['cerise', 'fruity'], ['litchi', 'fruity'],
  ['mangue', 'fruity'], ['prune', 'fruity'],
  // Gourmands
  ['chocolat', 'gourmand'], ['caramel', 'gourmand'], ['cacao', 'gourmand'],
  ['miel', 'gourmand'], ['cafe', 'gourmand'], ['noisette', 'gourmand'],
  ['praline', 'gourmand'],
  // Aquatiques
  ['marine', 'aquatic'], ['sel', 'aquatic'], ['ozone', 'aquatic'],
  ['eau', 'aquatic'], ['algue', 'aquatic'],
  // Aromatiques / Verts
  ['lavande', 'aromatic'], ['the', 'aromatic'], ['menthe', 'aromatic'],
  ['basilic', 'aromatic'], ['romarin', 'aromatic'], ['sauge', 'aromatic'],
  ['fougere', 'aromatic'], ['herbe', 'aromatic'],
  // Cuir
  ['cuir', 'leather'], ['suede', 'leather'], ['daim', 'leather'],
]

function classifyNote(noteName: string): NoteFamily {
  const n = normalize(noteName)
  for (const [key, family] of NOTE_FAMILY_MAP) {
    if (n.includes(key)) return family
  }
  return 'generic'
}

function dominantNoteFamily(products: ProductForSeo[]): NoteFamily {
  const scores: Partial<Record<NoteFamily, number>> = {}
  for (const p of products) {
    const all = [...p.notes.top, ...p.notes.heart, ...p.notes.base]
    for (const note of all) {
      if (!note) continue
      const f = classifyNote(note)
      scores[f] = (scores[f] ?? 0) + 1
    }
  }
  const entries = Object.entries(scores) as [NoteFamily, number][]
  if (entries.length === 0) return 'generic'
  return entries.sort((a, b) => b[1] - a[1])[0][0]
}

/* ── Dictionnaire familles × descriptions notes ─────────────────────────── */

const NOTE_FAMILY_CONTENT: Record<
  NoteFamily,
  { explication: string; sensations: string; familles: string }
> = {
  floral: {
    explication:
      `Les notes florales sont parmi les plus utilisées en parfumerie. Elles évoquent l'essence même de la nature en fleur — pétale, pistil, rosée du matin. Contrairement à l'idée reçue, une note florale ne se réduit pas à un parfum "de femme" : les grandes maisons de niche l'intègrent dans des compositions mixtes, abstraites, parfois même provocantes. La note en question peut être extraite par enfleurage, distillation ou reconstruction chimique, donnant à chaque version une signature distincte.`,
    sensations:
      `Porter une fragrance à note florale, c'est habiter un espace doux et vivant. Selon la composition, les sensations vont de la fraîcheur d'un jardin après la pluie à la chaleur enivrante d'une serre tropicale. Certaines interprétations sont pudiques et poudrées, d'autres sont charnelles, presque osées. La peau amplifie les notes florales au fil des heures, révélant des facettes insoupçonnées dès le fond.`,
    familles: `Florale, Chypré Floral, Oriental Floral, Eau Florale, Floral Aldéhydé, Floral Boisé — les notes florales traversent presque toutes les familles olfactives et servent de pont entre légèreté et profondeur.`,
  },
  woody: {
    explication:
      `Les notes boisées structurent la parfumerie depuis des siècles. Elles apportent profondeur, ancrage et longévité à une composition. Du cèdre sec et craquant au santal crémeux et laiteux, en passant par le patchouli terreux et le vétiver fumé, chaque bois a sa personnalité. L'oud — bois de agar — est l'ingrédient le plus précieux de la parfumerie orientale, capable de transformer radicalement une fragrance. Ces matières premières résineuses ou ligneuses durent souvent plusieurs heures sur la peau.`,
    sensations:
      `Une fragrance boisée installe une présence calme et assurée. Elle évoque la forêt, la bibliothèque ancienne, le craquement d'un plancher en chêne. Les bois peuvent être secs et minéraux, ou chauds et enveloppants selon la composition. Sur la peau, ils s'épanouissent progressivement — les premières heures révèlent les têtes, mais c'est dans le fond boisé que la vraie signature s'exprime.`,
    familles: `Boisé, Boisé Oriental, Boisé Musqué, Chypré Boisé, Aromatic Fougère — les accords boisés forment la colonne vertébrale de nombreux parfums de niche.`,
  },
  oriental: {
    explication:
      `Les notes orientales — vanille, ambre, musc, fève tonka — constituent ce qu'on appelle les "accords chauds" de la parfumerie. Elles évoquent l'opulence, la sensualité, les marchés d'épices d'Orient. La vanille naturelle est une orchidée dont l'extraction est complexe et coûteuse ; la version synthétique, la vanilline, est plus accessible mais moins nuancée. Le musc existe aujourd'hui presque exclusivement en version de synthèse pour des raisons éthiques, mais il reste l'ingrédient le plus universel de la parfumerie.`,
    sensations:
      `Une note orientale crée un sillage enveloppant, presque comestible. Elle rassure, réchauffe, séduit. Les fragrances orientales sont particulièrement efficaces en soirée ou par temps froid, quand la chaleur du corps amplifie leur projection. Sur la peau, elles se fondent et deviennent presque une seconde peau.`,
    familles: `Oriental, Floral Oriental, Oriental Gourmand, Ambré, Boisé Oriental — les bases orientales unissent les notes et assurent la tenue d'une fragrance au fil des heures.`,
  },
  spicy: {
    explication:
      `Les notes épicées ajoutent du caractère, du piquant, de la vivacité à une composition. Le poivre noir apporte une sécheresse sophistiquée ; le safran, un aspect presque médicinal et sensuel ; la cardamome, une légèreté aromatique. Ces notes viennent du commerce des épices qui a façonné l'histoire du monde — et elles gardent en parfumerie cette aura d'exotisme et de rareté. Une touche épicée peut suffire à sortir un parfum de la banalité.`,
    sensations:
      `Les fragrances épicées éveillent les sens. Elles donnent une impression de chaleur progressive, d'une légère brûlure agréable sur la peau. Selon le dosage, elles peuvent être discrètes et sophistiquées ou intenses et enveloppantes. Elles se marient particulièrement bien avec les accords boisés et orientaux pour des compositions masculines ou mixtes de caractère.`,
    familles: `Oriental Épicé, Fougère Épicée, Aromatique Épicé, Boisé Épicé — les notes épicées traversent toutes les familles et ajoutent une dimension virile ou exotique.`,
  },
  citrus: {
    explication:
      `Les notes hespéridées — bergamote, citron, mandarine, pamplemousse — sont parmi les premières notes de tête que le nez perçoit. Volatiles et énergisantes, elles apportent fraîcheur et légèreté à n'importe quelle composition. La bergamote, cultivée en Calabre, est l'ingrédient iconique de l'eau de Cologne classique. Le yuzu japonais, plus complexe, apporte une dimension florale et herbacée. Ces notes durent peu sur la peau mais leur impact à l'ouverture est immédiat.`,
    sensations:
      `Un agrume en parfumerie, c'est un réveil immédiat. Fraîcheur, netteté, légèreté — ces notes donnent l'impression d'une peau propre et lumineuse. Elles conviennent particulièrement aux grandes chaleurs, aux environnements de travail, aux moments où l'on veut une présence discrète mais soignée. Testées sur peau, les notes citronnées révèlent rapidement leurs accords de fond.`,
    familles: `Hespéridé, Hespéridé Aromatique, Hespéridé Boisé, Aquatique Hespéridé, Cologne — les notes citronnées ouvrent la majorité des eaux de toilette et eaux de cologne classiques.`,
  },
  fruity: {
    explication:
      `Les notes fruitées vont bien au-delà du fruit banal. En parfumerie, une note de pêche peut être juteuse et veloutée, ou séchée et presque vineuse. La figue combine le lacté de la feuille au musqué du fruit mûr. La framboise apporte une acidité gourmande. Ces notes sont souvent obtenues par synthèse chimique car l'extraction naturelle est complexe — ce qui permet aux parfumeurs de jouer sur des nuances impossibles à obtenir autrement.`,
    sensations:
      `Les notes fruitées créent une impression de fraîcheur accessible et joyeuse. Elles sont rarement intimidantes, souvent sensuelles. Sur la peau, elles s'associent naturellement aux muscs pour créer des accords "seconde peau" très addictifs. Les fragrances fruitées conviennent à toutes les occasions, en particulier pour un port quotidien.`,
    familles: `Fruité Floral, Fruité Gourmand, Chypré Fruité, Oriental Fruité — les notes fruitées modernes ont renouvelé la parfumerie féminine et mixte depuis les années 1990.`,
  },
  gourmand: {
    explication:
      `Les notes gourmandes sont nées en 1992 avec Angel de Thierry Mugler — premier parfum à utiliser le cacao et le caramel comme notes de fond. Depuis, elles sont devenues une famille à part entière. La vanille, le café, le miel, le chocolat et les pralinés sont désormais traités comme de véritables matières premières. Ces notes créent des fragrances à la frontière entre le parfum et la pâtisserie.`,
    sensations:
      `Porter une fragrance gourmande, c'est envelopper les personnes proches dans une chaleur douce et rassurante. Ces notes évoquent l'enfance, la cuisine, le réconfort. Elles sont particulièrement efficaces en automne et hiver, quand le sillage doit être enveloppant. Sur la peau, elles s'amplifient avec la chaleur corporelle et durent souvent toute une journée.`,
    familles: `Oriental Gourmand, Fruité Gourmand, Floral Gourmand, Patchouli Gourmand — les accords gourmands sont la famille la plus accessible de la parfumerie contemporaine.`,
  },
  aquatic: {
    explication:
      `Les notes marines et aquatiques sont une invention récente — leur essor date des années 1990 avec l'apparition des cétones macrocycliques et de la Calone. Elles évoquent l'embruns, la surface de la mer, l'air iodé d'un matin sur la côte. Certaines sont minérales et sèches, d'autres sont douces et poudrées. L'ozozone et le sel marin apportent une dimension aérienne unique, quasi photographique dans sa précision.`,
    sensations:
      `Une note marine crée une sensation d'espace et de légèreté instantanée. Elle rafraîchit sans être froide, elle est propre sans être savonnée. Ces fragrances conviennent particulièrement aux environments chauds, aux activités de plein air, aux personnes qui cherchent une discrétion élégante.`,
    familles: `Aquatique, Fougère Aquatique, Hespéridé Marin, Boisé Aquatique — les notes marines sont le pilier des fragrances "sport" et des eaux de sport des grandes maisons.`,
  },
  aromatic: {
    explication:
      `Les notes aromatiques — lavande, thé, menthe, basilic, romarin — sont issues des plantes aromatiques qui peuplent les jardins méditerranéens. La lavande est l'ingrédient central de la famille Fougère, pilier de la parfumerie masculine classique. Le thé vert apporte une fraîcheur verte et légèrement amère, très prisée dans la parfumerie japonaise et asiatique. Ces notes sont souvent perçues comme "propres" et fraîches.`,
    sensations:
      `Les fragrances aromatiques ont quelque chose d'immédiatement rassurant et sain. Elles évoquent l'herboriste, le jardin après la taille, la cuisine provençale. Sur la peau, elles sont légèrement balsamiques et durent quelques heures sans jamais peser. Ce sont des notes idéales pour une utilisation professionnelle ou sportive.`,
    familles: `Aromatique Fougère, Aromatique Boisé, Hespéridé Aromatique, Aromatic Aquatic — les notes aromatiques sont la signature olfactive de nombreux parfums masculins classiques.`,
  },
  leather: {
    explication:
      `Le cuir en parfumerie est une reconstruction olfactive : le vrai cuir brut, le suède doux, le daim poudré. Ces notes existent depuis la Renaissance, quand les parfumeurs florentins traitaient les gants en cuir pour masquer leur odeur. Aujourd'hui, les accords de cuir en parfumerie vont du métal brûlé à la selle de cheval, en passant par la veste neuve ou le livre ancien. C'est l'une des matières les plus complexes à travailler.`,
    sensations:
      `Une note de cuir impose une présence. Elle est à la fois sensuelle et austère, urbaine et sauvage. Ces fragrances sont souvent portées en soirée ou lors d'occasions où l'on veut affirmer sa personnalité. Sur la peau, les accords cuirés gagnent en profondeur au fil des heures et peuvent durer jusqu'au lendemain.`,
    familles: `Cuir, Chypré Cuir, Oriental Cuir, Boisé Cuir — les fragrances cuirées constituent un pilier de la haute parfumerie de niche.`,
  },
  generic: {
    explication:
      `Cette note apporte à la composition une dimension particulière que les parfumeurs utilisent pour créer de la complexité et de la singularité. En parfumerie de niche, chaque ingrédient est sélectionné avec précision pour contribuer à l'identité olfactive globale du parfum. Les meilleures fragrances sont souvent celles qui savent utiliser des notes inattendues pour surprendre et fidéliser.`,
    sensations:
      `Les sensations liées à cette note varient selon la composition globale du parfum. Sur la peau, elle peut évoluer différemment selon la chaleur corporelle, le pH cutané et les autres accords présents. C'est pourquoi tester sur peau reste indispensable — un même ingrédient produit des effets distincts sur chaque porteur.`,
    familles: `Cette note traverse plusieurs familles olfactives selon la façon dont les parfumeurs l'intègrent. Elle peut renforcer la longueur d'un accord boisé, apporter une transition dans une composition florale, ou servir de fond dans un oriental.`,
  },
}

/* ── Dictionnaire notes spécifiques ─────────────────────────────────────── */

const SPECIFIC_NOTE_CONTENT: Record<string, { explication: string; sensations: string }> = {
  'rose': {
    explication: `La rose est la note la plus utilisée en parfumerie. Elle existe sous des centaines d'interprétations : rose de Bulgarie absolue, rose de Mai de Grasse, rose turque, rose de synthèse. Chaque version diffère radicalement : la rose de Bulgarie est fraîche, légèrement citronnée ; la rose de Mai est plus riche, miellée, presque vineuse. Les grandes maisons de niche explorent des facettes inattendues — rose aquatique, rose cuirée, rose fougère.`,
    sensations: `Sur la peau, la rose s'épanouit progressivement. Elle peut commencer comme une note de tête vibrante et se fondre en un fond doux et poudré. Les fragrances à note de rose ont un caractère romantique mais pas nécessairement classique — elles peuvent être audacieuses, minimales ou ultra-complexes.`,
  },
  'oud': {
    explication: `L'oud — ou bois d'agar — est la matière première la plus précieuse de la parfumerie mondiale. Il provient d'un arbre asiatique infecté par un champignon, qui produit une résine sombre et complexe. L'oud naturel varie selon l'origine : indien, cambodgien, thaïlandais — chacun avec son caractère. Les versions de synthèse permettent aujourd'hui d'utiliser cet accord dans des gammes plus accessibles sans perdre l'essentiel.`,
    sensations: `L'oud crée une présence immédiate et mémorable. Sur la peau, il combine le boisé sombre, le légèrement animal, le fumé et une touche lactée. Les fragrances à l'oud ont un sillage ample et une excellente tenue — parfois au-delà de 12 heures.`,
  },
  'patchouli': {
    explication: `Le patchouli est une plante originaire d'Asie du Sud-Est dont les feuilles séchées produisent une huile essentielle terrestre et camphrée. Mal compris en Occident à cause de son association avec les années 1970, le patchouli a été réhabilité par la parfumerie de niche. Il peut être vert et frais (extrait récent), ou sombre et chaud (extrait vieilli). En fond de composition, il apporte de la profondeur, du sillage et une longévité exceptionnelle.`,
    sensations: `Le patchouli est l'un des ingrédients les plus polarisants en parfumerie. Certains le trouvent trop terrreux ou médicinal ; d'autres y voient une note chaleureuse, enveloppante, presque hypnotique. Sur la peau, il s'adoucit et se marie aux muscs pour créer des accords "seconde peau" profonds.`,
  },
  'vetiver': {
    explication: `Le vétiver est une graminée tropicale dont les racines produisent une huile essentielle fumée, terreuse et légèrement boisée. L'île de la Réunion est la principale source de vétiver de qualité en parfumerie (Vetiver Bourbon). Cette note est souvent la signature des fragrances masculines classiques, mais les parfumeurs contemporains l'utilisent dans des compositions mixtes pour son effet aérien et minéral.`,
    sensations: `Le vétiver impose un caractère sec et aristocratique. Sur la peau, il peut être légèrement fumé dans les premières heures, puis devenir plus crémeux et doux en fond. Son profil olfactif évoque la terre sèche, les cendres froides, une certaine élégance sans effort.`,
  },
  'santal': {
    explication: `Le santal de Mysore (Inde) est l'une des essences les plus rares et convoitées en parfumerie. Son exploitation est aujourd'hui strictement réglementée, ce qui explique l'utilisation fréquente de santalum australien ou de versions de synthèse. Le santal authentique est crémeux, laiteux, légèrement sucré — avec une nuance de lait de coco chauffé. Il forme un fond parfait pour les accords floraux et orientaux.`,
    sensations: `Le santal enveloppe littéralement la peau. Il est doux, réconfortant, sensuel. C'est l'une des notes les plus universellement appréciées — même les personnes peu sensibles aux parfums trouvent le santal agréable. Sur la peau, il s'amplifie avec la chaleur et peut durer bien au-delà de 8 heures.`,
  },
  'iris': {
    explication: `L'iris est l'une des notes les plus nobles et les plus coûteuses de la parfumerie. Elle est extraite du rhizome de la plante après un long séchage de plusieurs années. L'huile d'iris (orris butter) a une texture crémeuse avec des nuances poudrées, carottes, violettes et légèrement boisées. La note "iris" évoque souvent la poudre de riz, les armoires anciennes, une certaine aristocratie froide.`,
    sensations: `Un parfum à l'iris est souvent décrit comme "froid" dans ses premières minutes — une fraîcheur presque minérale. Puis il se réchauffe sur la peau et révèle ses facettes crémeuses et légèrement boisées. C'est une note qui requiert du temps et de l'attention pour être pleinement appréciée.`,
  },
  'jasmin': {
    explication: `Le jasmin est la "reine des fleurs" en parfumerie — une fleur d'une complexité chimique telle qu'elle contient à elle seule des centaines de molécules odorantes. Le jasmin de Grasse (jasmin absolue) est le standard de qualité ultime, utilisé dans les grands classiques de la parfumerie française. Le jasmin sambac, plus exotique et juteux, est très présent dans la parfumerie orientale. Ces deux facettes sont souvent confondues mais bien distinctes.`,
    sensations: `Le jasmin a une dualité unique : il peut être à la fois floral, vert, légèrement animal et presque insolent. Sur la peau, il prend le dessus sur les autres notes et laisse un sillage floral blanc et riche. Les fragrances au jasmin ont généralement une longévité remarquable.`,
  },
  'bergamote': {
    explication: `La bergamote est un agrume cultivé principalement en Calabre (Italie du Sud). Son huile essentielle est extraite à froid du zeste et produit une note citronnée, légèrement florale, avec des nuances de lavande et de jasmin. Ingrédient central de l'eau de Cologne classique depuis le XVIIIe siècle, la bergamote est aujourd'hui l'une des notes d'ouverture les plus utilisées en parfumerie.`,
    sensations: `La bergamote crée une ouverture lumineuse et rafraîchissante. Elle dure peu sur la peau (30 à 60 minutes), mais établit une première impression élégante et claire. Dans une composition équilibrée, elle annonce ce que le fond révélera — c'est une note de transition sophistiquée.`,
  },
  'vanille': {
    explication: `La vanille de Bourbon (Madagascar) est l'une des matières premières les plus utilisées en parfumerie, notamment comme note de fond. Extraite de l'orchidée Vanilla planifolia, elle apporte une douceur chaude, légèrement crémeuse et balsamique. La vanilline — version synthétique — est plus accessible mais moins nuancée. Les grandes maisons utilisent souvent les deux en combinaison pour obtenir la profondeur désirée.`,
    sensations: `La vanille est la note la plus universellement aimée en parfumerie. Elle réchauffe, rassure, séduit. Sur la peau, elle se fond avec les muscs pour créer des accords intimes et durables. Les fragrances à la vanille ont souvent un sillage doux et une excellente tenue — parfois au-delà de 8 heures.`,
  },
  'musc': {
    explication: `Le musc est une note de fond incontournable en parfumerie. Aujourd'hui entièrement synthétique pour des raisons éthiques, il existe sous des dizaines de versions : musc blanc poudré, musc propre, musc animal, musc ambré. Il est souvent invisible dans une composition mais son absence se ressent immédiatement. Le musc agit comme un fixateur et un amplificateur — il prolonge les autres notes et les fond en une seule signature.`,
    sensations: `Le musc est une note "seconde peau" — elle se confond avec votre propre odeur corporelle et crée une fragrance qui semble venir de l'intérieur. Sur la peau, il évolue lentement et peut rester perceptible le lendemain. C'est la note la plus intimiste de la parfumerie.`,
  },
  'cedre': {
    explication: `Le cèdre en parfumerie fait référence à plusieurs essences : cèdre de l'Atlas (Maroc), cèdre de Virginie (Amérique du Nord), cèdre japonais (Hinoki). Chacun a sa personnalité. Le cèdre de l'Atlas est sec, boisé, légèrement fumé ; le cèdre de Virginie est plus doux et crayon à papier. Ensemble, ils forment l'armature boisée de nombreuses fragrances masculines et mixtes.`,
    sensations: `Le cèdre apporte de la clarté et de la sécheresse à une composition. Sur la peau, il est souvent discret mais structurant — il empêche les compositions florales ou orientales de devenir trop lourdes. Les fragrances au cèdre sont polyvalentes et élégantes sans ostentation.`,
  },
  'ambre': {
    explication: `L'ambre en parfumerie est une reconstruction — une note composite qui évoque l'ambre résine ou l'ambre gris (substance animale). L'accord ambré classique combine labdanum, benjoin et vanille. Certaines formules modernes y ajoutent du musc et des accords boisés pour un résultat plus contemporain. L'ambre apporte chaleur, sensualité et longévité à toute composition.`,
    sensations: `L'ambre crée une base enveloppante et rassurante. Il réchauffe les compositions et leur donne une dimension presque tactile — comme si le parfum avait une texture. Sur la peau, les accords ambrés s'approfondissent avec les heures et peuvent durer toute une nuit.`,
  },
  'poivre': {
    explication: `Le poivre — noir, blanc, rose ou de Timut — est l'une des épices les plus polyvalentes en parfumerie. Le poivre noir apporte une sécheresse et une légère chaleur cinglante. Le poivre rose, plus doux et légèrement fruité, est prisé pour les compositions féminines contemporaines. Le poivre de Timut, agrumé et presque floral, est l'un des ingrédients les plus tendance de la parfumerie de niche.`,
    sensations: `Une note de poivre donne du mordant à une fragrance. Elle est vivifiante sans être agressante. Sur la peau, elle évolue rapidement vers des accords plus doux mais laisse cette impression de caractère et d'assurance. Les fragrances au poivre sont souvent portées par des personnes qui cherchent un parfum qui dit quelque chose d'elles.`,
  },
}

function getSpecificNoteContent(noteName: string): { explication: string; sensations: string } | null {
  const n = normalize(noteName)
  for (const [key, content] of Object.entries(SPECIFIC_NOTE_CONTENT)) {
    if (n.includes(normalize(key))) return content
  }
  return null
}

/* ══════════════════════════════════════════════════════════════════════════
   Descriptions officielles des marques (priorité sur la DB et le généré)
══════════════════════════════════════════════════════════════════════════ */

const BRAND_DESCRIPTIONS: Record<string, string> = {
  'born to stand out':
    `Born to Stand Out est une maison de parfumerie de niche fondée par Sébastien Jara, créateur français qui a bâti sa réputation sur l'audace et la singularité. Ses fragrances mixtes s'adressent à ceux qui refusent les codes convenus — elles jouent sur des matières premières inattendues, des ouvertures provocatrices et des fonds persistants qui s'inscrivent dans la mémoire. La maison incarne une vision de la parfumerie comme affirmation d'identité, loin des formules rassurantes.`,

  'bvlgari':
    `Bvlgari est une maison de joaillerie romaine fondée en 1884, qui a étendu son héritage à la parfumerie avec une vision singulière : capturer l'essence du thé, de la Méditerranée et des pierres précieuses en fragrance. Des eaux de Cologne légères de la collection Eau Parfumée aux profondeurs orientales de la ligne Allegra, Bvlgari conjugue l'élégance classique italienne à une créativité internationale. Chaque flacon est conçu comme un bijou — équilibre entre transparence et opulence.`,

  "d'orsay":
    `La maison D'Orsay est l'une des plus anciennes parfumeries françaises, fondée à Paris en 1830 par le Comte Alfred Guillaume Gabriel d'Orsay. Elle perpétue depuis près de deux siècles un savoir-faire artisanal parisien, avec des créations inspirées de la Belle Époque et de l'aristocratie française. Ses fragrances, souvent pudiques et raffinées, sont le reflet d'une certaine conception de l'élégance — celle qui ne cherche pas à s'imposer mais à séduire dans la durée.`,

  'dior':
    `Fondée par Christian Dior en 1946, la maison Dior est l'un des piliers de la haute couture et de la parfumerie française. De Miss Dior à Sauvage, en passant par J'adore, Fahrenheit et la Collection Privée, Dior cultive un univers olfactif à la fois romantique, puissant et intemporel. Chaque fragrance est le résultat d'une collaboration étroite entre les équipes créatives de la maison et les plus grands parfumeurs indépendants, avec une exigence constante sur la qualité des matières premières.`,

  'ex nihilo':
    `Ex Nihilo est une maison de parfumerie de niche parisienne fondée en 2013, dont le nom latin — "à partir de rien" — traduit une déclaration d'intention créative radicale. La maison s'est rapidement imposée dans la haute parfumerie internationale grâce à son service de personnalisation unique et à ses créations qui mêlent tradition française et modernité conceptuelle. Ses flacons épurés et ses formules développées avec des parfumeurs de renom en font une référence pour les amateurs exigeants.`,

  'guerlain':
    `Fondée à Paris en 1828, Guerlain est l'une des plus anciennes et plus prestigieuses maisons de parfumerie au monde. À l'origine de créations légendaires comme Shalimar (1925), Mitsouko (1919), L'Heure Bleue (1912) et Jicky (1889), elle continue d'innover avec des collections comme Les Absolus d'Orient et La Petite Robe Noire. Le savoir-faire Guerlain repose sur l'usage d'ingrédients d'exception — iris de Florence, rose de Mai, ylang-ylang des Comores — et une maîtrise de la formulation transmise sur cinq générations.`,

  'kilian paris':
    `Kilian Paris est une maison de parfumerie de luxe fondée en 2007 par Kilian Hennessy, héritier de la famille Moët Hennessy. Dès ses premières collections, la maison a imposé un positionnement ultra-luxe avec ses flacons rechargeables en métal précieux, ses coffrets de voyage réutilisables et ses créations olfactives intenses — souvent orientées vers le musc, l'ambre et le cuir. Des fragrances comme Good Girl Gone Bad, Roses on Ice ou Intoxicated sont devenues des classiques modernes de la niche.`,

  'louis vuitton':
    `Louis Vuitton a fait son entrée dans la haute parfumerie en 2016, avec une collection inaugurale de sept fragrances signées par le maître parfumeur Jacques Cavallier Belletrud. Depuis, la maison a développé un univers olfactif cohérent et ambitieux — Matière Noire, Ombre Nomade, Les Sables Roses, Contre Moi — qui conjugue l'héritage du voyage avec des ingrédients d'exception sourcés aux quatre coins du monde. Chaque fragrance est un récit, une destination, une invitation à l'exploration sensorielle.`,

  'maison crivelli':
    `Maison Crivelli est une maison de parfumerie de niche fondée par Thibault Crivelli, dont l'approche créative est résolument géographique : chaque fragrance est ancrée dans une région du monde, une matière première locale, une rencontre humaine spécifique. Du Néroli Calabria au Hibiscus Mahajad, en passant par le Cedrus, chaque création raconte un voyage et met en lumière une note d'exception travaillée à sa quintessence. Un positionnement rare qui conjugue naturalité, précision et storytelling.`,

  'maison francis kurkdjian':
    `Maison Francis Kurkdjian a été fondée en 2009 par le parfumeur éponyme, l'un des créateurs les plus influents de sa génération — à l'origine, entre autres, de Jean Paul Gaultier Le Male et Narciso Rodriguez For Her. Sa propre maison se distingue par une précision formelle remarquable et une capacité à rendre accessibles des accords d'une grande complexité. Baccarat Rouge 540, Aqua Celestia, OUD Satin Mood ou À la Rose sont devenus des références mondiales que les passionnés de parfumerie s'arrachent.`,

  'matière première':
    `MATIÈRE PREMIÈRE est une maison de parfumerie parisienne fondée en 2019 par Firman Bergès et le parfumeur Antoine Maisondieu. Son concept fondateur est radical et limpide : chaque fragrance met en valeur une unique matière première d'exception — cristal de thé, fleur de santal, neroli des Cyclades, citrus paradisi. Ce parti pris minimaliste et contemporain, associé à des formules d'une précision rare, a rapidement séduit une clientèle internationale exigeante à la recherche d'une parfumerie honnête et sincère.`,

  'place de la rêverie':
    `Place de la Rêverie est une maison de parfumerie de niche française qui cultive un imaginaire poétique, nostalgique et singulier. Ses créations explorent des territoires olfactifs inattendus, inspirés de la littérature, de la flânerie urbaine et d'une certaine idée du romantisme parisien. La maison privilégie une approche artisanale, des tirages confidentiels et une sensibilité narrative qui distingue chaque fragrance comme un chapitre d'un récit plus vaste.`,

  'stephane humbert lucas':
    `Stephane Humbert Lucas 777 est une maison de parfumerie de niche fondée par le créateur éponyme, ancien directeur artistique dans la mode internationale. Ses flacons sculptés en verre soufflé — véritables œuvres d'art signées — sont aussi reconnaissables que ses fragrances intenses et opulentes. Profondément teintées d'orient, de résines et de spiritualité, les créations Stephane Humbert Lucas oscillent entre luxe sensoriel et dimension contemplative : Mortal Skin, Oumma, She Was An Angel sont des expériences autant que des parfums.`,

  'xerjoff':
    `Xerjoff est une maison de parfumerie italienne fondée en 2003 à Turin, reconnue pour ses compositions olfactives opulentes, ses flacons en cristal travaillé et son positionnement résolument ultra-luxe. La collection Casamorati rend hommage à l'histoire de la parfumerie italienne du début du XXe siècle, tandis que les éditions de la ligne XJ offrent des accords boisés, floraux et orientaux d'une richesse remarquable. Chaque flacon est une pièce de collection autant qu'une fragrance.`,

  'yves saint laurent':
    `Fondée en 1961 par Yves Saint Laurent et Pierre Bergé, la maison YSL a révolutionné la mode et la parfumerie françaises. De l'iconique Opium (1977) à Libre, en passant par Y, Black Opium, Manifesto et L'Homme, Yves Saint Laurent incarne une féminité forte et une masculinité affirmée. Ses fragrances reflètent la vision transgressive et toujours contemporaine de son fondateur — luxe populaire, sensualité assumée, signature immédiatement reconnaissable.`,
}

function getCuratedDescription(brandName: string): string | null {
  const key = normalize(brandName)
  for (const [k, v] of Object.entries(BRAND_DESCRIPTIONS)) {
    if (normalize(k) === key) return v
  }
  return null
}

/* ══════════════════════════════════════════════════════════════════════════
   generateBrandSeoText
══════════════════════════════════════════════════════════════════════════ */

export function generateBrandSeoText(input: BrandSeoInput): BrandSeoContent {
  const { brandName, description, products } = input

  const count = products.length
  const topNotesArr = topNotes(products, 4)
  const productLinks = products.slice(0, 6).map(p => ({ name: p.name, slug: p.slug }))

  // ── Intro : priorité description officielle > DB > généré ────────────────
  let intro: string

  const curated = getCuratedDescription(brandName)
  const effectiveDescription = curated ?? (description && description.length > 80 ? description : null)

  if (effectiveDescription) {
    const short = effectiveDescription.length > 600
      ? effectiveDescription.slice(0, effectiveDescription.lastIndexOf(' ', 600)) + '.'
      : effectiveDescription
    intro = `${short} Sur BrazaScent, ${count > 1 ? `${count} fragrances ${brandName}` : `une fragrance ${brandName}`} ${count > 1 ? 'sont disponibles' : 'est disponible'} en décant, permettant de les explorer dans leur formule authentique avant tout investissement dans le flacon complet.`
  } else if (count === 1) {
    intro = `La maison ${brandName} est représentée sur BrazaScent par une fragrance disponible en décant. Tester ce parfum sur votre peau — dans un format 2ml, 5ml ou 10ml — reste la seule façon de savoir avec certitude s'il correspond à votre olfaction avant d'acheter le flacon original.`
  } else if (count <= 4) {
    intro = `La maison ${brandName} propose sur BrazaScent ${count} fragrances en décant, soigneusement sélectionnées parmi ses références les plus représentatives. Chaque décant est prélevé directement depuis le flacon d'origine — même concentration, même qualité, sans la contrainte financière d'un achat définitif.`
  } else {
    intro = `La maison ${brandName} figure parmi les sélections les plus demandées sur BrazaScent. Avec ${count} fragrances disponibles en décant, vous pouvez explorer en profondeur l'univers olfactif de cette maison — à votre rythme, sur votre peau, dans des formats allant de 2ml à 10ml.`
  }

  // ── Style olfactif ───────────────────────────────────────────────────────
  const styleOlfactif = count <= 1
    ? `L'univers parfumé de ${brandName} se révèle pleinement sur la peau, dans la durée. Chaque fragrance de la maison est une proposition singulière — une facette spécifique de son identité créative. Certaines compositions s'ouvrent sur la légèreté, d'autres sur la profondeur ou la chaleur. Ce décant vous permet de vivre cette expérience olfactive sur plusieurs jours, sans vous engager d'emblée dans l'achat du flacon complet.`
    : count <= 4
    ? `L'univers parfumé de ${brandName} se distingue par une approche créative cohérente, où chaque fragrance explore une facette différente de la maison. Certaines compositions peuvent être lumineuses et fraîches, d'autres plus boisées, ambrées, florales ou intenses. Tester ces ${count} fragrances en décant vous permet de les comparer dans la durée et d'identifier celle qui correspond le mieux à votre sensibilité olfactive.`
    : `L'univers parfumé de ${brandName} se distingue par une approche créative cohérente, où chaque fragrance explore une facette différente de la maison. Certaines compositions peuvent être lumineuses et fraîches, d'autres plus profondes, boisées ou florales. Avec ${count} fragrances disponibles en décant sur BrazaScent, vous pouvez comparer plusieurs interprétations de la marque et trouver celle qui résonne avec votre sensibilité — sans réduire son identité à quelques notes olfactives.`

  // ── Pourquoi décant ──────────────────────────────────────────────────────
  const pourquoiDecant = `Tester ${brandName} en décant, c'est aborder la parfumerie avec méthode. Un format 5ml représente plus de 100 projections — soit plusieurs semaines d'utilisation quotidienne. Sur la durée, vous observerez comment les notes de tête s'effacent pour laisser place au cœur, puis au fond de composition : c'est là que réside la vraie identité d'un parfum ${brandName}. Si l'accord final correspond à votre olfaction, le flacon complet devient alors un achat raisonné, pas un pari.`

  // ── BrazaScent ──────────────────────────────────────────────────────────
  const brazen = `BrazaScent propose ces décants ${brandName} dans leur formule d'origine, prélevés depuis des flacons authentiques achetés auprès de revendeurs officiels. Chaque commande est préparée sous 24h et expédiée en 24 à 48h ouvrées en France et vers les principaux pays européens.`

  // ── Disclaimer ──────────────────────────────────────────────────────────
  const disclaimer = `BrazaScent n'est pas affilié à ${brandName} et n'est pas un revendeur officiel de la marque. Les noms de marques et de fragrances sont utilisés uniquement à titre informatif pour identifier les produits.`

  // ── FAQ ──────────────────────────────────────────────────────────────────
  const faq: Array<{ q: string; a: string }> = [
    {
      q: `Les parfums ${brandName} chez BrazaScent sont-ils authentiques ?`,
      a: `Oui. Nos décants ${brandName} sont préparés à partir de flacons originaux. Vous recevez la fragrance dans sa concentration d'origine, sans dilution ni reformulation. La qualité est identique à celle du flacon que vous trouveriez en boutique.`,
    },
    {
      q: `Quels formats de décant sont disponibles pour ${brandName} ?`,
      a: `Les décants ${brandName} sur BrazaScent sont disponibles en 2ml, 5ml et 10ml selon les fragrances. Un format 5ml représente environ 100 projections — idéal pour tester sur plusieurs semaines. Le format 10ml correspond à plusieurs mois d'utilisation régulière.`,
    },
    {
      q: `Comment choisir entre plusieurs fragrances ${brandName} ?`,
      a: `Commencez par les notes de tête qui correspondent à votre famille olfactive préférée. Si vous êtes attiré par les accords ${topNotesArr.length > 0 ? formatNotes(topNotesArr.slice(0, 2)) : 'boisés ou floraux'}, identifiez les fragrances ${brandName} qui les utilisent. Notre quiz olfactif peut aussi vous aider à cibler rapidement les accords les mieux adaptés à votre personnalité.`,
    },
  ]

  return {
    heading: `Découvrir la maison ${brandName}`,
    intro,
    styleOlfactif,
    pourquoiDecant,
    productLinks,
    brazen,
    disclaimer,
    faq,
  }
}

/* ══════════════════════════════════════════════════════════════════════════
   generateNoteSeoText
══════════════════════════════════════════════════════════════════════════ */

export function generateNoteSeoText(input: NoteSeoInput): NoteSeoContent {
  const { noteName, products } = input

  const family = classifyNote(noteName)
  const familyContent = NOTE_FAMILY_CONTENT[family]
  const specificContent = getSpecificNoteContent(noteName)

  // Analyse des positions de la note dans les pyramides
  let topCount = 0, heartCount = 0, baseCount = 0
  for (const p of products) {
    const inTop = p.notes.top.some(n => normalize(n).includes(normalize(noteName)) || normalize(noteName).includes(normalize(n)))
    const inHeart = p.notes.heart.some(n => normalize(n).includes(normalize(noteName)) || normalize(noteName).includes(normalize(n)))
    const inBase = p.notes.base.some(n => normalize(n).includes(normalize(noteName)) || normalize(noteName).includes(normalize(n)))
    if (inTop) topCount++
    if (inHeart) heartCount++
    if (inBase) baseCount++
  }

  const dominantPosition = topCount >= heartCount && topCount >= baseCount
    ? 'tête'
    : heartCount >= baseCount
    ? 'cœur'
    : 'fond'

  const positionLabel = {
    tête: 'note d\'ouverture — la première impression',
    cœur: 'note de cœur — l\'identité centrale de la composition',
    fond: 'note de fond — la signature durable sur la peau',
  }[dominantPosition]

  // Marques distinctes qui utilisent cette note
  const brands = [...new Set(products.map(p => p.brand).filter(Boolean))] as string[]
  const brandsLabel = brands.length === 0
    ? ''
    : brands.length === 1
    ? `la maison ${brands[0]}`
    : brands.length <= 3
    ? brands.map((b, i) => i === brands.length - 1 ? `et ${b}` : b).join(', ')
    : `${brands.slice(0, 3).join(', ')} et ${brands.length - 3} autre${brands.length - 3 > 1 ? 's' : ''} maison${brands.length - 3 > 1 ? 's' : ''}`

  // ── Explication ──────────────────────────────────────────────────────────
  const explication = specificContent
    ? specificContent.explication
    : familyContent.explication

  // ── Sensations ───────────────────────────────────────────────────────────
  const sensations = specificContent
    ? specificContent.sensations
    : familyContent.sensations

  // ── Familles olfactives ──────────────────────────────────────────────────
  const familles = `La note de ${noteName.toLowerCase()} est utilisée principalement comme ${positionLabel}. Elle s'inscrit dans les familles olfactives suivantes : ${familyContent.familles}. ${
    brandsLabel
      ? `Sur BrazaScent, ${brandsLabel} ${brands.length > 1 ? 'exploitent' : 'exploite'} cette note dans ${products.length > 1 ? `${products.length} compositions disponibles en décant` : 'une composition disponible en décant'}.`
      : `Cette note est présente dans ${products.length} composition${products.length > 1 ? 's' : ''} disponible${products.length > 1 ? 's' : ''} sur BrazaScent.`
  }`

  // ── Sur le site ──────────────────────────────────────────────────────────
  const spotlightNames = products.slice(0, 3).map(p => p.name)
  const spotlightLabel = spotlightNames.length === 0
    ? ''
    : spotlightNames.length === 1
    ? spotlightNames[0]
    : spotlightNames.length === 2
    ? `${spotlightNames[0]} et ${spotlightNames[1]}`
    : `${spotlightNames[0]}, ${spotlightNames[1]} et ${spotlightNames[2]}`

  const surLeSite = products.length === 0
    ? `BrazaScent ne propose pas encore de décant utilisant cette note. Consultez notre catalogue complet ou inscrivez-vous à la newsletter pour être alerté des nouvelles références.`
    : `BrazaScent propose ${products.length} décant${products.length > 1 ? 's' : ''} utilisant la note de ${noteName.toLowerCase()}${spotlightLabel ? ` — dont ${spotlightLabel}` : ''}. Chaque décant est disponible en format 2ml, 5ml ou 10ml, prélevé directement depuis le flacon d'origine. C'est la façon la plus juste de tester cette note sur votre peau avant d'investir dans un flacon complet.`

  return {
    heading: `Parfums à la note de ${noteName}`,
    explication,
    sensations,
    familles,
    surLeSite,
  }
}
