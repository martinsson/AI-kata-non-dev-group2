// Curated destination dataset for the travel concierge first version.
// Each destination is scored against the user's profile + trip parameters.
//
// climate:    one of "beach" (hot/sun), "warm", "mild", "cold"
// interests:  tags matching the profile interest checkboxes
// budgetLevel:1 = budget, 2 = mid, 3 = luxury (typical positioning)
// dailyCost:  rough per-person daily cost (USD) by budget style
// family:     1-5 how family-with-kids friendly
// diets:      diets that are easy to cater for here
// bestMonths: 1-12 sweet-spot months (weather + crowds)
// suggested:  recommended trip length range in days
// kids:       age suitability + age-appropriate activities
//   bestAges: well-suited age bands -> "toddler" (0-3), "child" (4-9), "teen" (10-17)
//   activities: [{ age: <band>, text }]  shown to families based on their kids' ages

const DESTINATIONS = [
  {
    name: "Lisbon", country: "Portugal", region: "Europe", airport: "LIS",
    climate: "mild", interests: ["culture", "food", "relaxation", "nightlife"],
    budgetLevel: 2, dailyCost: { budget: 70, mid: 130, luxury: 280 },
    family: 4, diets: ["vegetarian", "vegan", "gluten-free"],
    bestMonths: [4, 5, 6, 9, 10], suggested: [3, 5],
    blurb: "Sunny hills, tiles and seafood — walkable, affordable and great food.",
    kids: {
      bestAges: ["toddler", "child", "teen"],
      activities: [
        { age: "toddler", text: "Ride the vintage Tram 28 and toddle around Gulbenkian gardens" },
        { age: "child", text: "Oceanário de Lisboa, one of Europe's best aquariums" },
        { age: "teen", text: "Beginner surf lesson at Costa da Caparica, riverside biking" }
      ]
    }
  },
  {
    name: "Bali", country: "Indonesia", region: "Asia", airport: "DPS",
    climate: "beach", interests: ["nature", "relaxation", "adventure", "food"],
    budgetLevel: 1, dailyCost: { budget: 45, mid: 110, luxury: 300 },
    family: 4, diets: ["vegetarian", "vegan", "gluten-free", "halal"],
    bestMonths: [4, 5, 6, 7, 8, 9], suggested: [7, 12],
    blurb: "Rice terraces, beaches and temples; superb value and very veg-friendly.",
    kids: {
      bestAges: ["child", "teen"],
      activities: [
        { age: "toddler", text: "Family resort pools and calm beach clubs in Nusa Dua" },
        { age: "child", text: "Monkey Forest, gentle waterfalls and a beginner surf lesson" },
        { age: "teen", text: "Snorkeling, ATV rides and a sunrise volcano hike" }
      ]
    }
  },
  {
    name: "Kyoto", country: "Japan", region: "Asia", airport: "KIX",
    climate: "mild", interests: ["culture", "food", "nature"],
    budgetLevel: 2, dailyCost: { budget: 80, mid: 160, luxury: 360 },
    family: 4, diets: ["vegetarian", "vegan"],
    bestMonths: [3, 4, 10, 11], suggested: [4, 7],
    blurb: "Temples, gardens and refined cuisine — magical in cherry-blossom and autumn.",
    kids: {
      bestAges: ["child", "teen"],
      activities: [
        { age: "toddler", text: "Strollers welcome in the big temple gardens and koi ponds" },
        { age: "child", text: "Kyoto Railway Museum and the Arashiyama monkey park" },
        { age: "teen", text: "Kimono rental, bamboo grove, day trip to feed Nara's deer" }
      ]
    }
  },
  {
    name: "Reykjavik & South Coast", country: "Iceland", region: "Europe", airport: "KEF",
    climate: "cold", interests: ["nature", "adventure", "relaxation"],
    budgetLevel: 3, dailyCost: { budget: 120, mid: 220, luxury: 450 },
    family: 4, diets: ["gluten-free", "vegetarian"],
    bestMonths: [6, 7, 8, 9, 2, 3], suggested: [4, 8],
    blurb: "Waterfalls, geysers, hot springs and northern lights — wild and otherworldly.",
    kids: {
      bestAges: ["child", "teen"],
      activities: [
        { age: "toddler", text: "Warm geothermal pools — but expect long drives between sights" },
        { age: "child", text: "Whale watching and the erupting Strokkur geyser" },
        { age: "teen", text: "Glacier hike, snorkeling at Silfra and ice-cave tours" }
      ]
    }
  },
  {
    name: "Barcelona", country: "Spain", region: "Europe", airport: "BCN",
    climate: "warm", interests: ["culture", "food", "nightlife", "relaxation"],
    budgetLevel: 2, dailyCost: { budget: 75, mid: 140, luxury: 300 },
    family: 4, diets: ["vegetarian", "vegan", "gluten-free", "halal"],
    bestMonths: [5, 6, 9, 10], suggested: [3, 5],
    blurb: "Gaudí, tapas and city beaches — culture and seaside in one trip.",
    kids: {
      bestAges: ["toddler", "child", "teen"],
      activities: [
        { age: "toddler", text: "Ciutadella park boats and easy city beaches" },
        { age: "child", text: "L'Aquàrium and the Tibidabo hilltop amusement park" },
        { age: "teen", text: "City bike tour, beach time and the FC Barcelona stadium" }
      ]
    }
  },
  {
    name: "Marrakech", country: "Morocco", region: "Africa", airport: "RAK",
    climate: "warm", interests: ["culture", "food", "relaxation"],
    budgetLevel: 1, dailyCost: { budget: 50, mid: 110, luxury: 280 },
    family: 3, diets: ["halal", "vegetarian"],
    bestMonths: [3, 4, 5, 10, 11], suggested: [3, 5],
    blurb: "Souks, riads and desert excursions — sensory, exotic and good value.",
    kids: {
      bestAges: ["child", "teen"],
      activities: [
        { age: "toddler", text: "Quiet riad with a pool — the crowded souks can overwhelm little ones" },
        { age: "child", text: "Camel ride and the colourful Majorelle Garden" },
        { age: "teen", text: "Quad biking in the desert and a hands-on tagine cooking class" }
      ]
    }
  },
  {
    name: "Costa Rica", country: "Costa Rica", region: "Americas", airport: "SJO",
    climate: "beach", interests: ["nature", "adventure", "relaxation"],
    budgetLevel: 2, dailyCost: { budget: 70, mid: 150, luxury: 320 },
    family: 5, diets: ["vegetarian", "vegan", "gluten-free"],
    bestMonths: [12, 1, 2, 3, 4], suggested: [7, 12],
    blurb: "Rainforest, volcanoes, wildlife and beaches — a dream for active families.",
    kids: {
      bestAges: ["toddler", "child", "teen"],
      activities: [
        { age: "toddler", text: "Calm beaches plus easy sloth and wildlife spotting" },
        { age: "child", text: "Gentle rainforest walks, butterfly gardens, hot springs" },
        { age: "teen", text: "Ziplining, white-water rafting and surf lessons" }
      ]
    }
  },
  {
    name: "Rome", country: "Italy", region: "Europe", airport: "FCO",
    climate: "warm", interests: ["culture", "food"],
    budgetLevel: 2, dailyCost: { budget: 80, mid: 150, luxury: 320 },
    family: 4, diets: ["vegetarian", "gluten-free"],
    bestMonths: [4, 5, 6, 9, 10], suggested: [3, 5],
    blurb: "Ancient history, piazzas and pasta at every corner.",
    kids: {
      bestAges: ["child", "teen"],
      activities: [
        { age: "toddler", text: "Boat rides and play areas in Villa Borghese park" },
        { age: "child", text: "Gladiator School and the Explora children's museum" },
        { age: "teen", text: "Colosseum tour, a gelato crawl and the Vatican" }
      ]
    }
  },
  {
    name: "Thailand (Bangkok & islands)", country: "Thailand", region: "Asia", airport: "BKK",
    climate: "beach", interests: ["food", "relaxation", "nightlife", "nature"],
    budgetLevel: 1, dailyCost: { budget: 40, mid: 100, luxury: 280 },
    family: 4, diets: ["vegetarian", "vegan", "halal", "gluten-free"],
    bestMonths: [11, 12, 1, 2, 3], suggested: [7, 14],
    blurb: "Street food, temples and turquoise islands — unbeatable value.",
    kids: {
      bestAges: ["child", "teen"],
      activities: [
        { age: "toddler", text: "Resort pools and shallow island bays (mind the heat and long flight)" },
        { age: "child", text: "Ethical elephant sanctuary and easy snorkeling" },
        { age: "teen", text: "Island hopping, sea kayaking and lively night markets" }
      ]
    }
  },
  {
    name: "Zermatt", country: "Switzerland", region: "Europe", airport: "ZRH",
    climate: "cold", interests: ["nature", "adventure", "relaxation"],
    budgetLevel: 3, dailyCost: { budget: 140, mid: 260, luxury: 550 },
    family: 4, diets: ["vegetarian", "gluten-free"],
    bestMonths: [1, 2, 3, 7, 8, 12], suggested: [4, 7],
    blurb: "The Matterhorn, world-class skiing in winter and alpine hikes in summer.",
    kids: {
      bestAges: ["child", "teen"],
      activities: [
        { age: "toddler", text: "Gentle snow play near the village (high altitude tires little ones)" },
        { age: "child", text: "Gornergrat cog railway and sledging runs" },
        { age: "teen", text: "Ski/snowboard lessons and the Matterhorn Glacier Paradise" }
      ]
    }
  },
  {
    name: "Riviera Maya", country: "Mexico", region: "Americas", airport: "CUN",
    climate: "beach", interests: ["relaxation", "nature", "nightlife", "food"],
    budgetLevel: 2, dailyCost: { budget: 65, mid: 150, luxury: 380 },
    family: 4, diets: ["vegetarian", "vegan", "gluten-free"],
    bestMonths: [11, 12, 1, 2, 3, 4], suggested: [5, 9],
    blurb: "Caribbean beaches, cenotes and Mayan ruins — easy all-inclusive options.",
    kids: {
      bestAges: ["toddler", "child", "teen"],
      activities: [
        { age: "toddler", text: "Calm Caribbean beaches and all-inclusive resort pools" },
        { age: "child", text: "Swim in a cenote and explore the Xcaret nature park" },
        { age: "teen", text: "Reef snorkeling, scuba intro and the Tulum cliff ruins" }
      ]
    }
  },
  {
    name: "Vietnam (Hanoi & Ha Long)", country: "Vietnam", region: "Asia", airport: "HAN",
    climate: "warm", interests: ["culture", "food", "nature", "adventure"],
    budgetLevel: 1, dailyCost: { budget: 40, mid: 95, luxury: 250 },
    family: 3, diets: ["vegetarian", "vegan"],
    bestMonths: [3, 4, 10, 11], suggested: [8, 14],
    blurb: "Bustling old quarters, limestone bays and incredible cheap food.",
    kids: {
      bestAges: ["child", "teen"],
      activities: [
        { age: "toddler", text: "Best with a stroller-friendly base — Hanoi traffic is intense" },
        { age: "child", text: "Ha Long Bay cruise and a water-puppet show" },
        { age: "teen", text: "Kayaking the bay, cycling Ninh Binh and a street-food tour" }
      ]
    }
  },
  {
    name: "Santorini & Athens", country: "Greece", region: "Europe", airport: "ATH",
    climate: "beach", interests: ["relaxation", "culture", "food", "nightlife"],
    budgetLevel: 2, dailyCost: { budget: 80, mid: 170, luxury: 420 },
    family: 3, diets: ["vegetarian", "vegan", "gluten-free"],
    bestMonths: [5, 6, 9, 10], suggested: [5, 8],
    blurb: "Whitewashed caldera views plus ancient Athens — iconic for couples.",
    kids: {
      bestAges: ["child", "teen"],
      activities: [
        { age: "toddler", text: "Caldera cliffs and stepped paths make this tough with toddlers" },
        { age: "child", text: "Acropolis explore and easy red/black-sand beaches" },
        { age: "teen", text: "Catamaran cruise and a hike to the volcano hot springs" }
      ]
    }
  },
  {
    name: "Dubai", country: "UAE", region: "Asia", airport: "DXB",
    climate: "warm", interests: ["relaxation", "nightlife", "food", "adventure"],
    budgetLevel: 3, dailyCost: { budget: 110, mid: 230, luxury: 600 },
    family: 4, diets: ["halal", "vegetarian", "vegan", "gluten-free"],
    bestMonths: [11, 12, 1, 2, 3], suggested: [3, 6],
    blurb: "Skyscrapers, desert safaris and beaches — polished and very family-equipped.",
    kids: {
      bestAges: ["toddler", "child", "teen"],
      activities: [
        { age: "toddler", text: "Resort kids' clubs, shaded pools and the aquarium walk-through" },
        { age: "child", text: "Aquaventure waterpark and the Dubai Aquarium" },
        { age: "teen", text: "Desert safari, Ski Dubai and the big theme parks" }
      ]
    }
  },
  {
    name: "Amsterdam", country: "Netherlands", region: "Europe", airport: "AMS",
    climate: "mild", interests: ["culture", "nightlife", "food"],
    budgetLevel: 2, dailyCost: { budget: 85, mid: 160, luxury: 330 },
    family: 3, diets: ["vegetarian", "vegan", "gluten-free"],
    bestMonths: [4, 5, 6, 9], suggested: [2, 4],
    blurb: "Canals, world-class museums and bikes everywhere.",
    kids: {
      bestAges: ["child", "teen"],
      activities: [
        { age: "toddler", text: "Vondelpark playgrounds and a gentle canal boat ride" },
        { age: "child", text: "NEMO Science Museum and the Artis zoo" },
        { age: "teen", text: "Family bike tour and the Anne Frank House" }
      ]
    }
  }
];

