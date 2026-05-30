-- Seed : 5 articles SEO evergreen pour le blog BrazaScent
-- Insérer uniquement si le slug n'existe pas déjà

INSERT INTO blog_posts (slug, title, excerpt, content, category, author, is_published, published_at)
SELECT
  'qu-est-ce-qu-un-decant-de-parfum',
  'Qu''est-ce qu''un décant de parfum ?',
  'Un décant, c''est l''accès à un parfum authentique sans investir dans un flacon entier. Explications, avantages, et comment ça fonctionne.',
  '<h2>Définition : qu''est-ce qu''un décant de parfum ?</h2>
<p>Un décant de parfum est un prélèvement effectué directement depuis le flacon d''origine d''une fragrance. Le parfum est transvasé dans un petit vaporisateur en verre — généralement de 2ml, 5ml ou 10ml — pour être distribué en format découverte.</p>
<p>Contrairement aux tâches-échantillons (bandelettes de papier) ou aux ampoules plastiques souvent distribuées en grande surface, un décant contient le parfum dans sa formule exacte, à la même concentration que le flacon plein. Aucune dilution, aucune reformulation.</p>

<h2>Quelle différence avec un échantillon officiel de marque ?</h2>
<p>Les échantillons officiels sont distribués par les marques elles-mêmes, souvent sous forme de petits flacons fermés ou de sachets. Les décants, eux, sont préparés par des revendeurs indépendants qui achètent les flacons originaux et les fractionnent.</p>
<p>La différence principale : un décant est généralement plus grand (2ml à 10ml vs 1ml pour un échantillon classique), rechargeable, et vendu dans un vaporisateur utilisable au quotidien pendant plusieurs semaines.</p>

<h2>Pourquoi acheter un décant plutôt qu''un flacon complet ?</h2>
<p>Un flacon de parfum de niche représente souvent un investissement de 100 à 400€. Avant de s''engager sur ce budget, tester le parfum sur papier ou lors d''un passage en boutique est insuffisant pour plusieurs raisons :</p>
<ul>
  <li><strong>Un parfum vit différemment selon les peaux.</strong> La chimie corporelle, le pH, la chaleur naturelle de la peau modifient radicalement l''évolution d''une fragrance. Ce qui sent divin sur le poignet d''une vendeuse peut vous décevoir sur votre propre peau.</li>
  <li><strong>Un parfum se découvre dans le temps.</strong> La note de tête (les premières minutes) cède la place au cœur (30 à 60 minutes), puis au fond (plusieurs heures). Une impression à froid en boutique ne révèle pas le fond d''un parfum.</li>
  <li><strong>Un parfum doit s''intégrer à votre quotidien.</strong> Au bureau, le soir, en été, en hiver — un parfum réagit différemment à chaque situation. Seul un test de plusieurs jours permet une décision éclairée.</li>
</ul>
<p>Un décant de 5ml vous offre 2 à 3 semaines d''utilisation quotidienne. C''est le temps idéal pour vivre vraiment un parfum avant de décider d''investir dans le flacon.</p>

<h2>Comment sont préparés les décants BrazaScent ?</h2>
<p>Chez BrazaScent, chaque décant est préparé à partir de flacons originaux achetés auprès de revendeurs officiels. Le parfum est transféré dans un vaporisateur en verre soigneusement nettoyé et stérilisé. Le flacon est ensuite étiqueté, conditionné, puis expédié sous 24 à 48h.</p>
<p>Nous ne modifions, ne diluons et ne reformulons aucun parfum. Vous recevez exactement le même produit que ce que vous trouverez dans une boutique officielle, en format découverte.</p>

<h2>Quels formats de décants proposons-nous ?</h2>
<ul>
  <li><strong>2ml</strong> : environ 40 projections. Parfait pour une première impression, un test rapide ou un usage ponctuel.</li>
  <li><strong>5ml</strong> : environ 100 à 110 projections. Le format idéal pour découvrir un parfum sur 2 à 3 semaines.</li>
  <li><strong>10ml</strong> : environ 200 projections. Pour les fragrances que vous savez déjà apprécier et que vous souhaitez utiliser sur une plus longue durée.</li>
</ul>
<p>Tous nos décants sont conditionnés dans des vaporisateurs en verre, sans entonnoir, pour préserver l''intégrité du parfum.</p>

