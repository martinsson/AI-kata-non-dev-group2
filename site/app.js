'use strict';

// ── Config ───────────────────────────────────────────────────────────────────

const SAVED_TRIPS_KEY = 'travelmate-saved-trips';

let currentPkg = null;

// ── Destination Database ─────────────────────────────────────────────────────

const DESTINATIONS = {
  tokyo: {
    name: 'Tokyo', country: 'Japon', flag: '🇯🇵',
    dep: { code: 'CDG', city: 'Paris' },
    arr: { code: 'NRT', city: 'Tokyo' },
    flightDuration: '12h15',
    airlines: ['Air France', 'Japan Airlines', 'ANA'],
    keywords: ['tokyo', 'japon', 'japonais', 'japonaise', 'nippon'],
    hotels: {
      budget: { name: 'APA Hotel Shinjuku',        stars: 3, ppn: 75,  location: 'Shinjuku',       desc: 'Hôtel moderne et fonctionnel au cœur de Shinjuku, idéal pour explorer la ville.', amenities: ['WiFi gratuit', 'Bains japonais', 'Service de blanchisserie'] },
      moyen:  { name: 'Shinjuku Granbell Hotel',    stars: 4, ppn: 185, location: 'Shinjuku',       desc: 'Hôtel design avec vue panoramique sur Tokyo. Chambres élégantes et restaurants à deux pas.', amenities: ['WiFi gratuit', 'Petit-déjeuner inclus', 'Spa & Bien-être', 'Salle de sport', 'Restaurant japonais'] },
      luxe:   { name: 'Park Hyatt Tokyo',           stars: 5, ppn: 480, location: 'Shinjuku',       desc: 'Légendaire hôtel rendu célèbre par "Lost in Translation". Vue imprenable sur le Mont Fuji.', amenities: ['WiFi gratuit', 'Petit-déjeuner gastronomique', 'Piscine intérieure', 'Spa', 'Bar 52e étage', 'Conciergerie 24h'] }
    },
    activities: [
      { type: 'visite',      name: 'Temple Senso-ji',             location: 'Asakusa',    duration: '2h',  price: 0,   desc: 'Le plus ancien temple de Tokyo avec sa célèbre lanterne rouge et la rue marchande Nakamise.' },
      { type: 'musee',       name: 'Musée Ghibli',                location: 'Mitaka',     duration: '3h',  price: 12,  desc: 'Univers féerique dédié aux créations du Studio Ghibli — réservation indispensable.' },
      { type: 'gastronomie', name: 'Marché extérieur de Tsukiji', location: 'Tsukiji',    duration: '2h',  price: 20,  desc: 'Dégustez les meilleurs sushis du monde directement au marché aux poissons.' },
      { type: 'visite',      name: 'Palais Impérial & Jardins',   location: 'Chiyoda',    duration: '2h',  price: 0,   desc: 'Résidence de la famille impériale avec ses jardins traditionnels et ses douves historiques.' },
      { type: 'sport',       name: 'Randonnée Mont Fuji',         location: 'Shizuoka',   duration: '10h', price: 40,  desc: 'Ascension du symbole du Japon, panorama exceptionnel (saison estivale juillet-août).' },
      { type: 'gastronomie', name: 'Cours de cuisine japonaise',  location: 'Shinjuku',   duration: '3h',  price: 65,  desc: 'Apprenez à préparer sushi, ramen et okonomiyaki avec un chef japonais.' },
      { type: 'visite',      name: 'Quartier Shibuya & carrefour', location: 'Shibuya',   duration: '3h',  price: 0,   desc: 'Le carrefour le plus fréquenté du monde et le cœur de la culture pop japonaise.' },
      { type: 'musee',       name: 'Musée National de Tokyo',     location: 'Ueno',       duration: '3h',  price: 15,  desc: 'Le plus grand musée du Japon avec des trésors nationaux et des artefacts historiques.' },
      { type: 'sport',       name: 'Cours de kendo',              location: 'Chiyoda',    duration: '2h',  price: 50,  desc: 'Initiation à l\'art martial du sabre japonais avec un maître certifié.' },
      { type: 'gastronomie', name: 'Dîner kaiseki à Ginza',       location: 'Ginza',      duration: '3h',  price: 120, desc: 'Haute gastronomie japonaise en 12 plats dans un restaurant étoilé.' },
      { type: 'visite',      name: 'Tour Skytree',                location: 'Asakusa',    duration: '2h',  price: 20,  desc: 'La plus haute tour du Japon avec vue à 360° sur Tokyo et le Mont Fuji.' },
    ]
  },

  paris: {
    name: 'Paris', country: 'France', flag: '🇫🇷',
    dep: { code: 'CDG', city: 'Paris' },
    arr: { code: 'CDG', city: 'Paris' },
    flightDuration: '1h (train)',
    airlines: ['SNCF Intercités', 'Eurostar'],
    keywords: ['paris', 'france', 'français', 'française', 'parisien', 'parisienne'],
    hotels: {
      budget: { name: 'ibis Paris Montmartre',     stars: 3, ppn: 95,  location: 'Montmartre',     desc: 'Hôtel bien situé dans le quartier bohème de Montmartre, proche du Sacré-Cœur.', amenities: ['WiFi gratuit', 'Bar', 'Réception 24h'] },
      moyen:  { name: 'Le Marais Boutique Hotel',  stars: 4, ppn: 220, location: 'Le Marais',       desc: 'Hôtel chic dans le quartier historique du Marais, à deux pas des musées et galeries d\'art.', amenities: ['WiFi gratuit', 'Petit-déjeuner gourmet', 'Spa', 'Concierge'] },
      luxe:   { name: 'Hôtel Ritz Paris',          stars: 5, ppn: 950, location: 'Place Vendôme',   desc: 'L\'hôtel mythique de Paris depuis 1898, symbole absolu du luxe à la française.', amenities: ['WiFi gratuit', 'Petit-déjeuner gastronomique', 'Piscine', 'Spa Chanel', 'Restaurant étoilé', 'Butler 24h'] }
    },
    activities: [
      { type: 'musee',       name: 'Musée du Louvre',             location: '1er arr.',   duration: '4h',  price: 22,  desc: 'Le plus grand musée d\'art du monde avec la Joconde et la Vénus de Milo.' },
      { type: 'visite',      name: 'Tour Eiffel',                 location: '7e arr.',    duration: '2h',  price: 28,  desc: 'Le monument le plus visité au monde avec vue panoramique sur Paris.' },
      { type: 'musee',       name: 'Musée d\'Orsay',             location: '7e arr.',    duration: '3h',  price: 16,  desc: 'La plus grande collection d\'art impressionniste au monde dans une ancienne gare.' },
      { type: 'gastronomie', name: 'Dîner au Jules Verne',        location: 'Tour Eiffel', duration: '3h', price: 180, desc: 'Restaurant gastronomique d\'Alain Ducasse avec vue imprenable sur Paris.' },
      { type: 'visite',      name: 'Versailles & ses jardins',    location: 'Versailles', duration: '6h',  price: 27,  desc: 'Le château et ses jardins à la française de Louis XIV, classé UNESCO.' },
      { type: 'gastronomie', name: 'Cours de pâtisserie française', location: 'Le Marais', duration: '3h', price: 85, desc: 'Apprenez les secrets des macarons et croissants avec un chef pâtissier.' },
      { type: 'visite',      name: 'Montmartre & Sacré-Cœur',     location: '18e arr.',   duration: '3h',  price: 0,   desc: 'Le quartier des artistes avec la magnifique basilique blanche dominant Paris.' },
      { type: 'sport',       name: 'Vélo le long de la Seine',    location: 'Bords de Seine', duration: '3h', price: 15, desc: 'Découvrez Paris à vélo le long de la Seine jusqu\'aux îles historiques.' },
      { type: 'gastronomie', name: 'Dégustation de vins',         location: 'Saint-Germain', duration: '2h', price: 60, desc: 'Initiation aux grands crus français avec un sommelier passionné.' },
    ]
  },

  barcelone: {
    name: 'Barcelone', country: 'Espagne', flag: '🇪🇸',
    dep: { code: 'CDG', city: 'Paris' },
    arr: { code: 'BCN', city: 'Barcelone' },
    flightDuration: '2h05',
    airlines: ['Vueling', 'Air France', 'Iberia', 'Transavia'],
    keywords: ['barcelone', 'barcelona', 'espagne', 'espagnol', 'catalogne', 'catalan'],
    hotels: {
      budget: { name: 'Generator Barcelona',       stars: 3, ppn: 70,  location: 'Gràcia',          desc: 'Hôtel branché dans le quartier bohème de Gràcia, ambiance cosmopolite et rooftop bar.', amenities: ['WiFi gratuit', 'Rooftop bar', 'Restaurant'] },
      moyen:  { name: 'Hotel Arts Barcelona',       stars: 4, ppn: 195, location: 'Barceloneta',     desc: 'Hôtel design au bord de la mer avec vue sur la Méditerranée et la skyline de Barcelone.', amenities: ['WiFi gratuit', 'Piscine', 'Plage privée', 'Spa', 'Restaurant gastronomique'] },
      luxe:   { name: 'W Barcelona',               stars: 5, ppn: 420, location: 'Barceloneta',     desc: 'Hôtel iconique en forme de voile au bord de la mer, design spectaculaire signé Ricardo Bofill.', amenities: ['WiFi gratuit', 'Piscine à débordement', 'Spa', 'Restaurant étoilé', 'Skybar 26e étage'] }
    },
    activities: [
      { type: 'visite',      name: 'Sagrada Família',             location: 'Eixample',   duration: '3h',  price: 30,  desc: 'Le chef-d\'œuvre inachevé de Gaudí, cathédrale moderniste unique au monde depuis 1882.' },
      { type: 'visite',      name: 'Park Güell',                  location: 'Gràcia',     duration: '2h',  price: 14,  desc: 'Parc fantastique de Gaudí avec mosaïques colorées et vue panoramique sur la ville.' },
      { type: 'gastronomie', name: 'Marché de la Boqueria',       location: 'Las Ramblas', duration: '2h', price: 20,  desc: 'Le marché couvert le plus célèbre de Barcelone, explosion de couleurs et de saveurs.' },
      { type: 'sport',       name: 'Cours de flamenco',           location: 'Gothic Quarter', duration: '2h', price: 45, desc: 'Initiation à la danse flamenco avec un professeur professionnel passionné.' },
      { type: 'musee',       name: 'Musée Picasso',               location: 'El Born',    duration: '3h',  price: 15,  desc: 'Plus de 4000 œuvres du maître cubiste dans 5 palais médiévaux du quartier Born.' },
      { type: 'sport',       name: 'Cours de surf à Barceloneta', location: 'Barceloneta', duration: '3h', price: 55,  desc: 'Apprenez à surfer sur les vagues méditerranéennes avec des moniteurs certifiés.' },
      { type: 'gastronomie', name: 'Tapas El Xampanyet',          location: 'El Born',    duration: '2h',  price: 35,  desc: 'Taverne authentique du quartier Born, tapas traditionnels et cava catalan maison.' },
      { type: 'visite',      name: 'Barri Gòtic',                 location: 'Gothic Quarter', duration: '3h', price: 0, desc: 'Le quartier gothique médiéval avec ses ruelles pavées et sa cathédrale impressionnante.' },
    ]
  },

  bali: {
    name: 'Bali', country: 'Indonésie', flag: '🇮🇩',
    dep: { code: 'CDG', city: 'Paris' },
    arr: { code: 'DPS', city: 'Denpasar' },
    flightDuration: '15h40',
    airlines: ['Qatar Airways', 'Emirates', 'KLM', 'Singapore Airlines'],
    keywords: ['bali', 'indonésie', 'indonésien', 'balinais', 'ubud', 'seminyak', 'kuta'],
    hotels: {
      budget: { name: 'Kuta Beach Hotel',          stars: 3, ppn: 55,  location: 'Kuta',            desc: 'Hôtel simple et agréable à Kuta, à deux pas de la plage et des commerces animés.', amenities: ['WiFi gratuit', 'Piscine', 'Petit-déjeuner inclus'] },
      moyen:  { name: 'Alaya Resort Ubud',          stars: 4, ppn: 145, location: 'Ubud',            desc: 'Resort au cœur des rizières d\'Ubud, mêlant architecture balinaise et confort contemporain.', amenities: ['WiFi gratuit', 'Piscine à débordement', 'Spa balinais', 'Petit-déjeuner inclus', 'Navette'] },
      luxe:   { name: 'Amandari Resort',            stars: 5, ppn: 650, location: 'Ubud',            desc: 'L\'un des plus beaux resorts de Bali, niché dans les rizières en terrasse d\'Ubud.', amenities: ['WiFi gratuit', 'Piscine privée', 'Spa Aman', 'Petit-déjeuner gastronomique', 'Butler', 'Activités culturelles'] }
    },
    activities: [
      { type: 'sport',       name: 'Cours de surf à Kuta',        location: 'Kuta',       duration: '3h',  price: 30,  desc: 'Initiation ou perfectionnement au surf sur les vagues mythiques de Kuta Beach.' },
      { type: 'visite',      name: 'Temple Tanah Lot',            location: 'Tabanan',    duration: '2h',  price: 5,   desc: 'Temple perché sur un rocher dans l\'océan, spectaculaire au coucher du soleil.' },
      { type: 'sport',       name: 'Yoga & méditation',           location: 'Ubud',       duration: '2h',  price: 20,  desc: 'Cours de yoga et méditation dans un cadre naturel entouré de rizières verdoyantes.' },
      { type: 'gastronomie', name: 'Cours de cuisine balinaise',  location: 'Ubud',       duration: '4h',  price: 45,  desc: 'Visite du marché local puis cuisson de plats balinais traditionnels avec un chef.' },
      { type: 'visite',      name: 'Rizières de Tegalalang',      location: 'Ubud',       duration: '3h',  price: 3,   desc: 'Balade dans les célèbres rizières en terrasse inscrites au patrimoine UNESCO.' },
      { type: 'musee',       name: 'Musée Puri Lukisan',          location: 'Ubud',       duration: '2h',  price: 6,   desc: 'Art balinais traditionnel et contemporain dans un magnifique palais historique.' },
      { type: 'sport',       name: 'Plongée à Tulamben',          location: 'Tulamben',   duration: '6h',  price: 60,  desc: 'Plongée sur l\'épave de l\'USS Liberty, biodiversité marine exceptionnelle.' },
      { type: 'gastronomie', name: 'Dîner Bebek Bengil',          location: 'Ubud',       duration: '3h',  price: 55,  desc: 'Canard croustillant balinais dans un cadre de rizières à couper le souffle.' },
    ]
  },

  rome: {
    name: 'Rome', country: 'Italie', flag: '🇮🇹',
    dep: { code: 'CDG', city: 'Paris' },
    arr: { code: 'FCO', city: 'Rome' },
    flightDuration: '2h15',
    airlines: ['Air France', 'ITA Airways', 'easyJet', 'Vueling'],
    keywords: ['rome', 'roma', 'italie', 'italien', 'italienne', 'toscane', 'sicile'],
    hotels: {
      budget: { name: 'Hotel Campo de\'Fiori',     stars: 3, ppn: 90,  location: 'Trastevere',      desc: 'Hôtel de charme dans le quartier animé de Trastevere, à deux pas du centre historique.', amenities: ['WiFi gratuit', 'Terrasse panoramique', 'Bar'] },
      moyen:  { name: 'Hotel de Russie',            stars: 4, ppn: 280, location: 'Piazza del Popolo', desc: 'Hôtel élégant à deux pas de la Piazza del Popolo, jardins secrets et spa réputé.', amenities: ['WiFi gratuit', 'Jardin secret', 'Spa', 'Restaurant gastronomique', 'Bar'] },
      luxe:   { name: 'Hotel de la Ville',          stars: 5, ppn: 750, location: 'Via Veneto',       desc: 'Palace romain sur la célèbre Via Veneto avec vue sur la Villa Borghèse.', amenities: ['WiFi gratuit', 'Rooftop piscine', 'Spa', 'Restaurant étoilé', 'Butler 24h'] }
    },
    activities: [
      { type: 'visite',      name: 'Colisée & Forum Romain',      location: 'Centro Storico', duration: '4h', price: 18, desc: 'L\'amphithéâtre le plus célèbre du monde et le cœur de la Rome antique.' },
      { type: 'visite',      name: 'Vatican & Chapelle Sixtine',   location: 'Vatican',    duration: '4h',  price: 27,  desc: 'Les Musées du Vatican et la Chapelle Sixtine de Michel-Ange, incontournables.' },
      { type: 'gastronomie', name: 'Cours de pasta',               location: 'Trastevere', duration: '3h',  price: 65,  desc: 'Apprenez à préparer carbonara, cacio e pepe et tiramisu avec une Nonna romaine.' },
      { type: 'visite',      name: 'Fontaine de Trevi & Panthéon', location: 'Centro Storico', duration: '3h', price: 5, desc: 'La fontaine baroque la plus célèbre et le temple romain le mieux conservé au monde.' },
      { type: 'musee',       name: 'Galerie Borghèse',             location: 'Villa Borghèse', duration: '3h', price: 15, desc: 'Chefs-d\'œuvre du Bernin et du Caravage dans une villa baroque somptueuse.' },
      { type: 'gastronomie', name: 'Dîner trattoria romaine',      location: 'Centro Storico', duration: '2h', price: 55, desc: 'Cucina romana traditionnelle dans une trattoria centenaire du centre historique.' },
      { type: 'sport',       name: 'Running Rome antique',         location: 'Circo Massimo', duration: '2h', price: 25, desc: 'Jogging guidé à travers les sites antiques au lever du soleil avec un guide expert.' },
    ]
  }
};

