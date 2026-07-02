const DONE_KEY = "grenoble-trails-done";
const PICK_COUNT = 4;

function loadDone() {
  try {
    return JSON.parse(localStorage.getItem(DONE_KEY)) || {};
  } catch {
    return {};
  }
}

function saveDone(done) {
  localStorage.setItem(DONE_KEY, JSON.stringify(done));
}

// ISO-8601 week number; the picks change every Monday.
function isoWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return { year: d.getUTCFullYear(), week };
}

// Deterministic PRNG so every device shows the same picks for a given week.
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Shuffle the FULL catalog with the week's seed, then take the first
// not-done trails: marking one pick as done swaps only that pick.
function weeklyPicks(trails, done, { year, week }) {
  const rand = mulberry32(year * 100 + week);
  const shuffled = [...trails];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.filter((t) => !done[t.id]).slice(0, PICK_COUNT);
}

function komootLink(trail) {
  return `https://www.komoot.com/discover?q=${encodeURIComponent(trail.name)}`;
}

function gmapsLink(trail) {
  const { lat, lon } = trail.trailhead;
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}&travelmode=transit`;
}

function badges(trail) {
  const b = [
    `<span class="badge ${trail.difficulty}">${trail.difficulty}</span>`,
    `<span class="badge">${trail.distance_km} km</span>`,
    `<span class="badge">↗ ${trail.elevation_gain_m} m</span>`,
    `<span class="badge">${trail.loop ? "loop" : "A → B"}</span>`,
  ];
  if (trail.bus.seasonal) b.push(`<span class="badge">seasonal bus</span>`);
  if (!trail.verified) b.push(`<span class="badge unverified">unverified</span>`);
  return b.join("");
}

function card(trail, done) {
  const isDone = Boolean(done[trail.id]);
  return `
    <article class="card ${isDone ? "done" : ""}">
      <h3>${trail.name}</h3>
      <div class="badges">${badges(trail)}</div>
      <p class="bus">🚌 ${trail.bus.line} → <strong>${trail.bus.stop}</strong></p>
      ${trail.warning ? `<p class="warning">⚠️ ${trail.warning}</p>` : ""}
      <div class="links">
        <a href="${gmapsLink(trail)}" target="_blank" rel="noopener">Bus times (Google Maps)</a>
        <a href="${komootLink(trail)}" target="_blank" rel="noopener">Find in Komoot</a>
      </div>
      <button class="done-btn" type="button" data-id="${trail.id}">
        ${isDone ? `↩ Undo (done ${done[trail.id]})` : "✓ Mark as done"}
      </button>
    </article>`;
}

function catalogRow(trail, done) {
  const isDone = Boolean(done[trail.id]);
  return `
    <div class="catalog-row ${isDone ? "done" : ""}">
      <span class="name">${trail.name}</span>
      <span class="meta">${trail.distance_km} km · ↗${trail.elevation_gain_m} m · ${trail.difficulty}</span>
      <button class="done-btn" type="button" data-id="${trail.id}">${isDone ? "↩" : "✓"}</button>
    </div>`;
}

function render(trails) {
  const done = loadDone();
  const now = new Date();
  const wk = isoWeek(now);
  const picks = weeklyPicks(trails, done, wk);
  const doneCount = trails.filter((t) => done[t.id]).length;

  document.getElementById("week-title").textContent = `This week's picks — week ${wk.week}`;
  document.getElementById("week-subtitle").textContent =
    `Deterministic for week ${wk.week}/${wk.year}: same picks all week, on any device with the same done-list.`;

  document.getElementById("picks").innerHTML = picks.length
    ? picks.map((t) => card(t, done)).join("")
    : `<div class="empty">All trails are done — time to add new ones to the catalog!</div>`;

  document.getElementById("catalog-count").textContent =
    `${trails.length} trails, ${doneCount} done.`;

  const byMassif = {};
  for (const t of trails) (byMassif[t.massif] ??= []).push(t);
  document.getElementById("catalog").innerHTML = Object.entries(byMassif)
    .map(
      ([massif, list]) => `
        <div class="massif-group">
          <h3>${massif}</h3>
          ${list.map((t) => catalogRow(t, done)).join("")}
        </div>`
    )
    .join("");

  for (const btn of document.querySelectorAll(".done-btn")) {
    btn.addEventListener("click", () => {
      const d = loadDone();
      if (d[btn.dataset.id]) delete d[btn.dataset.id];
      else d[btn.dataset.id] = new Date().toISOString().slice(0, 10);
      saveDone(d);
      render(trails);
    });
  }
}

function setupTools(trails) {
  document.getElementById("export-btn").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(loadDone(), null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "grenoble-hikes-done.json";
    a.click();
    URL.revokeObjectURL(a.href);
  });

  document.getElementById("import-input").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const imported = JSON.parse(await file.text());
      saveDone({ ...loadDone(), ...imported });
      render(trails);
    } catch {
      alert("Could not read that file — expected the exported JSON.");
    }
    e.target.value = "";
  });
}

async function main() {
  try {
    const res = await fetch("data/trails.json");
    const data = await res.json();
    render(data.trails);
    setupTools(data.trails);
  } catch (err) {
    document.getElementById("picks").innerHTML =
      `<div class="empty">Could not load trail data (${err.message}). ` +
      `If you opened this file directly, serve it instead: <code>python3 -m http.server</code> in the site/ folder.</div>`;
  }
}

main();