<h2>Décant et droit d''auteur : est-ce légal ?</h2>
<p>La revente de parfums authentiques acquis légalement est parfaitement licite en Europe, conformément au principe d''épuisement des droits (directive 2001/29/CE). BrazaScent achète ses flacons auprès de distributeurs officiels et ne modifie en rien les formules ou le conditionnement primaire des marques.</p>
<p>BrazaScent est indépendant et n''est pas affilié aux marques citées. Les noms de marques sont utilisés uniquement à titre informatif pour identifier les produits.</p>

<h2>Prêt à explorer la parfumerie autrement ?</h2>
<p>Découvrez notre <a href="/parfums">sélection complète de décants</a>, explorez nos <a href="/packs">packs découverte</a> ou passez notre <a href="/quiz">quiz olfactif</a> pour trouver la fragrance qui vous correspond vraiment.</p>',
  'education',
  'Braza Scent',
  true,
  NOW() - INTERVAL '10 days'
WHERE NOT EXISTS (SELECT 1 FROM blog_posts WHERE slug = 'qu-est-ce-qu-un-decant-de-parfum');

INSERT INTO blog_posts (slug, title, excerpt, content, category, author, is_published, published_at)
SELECT
  'decant-parfum-comment-choisir-son-format',
  'Décant parfum : comment choisir son format ?',
  '2ml, 5ml, 10ml… comment choisir le bon format de décant selon votre usage ? Notre guide complet pour ne pas se tromper.',
  '<h2>Décant 2ml, 5ml ou 10ml : quelle différence ?</h2>
<p>Lorsque vous commandez un décant de parfum, le choix du format est la première décision à prendre. Chaque taille correspond à un usage différent, un niveau d''engagement distinct, une logique de découverte particulière.</p>

<h2>Le décant 2ml : la première impression</h2>
<p>Un décant de 2ml représente environ 40 projections. Cela semble peu, mais c''est suffisant pour tester un parfum sérieusement sur 4 à 7 jours à raison d''une application quotidienne.</p>
<p><strong>Idéal si :</strong></p>
<ul>
  <li>Vous découvrez un parfum pour la première fois et avez des doutes.</li>
  <li>Vous souhaitez explorer rapidement plusieurs fragrances (par exemple un pack découverte).</li>
  <li>Vous cherchez un parfum pour une occasion précise (voyage, événement).</li>
</ul>
<p><strong>Limite :</strong> 40 projections ne permettent pas toujours d''apprécier un parfum dans toutes les conditions — différentes températures, différents moments de la journée, différentes tenues.</p>

<h2>Le décant 5ml : le format découverte par excellence</h2>
<p>Le 5ml est notre format le plus populaire. Environ 100 à 110 projections, soit 2 à 3 semaines d''utilisation quotidienne (2 à 3 sprays par jour). C''est le format qui vous permet de <em>vraiment vivre</em> un parfum.</p>
<p><strong>Pourquoi le 5ml est idéal :</strong></p>
<ul>
  <li>Vous pouvez le porter dans différentes situations : matin/soir, bureau/week-end, hiver/printemps.</li>
  <li>Vous avez le temps d''observer comment le parfum évolue sur votre peau sur plusieurs jours.</li>
  <li>C''est suffisant pour décider en toute connaissance de cause si vous voulez investir dans le flacon complet.</li>
</ul>
<p>Un parfum de niche coûte souvent 150 à 300€ le flacon. 2 à 3 semaines de test à 8 ou 10€ pour un 5ml — c''est un investissement de découverte qui fait sens.</p>

<h2>Le décant 10ml : le format usage régulier</h2>
<p>Un 10ml représente environ 180 à 200 projections, soit un mois d''utilisation quotidienne, voire plus si vous alternez avec d''autres fragrances. Ce format s''adresse à :</p>
<ul>
  <li>Ceux qui connaissent déjà le parfum et veulent l''utiliser sur la durée avant d''acheter le flacon.</li>
  <li>Ceux qui préfèrent ne pas acheter un grand flacon (pour des raisons de budget ou de rotation) mais souhaitent un usage confortable.</li>
  <li>Ceux qui voyagent souvent et préfèrent un format compact au flacon encombrant.</li>
</ul>

