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

  wrap.scrollIntoView({ behavior: "smooth", block: "start" });
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

  $("#itin-title").textContent = `Itinerary · ${CURRENT_DEST.name}`;
  $("#itin-output").innerHTML = "";
  $("#itin-export").hidden = true;
  CURRENT_ITIN = null;

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

  renderItinerary(CURRENT_ITIN);
  $("#itin-export").hidden = false;
  $("#exp-share").hidden = !navigator.share;
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

function exportCopy() {
  if (!CURRENT_ITIN) return;
  navigator.clipboard.writeText(itineraryToText(CURRENT_ITIN))
    .then(() => flash("Itinerary copied to clipboard."))
    .catch(() => flash("Couldn't copy — try Download instead."));
}

function exportDownload() {
  if (!CURRENT_ITIN) return;
  const text = itineraryToText(CURRENT_ITIN);
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
  if (!CURRENT_ITIN) return;
  const subject = `Trip itinerary: ${CURRENT_ITIN.destName} (${CURRENT_ITIN.days} days)`;
  const body = itineraryToText(CURRENT_ITIN);
  window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function exportShare() {
  if (!CURRENT_ITIN || !navigator.share) return;
  navigator.share({
    title: `Trip itinerary: ${CURRENT_ITIN.destName}`,
    text: itineraryToText(CURRENT_ITIN)
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
  $("#exp-copy").addEventListener("click", exportCopy);
  $("#exp-download").addEventListener("click", exportDownload);
  $("#exp-email").addEventListener("click", exportEmail);
  $("#exp-share").addEventListener("click", exportShare);
});
