/* Équilibre — utilitaires partagés : stockage local, profil, navigation, synthèse vocale. */

window.EQ = (function () {
  const KEYS = {
    profile: "eq.profile",        // { name, pcmType, startDate (ISO yyyy-mm-dd) }
    hunger: "eq.hungerLog",       // [ { id, ts, parts:[], sensations:[], intensity, hungerType, emotions:[], note } ]
    program: "eq.programProgress" // { "1": { read:bool, listen:bool, reflection:"" }, ... }
  };

  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }
  function write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  // --- Profil ---
  function getProfile() { return read(KEYS.profile, null); }
  function saveProfile(p) { write(KEYS.profile, p); }
  function hasProfile() { const p = getProfile(); return !!(p && p.pcmType); }

  // --- Journal alimentaire ---
  function getHungerLog() { return read(KEYS.hunger, []); }
  function addHungerEntry(entry) {
    const log = getHungerLog();
    entry.id = "h" + Date.now();
    entry.ts = new Date().toISOString();
    log.unshift(entry);
    write(KEYS.hunger, log);
    return entry;
  }
  function deleteHungerEntry(id) {
    write(KEYS.hunger, getHungerLog().filter((e) => e.id !== id));
  }

  // --- Programme ---
  function getProgram() { return read(KEYS.program, {}); }
  function getDayState(day) {
    const p = getProgram();
    return p[String(day)] || { read: false, listen: false, reflection: "" };
  }
  function setDayState(day, state) {
    const p = getProgram();
    p[String(day)] = Object.assign(getDayState(day), state);
    write(KEYS.program, p);
  }
  function completedDays() {
    const p = getProgram();
    return Object.keys(p).filter((d) => p[d] && (p[d].read || p[d].listen)).length;
  }
  // Jour « courant » fondé sur la date de début (1 jour réel = 1 jour de programme),
  // borné à 21. Le programme reste consultable même en avance/retard.
  function currentDay() {
    const p = getProfile();
    if (!p || !p.startDate) return 1;
    const start = new Date(p.startDate + "T00:00:00");
    const now = new Date();
    const diff = Math.floor((now - start) / 86400000);
    return Math.min(21, Math.max(1, diff + 1));
  }

  // --- Date ---
  function todayISO() {
    const d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }
  function formatDateTime(iso) {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" }) +
        " à " + d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    } catch (e) { return iso; }
  }

  // --- Synthèse vocale (lire / écouter) ---
  const Speech = {
    supported: ("speechSynthesis" in window),
    utter: null,
    speak: function (text, opts) {
      opts = opts || {};
      if (!this.supported) { if (opts.onerror) opts.onerror(); return false; }
      this.stop();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "fr-FR";
      u.rate = opts.rate || 0.95;
      u.pitch = 1;
      const voices = window.speechSynthesis.getVoices();
      const fr = voices.find((v) => /fr/i.test(v.lang));
      if (fr) u.voice = fr;
      if (opts.onend) u.onend = opts.onend;
      if (opts.onstart) u.onstart = opts.onstart;
      this.utter = u;
      window.speechSynthesis.speak(u);
      return true;
    },
    pause: function () { if (this.supported) window.speechSynthesis.pause(); },
    resume: function () { if (this.supported) window.speechSynthesis.resume(); },
    stop: function () { if (this.supported) window.speechSynthesis.cancel(); },
    speaking: function () { return this.supported && window.speechSynthesis.speaking; }
  };

  // --- Navigation : marque le lien actif ---
  function markActiveNav() {
    const path = location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll(".navlink").forEach((a) => {
      const href = a.getAttribute("href");
      if (href === path || (path === "" && href === "index.html")) a.classList.add("active");
    });
  }

  document.addEventListener("DOMContentLoaded", markActiveNav);
  // Pré-charge les voix (certains navigateurs les chargent de façon asynchrone)
  if ("speechSynthesis" in window) { window.speechSynthesis.getVoices(); }

  return {
    KEYS, getProfile, saveProfile, hasProfile,
    getHungerLog, addHungerEntry, deleteHungerEntry,
    getProgram, getDayState, setDayState, completedDays, currentDay,
    todayISO, formatDateTime, Speech
  };
})();
