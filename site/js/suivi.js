/* Page de suivi : statistiques du journal + progression du programme. */
(function () {
  function tally(log, field) {
    const counts = {};
    log.forEach((e) => (e[field] || []).forEach((v) => { counts[v] = (counts[v] || 0) + 1; }));
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }

  function renderBars(containerId, pairs) {
    const wrap = document.getElementById(containerId);
    if (!pairs.length) { wrap.innerHTML = '<p class="muted">Pas encore de données.</p>'; return; }
    const max = pairs[0][1];
    wrap.innerHTML = pairs.slice(0, 8).map(([name, cnt]) =>
      `<div class="bar-row">
         <span class="name">${escapeHtml(name)}</span>
         <span class="bar"><span style="width:${Math.round((cnt / max) * 100)}%"></span></span>
         <span class="cnt">${cnt}</span>
       </div>`).join("");
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  document.addEventListener("DOMContentLoaded", () => {
    const log = EQ.getHungerLog();
    const done = EQ.completedDays();

    document.getElementById("statEntries").textContent = log.length;
    document.getElementById("statDays").textContent = done + "/21";

    const phys = log.filter((e) => e.hungerType === "physique").length;
    const emo = log.filter((e) => e.hungerType === "emotionnelle").length;
    const rated = phys + emo;
    document.getElementById("statPhys").textContent = rated ? Math.round((phys / rated) * 100) + "%" : "—";
    document.getElementById("statEmo").textContent = rated ? Math.round((emo / rated) * 100) + "%" : "—";

    document.getElementById("progBar").style.width = Math.round((done / 21) * 100) + "%";
    document.getElementById("progText").textContent =
      done === 0 ? "Le programme vous attend quand vous êtes prêt(e)." :
      done >= 21 ? "Programme terminé — félicitations pour ce parcours ! 🌿" :
      `Vous avez accompli ${done} jour${done > 1 ? "s" : ""} sur 21. Continuez à votre rythme.`;

    renderBars("partsStats", tally(log, "parts"));
    renderBars("sensStats", tally(log, "sensations"));
    renderBars("emoStats", tally(log, "emotions"));

    document.getElementById("exportBtn").addEventListener("click", () => {
      const data = {
        profile: EQ.getProfile(),
        hungerLog: EQ.getHungerLog(),
        program: EQ.getProgram(),
        exportedAt: new Date().toISOString()
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "equilibre-donnees.json";
      a.click();
      URL.revokeObjectURL(a.href);
    });

    document.getElementById("resetBtn").addEventListener("click", () => {
      if (!confirm("Effacer toutes vos données (profil, ressentis, progression) ? Cette action est irréversible.")) return;
      localStorage.removeItem(EQ.KEYS.profile);
      localStorage.removeItem(EQ.KEYS.hunger);
      localStorage.removeItem(EQ.KEYS.program);
      const msg = document.getElementById("dataMsg");
      msg.textContent = "Toutes vos données ont été effacées.";
      msg.classList.remove("hidden");
      setTimeout(() => location.reload(), 1200);
    });
  });
})();