<h2>Comment décider entre les formats ?</h2>
<p>Voici une règle simple :</p>
<ul>
  <li><strong>Parfum inconnu → 2ml</strong> pour tester l''impression générale.</li>
  <li><strong>Parfum intéressant → 5ml</strong> pour une découverte complète avant achat du flacon.</li>
  <li><strong>Parfum déjà connu et apprécié → 10ml</strong> pour un usage quotidien économique.</li>
</ul>

<h2>Et si je commande plusieurs décants à la fois ?</h2>
<p>Nos <a href="/packs">packs découverte</a> regroupent plusieurs décants thématiques à prix avantageux. C''est le format idéal pour explorer plusieurs fragrances d''une même famille olfactive en une seule commande.</p>
<p>Vous pouvez également composer votre propre sélection en choisissant des décants individuels dans notre <a href="/parfums">catalogue complet</a>. Combinez des 2ml pour tester rapidement et un 5ml pour approfondir la fragrance qui vous attire le plus.</p>

<h2>Découvrez notre sélection</h2>
<p>Explorez nos <a href="/parfums">décants de parfums</a> par famille olfactive, par marque ou par format. Passez notre <a href="/quiz">quiz olfactif</a> pour recevoir des recommandations personnalisées selon votre profil.</p>',
  'conseils',
  'Braza Scent',
  true,
  NOW() - INTERVAL '8 days'
WHERE NOT EXISTS (SELECT 1 FROM blog_posts WHERE slug = 'decant-parfum-comment-choisir-son-format');

INSERT INTO blog_posts (slug, title, excerpt, content, category, author, is_published, published_at)
SELECT
  'parfum-de-niche-pourquoi-commencer-par-un-echantillon',
  'Parfum de niche : pourquoi commencer par un échantillon ?',
  'La parfumerie de niche fascine mais intimide. Maisons inconnues, prix élevés, fragrances insolites — commencer par un décant est la seule méthode intelligente.',
  '<h2>Qu''est-ce que la parfumerie de niche ?</h2>
<p>La parfumerie de niche désigne les maisons de parfumerie indépendantes qui privilégient la création artistique à la distribution de masse. Contrairement aux parfums de marques grandes distribution (Chanel, Dior, Givenchy), les parfums de niche sont fabriqués en quantités limitées, avec des matières premières rares, souvent vendus exclusivement en boutiques spécialisées ou en ligne.</p>
<p>Des maisons comme Maison Francis Kurkdjian, Le Labo, Byredo, Amouage, Initio, Xerjoff ou Creed appartiennent à ce monde. Leurs parfums peuvent coûter de 150 à plus de 500€ le flacon de 50ml.</p>

<h2>Pourquoi la parfumerie de niche est-elle si attrayante ?</h2>
<p>La parfumerie de niche offre ce que les grandes marques proposent rarement : de la singularité. Ces parfums ne cherchent pas à séduire le plus grand nombre — ils cherchent à provoquer une émotion, à raconter une histoire, à explorer des matières premières précieuses.</p>
<p>Un parfum de niche peut être:<br>
— animal, sauvage, presque inconfortable au premier abord (l''oud brut d''Amouage)<br>
— incroyablement doux et poétique (les créations de Diptyque)<br>
— d''une complexité qui se révèle sur des heures (les Exclusifs de Chanel)<br>
— d''un minimalisme radical qui vous surprend (Le Labo, avec son célèbre Santal 33)</p>

<h2>Le problème : comment découvrir sans risquer de se tromper ?</h2>
<p>Acheter un parfum de niche en aveugle — sur la base d''une description de notes ou d''un avis en ligne — est risqué. Ces fragrances peuvent être déroutantes lors du premier contact. Un parfum qui vous semble "bizarre" en première impression peut devenir votre préféré après 3 jours de port.</p>
<p>Et l''inverse est vrai : un parfum qui semble extraordinaire lors d''une application rapide en boutique peut devenir pesant au quotidien, ou ne pas s''accorder avec votre peau.</p>
<p>La seule solution : <strong>tester sur votre peau, dans le temps</strong>. C''est précisément ce que permet un décant.</p>

