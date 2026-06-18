// Travel concierge — first version logic.
// State: a persisted profile (asked once) + per-trip parameters (few questions).

const MONTHS = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun",
                "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

// Last search context + the currently open itinerary, for the modal/exports.
let CTX = null;
let CURRENT_ITIN = null;
let CURRENT_DEST = null;
let CURRENT_AI_TEXT = null;

// Leaflet map state.
let MAP = null;
let MAP_MARKERS = [];

/* ---------------- Profile persistence ---------------- */

function loadProfile() {
  try { return JSON.parse(localStorage.getItem("tc_profile")) || null; }
  catch { return null; }
}

// Read the current profile form values (without persisting).
function readFormProfile() {
  const children = parseInt($("#children").value, 10) || 0;
  return {
    travellers: $("#travellers").value,
    adults: parseInt($("#adults").value, 10) || 1,
    children,
    childrenAges: readAges(children),
    budget: $("#budget").value,
    climate: $("#climate").value,
    origin: $("#origin").value,
    diet: $("#diet").value,
    interests: $$(".interest:checked").map((c) => c.value)
  };
}

function saveProfile() {
  const profile = readFormProfile();
  localStorage.setItem("tc_profile", JSON.stringify(profile));
  flash("Profile saved — you won't be asked these again.");
  return profile;
}

function applyProfile(p) {
  if (!p) return;
  $("#travellers").value = p.travellers ?? "couple";
  $("#adults").value = p.adults ?? 2;
  $("#children").value = p.children ?? 0;
  $("#budget").value = p.budget ?? "mid";
  $("#climate").value = p.climate ?? "any";
  $("#origin").value = p.origin ?? "Europe";
  $("#diet").value = p.diet ?? "none";
  $$(".interest").forEach((c) => { c.checked = (p.interests || []).includes(c.value); });
  renderAgeInputs(p.children ?? 0, p.childrenAges || []);
}

/* ---------------- Children's ages ---------------- */

const AGE_BANDS = { toddler: "0-3", child: "4-9", teen: "10-17" };

function ageBand(age) {
  if (age <= 3) return "toddler";
  if (age <= 9) return "child";
  if (age <= 17) return "teen";
  return null; // 18+ counted as an adult, ignored for kid logic
}

function bandLabel(band) {
  return { toddler: "toddler", child: "child", teen: "teen" }[band] || band;
}

function renderAgeInputs(count, existing = []) {
  const row = $("#ages-row");
  const wrap = $("#ages-inputs");
  wrap.innerHTML = "";
  if (!count || count < 1) { row.hidden = true; return; }
  row.hidden = false;
  for (let i = 0; i < count; i++) {
    const input = document.createElement("input");
    input.type = "number";
    input.min = "0";
    input.max = "17";
    input.className = "age-input";
    input.placeholder = "age";
    input.value = existing[i] != null ? existing[i] : "";
    wrap.appendChild(input);
  }
}

function readAges(count) {
  return $$(".age-input")
    .slice(0, count)
    .map((el) => parseInt(el.value, 10))
    .filter((n) => Number.isFinite(n) && n >= 0 && n <= 17);
}

function childBands(profile) {
  return [...new Set((profile.childrenAges || []).map(ageBand).filter(Boolean))];
}

/* ---------------- Recommendation engine ---------------- */

function budgetWord(level) { return ["", "budget", "mid", "luxury"][level]; }
function budgetToLevel(word) { return { budget: 1, mid: 2, luxury: 3 }[word] || 2; }

