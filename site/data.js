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

const DESTINATIONS = [
  {
    name: "Lisbon", country: "Portugal", region: "Europe", airport: "LIS",
    climate: "mild", interests: ["culture", "food", "relaxation", "nightlife"],
    budgetLevel: 2, dailyCost: { budget: 70, mid: 130, luxury: 280 },
    family: 4, diets: ["vegetarian", "vegan", "gluten-free"],
    bestMonths: [4, 5, 6, 9, 10], suggested: [3, 5],
    blurb: "Sunny hills, tiles and seafood — walkable, affordable and great food."
  },
  {
    name: "Bali", country: "Indonesia", region: "Asia", airport: "DPS",
    climate: "beach", interests: ["nature", "relaxation", "adventure", "food"],
    budgetLevel: 1, dailyCost: { budget: 45, mid: 110, luxury: 300 },
    family: 4, diets: ["vegetarian", "vegan", "gluten-free", "halal"],
    bestMonths: [4, 5, 6, 7, 8, 9], suggested: [7, 12],
    blurb: "Rice terraces, beaches and temples; superb value and very veg-friendly."
  },
  {
    name: "Kyoto", country: "Japan", region: "Asia", airport: "KIX",
    climate: "mild", interests: ["culture", "food", "nature"],
    budgetLevel: 2, dailyCost: { budget: 80, mid: 160, luxury: 360 },
    family: 4, diets: ["vegetarian", "vegan"],
    bestMonths: [3, 4, 10, 11], suggested: [4, 7],
    blurb: "Temples, gardens and refined cuisine — magical in cherry-blossom and autumn."
  },
  {
    name: "Reykjavik & South Coast", country: "Iceland", region: "Europe", airport: "KEF",
    climate: "cold", interests: ["nature", "adventure", "relaxation"],
    budgetLevel: 3, dailyCost: { budget: 120, mid: 220, luxury: 450 },
    family: 4, diets: ["gluten-free", "vegetarian"],
    bestMonths: [6, 7, 8, 9, 2, 3], suggested: [4, 8],
    blurb: "Waterfalls, geysers, hot springs and northern lights — wild and otherworldly."
  },
  {
    name: "Barcelona", country: "Spain", region: "Europe", airport: "BCN",
    climate: "warm", interests: ["culture", "food", "nightlife", "relaxation"],
    budgetLevel: 2, dailyCost: { budget: 75, mid: 140, luxury: 300 },
    family: 4, diets: ["vegetarian", "vegan", "gluten-free", "halal"],
    bestMonths: [5, 6, 9, 10], suggested: [3, 5],
    blurb: "Gaudí, tapas and city beaches — culture and seaside in one trip."
  },
  {
    name: "Marrakech", country: "Morocco", region: "Africa", airport: "RAK",
    climate: "warm", interests: ["culture", "food", "relaxation"],
    budgetLevel: 1, dailyCost: { budget: 50, mid: 110, luxury: 280 },
    family: 3, diets: ["halal", "vegetarian"],
    bestMonths: [3, 4, 5, 10, 11], suggested: [3, 5],
    blurb: "Souks, riads and desert excursions — sensory, exotic and good value."
  },
  {
    name: "Costa Rica", country: "Costa Rica", region: "Americas", airport: "SJO",
    climate: "beach", interests: ["nature", "adventure", "relaxation"],
    budgetLevel: 2, dailyCost: { budget: 70, mid: 150, luxury: 320 },
    family: 5, diets: ["vegetarian", "vegan", "gluten-free"],
    bestMonths: [12, 1, 2, 3, 4], suggested: [7, 12],
    blurb: "Rainforest, volcanoes, wildlife and beaches — a dream for active families."
  },
  {
    name: "Rome", country: "Italy", region: "Europe", airport: "FCO",
    climate: "warm", interests: ["culture", "food"],
    budgetLevel: 2, dailyCost: { budget: 80, mid: 150, luxury: 320 },
    family: 4, diets: ["vegetarian", "gluten-free"],
    bestMonths: [4, 5, 6, 9, 10], suggested: [3, 5],
    blurb: "Ancient history, piazzas and pasta at every corner."
  },
  {
    name: "Thailand (Bangkok & islands)", country: "Thailand", region: "Asia", airport: "BKK",
    climate: "beach", interests: ["food", "relaxation", "nightlife", "nature"],
    budgetLevel: 1, dailyCost: { budget: 40, mid: 100, luxury: 280 },
    family: 4, diets: ["vegetarian", "vegan", "halal", "gluten-free"],
    bestMonths: [11, 12, 1, 2, 3], suggested: [7, 14],
    blurb: "Street food, temples and turquoise islands — unbeatable value."
  },
  {
    name: "Zermatt", country: "Switzerland", region: "Europe", airport: "ZRH",
    climate: "cold", interests: ["nature", "adventure", "relaxation"],
    budgetLevel: 3, dailyCost: { budget: 140, mid: 260, luxury: 550 },
    family: 4, diets: ["vegetarian", "gluten-free"],
    bestMonths: [1, 2, 3, 7, 8, 12], suggested: [4, 7],
    blurb: "The Matterhorn, world-class skiing in winter and alpine hikes in summer."
  },
  {
    name: "Riviera Maya", country: "Mexico", region: "Americas", airport: "CUN",
    climate: "beach", interests: ["relaxation", "nature", "nightlife", "food"],
    budgetLevel: 2, dailyCost: { budget: 65, mid: 150, luxury: 380 },
    family: 4, diets: ["vegetarian", "vegan", "gluten-free"],
    bestMonths: [11, 12, 1, 2, 3, 4], suggested: [5, 9],
    blurb: "Caribbean beaches, cenotes and Mayan ruins — easy all-inclusive options."
  },
  {
    name: "Vietnam (Hanoi & Ha Long)", country: "Vietnam", region: "Asia", airport: "HAN",
    climate: "warm", interests: ["culture", "food", "nature", "adventure"],
    budgetLevel: 1, dailyCost: { budget: 40, mid: 95, luxury: 250 },
    family: 3, diets: ["vegetarian", "vegan"],
    bestMonths: [3, 4, 10, 11], suggested: [8, 14],
    blurb: "Bustling old quarters, limestone bays and incredible cheap food."
  },
  {
    name: "Santorini & Athens", country: "Greece", region: "Europe", airport: "ATH",
    climate: "beach", interests: ["relaxation", "culture", "food", "nightlife"],
    budgetLevel: 2, dailyCost: { budget: 80, mid: 170, luxury: 420 },
    family: 3, diets: ["vegetarian", "vegan", "gluten-free"],
    bestMonths: [5, 6, 9, 10], suggested: [5, 8],
    blurb: "Whitewashed caldera views plus ancient Athens — iconic for couples."
  },
  {
    name: "Dubai", country: "UAE", region: "Asia", airport: "DXB",
    climate: "warm", interests: ["relaxation", "nightlife", "food", "adventure"],
    budgetLevel: 3, dailyCost: { budget: 110, mid: 230, luxury: 600 },
    family: 4, diets: ["halal", "vegetarian", "vegan", "gluten-free"],
    bestMonths: [11, 12, 1, 2, 3], suggested: [3, 6],
    blurb: "Skyscrapers, desert safaris and beaches — polished and very family-equipped."
  },
  {
    name: "Amsterdam", country: "Netherlands", region: "Europe", airport: "AMS",
    climate: "mild", interests: ["culture", "nightlife", "food"],
    budgetLevel: 2, dailyCost: { budget: 85, mid: 160, luxury: 330 },
    family: 3, diets: ["vegetarian", "vegan", "gluten-free"],
    bestMonths: [4, 5, 6, 9], suggested: [2, 4],
    blurb: "Canals, world-class museums and bikes everywhere."
  }
];

// Rough round-trip economy flight estimate (USD/person) by origin region -> dest region.
const FLIGHT_MATRIX = {
  Europe:   { Europe: 150, Africa: 300, Asia: 700, Americas: 650 },
  Americas: { Europe: 650, Africa: 900, Asia: 950, Americas: 350 },
  Asia:     { Europe: 700, Africa: 700, Asia: 250, Americas: 950 },
  Africa:   { Europe: 300, Africa: 350, Asia: 700, Americas: 900 }
};