const DEFAULT_DEST = 'tokyo';

// ── Prompt Parser ─────────────────────────────────────────────────────────────

function parsePrompt(text) {
  const t = text.toLowerCase();

  let destKey = DEFAULT_DEST;
  for (const [key, d] of Object.entries(DESTINATIONS)) {
    if (d.keywords.some(kw => t.includes(kw))) { destKey = key; break; }
  }

  let days = 7;
  const dm = t.match(/(\d+)\s*jours?/);
  const wm = t.match(/(\d+)\s*semaines?/);
  const nm = t.match(/(\d+)\s*nuits?/);
  if (dm) days = parseInt(dm[1]);
  else if (wm) days = parseInt(wm[1]) * 7;
  else if (nm) days = parseInt(nm[1]);
  else if (t.includes('week-end') || t.includes('weekend')) days = 3;
  days = Math.max(2, Math.min(days, 21));

  let travelers = 2;
  const tm = t.match(/(\d+)\s*(?:personnes?|adultes?|voyageurs?)/);
  if (tm) travelers = Math.min(parseInt(tm[1]), 10);
  else if (t.includes('seul') || t.includes('solo')) travelers = 1;
  else if (t.includes('famille')) travelers = 4;

  let budget = 'moyen';
  if (/économ|petit budget|budget serré|pas cher|low.?cost/.test(t)) budget = 'budget';
  else if (/luxe|haut de gamme|premium|palace|5 étoiles/.test(t)) budget = 'luxe';

  return { destKey, days, travelers, budget };
}