function scoreDestination(dest, profile, trip) {
  let score = 0;
  const reasons = [];

  // Climate
  if (profile.climate === "any" || profile.climate === dest.climate) {
    score += 3;
    if (profile.climate !== "any") reasons.push(`${dest.climate} climate you wanted`);
  } else if (
    (profile.climate === "beach" && dest.climate === "warm") ||
    (profile.climate === "warm" && dest.climate === "beach")
  ) {
    score += 1;
  }

  // Interests overlap
  const overlap = (profile.interests || []).filter((i) => dest.interests.includes(i));
  score += overlap.length * 2;
  if (overlap.length) reasons.push(`great for ${overlap.join(", ")}`);

  // Budget fit
  const want = budgetToLevel(profile.budget);
  const diff = Math.abs(want - dest.budgetLevel);
  score += diff === 0 ? 3 : diff === 1 ? 1 : -1;

  // Family / travellers
  if (profile.travellers === "family") {
    if (dest.family >= 4) { score += 3; reasons.push("very family-friendly"); }
    else if (dest.family <= 2) { score -= 2; }
    if (profile.children > 0 && dest.family >= 4) score += 1;

    // Age-band fit: reward destinations suited to the kids' ages
    const bands = childBands(profile);
    const best = (dest.kids && dest.kids.bestAges) || [];
    bands.forEach((b) => {
      if (best.includes(b)) { score += 2; }
      else { score -= 1; }
    });
    if (bands.length && bands.every((b) => best.includes(b))) {
      reasons.push(`well suited to your kids (${bands.map(bandLabel).join(", ")})`);
    }

    // Long-haul caution for toddlers
    const flightPer = (FLIGHT_MATRIX[profile.origin] || {})[dest.region] ?? 600;
    if (bands.includes("toddler") && flightPer >= 650) score -= 2;
  } else if (profile.travellers === "couple" && dest.interests.includes("relaxation")) {
    score += 1;
  } else if (profile.travellers === "solo" && dest.interests.includes("culture")) {
    score += 1;
  }

  // Diet
  if (profile.diet !== "none") {
    if (dest.diets.includes(profile.diet)) { score += 2; reasons.push(`easy ${profile.diet} options`); }
    else { score -= 2; }
  }

  // Timeframe / month
  if (trip.month) {
    if (dest.bestMonths.includes(trip.month)) {
      score += 3; reasons.push(`ideal in ${MONTHS[trip.month]}`);
    } else { score -= 1; }
  }

  // Duration fit
  if (trip.days) {
    const [lo, hi] = dest.suggested;
    if (trip.days < lo - 1) { score -= 1; }
    else if (trip.days >= lo && trip.days <= hi) { score += 1; }
  }

  // Country filter (hard preference, not a hard filter)
  if (trip.country) {
    const q = trip.country.toLowerCase();
    if (dest.country.toLowerCase().includes(q) || dest.name.toLowerCase().includes(q)) {
      score += 8; reasons.push("matches the country you asked for");
    }
  }

  return { score, reasons };
}

// Age-appropriate activities + cautions for the family's actual kids.
function familyInsights(dest, profile) {
  if (profile.travellers !== "family") return null;
  const bands = childBands(profile);
  if (!bands.length) return null;

  const all = (dest.kids && dest.kids.activities) || [];
  const activities = all.filter((a) => bands.includes(a.age));

  const cautions = [];
  const best = (dest.kids && dest.kids.bestAges) || [];
  bands.forEach((b) => {
    if (!best.includes(b)) cautions.push(`Less ideal for a ${bandLabel(b)} — see the note above.`);
  });
  const flightPer = (FLIGHT_MATRIX[profile.origin] || {})[dest.region] ?? 600;
  if (bands.includes("toddler") && flightPer >= 650) {
    cautions.push("Long-haul flight — tough with a toddler; consider breaking the journey.");
  }

  const agesLabel = (profile.childrenAges || []).join(", ");
  return { activities, cautions: [...new Set(cautions)], agesLabel };
}

function estimateCost(dest, profile, trip) {
  const people = (profile.adults || 1) + (profile.children || 0);
  const days = trip.days || Math.round((dest.suggested[0] + dest.suggested[1]) / 2);
  const perDay = dest.dailyCost[profile.budget] || dest.dailyCost.mid;
  const land = perDay * days * people;
  const flightPer = (FLIGHT_MATRIX[profile.origin] || {})[dest.region] ?? 600;
  const flights = flightPer * people;
  return { days, people, land, flights, total: land + flights, perPerson: Math.round((land + flights) / people) };
}

/* ---------------- Booking deep links ---------------- */

