// Travel concierge — first version logic.
// State: a persisted profile (asked once) + per-trip parameters (few questions).

const MONTHS = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun",
                "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

/* ---------------- Profile persistence ---------------- */

function loadProfile() {
  try { return JSON.parse(localStorage.getItem("tc_profile")) || null; }
  catch { return null; }
}

function saveProfile() {
  const profile = {
    travellers: $("#travellers").value,
    adults: parseInt($("#adults").value, 10) || 1,
    children: parseInt($("#children").value, 10) || 0,
    budget: $("#budget").value,
    climate: $("#climate").value,
    origin: $("#origin").value,
    diet: $("#diet").value,
    interests: $$(".interest:checked").map((c) => c.value)
  };
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

/* ---------------- Rendering ---------------- */

function recommend() {
  const profile = saveProfile();
  const trip = {
    country: $("#trip-country").value.trim(),
    days: parseInt($("#trip-days").value, 10) || null,
    month: parseInt($("#trip-month").value, 10) || null
  };

  const ranked = DESTINATIONS
    .map((d) => ({ dest: d, ...scoreDestination(d, profile, trip) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, trip.country ? 4 : 6);

  renderResults(ranked, profile, trip);
}

function renderResults(ranked, profile, trip) {
  const wrap = $("#results");
  wrap.innerHTML = "";

  const head = document.createElement("p");
  head.className = "results-head";
  head.textContent = trip.country
    ? `Best matches around "${trip.country}" for your profile:`
    : "Here are ideas tailored to your profile:";
  wrap.appendChild(head);

  ranked.forEach(({ dest, reasons }) => {
    const cost = estimateCost(dest, profile, trip);
    const links = bookingLinks(dest, profile, trip, cost);
    const months = dest.bestMonths.map((m) => MONTHS[m]).join(", ");

    const card = document.createElement("article");
    card.className = "card";
    card.innerHTML = `
      <div class="card-top">
        <h3>${dest.name} <span class="country">· ${dest.country}</span></h3>
        <span class="tag">${cost.days} days</span>
      </div>
      <p class="blurb">${dest.blurb}</p>
      ${reasons.length ? `<ul class="reasons">${reasons.map((r) => `<li>${r}</li>`).join("")}</ul>` : ""}
      <div class="cost">
        <div><span class="big">~$${cost.total.toLocaleString()}</span> est. total
          <span class="muted">(${cost.people} ${cost.people > 1 ? "people" : "person"})</span></div>
        <div class="muted">≈ $${cost.perPerson.toLocaleString()}/person · flights ~$${cost.flights.toLocaleString()} + stay ~$${cost.land.toLocaleString()}</div>
        <div class="muted">Best months: ${months}</div>
      </div>
      <div class="links">
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
  $("#save-profile").addEventListener("click", saveProfile);
  $("#plan").addEventListener("click", recommend);
  $("#surprise").addEventListener("click", () => {
    $("#trip-country").value = "";
    recommend();
  });
});