// ── Mock Package Generator ────────────────────────────────────────────────────

function selectActivities(pool, days) {
  const types = ['visite', 'musee', 'gastronomie', 'sport'];
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const selected = [];

  for (const type of types) {
    const found = shuffled.find(a => a.type === type && !selected.includes(a));
    if (found) selected.push(found);
  }

  const remaining = shuffled.filter(a => !selected.includes(a));
  const target = Math.min(Math.max(days + 2, 6), pool.length);
  while (selected.length < target && remaining.length > 0) selected.push(remaining.shift());

  return selected;
}

function buildProgram(activities, days, startDate, dest) {
  const program = [];
  let ai = 0;

  for (let d = 0; d < days; d++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + d);
    const dateStr = date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

    const items = [];
    if (d === 0) {
      items.push({ time: '14:00', type: 'transport', name: `Arrivée à ${dest.arr.city}`, desc: 'Atterrissage et transfert vers l\'hôtel.', price: 0 });
      items.push({ time: '16:30', type: 'hotel', name: 'Check-in à l\'hôtel', desc: 'Installation et découverte de l\'hébergement.', price: 0 });
      if (ai < activities.length) { items.push({ time: '19:30', ...activities[ai++] }); }
    } else if (d === days - 1) {
      if (ai < activities.length) { items.push({ time: '09:00', ...activities[ai++] }); }
      items.push({ time: '12:30', type: 'hotel', name: 'Check-out de l\'hôtel', desc: 'Remise des clés et transfert vers l\'aéroport.', price: 0 });
      items.push({ time: '14:20', type: 'transport', name: `Vol retour vers ${dest.dep.city}`, desc: 'Embarquement et retour.', price: 0 });
    } else {
      const times = ['09:00', '13:30', '19:00'];
      for (let i = 0; i < 3 && ai < activities.length; i++) {
        items.push({ time: times[i], ...activities[ai++] });
      }
    }

    program.push({
      day: d + 1,
      label: d === 0 ? 'Jour 1 — Arrivée' : d === days - 1 ? `Jour ${d + 1} — Départ` : `Jour ${d + 1}`,
      date: dateStr,
      items
    });
  }
  return program;
}

