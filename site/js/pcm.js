/* Process Communication — profils, mini-quiz et contenu de reprogrammation 21 jours.
   Données exposées sur window.EQ_PCM. Aucun framework, aucun appel réseau. */

(function () {
  // --- Les 6 types Process Communication (noms actuels + ancien nom entre parenthèses) ---
  const TYPES = {
    empathique: {
      key: "empathique",
      name: "Empathique",
      alias: "Harmoniseur",
      emoji: "💗",
      short: "Chaleureux, sensible, attentif aux autres et aux ambiances.",
      desc: "Vous percevez le monde par les émotions et la relation. Vous avez besoin de vous sentir reconnu(e) en tant que personne et de prendre soin de vous comme vous prenez soin des autres.",
      tone: "doux et bienveillant",
      // accroche placée en tête du texte du jour
      opening: "Prends un instant pour toi, tu le mérites. Installe-toi confortablement et accueille ce moment avec douceur.",
      affirmationStyle: (core) => `Je m'autorise à prendre soin de moi avec tendresse. ${core}`
    },
    analyseur: {
      key: "analyseur",
      name: "Analyseur",
      alias: "Travaillomane",
      emoji: "🧠",
      short: "Logique, organisé, aime comprendre et structurer.",
      desc: "Vous percevez le monde par la pensée et les faits. Vous avez besoin que vos efforts et votre réflexion soient reconnus, et qu'on vous explique le « pourquoi ».",
      tone: "clair et structuré",
      opening: "Voici un exercice simple et concret. Comprendre comment fonctionne ton cerveau est la première étape pour le reprogrammer efficacement.",
      affirmationStyle: (core) => `Chaque étape que je comprends me rend plus libre de mes choix. ${core}`
    },
    perseverant: {
      key: "perseverant",
      name: "Persévérant",
      alias: "Persévérant",
      emoji: "🎯",
      short: "Engagé, fidèle à ses valeurs et à ses convictions.",
      desc: "Vous percevez le monde par vos opinions et vos valeurs. Vous avez besoin que vos convictions soient respectées et de vous engager dans ce qui a du sens pour vous.",
      tone: "ancré dans les valeurs",
      opening: "Tu t'es engagé(e) dans une démarche qui compte vraiment. Reste fidèle à ce qui est important pour toi : ton bien-être et ta santé.",
      affirmationStyle: (core) => `Je reste fidèle à l'engagement que j'ai pris envers moi-même. ${core}`
    },
    imagineur: {
      key: "imagineur",
      name: "Imagineur",
      alias: "Rêveur",
      emoji: "🌙",
      short: "Calme, réfléchi, imaginatif, aime le temps pour soi.",
      desc: "Vous percevez le monde par l'imagination et la réflexion intérieure. Vous avez besoin de calme, d'espace et de moments de solitude pour vous ressourcer.",
      tone: "calme et visuel",
      opening: "Trouve un endroit tranquille, rien que pour toi. Ferme les yeux un instant et laisse les images venir doucement à ton esprit.",
      affirmationStyle: (core) => `Dans le calme, je laisse une nouvelle image de moi prendre forme. ${core}`
    },
    energiseur: {
      key: "energiseur",
      name: "Énergiseur",
      alias: "Rebelle",
      emoji: "✨",
      short: "Spontané, créatif, aime le fun, réagit au quart de tour.",
      desc: "Vous percevez le monde par vos réactions et vos goûts (« j'aime / j'aime pas »). Vous avez besoin de contact ludique, de spontanéité et de plaisir.",
      tone: "ludique et enthousiaste",
      opening: "Allez, c'est parti pour un petit moment rien que pour toi — et oui, ça peut être agréable ! Pas de prise de tête ici.",
      affirmationStyle: (core) => `J'ai le droit de me sentir bien et léger(ère) ! ${core}`
    },
    promoteur: {
      key: "promoteur",
      name: "Promoteur",
      alias: "Promoteur",
      emoji: "🔥",
      short: "Tourné vers l'action, le résultat et le défi.",
      desc: "Vous percevez le monde par l'action. Vous avez besoin de challenges, de résultats concrets et rapides, et d'aller droit au but.",
      tone: "direct et orienté résultat",
      opening: "Droit au but : ce moment est ton entraînement mental du jour. Quelques minutes d'action ciblée pour un vrai résultat.",
      affirmationStyle: (core) => `Je décide, j'agis, et j'obtiens des résultats. ${core}`
    }
  };

  const TYPE_ORDER = ["empathique", "analyseur", "perseverant", "imagineur", "energiseur", "promoteur"];

  // --- Mini-quiz : 6 affirmations, chacune pointant vers un type dominant ---
  const QUIZ = [
    { q: "Dans une journée idéale, ce qui me fait le plus de bien c'est…", a: [
      { t: "empathique", label: "Des moments chaleureux avec mes proches" },
      { t: "analyseur", label: "Avancer sur mes projets de façon organisée" },
      { t: "imagineur", label: "Du calme et du temps seul(e) pour réfléchir" },
      { t: "energiseur", label: "M'amuser et faire des choses spontanées" }
    ]},
    { q: "Quand je suis stressé(e), j'ai surtout besoin de…", a: [
      { t: "empathique", label: "Être réconforté(e) et écouté(e)" },
      { t: "perseverant", label: "Qu'on respecte mon point de vue" },
      { t: "imagineur", label: "Me retirer au calme" },
      { t: "promoteur", label: "Agir tout de suite pour régler le problème" }
    ]},
    { q: "On me décrit souvent comme quelqu'un de…", a: [
      { t: "empathique", label: "Bienveillant(e) et sensible" },
      { t: "analyseur", label: "Logique et fiable" },
      { t: "perseverant", label: "Engagé(e) et fidèle à ses valeurs" },
      { t: "energiseur", label: "Drôle et plein(e) d'énergie" }
    ]},
    { q: "Pour me motiver à changer une habitude, il me faut…", a: [
      { t: "analyseur", label: "Comprendre pourquoi et avoir un plan clair" },
      { t: "perseverant", label: "Une raison qui a du sens pour moi" },
      { t: "promoteur", label: "Un défi et un résultat visible vite" },
      { t: "energiseur", label: "Que ce soit ludique et pas ennuyeux" }
    ]},
    { q: "Ce qui me pèse le plus, c'est…", a: [
      { t: "empathique", label: "Les conflits et les tensions relationnelles" },
      { t: "imagineur", label: "Le bruit et le manque de temps pour moi" },
      { t: "promoteur", label: "L'inaction et l'ennui" },
      { t: "analyseur", label: "Le désordre et l'imprévu" }
    ]},
    { q: "Une phrase qui me ressemble :", a: [
      { t: "promoteur", label: "« Fonce, on verra bien ! »" },
      { t: "perseverant", label: "« Je fais ce en quoi je crois. »" },
      { t: "imagineur", label: "« J'ai besoin de prendre du recul. »" },
      { t: "empathique", label: "« Comment vas-tu, vraiment ? »" }
    ]}
  ];

  // --- Programme 21 jours : 3 semaines thématiques ---
  const WEEKS = [
    { n: 1, theme: "Prendre conscience", desc: "Distinguer la faim physique de la faim émotionnelle et observer mes ressentis." },
    { n: 2, theme: "Apaiser & reprogrammer", desc: "Installer de nouvelles croyances et désamorcer les déclencheurs." },
    { n: 3, theme: "Ancrer & devenir autonome", desc: "Renforcer ma nouvelle image de moi et rendre les changements durables." }
  ];

  // 21 textes « cœur ». L'accroche et l'affirmation sont ensuite adaptées au profil.
  const DAYS = [
    // Semaine 1 — Prendre conscience
    { day: 1, week: 1, title: "Faire la paix avec mon corps",
      body: ["Aujourd'hui, je commence un chemin nouveau, sans me juger. Mon corps n'est pas un ennemi à combattre : c'est un allié qui m'envoie des signaux. Mon objectif n'est pas de me priver, mais de réapprendre à m'écouter.",
             "Je respire profondément trois fois. À chaque expiration, je relâche un peu de la pression que je me mets."],
      core: "Mon corps mérite mon attention et ma douceur." },
    { day: 2, week: 1, title: "Faim du ventre, faim du cœur",
      body: ["Il existe deux faims. La faim physique monte progressivement, dans le ventre, et se calme quand je mange. La faim émotionnelle arrive soudainement, vise un aliment précis et reste souvent insatisfaite.",
             "Avant chaque envie de manger aujourd'hui, je m'arrête une seconde et je me demande : est-ce mon ventre ou mon cœur qui réclame ?"],
      core: "Je sais faire la différence entre nourrir mon corps et nourrir mon émotion." },
    { day: 3, week: 1, title: "Écouter les signaux du corps",
      body: ["Mon corps me parle bien avant la faim : un creux, une légèreté, une baisse d'énergie. Souvent, je ne l'écoute plus depuis longtemps.",
             "Aujourd'hui, je porte mon attention sur mes sensations physiques. Je note dans mon journal où, dans mon corps, je ressens quelque chose avant de manger."],
      core: "J'apprends à entendre les messages que mon corps m'envoie." },
    { day: 4, week: 1, title: "L'échelle de la faim",
      body: ["Imagine une échelle de 0 (affamé) à 10 (trop plein). L'idéal est de manger autour de 3-4 et de s'arrêter vers 6-7, agréablement rassasié.",
             "Avant de manger aujourd'hui, je situe ma faim sur cette échelle. Je n'ai pas besoin d'attendre d'être affamé(e) ni de finir mon assiette si je suis rassasié(e)."],
      core: "Je mange quand mon corps en a besoin, et je m'arrête quand il est satisfait." },
    { day: 5, week: 1, title: "Manger en pleine conscience",
      body: ["Aujourd'hui, pour au moins un repas, je pose mon téléphone. Je regarde mon assiette, je sens les odeurs, je mâche lentement.",
             "Manger lentement laisse à mon cerveau le temps de recevoir le signal de satiété. Chaque bouchée savourée vaut mieux que dix avalées sans y penser."],
      core: "Je savoure ce que je mange, pleinement présent(e) à l'instant." },
    { day: 6, week: 1, title: "Repérer mes déclencheurs",
      body: ["Le stress, l'ennui, la fatigue, la solitude… ces émotions déclenchent souvent l'envie de manger sans faim réelle.",
             "Aujourd'hui, j'observe sans me juger : quelles situations me donnent envie de grignoter ? Identifier mes déclencheurs, c'est déjà reprendre du pouvoir sur eux."],
      core: "Je reconnais mes déclencheurs, et ce que je vois, je peux le changer." },
    { day: 7, week: 1, title: "Bilan de la semaine 1",
      body: ["Une semaine que j'ai commencé à m'écouter. Je félicite-moi : observer est déjà un grand pas.",
             "Je repense aux moments où j'ai distingué la faim physique de la faim émotionnelle. Chaque prise de conscience est une victoire qui compte."],
      core: "Chaque petit pas que je fais construit le grand changement." },

    // Semaine 2 — Apaiser & reprogrammer
    { day: 8, week: 2, title: "Mes anciennes croyances",
      body: ["« Je n'ai aucune volonté », « j'ai toujours été comme ça », « manger me console ». Ces phrases que je me répète ne sont pas des vérités : ce sont de vieux programmes.",
             "Aujourd'hui, je repère une croyance limitante. Je la note, puis je me demande : est-ce vraiment vrai, ou juste une habitude de pensée ?"],
      core: "Mes pensées ne sont pas des faits : je peux les reprogrammer." },
    { day: 9, week: 2, title: "Une nouvelle histoire",
      body: ["À chaque ancienne croyance, j'oppose une nouvelle phrase, juste et bienveillante. « Je n'ai pas de volonté » devient « j'apprends à m'écouter, jour après jour ».",
             "Je choisis aujourd'hui une nouvelle phrase et je la répète plusieurs fois. Mon cerveau croit ce que je lui répète."],
      core: "Je réécris mon histoire avec des mots qui me font du bien." },
    { day: 10, week: 2, title: "La pause de 5 minutes",
      body: ["Quand l'envie de manger sans faim arrive, je ne lutte pas : je fais une pause de 5 minutes. Je respire, je bois un verre d'eau, je m'occupe les mains.",
             "Très souvent, l'envie passe d'elle-même. Et si elle reste, je choisis en conscience, sans culpabilité."],
      core: "Entre l'envie et l'action, il y a toujours un espace de liberté." },
    { day: 11, week: 2, title: "Nourrir mon émotion autrement",
      body: ["Quand c'est le cœur qui a faim, la nourriture ne le rassasie jamais vraiment. De quoi ai-je réellement besoin ? De repos, de réconfort, de contact, de mouvement ?",
             "Aujourd'hui, face à une faim émotionnelle, je teste une autre réponse : un appel, une marche, une respiration, quelques pages d'un livre."],
      core: "Je réponds à mes vrais besoins, et mes vrais besoins ne sont pas dans l'assiette." },
    { day: 12, week: 2, title: "La bienveillance plutôt que la culpabilité",
      body: ["Si je « craque », je ne m'effondre pas. La culpabilité pousse souvent à manger davantage. Un écart n'efface pas mes progrès.",
             "Aujourd'hui, je me parle comme je parlerais à un ami que j'aime : avec compréhension et encouragement."],
      core: "Je me traite avec la même douceur que j'offrirais à quelqu'un que j'aime." },
    { day: 13, week: 2, title: "Visualiser mon équilibre",
      body: ["Je ferme les yeux et j'imagine la version de moi qui se sent bien : légère, sereine, en paix avec la nourriture. Comment se tient-elle ? Comment respire-t-elle ?",
             "Cette image n'est pas un rêve lointain : c'est une direction. Plus je la visualise, plus mon cerveau s'oriente vers elle."],
      core: "Je deviens, jour après jour, la personne sereine que je visualise." },
    { day: 14, week: 2, title: "Bilan de la semaine 2",
      body: ["J'ai commencé à transformer mes pensées et à répondre autrement à mes émotions. C'est un travail profond, et je le fais.",
             "Je relis les nouvelles phrases que j'ai choisies. Elles deviennent peu à peu ma nouvelle voix intérieure."],
      core: "Ma nouvelle voix intérieure est de plus en plus forte." },

    // Semaine 3 — Ancrer & devenir autonome
    { day: 15, week: 3, title: "Mes victoires invisibles",
      body: ["Le changement ne se mesure pas qu'avec une balance. Avoir reporté un grignotage, savouré un repas, écouté ma satiété : ce sont de vraies victoires.",
             "Aujourd'hui, je note trois petites victoires des deux dernières semaines. Elles sont la preuve que je change."],
      core: "Je reconnais et je célèbre chacun de mes progrès." },
    { day: 16, week: 3, title: "Mon environnement, mon allié",
      body: ["Mon cadre de vie influence mes choix. Avoir des aliments sains à portée de main, ranger les tentations, préparer mes repas : autant de petits gestes qui me facilitent la vie.",
             "Aujourd'hui, j'aménage un détail de mon environnement pour qu'il soutienne mes nouvelles habitudes."],
      core: "J'organise mon environnement pour qu'il travaille avec moi, pas contre moi." },
    { day: 17, week: 3, title: "Le plaisir sans culpabilité",
      body: ["Se faire plaisir fait partie de l'équilibre. Un aliment apprécié, mangé en conscience et sans culpabilité, n'a rien de « mal ».",
             "Aujourd'hui, je m'autorise un plaisir, pleinement, en le savourant. La privation totale nourrit les frustrations et les excès."],
      core: "Le plaisir a toute sa place dans mon équilibre." },
    { day: 18, week: 3, title: "Gérer les jours difficiles",
      body: ["Il y aura des jours plus durs : fatigue, stress, événements. C'est normal. Ce qui compte, ce n'est pas la perfection, mais de revenir doucement à mon cap.",
             "Aujourd'hui, je prépare mon plan pour les jours difficiles : ma phrase ressource, mon geste réconfort, ma respiration."],
      core: "Un jour difficile ne définit pas mon chemin : je reviens toujours à mon cap." },
    { day: 19, week: 3, title: "Mon corps, mon partenaire",
      body: ["Mon corps me porte chaque jour. Plutôt que de le critiquer, je peux le remercier pour ce qu'il me permet de vivre.",
             "Aujourd'hui, je pose une intention de soin : bouger avec plaisir, m'hydrater, dormir suffisamment. Prendre soin, ce n'est pas punir."],
      core: "Je prends soin de mon corps par gratitude, pas par punition." },
    { day: 20, week: 3, title: "Devenir autonome",
      body: ["Je n'ai plus besoin de règles rigides venues de l'extérieur. J'ai désormais une boussole intérieure : mes sensations, mes besoins, ma bienveillance.",
             "Aujourd'hui, je me fais confiance pour un choix alimentaire, en m'appuyant sur tout ce que j'ai appris."],
      core: "Je me fais confiance : j'ai en moi tout ce qu'il faut pour m'écouter." },
    { day: 21, week: 3, title: "Mon nouvel équilibre",
      body: ["Trois semaines de présence à moi-même. Je ne suis plus tout à fait la même : je m'écoute, je me parle avec douceur, je réponds à mes vrais besoins.",
             "Ce n'est pas une fin, mais un début. Je garde mes outils précieux et je continue, à mon rythme, ce chemin vers mon équilibre."],
      core: "Je continue, jour après jour, à vivre en équilibre avec moi-même." }
  ];

  // Compose le texte adapté au profil pour un jour donné.
  function buildDayText(type, dayObj) {
    const t = TYPES[type] || TYPES.empathique;
    const paragraphs = [t.opening].concat(dayObj.body);
    const affirmation = t.affirmationStyle(dayObj.core);
    return { paragraphs, affirmation, toneLabel: t.tone };
  }

  // Renvoie le texte brut (pour la synthèse vocale).
  function plainText(type, dayObj) {
    const built = buildDayText(type, dayObj);
    return built.paragraphs.join(" ") + " Mon affirmation du jour : " + built.affirmation;
  }

  function scoreQuiz(answers) {
    // answers : tableau d'identifiants de type choisis
    const tally = {};
    TYPE_ORDER.forEach((k) => (tally[k] = 0));
    answers.forEach((k) => { if (tally[k] != null) tally[k]++; });
    let best = TYPE_ORDER[0];
    TYPE_ORDER.forEach((k) => { if (tally[k] > tally[best]) best = k; });
    return best;
  }

  window.EQ_PCM = {
    TYPES, TYPE_ORDER, QUIZ, WEEKS, DAYS,
    buildDayText, plainText, scoreQuiz
  };
})();