<h2>Le décant comme passeport vers la parfumerie de niche</h2>
<p>Un décant de 5ml d''un parfum de niche vous coûte généralement moins de 15€. Pour 3 à 5 décants bien choisis, vous explorez tout un univers olfactif pour moins de 50€ — contre plusieurs centaines d''euros si vous achetiez les flacons directement.</p>
<p>Cette approche vous permet de :</p>
<ul>
  <li><strong>Comparer des maisons</strong> : Le Labo vs Byredo vs Diptyque — chacune a une philosophie, une "grammaire" olfactive différente.</li>
  <li><strong>Identifier vos familles préférées</strong> : boisés orientaux, floraux modernes, chyprés, gourmands… les décants vous aident à construire votre vocabulaire olfactif.</li>
  <li><strong>Découvrir des parfums rares</strong> : certaines créations sont impossibles à tester localement. Les décants BrazaScent vous donnent accès à des fragrances que vous ne trouverez pas dans la parfumerie du coin.</li>
  <li><strong>Décider sereinement</strong> : après 2 semaines avec un 5ml, si vous en redemandez tous les matins, le flacon complet s''impose naturellement.</li>
</ul>

<h2>Par où commencer ?</h2>
<p>Si vous découvrez la parfumerie de niche, voici quelques pistes :</p>
<ul>
  <li>Explorez les <a href="/parfums/florale">floraux</a> pour une entrée accessible et universelle.</li>
  <li>Testez les <a href="/parfums/boisee">boisés</a> si vous aimez les parfums profonds et persistants.</li>
  <li>Découvrez les <a href="/parfums/orientale">orientaux</a> pour des fragrances chaudes et enveloppantes.</li>
  <li>Commencez par un <a href="/packs">pack découverte</a> pour explorer plusieurs maisons en une commande.</li>
  <li>Passez notre <a href="/quiz">quiz olfactif</a> pour des recommandations personnalisées.</li>
</ul>
<p>La parfumerie de niche ne s''impose pas — elle se découvre. Prenez le temps, testez en décants, et laissez votre nez vous guider.</p>',
  'education',
  'Braza Scent',
  true,
  NOW() - INTERVAL '6 days'
WHERE NOT EXISTS (SELECT 1 FROM blog_posts WHERE slug = 'parfum-de-niche-pourquoi-commencer-par-un-echantillon');

INSERT INTO blog_posts (slug, title, excerpt, content, category, author, is_published, published_at)
SELECT
  'comment-tester-un-parfum-avant-d-acheter-un-flacon',
  'Comment tester un parfum avant d''acheter un flacon ?',
  'Tester un parfum sur une bandelette en boutique ne suffit pas. Voici la méthode complète pour vraiment évaluer une fragrance avant d''investir.',
  '<h2>Pourquoi le test en boutique est insuffisant</h2>
<p>La grande majorité des achats de parfums sont des déceptions. La raison est simple : nous achetons sur une impression fugace — quelques secondes sur une bandelette, une projection rapide sur le poignet avant de passer à la caisse. Mais un parfum n''est pas statique.</p>
<p>Une fragrance se déroule en trois actes, sur plusieurs heures :</p>
<ul>
  <li><strong>La note de tête</strong> (0 à 15 min) : ce que vous sentez immédiatement. Elle est souvent fraîche, vive, volatile. C''est l''accroche.</li>
  <li><strong>Le cœur</strong> (15 min à 2-3h) : la personnalité profonde du parfum. C''est ici que se révèle le vrai caractère de la fragrance.</li>
  <li><strong>Le fond</strong> (3h à 8h+) : les notes qui persistent sur la peau. Muscs, bois, résines — c''est ce que les autres "sentent" sur vous plusieurs heures après l''application.</li>
</ul>
<p>Une impression en boutique ne capture que la note de tête. Et la note de tête n''est souvent pas ce qui vous fera vous souvenir d''un parfum.</p>

<h2>Le problème de la peau</h2>
<p>Un parfum réagit différemment sur chaque peau. Le pH, l''acidité naturelle, la chaleur corporelle, les cosmétiques utilisés — tout cela modifie la façon dont un parfum s''exprime. Le même parfum peut sentir merveilleux sur quelqu''un et décevant sur vous.</p>
<p>C''est pourquoi le test sur bandelette ou sur la peau d''une tierce personne ne compte pas. Seul le test sur votre propre peau, dans vos propres conditions de vie, vaut quelque chose.</p>

<h2>La méthode complète pour tester un parfum</h2>
<h3>Étape 1 : Application</h3>
<p>Appliquez 2 à 3 projections sur le poignet ou l''intérieur du coude. Ne frottez pas — cela casse les molécules et accélère l''évaporation des notes de cœur. Laissez simplement sécher.</p>

