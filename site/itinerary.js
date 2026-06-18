// Itinerary generator + export helpers.
// Builds a day-by-day schedule from PLANS data and the user's scheduling
// preferences (eating hours, pace, minimise daily travel).

const PACE = {
  relaxed:  { morning: 1, afternoon: 1 },
  balanced: { morning: 1, afternoon: 2 },
  packed:   { morning: 2, afternoon: 2 }
};

function addMinutes(hhmm, mins) {
  const [h, m] = hhmm.split(":").map(Number);
  let tot = h * 60 + m + mins;
  tot = ((tot % 1440) + 1440) % 1440;
  const hh = Math.floor(tot / 60);
  const mm = tot % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

function timeRange(start, hrs) {
  return `${start}–${addMinutes(start, Math.round(hrs * 60))}`;
}

// Pick restaurants for a meal, preferring those that match the diet.
function foodPool(food, meal, diet) {
  let pool = food.filter((f) => f.meal === meal || f.meal === "any");
  if (!pool.length) pool = food.slice();
  if (diet && diet !== "none") {
    const match = pool.filter((f) => (f.diet || []).includes(diet));
    if (match.length) pool = match;
  }
  return pool;
}

// Generic fallback if a destination has no curated plan.
function genericPlan(dest) {
  return {
    hotelArea: "A central, well-reviewed neighbourhood",
    transport: "Use local transit/taxis and group sights by area to cut travel time.",
    areas: [
      { zone: "City highlights", spots: [
        { name: "Old town & main square walk", hrs: 2 },
        { name: "Top museum or landmark", hrs: 2 },
        { name: "Local market", hrs: 1.5 }
      ]},
      { zone: "Nature & views", spots: [
        { name: "Best viewpoint / park", hrs: 2 },
        { name: "Half-day nature excursion", hrs: 4 }
      ]},
      { zone: "Local life", spots: [
        { name: "Neighbourhood stroll", hrs: 2 },
        { name: "Cultural site or gallery", hrs: 2 }
      ]}
    ],
    food: [
      { name: "Popular local restaurant", meal: "lunch", cuisine: "Local", diet: ["vegetarian", "vegan", "halal", "gluten-free"] },
      { name: "Highly-rated dinner spot", meal: "dinner", cuisine: "Local", diet: ["vegetarian", "gluten-free"] }
    ]
  };
}

// opts: { days, start, lunch, dinner, pace, minimizeTravel, diet }
function buildItinerary(dest, opts) {
  const plan = PLANS[dest.name] || genericPlan(dest);
  const days = Math.max(1, Math.min(21, opts.days ||
    Math.round((dest.suggested[0] + dest.suggested[1]) / 2)));
  const pace = PACE[opts.pace] || PACE.balanced;

  const zones = plan.areas.map((z) => ({ zone: z.zone, spots: z.spots.slice() }));
  const flat = zones.flatMap((z) => z.spots.map((s) => ({ ...s, zone: z.zone })));
  let flatIdx = 0;
  const takeFlat = () => (flat.length ? flat[flatIdx++ % flat.length] : null);

  const lunchPool = foodPool(plan.food, "lunch", opts.diet);
  const dinnerPool = foodPool(plan.food, "dinner", opts.diet);
  let li = 0, di = 0;
  const nextLunch = () => (lunchPool.length ? lunchPool[li++ % lunchPool.length] : null);
  const nextDinner = () => (dinnerPool.length ? dinnerPool[di++ % dinnerPool.length] : null);

  const schedule = [];
  for (let d = 0; d < days; d++) {
    const z = zones[d % zones.length];
    const useZone = opts.minimizeTravel && z;
    const dayZone = useZone ? z.zone : "Across the city";
    const zoneSpots = useZone ? z.spots.slice() : [];
    const usedToday = new Set();
    const grab = () => {
      if (useZone && zoneSpots.length) {
        const s = zoneSpots.shift();
        usedToday.add(s.name);
        return s;
      }
      // Fall back to the flat pool, skipping anything already used today.
      for (let tries = 0; tries < flat.length; tries++) {
        const s = takeFlat();
        if (s && !usedToday.has(s.name)) { usedToday.add(s.name); return s; }
      }
      return null;
    };

    const blocks = [];
    let t = opts.start || "09:00";

    for (let k = 0; k < pace.morning; k++) {
      const s = grab();
      if (!s) break;
      blocks.push({ time: timeRange(t, s.hrs), type: "activity", title: s.name, meta: `~${s.hrs}h` });
      t = addMinutes(t, Math.round(s.hrs * 60) + 15);
    }

    const l = nextLunch();
    blocks.push({ time: opts.lunch, type: "meal", title: l ? l.name : "Lunch", meta: l ? `Lunch · ${l.cuisine}` : "Lunch" });
    t = addMinutes(opts.lunch, 75);
    if (t < (opts.start || "09:00")) t = addMinutes(opts.lunch, 75);

    for (let k = 0; k < pace.afternoon; k++) {
      const s = grab();
      if (!s) break;
      blocks.push({ time: timeRange(t, s.hrs), type: "activity", title: s.name, meta: `~${s.hrs}h` });
      t = addMinutes(t, Math.round(s.hrs * 60) + 15);
    }

    const dn = nextDinner();
    blocks.push({ time: opts.dinner, type: "meal", title: dn ? dn.name : "Dinner", meta: dn ? `Dinner · ${dn.cuisine}` : "Dinner" });

    schedule.push({ day: d + 1, zone: dayZone, blocks });
  }

  return {
    destName: dest.name,
    country: dest.country,
    days,
    hotelArea: plan.hotelArea,
    transport: plan.transport,
    prefs: { ...opts },
    schedule
  };
}

// Plain-text/markdown version for copy / download / email / share.
function itineraryToText(itin) {
  const p = itin.prefs;
  const lines = [];
  lines.push(`TRIP TO ${itin.destName.toUpperCase()}, ${itin.country} — ${itin.days} days`);
  lines.push("");
  lines.push(`Where to stay: ${itin.hotelArea}`);
  lines.push(`Getting around: ${itin.transport}`);
  const prefBits = [`lunch ~${p.lunch}`, `dinner ~${p.dinner}`, `${p.pace} pace`];
  if (p.minimizeTravel) prefBits.push("minimal daily travel");
  if (p.diet && p.diet !== "none") prefBits.push(`${p.diet} food`);
  lines.push(`Preferences: ${prefBits.join(", ")}`);
  lines.push("");

  itin.schedule.forEach((day) => {
    lines.push(`DAY ${day.day} — ${day.zone}`);
    day.blocks.forEach((b) => {
      const tag = b.type === "meal" ? "🍽" : "•";
      lines.push(`  ${b.time}  ${tag} ${b.title}${b.meta ? `  (${b.meta})` : ""}`);
    });
    lines.push("");
  });

  lines.push("— Planned with Trip Concierge");
  return lines.join("\n");
}
