/* Volet alimentaire : silhouette interactive + journal des ressentis de faim. */
(function () {
  const SENSATIONS = [
    "Serrement", "Boule", "Vide / creux", "Chaleur", "Tension",
    "Nausée", "Papillons", "Lourdeur", "Crampe", "Picotements",
    "Gorge nouée", "Tremblements"
  ];
  const EMOTIONS = [
    "Stress", "Ennui", "Fatigue", "Tristesse", "Joie",
    "Colère", "Solitude", "Anxiété", "Habitude", "Frustration"
  ];

  const state = {
    parts: new Set(),
    sensations: new Set(),
    emotions: new Set(),
    intensity: 5,
    hungerType: null
  };

  // --- Silhouette ---
  function initBody() {
    document.querySelectorAll("#bodyRegions .region").forEach((reg) => {
      reg.addEventListener("click", () => {
        const part = reg.dataset.part;
        if (state.parts.has(part)) { state.parts.delete(part); reg.classList.remove("selected"); }
        else { state.parts.add(part); reg.classList.add("selected"); }
        renderSelParts();
      });
    });
  }
  function renderSelParts() {
    const el = document.getElementById("selParts");
    el.textContent = state.parts.size ? Array.from(state.parts).join(", ") : "aucune";
  }

  // --- Chips génériques ---
  function buildChips(containerId, items, set, cls) {
    const wrap = document.getElementById(containerId);
    items.forEach((label) => {
      const chip = document.createElement("span");
      chip.className = "chip" + (cls ? " " + cls : "");
      chip.textContent = label;
      chip.addEventListener("click", () => {
        if (set.has(label)) { set.delete(label); chip.classList.remove("selected"); }
        else { set.add(label); chip.classList.add("selected"); }
      });
      wrap.appendChild(chip);
    });
  }

  function initHungerType() {
    document.querySelectorAll("#hungerType .chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        document.querySelectorAll("#hungerType .chip").forEach((c) => c.classList.remove("selected"));
        chip.classList.add("selected");
        state.hungerType = chip.dataset.h;
      });
    });
  }

  function resetForm() {
    state.parts.clear(); state.sensations.clear(); state.emotions.clear();
    state.intensity = 5; state.hungerType = null;
    document.querySelectorAll(".region.selected").forEach((r) => r.classList.remove("selected"));
    document.querySelectorAll(".chip.selected").forEach((c) => c.classList.remove("selected"));
    document.getElementById("intensity").value = 5;
    document.getElementById("intVal").textContent = "5";
    document.getElementById("note").value = "";
    renderSelParts();
  }

  const HT_LABEL = { physique: ["Faim physique", "phys"], emotionnelle: ["Faim émotionnelle", "emo"], incertaine: ["Faim incertaine", "unsure"] };

  function renderList() {
    const wrap = document.getElementById("entryList");
    const log = EQ.getHungerLog();
    if (!log.length) {
      wrap.innerHTML = '<p class="muted">Aucun ressenti enregistré pour le moment. Votre premier sera ici.</p>';
      return;
    }
    wrap.innerHTML = "";
    log.forEach((e) => {
      const div = document.createElement("div");
      div.className = "entry";
      const ht = HT_LABEL[e.hungerType] || ["", ""];
      const partsTags = (e.parts || []).map((p) => `<span class="tag">${p}</span>`).join("");
      const sensTags = (e.sensations || []).map((s) => `<span class="tag accent">${s}</span>`).join("");
      const emoTags = (e.emotions || []).map((m) => `<span class="tag">${m}</span>`).join("");
      div.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px">
          <span class="when">${EQ.formatDateTime(e.ts)}</span>
          ${e.hungerType ? `<span class="badge ${ht[1]}">${ht[0]}</span>` : ""}
        </div>
        <div class="tags">${partsTags || '<span class="muted">zone non précisée</span>'}</div>
        ${sensTags ? `<div class="tags">${sensTags}</div>` : ""}
        <div class="muted" style="font-size:.85rem">Intensité : ${e.intensity}/10 ${emoTags ? "· déclencheurs :" : ""} ${emoTags}</div>
        ${e.note ? `<p style="margin:8px 0 0">${escapeHtml(e.note)}</p>` : ""}
        <div class="btn-row" style="margin-top:10px">
          <button class="btn btn-danger btn-sm" data-del="${e.id}">Supprimer</button>
        </div>`;
      wrap.appendChild(div);
    });
    wrap.querySelectorAll("[data-del]").forEach((b) =>
      b.addEventListener("click", () => {
        EQ.deleteHungerEntry(b.dataset.del);
        renderList();
      }));
  }

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  document.addEventListener("DOMContentLoaded", () => {
    initBody();
    buildChips("sensChips", SENSATIONS, state.sensations, "accent");
    buildChips("emoChips", EMOTIONS, state.emotions);
    initHungerType();

    const range = document.getElementById("intensity");
    range.addEventListener("input", () => {
      state.intensity = parseInt(range.value, 10);
      document.getElementById("intVal").textContent = range.value;
    });

    document.getElementById("resetForm").addEventListener("click", resetForm);

    document.getElementById("saveEntry").addEventListener("click", () => {
      const msg = document.getElementById("entryMsg");
      if (!state.parts.size && !state.sensations.size) {
        msg.textContent = "Indiquez au moins une zone du corps ou un ressenti.";
        msg.classList.remove("hidden");
        return;
      }
      EQ.addHungerEntry({
        parts: Array.from(state.parts),
        sensations: Array.from(state.sensations),
        emotions: Array.from(state.emotions),
        intensity: state.intensity,
        hungerType: state.hungerType,
        note: document.getElementById("note").value.trim()
      });
      msg.textContent = "Ressenti enregistré. Bravo de prendre ce temps pour vous écouter. 🌿";
      msg.classList.remove("hidden");
      resetForm();
      renderList();
      setTimeout(() => msg.classList.add("hidden"), 3000);
    });

    renderList();
  });
})();
