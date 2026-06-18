// Itinerary building blocks per destination, keyed by destination name (must
// match DESTINATIONS[].name in data.js). Used by itinerary.js to assemble a
// day-by-day schedule.
//
//   hotelArea : suggested base/neighbourhood to stay in
//   transport : how to get around (used to minimise daily travel)
//   areas[]   : { zone, spots:[{ name, hrs }] }  — spots grouped by neighbourhood
//               so a day can stay within one zone (less time in transit)
//   food[]    : { name, meal:"lunch"|"dinner"|"any", cuisine, diet:[...] }

const PLANS = {
  "Lisbon": {
    hotelArea: "Baixa–Chiado (central, walkable, on the metro)",
    transport: "Walk the centre; trams 28/15 and the metro for longer hops. Airport: red line metro (~20 min).",
    areas: [
      { zone: "Alfama & Baixa", spots: [
        { name: "São Jorge Castle", hrs: 2 },
        { name: "Alfama old town & Fado lanes", hrs: 2 },
        { name: "Praça do Comércio", hrs: 1 }
      ]},
      { zone: "Belém", spots: [
        { name: "Jerónimos Monastery", hrs: 2 },
        { name: "Belém Tower", hrs: 1 },
        { name: "Pastéis de Belém tasting", hrs: 1 }
      ]},
      { zone: "Chiado & Bairro Alto", spots: [
        { name: "Time Out Market", hrs: 1.5 },
        { name: "Miradouro de São Pedro de Alcântara", hrs: 1 },
        { name: "LX Factory", hrs: 2 }
      ]}
    ],
    food: [
      { name: "Time Out Market", meal: "lunch", cuisine: "Portuguese / varied", diet: ["vegetarian", "vegan", "gluten-free"] },
      { name: "Cervejaria Ramiro", meal: "dinner", cuisine: "Seafood", diet: [] },
      { name: "Ao 26 Vegan Food Project", meal: "dinner", cuisine: "Vegan", diet: ["vegetarian", "vegan"] }
    ]
  },

  "Bali": {
    hotelArea: "Pick one base — Ubud (culture) or Seminyak/Canggu (beach) — to cut transfers",
    transport: "Hire a private driver for day trips; scooters/Grab for short hops. Roads are slow, so group sights by area.",
    areas: [
      { zone: "Ubud", spots: [
        { name: "Sacred Monkey Forest", hrs: 1.5 },
        { name: "Tegalalang Rice Terraces", hrs: 2 },
        { name: "Ubud Palace & Market", hrs: 1 }
      ]},
      { zone: "Beaches (Seminyak/Canggu)", spots: [
        { name: "Tanah Lot Temple", hrs: 1.5 },
        { name: "Beach club afternoon", hrs: 3 },
        { name: "Seminyak Beach sunset", hrs: 2 }
      ]},
      { zone: "Adventure", spots: [
        { name: "Mount Batur sunrise hike", hrs: 4 },
        { name: "Tirta Empul water temple", hrs: 1.5 },
        { name: "Tegenungan Waterfall", hrs: 1.5 }
      ]}
    ],
    food: [
      { name: "Local warung lunch", meal: "lunch", cuisine: "Balinese", diet: ["vegetarian", "vegan", "halal"] },
      { name: "Ubud healthy cafe (bowls)", meal: "lunch", cuisine: "Healthy", diet: ["vegetarian", "vegan", "gluten-free"] },
      { name: "La Favela Seminyak", meal: "dinner", cuisine: "International", diet: ["vegetarian"] }
    ]
  },

  "Kyoto": {
    hotelArea: "Near Kyoto Station or Gion — central and on transit",
    transport: "Buses + subway with an ICOCA card; rent a bike for the flat centre.",
    areas: [
      { zone: "Higashiyama & Gion", spots: [
        { name: "Kiyomizu-dera temple", hrs: 1.5 },
        { name: "Gion & Hanamikoji street", hrs: 1.5 },
        { name: "Yasaka Shrine", hrs: 1 }
      ]},
      { zone: "Arashiyama", spots: [
        { name: "Bamboo Grove", hrs: 1 },
        { name: "Tenryu-ji temple & garden", hrs: 1.5 },
        { name: "Monkey Park Iwatayama", hrs: 1.5 }
      ]},
      { zone: "Fushimi & Central", spots: [
        { name: "Fushimi Inari shrine", hrs: 2 },
        { name: "Kinkaku-ji (Golden Pavilion)", hrs: 1 },
        { name: "Nishiki Market", hrs: 1.5 }
      ]}
    ],
    food: [
      { name: "Nishiki Market stalls", meal: "lunch", cuisine: "Japanese street food", diet: ["vegetarian"] },
      { name: "Shigetsu (temple vegetarian)", meal: "lunch", cuisine: "Shojin vegetarian", diet: ["vegetarian", "vegan"] },
      { name: "Local ramen / izakaya", meal: "dinner", cuisine: "Japanese", diet: ["vegetarian"] }
    ]
  },

  "Reykjavik & South Coast": {
    hotelArea: "Reykjavik 101 (food/nightlife) or a South Coast guesthouse for the sights",
    transport: "Rent a car — sights are spread along Route 1. Book the Blue Lagoon ahead.",
    areas: [
      { zone: "Reykjavik", spots: [
        { name: "Hallgrímskirkja church", hrs: 1 },
        { name: "Old harbour & whale watching", hrs: 3 },
        { name: "Sun Voyager & waterfront", hrs: 1 }
      ]},
      { zone: "Golden Circle", spots: [
        { name: "Þingvellir National Park", hrs: 1.5 },
        { name: "Geysir & Strokkur", hrs: 1 },
        { name: "Gullfoss waterfall", hrs: 1 }
      ]},
      { zone: "South Coast", spots: [
        { name: "Seljalandsfoss & Skógafoss", hrs: 2 },
        { name: "Reynisfjara black-sand beach", hrs: 1.5 },
        { name: "Sólheimajökull glacier walk", hrs: 2 }
      ]}
    ],
    food: [
      { name: "Bæjarins Beztu hot dog", meal: "lunch", cuisine: "Icelandic street", diet: [] },
      { name: "Gló (healthy/veg)", meal: "lunch", cuisine: "Vegetarian", diet: ["vegetarian", "vegan", "gluten-free"] },
      { name: "Messinn seafood", meal: "dinner", cuisine: "Seafood", diet: ["gluten-free"] }
    ]
  },

  "Barcelona": {
    hotelArea: "Eixample or the Gothic Quarter — central and walkable",
    transport: "Metro is fast and cheap; walk the old town. Airport: Aerobús or metro L9.",
    areas: [
      { zone: "Gothic & Born", spots: [
        { name: "Barcelona Cathedral & Gothic Quarter", hrs: 2 },
        { name: "Picasso Museum", hrs: 1.5 },
        { name: "Santa Maria del Mar", hrs: 1 }
      ]},
      { zone: "Gaudí", spots: [
        { name: "Sagrada Família", hrs: 1.5 },
        { name: "Park Güell", hrs: 1.5 },
        { name: "Casa Batlló", hrs: 1 }
      ]},
      { zone: "Seaside & Montjuïc", spots: [
        { name: "La Boqueria & La Rambla", hrs: 1.5 },
        { name: "Barceloneta beach", hrs: 2 },
        { name: "Montjuïc & Magic Fountain", hrs: 2 }
      ]}
    ],
    food: [
      { name: "La Boqueria market", meal: "lunch", cuisine: "Tapas / varied", diet: ["vegetarian", "vegan"] },
      { name: "Teresa Carles (veg)", meal: "lunch", cuisine: "Vegetarian", diet: ["vegetarian", "vegan", "gluten-free"] },
      { name: "Cervecería Catalana", meal: "dinner", cuisine: "Tapas", diet: ["vegetarian"] }
    ]
  },

  "Marrakech": {
    hotelArea: "A riad in the Medina (atmosphere) or Gueliz (modern, quieter)",
    transport: "Walk the Medina; petit taxis for longer hops — agree the fare first.",
    areas: [
      { zone: "Medina", spots: [
        { name: "Jemaa el-Fnaa square", hrs: 2 },
        { name: "The souks", hrs: 2 },
        { name: "Bahia Palace", hrs: 1.5 }
      ]},
      { zone: "Gardens", spots: [
        { name: "Majorelle Garden & YSL", hrs: 1.5 },
        { name: "Le Jardin Secret", hrs: 1 },
        { name: "Menara Gardens", hrs: 1 }
      ]},
      { zone: "Desert & spa", spots: [
        { name: "Agafay desert sunset & camel ride", hrs: 4 },
        { name: "Traditional hammam & spa", hrs: 2 },
        { name: "Atlas Mountains day trip", hrs: 6 }
      ]}
    ],
    food: [
      { name: "Nomad (rooftop)", meal: "lunch", cuisine: "Modern Moroccan", diet: ["vegetarian", "halal"] },
      { name: "Le Jardin", meal: "lunch", cuisine: "Moroccan", diet: ["vegetarian", "halal"] },
      { name: "Al Fassia", meal: "dinner", cuisine: "Traditional Moroccan", diet: ["halal", "vegetarian"] }
    ]
  },

  "Costa Rica": {
    hotelArea: "Split between La Fortuna (Arenal) and a Pacific beach (Manuel Antonio/Tamarindo)",
    transport: "Rent a 4x4 or use tourist shuttles; short internal flights save long drives.",
    areas: [
      { zone: "Arenal / La Fortuna", spots: [
        { name: "Arenal Volcano hike", hrs: 2 },
        { name: "La Fortuna Waterfall", hrs: 2 },
        { name: "Tabacón hot springs", hrs: 3 }
      ]},
      { zone: "Monteverde", spots: [
        { name: "Cloud Forest reserve", hrs: 3 },
        { name: "Hanging bridges walk", hrs: 2 },
        { name: "Ziplining canopy tour", hrs: 3 }
      ]},
      { zone: "Pacific Coast", spots: [
        { name: "Manuel Antonio National Park", hrs: 3 },
        { name: "Beach & wildlife", hrs: 2 },
        { name: "Catamaran & snorkel", hrs: 4 }
      ]}
    ],
    food: [
      { name: "Soda típica (casado plate)", meal: "lunch", cuisine: "Costa Rican", diet: ["vegetarian", "vegan", "gluten-free"] },
      { name: "Beach seafood grill", meal: "dinner", cuisine: "Seafood", diet: ["gluten-free"] },
      { name: "Lodge restaurant", meal: "dinner", cuisine: "International", diet: ["vegetarian"] }
    ]
  },

  "Rome": {
    hotelArea: "Near the Pantheon/Trevi or Monti — walkable to the sights",
    transport: "Walk the centre; metro for the Vatican/Colosseum. Validate bus tickets.",
    areas: [
      { zone: "Ancient Rome", spots: [
        { name: "Colosseum & Roman Forum", hrs: 3 },
        { name: "Palatine Hill", hrs: 1.5 },
        { name: "Capitoline Museums", hrs: 1.5 }
      ]},
      { zone: "Vatican", spots: [
        { name: "St. Peter's Basilica", hrs: 1.5 },
        { name: "Vatican Museums & Sistine Chapel", hrs: 3 },
        { name: "Castel Sant'Angelo", hrs: 1 }
      ]},
      { zone: "Centro Storico", spots: [
        { name: "Pantheon", hrs: 1 },
        { name: "Trevi Fountain & Spanish Steps", hrs: 1.5 },
        { name: "Piazza Navona", hrs: 1 }
      ]}
    ],
    food: [
      { name: "Roscioli / Campo de' Fiori", meal: "lunch", cuisine: "Roman", diet: ["vegetarian"] },
      { name: "Trastevere trattoria", meal: "dinner", cuisine: "Roman pasta", diet: ["vegetarian", "gluten-free"] },
      { name: "Gelato & espresso stop", meal: "any", cuisine: "Gelato", diet: ["vegetarian", "gluten-free"] }
    ]
  },

  "Thailand (Bangkok & islands)": {
    hotelArea: "Bangkok: riverside/Sukhumvit; Islands: pick one base (Phuket/Krabi/Samui)",
    transport: "Bangkok: BTS Skytrain + river boats + Grab. Islands: ferries & longtail boats.",
    areas: [
      { zone: "Bangkok temples", spots: [
        { name: "Grand Palace & Wat Pho", hrs: 3 },
        { name: "Wat Arun", hrs: 1 },
        { name: "Chinatown street food", hrs: 2 }
      ]},
      { zone: "Bangkok modern", spots: [
        { name: "Chatuchak weekend market", hrs: 3 },
        { name: "Jim Thompson House", hrs: 1.5 },
        { name: "Rooftop bar sunset", hrs: 2 }
      ]},
      { zone: "Islands", spots: [
        { name: "Island-hopping longtail tour", hrs: 5 },
        { name: "Snorkeling & beaches", hrs: 4 },
        { name: "Big Buddha & viewpoint", hrs: 1.5 }
      ]}
    ],
    food: [
      { name: "Street-food stalls", meal: "lunch", cuisine: "Thai", diet: ["vegetarian", "vegan", "halal"] },
      { name: "Thipsamai pad thai", meal: "dinner", cuisine: "Thai", diet: ["vegetarian"] },
      { name: "Beachfront seafood BBQ", meal: "dinner", cuisine: "Seafood", diet: ["gluten-free"] }
    ]
  },

  "Zermatt": {
    hotelArea: "Zermatt village (car-free) — everything walkable to the lifts",
    transport: "Park in Täsch and take the shuttle train (Zermatt is car-free); cable cars to the slopes.",
    areas: [
      { zone: "Gornergrat", spots: [
        { name: "Gornergrat cog railway", hrs: 3 },
        { name: "Riffelsee Matterhorn reflection walk", hrs: 2 },
        { name: "Sledging / snow play", hrs: 2 }
      ]},
      { zone: "Glacier Paradise", spots: [
        { name: "Matterhorn Glacier Paradise", hrs: 3 },
        { name: "Glacier Palace ice grotto", hrs: 1 },
        { name: "Skiing / snowboarding", hrs: 5 }
      ]},
      { zone: "Village & valley", spots: [
        { name: "Zermatt village & church", hrs: 1 },
        { name: "Gorner Gorge walk", hrs: 1.5 },
        { name: "Sunnegga & Leisee lake", hrs: 2 }
      ]}
    ],
    food: [
      { name: "Mountain hut (berghaus) lunch", meal: "lunch", cuisine: "Swiss alpine", diet: ["vegetarian"] },
      { name: "Bakery & raclette stop", meal: "any", cuisine: "Swiss", diet: ["vegetarian", "gluten-free"] },
      { name: "Fondue dinner", meal: "dinner", cuisine: "Swiss", diet: ["vegetarian"] }
    ]
  },

  "Riviera Maya": {
    hotelArea: "Playa del Carmen (lively) or a Tulum/Akumal resort (quieter beaches)",
    transport: "Colectivos along Highway 307; rent a car for cenotes & ruins.",
    areas: [
      { zone: "Beaches & Playa", spots: [
        { name: "Playa del Carmen 5th Ave & beach", hrs: 2 },
        { name: "Beach club day", hrs: 4 },
        { name: "Cozumel ferry & snorkel", hrs: 6 }
      ]},
      { zone: "Cenotes", spots: [
        { name: "Gran Cenote / Dos Ojos swim", hrs: 3 },
        { name: "Akumal turtle snorkel", hrs: 2 },
        { name: "Cenote diving intro", hrs: 3 }
      ]},
      { zone: "Ruins & parks", spots: [
        { name: "Tulum ruins", hrs: 2 },
        { name: "Xcaret eco-park", hrs: 6 },
        { name: "Chichén Itzá day trip", hrs: 6 }
      ]}
    ],
    food: [
      { name: "Local taquería", meal: "lunch", cuisine: "Mexican tacos", diet: ["vegetarian", "vegan"] },
      { name: "Beach club ceviche", meal: "lunch", cuisine: "Seafood", diet: ["gluten-free"] },
      { name: "Tulum dinner spot", meal: "dinner", cuisine: "Mexican / international", diet: ["vegetarian", "vegan", "gluten-free"] }
    ]
  },

  "Vietnam (Hanoi & Ha Long)": {
    hotelArea: "Hanoi Old Quarter (walk to sights); an overnight cabin in Ha Long",
    transport: "Walk/Grab in Hanoi; book a shuttle + overnight boat for Ha Long Bay.",
    areas: [
      { zone: "Hanoi Old Quarter", spots: [
        { name: "Hoan Kiem Lake & Old Quarter walk", hrs: 2 },
        { name: "Temple of Literature", hrs: 1.5 },
        { name: "Water puppet show", hrs: 1 }
      ]},
      { zone: "Hanoi culture", spots: [
        { name: "Ho Chi Minh Mausoleum complex", hrs: 2 },
        { name: "Train Street coffee", hrs: 1 },
        { name: "Vietnamese cooking class", hrs: 3 }
      ]},
      { zone: "Ha Long Bay", spots: [
        { name: "Overnight bay cruise", hrs: 8 },
        { name: "Kayaking & caves", hrs: 2 },
        { name: "Sung Sot cave", hrs: 1.5 }
      ]}
    ],
    food: [
      { name: "Pho & banh mi street stall", meal: "lunch", cuisine: "Vietnamese", diet: ["vegetarian"] },
      { name: "Bun cha lunch", meal: "lunch", cuisine: "Vietnamese", diet: [] },
      { name: "Cruise seafood dinner", meal: "dinner", cuisine: "Seafood", diet: ["gluten-free"] }
    ]
  },

  "Santorini & Athens": {
    hotelArea: "Athens: Plaka/Monastiraki; Santorini: Oia or Fira for the views",
    transport: "Athens: metro + walking. Santorini: rent an ATV/car; ferry or flight between them.",
    areas: [
      { zone: "Athens", spots: [
        { name: "Acropolis & Parthenon", hrs: 2.5 },
        { name: "Acropolis Museum", hrs: 1.5 },
        { name: "Plaka & Monastiraki", hrs: 2 }
      ]},
      { zone: "Santorini villages", spots: [
        { name: "Oia sunset & castle", hrs: 2 },
        { name: "Fira to Firostefani walk", hrs: 2 },
        { name: "Winery tasting", hrs: 2 }
      ]},
      { zone: "Santorini by sea", spots: [
        { name: "Caldera catamaran cruise", hrs: 5 },
        { name: "Red Beach & Akrotiri", hrs: 2 },
        { name: "Amoudi Bay swim", hrs: 2 }
      ]}
    ],
    food: [
      { name: "Souvlaki / taverna", meal: "lunch", cuisine: "Greek", diet: ["vegetarian", "gluten-free"] },
      { name: "Bakery & Greek salad", meal: "lunch", cuisine: "Greek", diet: ["vegetarian", "vegan", "gluten-free"] },
      { name: "Oia dinner with caldera view", meal: "dinner", cuisine: "Mediterranean", diet: ["vegetarian", "vegan"] }
    ]
  },

  "Dubai": {
    hotelArea: "Downtown (Burj area) or Dubai Marina/JBR for the beach",
    transport: "Metro red line + taxis/Careem; some areas need a car. Lots of AC mall walkways.",
    areas: [
      { zone: "Downtown", spots: [
        { name: "Burj Khalifa At the Top", hrs: 1.5 },
        { name: "Dubai Mall & Fountain show", hrs: 3 },
        { name: "Dubai Aquarium", hrs: 1.5 }
      ]},
      { zone: "Old Dubai", spots: [
        { name: "Al Fahidi historic district", hrs: 1.5 },
        { name: "Gold & Spice Souks (abra ride)", hrs: 2 },
        { name: "Dubai Frame", hrs: 1 }
      ]},
      { zone: "Beach & desert", spots: [
        { name: "Desert safari & dune bashing", hrs: 5 },
        { name: "JBR Beach & Marina walk", hrs: 2 },
        { name: "Aquaventure waterpark", hrs: 5 }
      ]}
    ],
    food: [
      { name: "Arabic grill / mall food hall", meal: "lunch", cuisine: "Middle Eastern", diet: ["halal", "vegetarian", "vegan"] },
      { name: "Al Ustad Special Kabab", meal: "dinner", cuisine: "Persian / kebab", diet: ["halal"] },
      { name: "Marina seafood dinner", meal: "dinner", cuisine: "Seafood", diet: ["halal", "gluten-free"] }
    ]
  },

  "Amsterdam": {
    hotelArea: "Canal Ring / Jordaan — central and scenic",
    transport: "Walk or rent a bike; trams for longer hops. Train from Schiphol (~15 min).",
    areas: [
      { zone: "Museums", spots: [
        { name: "Rijksmuseum", hrs: 2.5 },
        { name: "Van Gogh Museum", hrs: 2 },
        { name: "Museumplein", hrs: 1 }
      ]},
      { zone: "Canals & centre", spots: [
        { name: "Canal cruise", hrs: 1.5 },
        { name: "Jordaan stroll", hrs: 2 },
        { name: "Anne Frank House", hrs: 1.5 }
      ]},
      { zone: "Markets & parks", spots: [
        { name: "Albert Cuyp Market", hrs: 1.5 },
        { name: "Vondelpark", hrs: 1.5 },
        { name: "Bloemenmarkt flower market", hrs: 1 }
      ]}
    ],
    food: [
      { name: "Foodhallen", meal: "lunch", cuisine: "International street food", diet: ["vegetarian", "vegan"] },
      { name: "Pancakes & stroopwafel stop", meal: "any", cuisine: "Dutch sweets", diet: ["vegetarian"] },
      { name: "Brown café dinner", meal: "dinner", cuisine: "Dutch", diet: ["vegetarian"] }
    ]
  }
};