function tripDates(trip, days) {
  // Build checkin/checkout if a month is chosen; default to next suitable month.
  const now = new Date();
  let year = now.getFullYear();
  let month = trip.month || (now.getMonth() + 2); // default ~next month
  if (month <= now.getMonth() + 1 && (trip.month ? trip.month <= now.getMonth() + 1 : false)) year += 1;
  if (!trip.month && month > 12) { month -= 12; year += 1; }
  const checkin = new Date(year, (month - 1), 12);
  const checkout = new Date(checkin); checkout.setDate(checkout.getDate() + days);
  const fmt = (d) => d.toISOString().slice(0, 10);
  return { checkin: fmt(checkin), checkout: fmt(checkout) };
}

function bookingLinks(dest, profile, trip, cost) {
  const { checkin, checkout } = tripDates(trip, cost.days);
  const q = encodeURIComponent(`${dest.name}, ${dest.country}`);

  const hotels = `https://www.booking.com/searchresults.html?ss=${q}` +
    `&checkin=${checkin}&checkout=${checkout}` +
    `&group_adults=${profile.adults || 1}&group_children=${profile.children || 0}&no_rooms=1`;

  const flights = `https://www.google.com/travel/flights?q=` +
    encodeURIComponent(`Flights to ${dest.name} ${checkin} to ${checkout}`);

  const activities = `https://www.getyourguide.com/s/?q=${q}`;

  return { hotels, flights, activities, checkin, checkout };
}

/* ---------------- Per-trip overrides ---------------- */

// Each mood swaps the interests used for scoring (this trip only).
const MOODS = {
  relax: ["relaxation", "food"],
  adventure: ["adventure", "nature"],
  culture: ["culture", "food"],
  party: ["nightlife", "food"]
};

function readOverrides() {
  return {
    budget: $("#ov-budget").value,
    mood: $("#ov-mood").value,
    climate: $("#ov-climate").value,
    adultsOnly: $("#ov-adults-only").checked
  };
}

// Layer trip overrides on top of the baseline profile — without mutating it.
function applyOverrides(base, ov) {
  const eff = {
    ...base,
    childrenAges: [...(base.childrenAges || [])],
    interests: [...(base.interests || [])]
  };
  if (ov.budget) eff.budget = ov.budget;
  if (ov.climate) eff.climate = ov.climate;
  if (ov.mood && MOODS[ov.mood]) eff.interests = [...MOODS[ov.mood]];
  if (ov.adultsOnly) {
    eff.children = 0;
    eff.childrenAges = [];
    eff.travellers = (base.adults || 1) > 1 ? "couple" : "solo";
  }
  return eff;
}

// Human-readable chips describing which overrides are active.
function overrideSummary(ov) {
  const out = [];
  if (ov.budget) out.push(`budget: ${ov.budget}`);
  if (ov.mood) out.push(`mood: ${ov.mood}`);
  if (ov.climate) out.push(`climate: ${ov.climate}`);
  if (ov.adultsOnly) out.push("adults only");
  return out;
}

/* ---------------- Rendering ---------------- */