<h3>Étape 2 : Patience</h3>
<p>Attendez 10 minutes avant de sentir. Vous éviterez ainsi l''alcool résiduel et perceveiz les premières notes de cœur. Sentez à nouveau après 1 heure — vous êtes maintenant dans le fond du parfum.</p>

<h3>Étape 3 : Observation sur plusieurs jours</h3>
<p>C''est l''étape que seul un décant permet. Portez le parfum 3 à 5 jours consécutifs. Observez comment il se comporte :</p>
<ul>
  <li>Au réveil, avant la douche</li>
  <li>Le soir, après une journée de travail</li>
  <li>Par temps chaud vs temps froid</li>
  <li>Avec des vêtements légers vs des vêtements épais</li>
</ul>
<p>Un parfum qui vous fait encore sourire après 3 jours est un parfum qui vous appartient.</p>

<h3>Étape 4 : La question décisive</h3>
<p>Le matin du quatrième ou cinquième jour, vous portez-vous encore le même parfum sans hésitation ? Ou cherchez-vous instinctivement à passer à autre chose ? Cette réponse vous dit tout.</p>

<h2>Le décant : l''outil essentiel du testeur sérieux</h2>
<p>Un décant de 5ml vous donne 2 à 3 semaines pour mettre en pratique cette méthode. C''est le format que nous recommandons pour tout parfum sérieusement envisagé. Pour une première découverte rapide, un 2ml suffit pour avoir une impression complète sur 4 à 5 jours.</p>
<p>Nos <a href="/packs">packs découverte</a> vous permettent de tester plusieurs fragrances simultanément — idéal pour comparer des candidats au flacon et prendre la meilleure décision.</p>

<h2>Les erreurs courantes à éviter</h2>
<ul>
  <li><strong>Tester trop de parfums en une session.</strong> Votre nez se sature après 3 à 4 fragrances. Après cela, vos perceptions sont faussées. Limitez vos tests à 3 par jour maximum.</li>
  <li><strong>Sentir le bouchon.</strong> Toujours appliquer sur la peau. Le bouchon donne une impression concentrée et souvent trompeuse.</li>
  <li><strong>Juger à froid.</strong> Un parfum oudd, fumé ou musqué peut sembler agressif lors du premier contact. Donnez-lui 2 jours — il devient souvent addictif.</li>
  <li><strong>Acheter sous influence.</strong> L''ambiance d''une boutique, un vendeur enthousiaste, une belle présentation — tout cela peut pousser à l''achat impulsif. Un décant permet de faire la décision chez soi, seul, sans pression.</li>
</ul>

<h2>Testez avant d''investir</h2>
<p>Parcourez notre <a href="/parfums">catalogue de décants</a>, explorez les fragrances par <a href="/marques">marque</a> ou par <a href="/parfums/florale">famille olfactive</a>, et passez notre <a href="/quiz">quiz</a> pour trouver votre prochaine fragrance signature.</p>',
  'conseils',
  'Braza Scent',
  true,
  NOW() - INTERVAL '4 days'
WHERE NOT EXISTS (SELECT 1 FROM blog_posts WHERE slug = 'comment-tester-un-parfum-avant-d-acheter-un-flacon');

INSERT INTO blog_posts (slug, title, excerpt, content, category, author, is_published, published_at)
SELECT
  'meilleurs-decants-parfumerie-de-niche',
  'Les meilleurs décants pour découvrir la parfumerie de niche',
  'Quels décants choisir pour débuter en parfumerie de niche ? Notre sélection des incontournables à tester absolument, famille par famille.',
  '<h2>Par où commencer en parfumerie de niche ?</h2>
<p>La parfumerie de niche est vaste, parfois intimidante. Des centaines de maisons, des milliers de fragrances, des prix souvent élevés — par où commencer ? La réponse : par les décants. Et par une sélection de références qui ont conquis des milliers de passionnés à travers le monde.</p>
<p>Voici notre guide des incontournables, famille par famille, pour construire votre première exploration de la parfumerie de niche avec méthode et plaisir.</p>