function generateMockPackage(prompt) {
  const { destKey, days, travelers, budget } = parsePrompt(prompt);
  const dest  = DESTINATIONS[destKey];
  const hotel = dest.hotels[budget];

  const depDate = new Date();
  depDate.setDate(depDate.getDate() + 21);
  const retDate = new Date(depDate);
  retDate.setDate(retDate.getDate() + days);

  const fmt = d => d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const basePrices = { budget: 290, moyen: 580, luxe: 1100 };
  const distMult   = { paris: 0.12, barcelone: 0.55, rome: 0.65, bali: 1.7, tokyo: 1.55 };
  const flightPPP  = Math.round(basePrices[budget] * (distMult[destKey] || 1) + Math.random() * 80);

  const airline    = dest.airlines[Math.floor(Math.random() * dest.airlines.length)];
  const flightNum  = airline.substring(0, 2).toUpperCase().replace(/\s/g, '') + (Math.floor(Math.random() * 9000) + 1000);
  const retFlightN = airline.substring(0, 2).toUpperCase().replace(/\s/g, '') + (Math.floor(Math.random() * 9000) + 1000);

  const acts = selectActivities(dest.activities, days);
  const program = buildProgram(acts, days, depDate, dest);

  const hotelNights  = days - 1;
  const hotelRooms   = travelers <= 2 ? 1 : Math.ceil(travelers / 2);
  const hotelTotal   = hotel.ppn * hotelNights * hotelRooms;
  const flightTotal  = flightPPP * travelers * 2;
  const activTotal   = acts.reduce((s, a) => s + a.price, 0) * travelers;
  const perPerson    = Math.round((flightTotal + hotelTotal + activTotal) / travelers);

  const classLabel = budget === 'luxe' ? 'Affaires' : budget === 'budget' ? 'Économique' : 'Économique Premium';
  const catLabel   = budget === 'luxe' ? 'Luxe' : budget === 'budget' ? 'Économique' : 'Confort';

  return {
    destination: `${dest.name}, ${dest.country}`,
    flag: dest.flag,
    departureCity: dest.dep.city,
    duration: `${days} jour${days > 1 ? 's' : ''}`,
    travelers: travelers === 1 ? '1 voyageur' : `${travelers} voyageurs`,
    budgetCategory: catLabel,
    budgetPerPerson: `${perPerson.toLocaleString('fr-FR')} €`,
    flights: {
      outbound: {
        airline, number: flightNum, classLabel,
        price: `${flightPPP.toLocaleString('fr-FR')} € / pers.`,
        departure: { time: '10:30', airport: `${dest.dep.city} (${dest.dep.code})` },
        arrival:   { time: dest.arr.code === 'CDG' ? '11:15' : '06:45+1', airport: `${dest.arr.city} (${dest.arr.code})` },
        duration: dest.flightDuration, date: fmt(depDate)
      },
      return: {
        airline, number: retFlightN, classLabel,
        price: `${flightPPP.toLocaleString('fr-FR')} € / pers.`,
        departure: { time: '14:20', airport: `${dest.arr.city} (${dest.arr.code})` },
        arrival:   { time: '19:35', airport: `${dest.dep.city} (${dest.dep.code})` },
        duration: dest.flightDuration, date: fmt(retDate)
      }
    },
    hotel: {
      name: hotel.name, stars: hotel.stars,
      location: hotel.location,
      pricePerNight: `${hotel.ppn} €`,
      description: hotel.desc,
      amenities: hotel.amenities
    },
    activities: acts,
    program
  };
}