function recommend() {
  const overrides = readOverrides();
  const profile = applyOverrides(readFormProfile(), overrides);
  const trip = {
    country: $("#trip-country").value.trim(),
    days: parseInt($("#trip-days").value, 10) || null,
    month: parseInt($("#trip-month").value, 10) || null
  };

  const ranked = DESTINATIONS
    .map((d) => ({ dest: d, ...scoreDestination(d, profile, trip) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, trip.country ? 4 : 6);

  renderResults(ranked, profile, trip, overrides);
}

function renderResults(ranked, profile, trip, overrides = {}) {
  const wrap = $("#results");
  wrap.innerHTML = "";

  const head = document.createElement("p");
  head.className = "results-head";
  head.textContent = trip.country
    ? `Best matches around "${trip.country}" for your profile:`
    : "Here are ideas tailored to your profile:";
  wrap.appendChild(head);

  const active = overrideSummary(overrides);
  if (active.length) {
    const banner = document.createElement("div");
    banner.className = "override-banner";
    banner.innerHTML = `🎛️ Just for this trip: ` +
      active.map((a) => `<span>${a}</span>`).join("") +
      ` <em>(your saved profile is unchanged)</em>`;
    wrap.appendChild(banner);
  }

  // Remember context so the itinerary modal can rebuild for any card.
  CTX = { ranked, profile, trip };

  ranked.forEach(({ dest, reasons }, index) => {
    const cost = estimateCost(dest, profile, trip);
    const links = bookingLinks(dest, profile, trip, cost);
    const months = dest.bestMonths.map((m) => MONTHS[m]).join(", ");
    const fam = familyInsights(dest, profile);

    const famHtml = fam && (fam.activities.length || fam.cautions.length) ? `
      <div class="kids">
        <div class="kids-head">👨‍👩‍👧 For your kids${fam.agesLabel ? ` (ages ${fam.agesLabel})` : ""}</div>
        ${fam.activities.length ? `<ul class="kids-acts">${fam.activities.map((a) =>
          `<li><span class="age-pill">${bandLabel(a.age)}</span> ${a.text}</li>`).join("")}</ul>` : ""}
        ${fam.cautions.length ? `<ul class="kids-warn">${fam.cautions.map((c) =>
          `<li>⚠️ ${c}</li>`).join("")}</ul>` : ""}
      </div>` : "";

    const card = document.createElement("article");
    card.className = "card";
    card.innerHTML = `
      <div class="card-top">
        <h3>${dest.name} <span class="country">· ${dest.country}</span></h3>
        <span class="tag">${cost.days} days</span>
      </div>
      <p class="blurb">${dest.blurb}</p>
      ${reasons.length ? `<ul class="reasons">${reasons.map((r) => `<li>${r}</li>`).join("")}</ul>` : ""}
      ${famHtml}
      <div class="cost">
        <div><span class="big">~$${cost.total.toLocaleString()}</span> est. total
          <span class="muted">(${cost.people} ${cost.people > 1 ? "people" : "person"})</span></div>
        <div class="muted">≈ $${cost.perPerson.toLocaleString()}/person · flights ~$${cost.flights.toLocaleString()} + stay ~$${cost.land.toLocaleString()}</div>
        <div class="muted">Best months: ${months}</div>
      </div>
      <div class="links">
        <button class="btn itinerary-btn" data-i="${index}">🗓️ Build itinerary</button>
        <a class="btn primary" href="${links.hotels}" target="_blank" rel="noopener">🏨 Hotels (Booking.com)</a>
        <a class="btn" href="${links.flights}" target="_blank" rel="noopener">✈️ Flights</a>
        <a class="btn" href="${links.activities}" target="_blank" rel="noopener">🎟️ Activities</a>
      </div>
      <div class="muted dates">Pre-filled for ${links.checkin} → ${links.checkout}</div>
    `;
    wrap.appendChild(card);
  });

  renderMap(ranked, profile, trip);
  wrap.scrollIntoView({ behavior: "smooth", block: "start" });
}

/* ---------------- Map ---------------- */

function renderMap(ranked, profile, trip) {
  if (typeof L === "undefined") return; // Leaflet failed to load — skip gracefully
  const el = $("#map");
  el.hidden = false;

  if (!MAP) {
    MAP = L.map("map", { scrollWheelZoom: false });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
      attribution: "© OpenStreetMap contributors"
    }).addTo(MAP);
  }

  MAP_MARKERS.forEach((m) => MAP.removeLayer(m));
  MAP_MARKERS = [];

  const bounds = [];
  ranked.forEach(({ dest }) => {
    const c = COORDS[dest.name];
    if (!c) return;
    const cost = estimateCost(dest, profile, trip);
    const marker = L.marker(c).addTo(MAP);
    marker.bindPopup(
      `<strong>${dest.name}</strong><br>${dest.country}<br>` +
      `~$${cost.total.toLocaleString()} total · ${cost.days} days`
    );
    MAP_MARKERS.push(marker);
    bounds.push(c);
  });

  if (bounds.length === 1) {
    MAP.setView(bounds[0], 5);
  } else if (bounds.length > 1) {
    MAP.fitBounds(bounds, { padding: [40, 40], maxZoom: 6 });
  }
  // The map is created/shown after layout; recalc its size so tiles fill it.
  setTimeout(() => MAP.invalidateSize(), 100);
}