<h2>Les boisés incontournables</h2>
<p>Les parfums boisés sont parmi les plus populaires en parfumerie de niche. Ils combinent profondeur, persistance et polyvalence saisonnière. Quelques références à découvrir en décant :</p>
<ul>
  <li><strong>Les boisés au santal</strong> : le santal apporte une douceur crémeuse, une chaleur apaisante. Les grands nez de niche l''utilisent en accord avec la rose, le musc ou les épices.</li>
  <li><strong>Les boisés à l''oud</strong> : plus intenses, parfois fumés ou animaux. L''oud est la matière première reine de la parfumerie de luxe orientale. Un décant vous permettra de savoir si vous y êtes sensible.</li>
  <li><strong>Les boisés au cèdre</strong> : secs, précis, élégants. Idéaux pour ceux qui cherchent un boisé discret mais distinctif.</li>
</ul>
<p>Explorez notre <a href="/parfums/boisee">sélection de décants boisés</a>.</p>

<h2>Les floraux modernes</h2>
<p>La famille florale a été profondément réinventée par la parfumerie de niche. Loin des floraux sucrés ou poudré des années 90, les floraux contemporains sont souvent abstraits, légèrement salins, ou portés par une charpente boisée ou musquée.</p>
<ul>
  <li><strong>Les floraux à l''iris</strong> : l''iris est une note complexe, poudreuse, légèrement terreuse. Les grands parfumeurs en font un territoire d''exploration unique.</li>
  <li><strong>Les floraux à la rose</strong> : de la rose fraîche et aqueuse à la rose musquée profonde, toutes les variations sont représentées en niche.</li>
  <li><strong>Les floraux indolents</strong> : jasmin, muguet, gardénia — des fleurs portées à leur maximum expressif, souvent mêlées de notes animales ou fumées.</li>
</ul>
<p>Découvrez notre <a href="/parfums/florale">sélection de décants floraux</a>.</p>

<h2>Les orientaux addictifs</h2>
<p>Les orientaux sont les parfums les plus persistants, les plus enveloppants. Ils conviennent particulièrement aux saisons froides et aux soirées. Commencer par un décant est indispensable — leur puissance peut surprendre.</p>
<ul>
  <li><strong>Les ambrés vanillés</strong> : doux, chauds, rassurants. Les plus accessibles des orientaux.</li>
  <li><strong>Les épicés-boisés</strong> : safran, cardamome, poivre noir sur fond de cèdre ou d''oud — l''orient contemporain dans toute sa sophistication.</li>
  <li><strong>Les muscs profonds</strong> : les muscs de niche ne ressemblent pas aux muscs bon marché. Ils sont animaux, charnels, persistants.</li>
</ul>
<p>Explorez notre <a href="/parfums/orientale">sélection de décants orientaux</a>.</p>

<h2>Les frais sophistiqués</h2>
<p>Toutes les maisons de niche proposent des interprétations fraîches qui dépassent largement les "eaux de cologne" conventionnelles. Agrumes rares, thés précieux, herbes aromatiques cultivées avec soin.</p>
<ul>
  <li><strong>Les agrumes de niche</strong> : bergamote d''Italie, yuzu du Japon, cédrat de Corse — une précision et une fraîcheur que les parfums grande distribution ne peuvent pas reproduire.</li>
  <li><strong>Les aquatiques modernes</strong> : loin des "eaux marines" des années 90, les aquatiques de niche sont complexes, salins, presque minéraux.</li>
</ul>
<p>Découvrez notre <a href="/parfums/fraiche">sélection de décants frais</a>.</p>

<h2>Comment construire sa première sélection de décants ?</h2>
<p>Notre recommandation pour débuter :</p>
<ol>
  <li>Passez notre <a href="/quiz">quiz olfactif</a> pour identifier vos affinités naturelles.</li>
  <li>Commandez un <a href="/packs">pack découverte</a> thématique — c''est la façon la plus économique d''explorer plusieurs fragrances à la fois.</li>
  <li>Approfondissez avec des <a href="/parfums">décants individuels en 5ml</a> pour les fragrances qui vous ont le plus parlé.</li>
</ol>
<p>La parfumerie de niche se découvre dans le temps, avec curiosité et sans précipitation. BrazaScent vous accompagne à chaque étape de cette exploration.</p>',
  'conseils',
  'Braza Scent',
  true,
  NOW() - INTERVAL '2 days'
WHERE NOT EXISTS (SELECT 1 FROM blog_posts WHERE slug = 'meilleurs-decants-parfumerie-de-niche');