// Map coordinates [lat, lng] per destination, keyed by name (for the Leaflet map).
const COORDS = {
  "Lisbon": [38.7223, -9.1393],
  "Bali": [-8.4095, 115.1889],
  "Kyoto": [35.0116, 135.7681],
  "Reykjavik & South Coast": [64.1466, -21.9426],
  "Barcelona": [41.3851, 2.1734],
  "Marrakech": [31.6295, -7.9811],
  "Costa Rica": [9.7489, -83.7534],
  "Rome": [41.9028, 12.4964],
  "Thailand (Bangkok & islands)": [13.7563, 100.5018],
  "Zermatt": [46.0207, 7.7491],
  "Riviera Maya": [20.6296, -87.0739],
  "Vietnam (Hanoi & Ha Long)": [21.0278, 105.8342],
  "Santorini & Athens": [36.3932, 25.4615],
  "Dubai": [25.2048, 55.2708],
  "Amsterdam": [52.3676, 4.9041]
};

// Rough round-trip economy flight estimate (USD/person) by origin region -> dest region.
const FLIGHT_MATRIX = {
  Europe:   { Europe: 150, Africa: 300, Asia: 700, Americas: 650 },
  Americas: { Europe: 650, Africa: 900, Asia: 950, Americas: 350 },
  Asia:     { Europe: 700, Africa: 700, Asia: 250, Americas: 950 },
  Africa:   { Europe: 300, Africa: 350, Asia: 700, Americas: 900 }
};