/* ---------------- Itinerary modal ---------------- */

function loadPrefs() {
  try { return JSON.parse(localStorage.getItem("tc_prefs")) || {}; }
  catch { return {}; }
}
function savePrefs(p) { localStorage.setItem("tc_prefs", JSON.stringify(p)); }

function openItinerary(index) {
  if (!CTX || !CTX.ranked[index]) return;
  CURRENT_DEST = CTX.ranked[index].dest;

  const p = loadPrefs();
  $("#pref-start").value = p.start || "09:00";
  $("#pref-lunch").value = p.lunch || "13:00";
  $("#pref-dinner").value = p.dinner || "20:00";
  $("#pref-pace").value = p.pace || "balanced";
  $("#pref-minimize").checked = p.minimizeTravel !== false;

  $("#ai-key").value = loadKey();
  $("#itin-title").textContent = `Itinerary · ${CURRENT_DEST.name}`;
  $("#itin-output").innerHTML = "";
  $("#itin-export").hidden = true;
  CURRENT_ITIN = null;
  CURRENT_AI_TEXT = null;

  const modal = $("#itin-modal");
  modal.hidden = false;
  document.body.style.overflow = "hidden";
}

function closeItinerary() {
  $("#itin-modal").hidden = true;
  document.body.style.overflow = "";
}

function generateItinerary() {
  if (!CURRENT_DEST) return;
  const prefs = {
    start: $("#pref-start").value || "09:00",
    lunch: $("#pref-lunch").value || "13:00",
    dinner: $("#pref-dinner").value || "20:00",
    pace: $("#pref-pace").value,
    minimizeTravel: $("#pref-minimize").checked
  };
  savePrefs(prefs);

  const cost = estimateCost(CURRENT_DEST, CTX.profile, CTX.trip);
  CURRENT_ITIN = buildItinerary(CURRENT_DEST, {
    ...prefs,
    days: cost.days,
    diet: CTX.profile.diet
  });

  CURRENT_AI_TEXT = null;
  renderItinerary(CURRENT_ITIN);
  $("#itin-export").hidden = false;
  $("#exp-share").hidden = !navigator.share;
}

/* ---------------- AI itinerary (Claude) ---------------- */

function loadKey() { return localStorage.getItem("tc_anthropic_key") || ""; }
function saveKey(k) {
  if (k) localStorage.setItem("tc_anthropic_key", k);
  else localStorage.removeItem("tc_anthropic_key");
}

// Build a grounded prompt from the destination's curated data + the traveller profile.
function buildAIPrompt(dest, profile, trip, prefs, days) {
  const plan = PLANS[dest.name] || genericPlan(dest);
  const kids = profile.travellers === "family" && (profile.childrenAges || []).length
    ? `Children ages: ${profile.childrenAges.join(", ")}.` : "";
  const areas = plan.areas
    .map((z) => `- ${z.zone}: ${z.spots.map((s) => `${s.name} (~${s.hrs}h)`).join("; ")}`)
    .join("\n");
  const food = plan.food.map((f) => `- ${f.name} (${f.meal}, ${f.cuisine})`).join("\n");

  const system =
    "You are an expert travel concierge. Produce a realistic, well-paced day-by-day " +
    "itinerary in clear Markdown. Respect the traveller's profile, diet, budget, eating " +
    "hours and pace. Group each day geographically to minimise transit when asked. " +
    "Use the supplied points of interest and restaurants as the backbone, but you may add " +
    "obvious well-known spots. Keep it practical: times, neighbourhoods, and short tips. " +
    "Do not invent specific prices or opening hours you're unsure of.";

  const user = `Plan a trip to ${dest.name}, ${dest.country}.

TRAVELLER PROFILE
- Travellers: ${profile.travellers} (${profile.adults} adults, ${profile.children} children). ${kids}
- Budget style: ${profile.budget}
- Diet: ${profile.diet}
- Interests: ${(profile.interests || []).join(", ") || "general"}

TRIP
- Duration: ${days} days
- Month: ${trip.month ? MONTHS[trip.month] : "flexible"}

SCHEDULING PREFERENCES
- Start each day around ${prefs.start}
- Lunch around ${prefs.lunch}, dinner around ${prefs.dinner}
- Pace: ${prefs.pace}
- Minimise daily travel: ${prefs.minimizeTravel ? "yes — keep each day within one area" : "no"}

SUGGESTED BASE: ${plan.hotelArea}
GETTING AROUND: ${plan.transport}

POINTS OF INTEREST (by area)
${areas}

RESTAURANTS
${food}

Write the itinerary now, one section per day (### Day N — area), with timed bullet points for activities and meals, a hotel-area suggestion, and a one-line transport tip per day.`;

  return { system, user };
}