// ── UI Helpers ────────────────────────────────────────────────────────────────

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Saved Trips ───────────────────────────────────────────────────────────────

function getSavedTrips() {
  try { return JSON.parse(localStorage.getItem(SAVED_TRIPS_KEY) || '[]'); }
  catch { return []; }
}

function setSavedTrips(trips) {
  localStorage.setItem(SAVED_TRIPS_KEY, JSON.stringify(trips));
}

function updateSavedBadge() {
  const trips = getSavedTrips();
  const badge = document.getElementById('saved-count');
  if (!badge) return;
  if (trips.length > 0) { badge.textContent = trips.length; badge.hidden = false; }
  else badge.hidden = true;
}

function saveCurrentTrip(pkg) {
  const trips = getSavedTrips();
  const id = Date.now().toString();
  trips.unshift({ id, savedAt: new Date().toISOString(), pkg });
  setSavedTrips(trips);
  updateSavedBadge();
}

function deleteTrip(id) {
  const trips = getSavedTrips().filter(t => t.id !== id);
  setSavedTrips(trips);
  updateSavedBadge();
}

function renderSavedView() {
  const trips = getSavedTrips();
  const empty = document.getElementById('saved-empty');
  const grid  = document.getElementById('saved-grid');
  if (!grid) return;

  grid.innerHTML = '';
  if (empty) empty.hidden = trips.length > 0;

  trips.forEach(({ id, savedAt, pkg }) => {
    const date = new Date(savedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    const card = document.createElement('div');
    card.className = 'saved-card';
    card.innerHTML = `
      <div class="saved-card-header">
        <span class="saved-card-flag">${esc(pkg.flag)}</span>
        <div class="saved-card-dest">
          <div class="saved-card-name">${esc(pkg.destination)}</div>
          <div class="saved-card-date">Sauvegardé le ${esc(date)}</div>
        </div>
      </div>
      <div class="saved-card-pills">
        <span class="saved-pill"><i data-lucide="calendar"></i> ${esc(pkg.duration)}</span>
        <span class="saved-pill"><i data-lucide="users"></i> ${esc(pkg.travelers)}</span>
        <span class="saved-pill"><i data-lucide="star"></i> ${esc(pkg.budgetCategory)}</span>
      </div>
      <div class="saved-budget">${esc(pkg.budgetPerPerson)} <small style="font-size:.7em;font-weight:600;color:var(--muted)">/ pers.</small></div>
      <div class="saved-card-actions">
        <button class="btn-view" data-id="${esc(id)}"><i data-lucide="eye"></i> Voir le voyage</button>
        <button class="btn-delete" data-id="${esc(id)}" title="Supprimer"><i data-lucide="trash-2"></i></button>
      </div>
    `;

    card.querySelector('.btn-view').addEventListener('click', () => {
      renderResults(pkg);
      switchTab('flights');
      showView('view-results');
      window.scrollTo(0, 0);
      markSaveButton(id, trips);
    });

    card.querySelector('.btn-delete').addEventListener('click', () => {
      deleteTrip(id);
      card.remove();
      const remaining = getSavedTrips();
      if (empty) empty.hidden = remaining.length > 0;
    });

    grid.appendChild(card);
  });
  lucide.createIcons();
}

function markSaveButton(existingId, trips) {
  const btn   = document.getElementById('btn-save');
  const label = document.getElementById('save-label');
  if (!btn || !label) return;
  if (existingId) {
    btn.className = 'btn-save saved';
    btn.dataset.existingId = existingId;
    label.textContent = 'Voyage sauvegardé';
  } else {
    btn.className = 'btn-save';
    delete btn.dataset.existingId;
    label.textContent = 'Sauvegarder ce voyage';
  }
}

// ── Views ─────────────────────────────────────────────────────────────────────

function showView(id) {
  ['view-hero', 'view-loading', 'view-results', 'view-saved'].forEach(v => {
    const el = document.getElementById(v);
    if (el) el.hidden = v !== id;
  });
}

// ── Loading Steps ─────────────────────────────────────────────────────────────

const STEPS = [
  { id: 'lstep-0', text: 'Analyse de votre demande...' },
  { id: 'lstep-1', text: 'Recherche des meilleures options de vols...' },
  { id: 'lstep-2', text: 'Sélection de l\'hébergement idéal...' },
  { id: 'lstep-3', text: 'Composition des activités...' },
  { id: 'lstep-4', text: 'Finalisation du programme jour par jour...' }
];

async function runLoadingAnimation() {
  const textEl = document.getElementById('loading-text');
  for (let i = 0; i < STEPS.length; i++) {
    if (i > 0) {
      const prev = document.getElementById(STEPS[i - 1].id);
      if (prev) { prev.classList.remove('active'); prev.classList.add('done'); }
    }
    const cur = document.getElementById(STEPS[i].id);
    if (cur) cur.classList.add('active');
    if (textEl) textEl.textContent = STEPS[i].text;
    await new Promise(r => setTimeout(r, 900 + Math.random() * 300));
  }
}

// ── Renderers ─────────────────────────────────────────────────────────────────

function renderSummary(pkg) {
  setText('sum-flag', pkg.flag);
  setText('sum-destination', pkg.destination);
  setText('sum-departure', `Départ depuis ${pkg.departureCity}`);
  setText('sum-duration', pkg.duration);
  setText('sum-travelers', pkg.travelers);
  setText('sum-category', pkg.budgetCategory);
  setText('sum-budget', pkg.budgetPerPerson);
}

function renderFlight(f, prefix) {
  setText(`f-${prefix}-date`, f.date);
  setText(`f-${prefix}-price`, f.price);
  setText(`f-${prefix}-dep-time`, f.departure.time);
  setText(`f-${prefix}-dep-airport`, f.departure.airport);
  setText(`f-${prefix}-arr-time`, f.arrival.time);
  setText(`f-${prefix}-arr-airport`, f.arrival.airport);
  setText(`f-${prefix}-duration`, f.duration);
  setText(`f-${prefix}-airline`, f.airline);
  setText(`f-${prefix}-number`, f.number);
  setText(`f-${prefix}-class`, f.classLabel);
}

function renderHotel(h) {
  setText('h-name', h.name);
  setText('h-price', h.pricePerNight);
  setText('h-location', h.location);
  setText('h-desc', h.description);

  const starsEl = document.getElementById('h-stars');
  if (starsEl) starsEl.textContent = '★'.repeat(h.stars) + '☆'.repeat(5 - h.stars);

  const amenEl = document.getElementById('h-amenities');
  if (amenEl) {
    amenEl.innerHTML = '';
    (h.amenities || []).forEach(a => {
      const chip = document.createElement('span');
      chip.className = 'amenity-chip';
      chip.textContent = a;
      amenEl.appendChild(chip);
    });
  }
}

const ACT_ICONS = { visite: 'landmark', musee: 'building-2', gastronomie: 'utensils', sport: 'dumbbell', transport: 'plane', hotel: 'bed' };

function renderActivities(activities) {
  const grid = document.getElementById('activities-grid');
  if (!grid) return;
  grid.innerHTML = '';

  activities.forEach(act => {
    const type = act.type || 'visite';
    const icon = ACT_ICONS[type] || 'star';
    const priceStr = act.price === 0 ? 'Gratuit' : `${act.price} € / pers.`;
    const typeLabel = { visite: 'Visite', musee: 'Musée', gastronomie: 'Gastronomie', sport: 'Sport' }[type] || type;

    const card = document.createElement('div');
    card.className = `activity-card type-${esc(type)}`;
    card.innerHTML = `
      <div class="act-header">
        <span class="act-type-badge">
          <i data-lucide="${esc(icon)}"></i> ${esc(typeLabel)}
        </span>
        <span class="act-price">${esc(priceStr)}</span>
      </div>
      <h4 class="act-name">${esc(act.name)}</h4>
      <p class="act-location"><i data-lucide="map-pin"></i> ${esc(act.location)}</p>
      <p class="act-desc">${esc(act.desc || act.description || '')}</p>
      <p class="act-duration"><i data-lucide="clock"></i> ${esc(act.duration)}</p>
    `;
    grid.appendChild(card);
  });
  lucide.createIcons();
}

function renderProgram(program) {
  const list = document.getElementById('program-list');
  if (!list) return;
  list.innerHTML = '';

  program.forEach(day => {
    const dayEl = document.createElement('div');
    dayEl.className = 'program-day';

    const itemsHtml = (day.items || []).map(item => {
      const type = item.type || 'visite';
      const icon = ACT_ICONS[type] || 'circle';
      const priceHtml = item.price > 0 ? `<span class="prog-price">${esc(String(item.price))} € / pers.</span>` : '';
      return `
        <div class="prog-item">
          <div class="prog-time">${esc(item.time)}</div>
          <div class="prog-dot dot-${esc(type)}"><i data-lucide="${esc(icon)}"></i></div>
          <div class="prog-content">
            <div class="prog-name">${esc(item.name)} ${priceHtml}</div>
            <div class="prog-desc">${esc(item.desc || item.description || '')}</div>
          </div>
        </div>
      `;
    }).join('');

    dayEl.innerHTML = `
      <div class="prog-day-header">
        <span class="prog-day-label">${esc(day.label)}</span>
        <span class="prog-day-date">${esc(day.date)}</span>
      </div>
      <div class="prog-items">${itemsHtml}</div>
    `;
    list.appendChild(dayEl);
  });
  lucide.createIcons();
}

function renderResults(pkg) {
  renderSummary(pkg);
  renderFlight(pkg.flights.outbound, 'out');
  renderFlight(pkg.flights.return, 'ret');
  renderHotel(pkg.hotel);
  renderActivities(pkg.activities);
  renderProgram(pkg.program);
}

// ── Tabs ──────────────────────────────────────────────────────────────────────

function switchTab(name) {
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === name));
  ['flights', 'hotel', 'activities', 'program'].forEach(n => {
    const panel = document.getElementById(`panel-${n}`);
    if (panel) panel.hidden = n !== name;
  });
}

// ── Main Generate Flow ────────────────────────────────────────────────────────

async function handleGenerate() {
  const promptEl = document.getElementById('prompt-input');
  const prompt = (promptEl?.value || '').trim();
  if (!prompt) {
    promptEl?.focus();
    return;
  }

  const btn = document.getElementById('btn-generate');
  if (btn) btn.disabled = true;

  STEPS.forEach(s => {
    const el = document.getElementById(s.id);
    if (el) { el.className = 'loading-step'; }
  });

  showView('view-loading');
  window.scrollTo(0, 0);

  const [pkg] = await Promise.all([
    Promise.resolve(generateMockPackage(prompt)),
    runLoadingAnimation()
  ]);

  currentPkg = pkg;
  renderResults(pkg);
  switchTab('flights');
  showView('view-results');
  window.scrollTo(0, 0);
  markSaveButton(null, null);

  if (btn) btn.disabled = false;
}

// ── Init ──────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  lucide.createIcons();
  updateSavedBadge();

  // Generate button
  document.getElementById('btn-generate')?.addEventListener('click', handleGenerate);

  // Textarea Enter (Ctrl/Cmd + Enter)
  document.getElementById('prompt-input')?.addEventListener('keydown', e => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleGenerate();
  });

  // Example chips
  document.querySelectorAll('.chip[data-prompt]').forEach(chip => {
    chip.addEventListener('click', () => {
      const input = document.getElementById('prompt-input');
      if (input) { input.value = chip.dataset.prompt; input.focus(); }
    });
  });

  // Back button (results → hero)
  document.getElementById('btn-back')?.addEventListener('click', () => {
    showView('view-hero');
    window.scrollTo(0, 0);
  });

  // Back button (saved trips → hero)
  document.getElementById('btn-saved-back')?.addEventListener('click', () => {
    showView('view-hero');
    window.scrollTo(0, 0);
  });

  // Save current trip
  document.getElementById('btn-save')?.addEventListener('click', () => {
    const btn = document.getElementById('btn-save');
    if (!btn || btn.dataset.existingId || !currentPkg) return;
    saveCurrentTrip(currentPkg);
    markSaveButton('saved', null);
  });

  // Saved trips button
  document.getElementById('btn-saved-trips')?.addEventListener('click', () => {
    renderSavedView();
    showView('view-saved');
    window.scrollTo(0, 0);
  });

  // Tabs
  document.querySelectorAll('.tab[data-tab]').forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });

});