async function callClaude(apiKey, system, userText) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true"
    },
    body: JSON.stringify({
      model: "claude-opus-4-8",
      max_tokens: 4000,
      system,
      messages: [{ role: "user", content: userText }]
    })
  });
  if (!res.ok) {
    let detail = "";
    try { detail = (await res.json()).error?.message || ""; } catch { /* ignore */ }
    throw new Error(`API ${res.status}${detail ? ": " + detail : ""}`);
  }
  const data = await res.json();
  return (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n");
}

async function generateItineraryAI() {
  if (!CURRENT_DEST) return;
  const key = $("#ai-key").value.trim();
  saveKey(key);
  if (!key) {
    flash("Add your Anthropic API key in AI settings first.");
    const s = $(".ai-settings"); if (s) s.open = true;
    return;
  }

  const prefs = {
    start: $("#pref-start").value || "09:00",
    lunch: $("#pref-lunch").value || "13:00",
    dinner: $("#pref-dinner").value || "20:00",
    pace: $("#pref-pace").value,
    minimizeTravel: $("#pref-minimize").checked
  };
  savePrefs(prefs);

  const cost = estimateCost(CURRENT_DEST, CTX.profile, CTX.trip);
  const { system, user } = buildAIPrompt(CURRENT_DEST, CTX.profile, CTX.trip, prefs, cost.days);

  const btn = $("#itin-generate-ai");
  btn.disabled = true;
  $("#itin-export").hidden = true;
  $("#itin-output").innerHTML = `<div class="ai-loading">✨ Writing your itinerary with Claude…</div>`;

  try {
    const text = await callClaude(key, system, user);
    CURRENT_AI_TEXT = text;
    CURRENT_ITIN = { destName: CURRENT_DEST.name, country: CURRENT_DEST.country, days: cost.days };
    $("#itin-output").innerHTML =
      `<div class="ai-badge">✨ AI-generated</div><div class="ai-itin">${mdLite(text)}</div>`;
    $("#itin-export").hidden = false;
    $("#exp-share").hidden = !navigator.share;
  } catch (err) {
    $("#itin-output").innerHTML =
      `<div class="ai-error">Couldn't generate: ${escapeHtml(err.message)}<br>` +
      `Check your API key and that your network allows calls to api.anthropic.com.</div>`;
  } finally {
    btn.disabled = false;
  }
}

// Minimal, safe Markdown -> HTML (escape first, then a few inline/block rules).
function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function mdLite(md) {
  const lines = escapeHtml(md).split("\n");
  let html = "";
  let inList = false;
  const closeList = () => { if (inList) { html += "</ul>"; inList = false; } };
  for (let raw of lines) {
    let line = raw
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>");
    if (/^###\s+/.test(line)) { closeList(); html += `<h4>${line.replace(/^###\s+/, "")}</h4>`; }
    else if (/^##\s+/.test(line)) { closeList(); html += `<h3>${line.replace(/^##\s+/, "")}</h3>`; }
    else if (/^#\s+/.test(line)) { closeList(); html += `<h3>${line.replace(/^#\s+/, "")}</h3>`; }
    else if (/^\s*[-*]\s+/.test(line)) {
      if (!inList) { html += "<ul>"; inList = true; }
      html += `<li>${line.replace(/^\s*[-*]\s+/, "")}</li>`;
    } else if (line.trim() === "") { closeList(); }
    else { closeList(); html += `<p>${line}</p>`; }
  }
  closeList();
  return html;
}

function renderItinerary(itin) {
  const out = $("#itin-output");
  const daysHtml = itin.schedule.map((day) => `
    <div class="itin-day">
      <div class="itin-day-head">Day ${day.day} <span class="itin-zone">${day.zone}</span></div>
      <ul class="itin-blocks">
        ${day.blocks.map((b) => `
          <li class="itin-block ${b.type}">
            <span class="itin-time">${b.time}</span>
            <span class="itin-title">${b.type === "meal" ? "🍽 " : ""}${b.title}</span>
            ${b.meta ? `<span class="itin-meta">${b.meta}</span>` : ""}
          </li>`).join("")}
      </ul>
    </div>`).join("");

  out.innerHTML = `
    <div class="itin-summary">
      <div><strong>🏨 Stay:</strong> ${itin.hotelArea}</div>
      <div><strong>🚇 Getting around:</strong> ${itin.transport}</div>
    </div>
    ${daysHtml}`;
}

/* ---------------- Exports ---------------- */

// AI text when present, otherwise the rule-based structured itinerary.
function getExportText() {
  if (CURRENT_AI_TEXT) return CURRENT_AI_TEXT;
  if (CURRENT_ITIN) return itineraryToText(CURRENT_ITIN);
  return "";
}

function exportCopy() {
  const text = getExportText();
  if (!text) return;
  navigator.clipboard.writeText(text)
    .then(() => flash("Itinerary copied to clipboard."))
    .catch(() => flash("Couldn't copy — try Download instead."));
}

function exportDownload() {
  const text = getExportText();
  if (!text) return;
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `itinerary-${CURRENT_ITIN.destName.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.txt`;
  a.click();
  URL.revokeObjectURL(url);
  flash("Itinerary downloaded.");
}

function exportEmail() {
  const text = getExportText();
  if (!text || !CURRENT_ITIN) return;
  const subject = `Trip itinerary: ${CURRENT_ITIN.destName} (${CURRENT_ITIN.days} days)`;
  window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
}

function exportShare() {
  const text = getExportText();
  if (!text || !CURRENT_ITIN || !navigator.share) return;
  navigator.share({
    title: `Trip itinerary: ${CURRENT_ITIN.destName}`,
    text
  }).catch(() => {});
}

/* ---------------- Misc UI ---------------- */

let flashTimer;
function flash(msg) {
  const el = $("#flash");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(flashTimer);
  flashTimer = setTimeout(() => el.classList.remove("show"), 2500);
}

document.addEventListener("DOMContentLoaded", () => {
  applyProfile(loadProfile());
  $("#children").addEventListener("input", (e) => {
    renderAgeInputs(parseInt(e.target.value, 10) || 0, readAges(10));
  });
  $("#save-profile").addEventListener("click", saveProfile);
  $("#plan").addEventListener("click", recommend);
  $("#surprise").addEventListener("click", () => {
    $("#trip-country").value = "";
    recommend();
  });
  $("#reset-overrides").addEventListener("click", () => {
    $("#ov-budget").value = "";
    $("#ov-mood").value = "";
    $("#ov-climate").value = "";
    $("#ov-adults-only").checked = false;
    flash("Trip adjustments cleared.");
  });

  // Itinerary: open from any result card (delegated).
  $("#results").addEventListener("click", (e) => {
    const btn = e.target.closest(".itinerary-btn");
    if (btn) openItinerary(parseInt(btn.dataset.i, 10));
  });
  $("#itin-close").addEventListener("click", closeItinerary);
  $("#itin-modal").addEventListener("click", (e) => {
    if (e.target.id === "itin-modal") closeItinerary();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !$("#itin-modal").hidden) closeItinerary();
  });
  $("#itin-generate").addEventListener("click", generateItinerary);
  $("#itin-generate-ai").addEventListener("click", generateItineraryAI);
  $("#ai-key").addEventListener("change", (e) => saveKey(e.target.value.trim()));
  $("#exp-copy").addEventListener("click", exportCopy);
  $("#exp-download").addEventListener("click", exportDownload);
  $("#exp-email").addEventListener("click", exportEmail);
  $("#exp-share").addEventListener("click", exportShare);
});
