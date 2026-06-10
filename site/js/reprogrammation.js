/* Volet reprogrammation : programme 21 jours, lecture/écoute adaptée au profil. */
(function () {
  const PCM = window.EQ_PCM;
  let profile = null;
  let viewDay = 1; // jour actuellement affiché

  function dayObj(day) { return PCM.DAYS.find((d) => d.day === day); }

  function renderHeader() {
    const t = PCM.TYPES[profile.pcmType];
    document.getElementById("programIntro").innerHTML =
      `Bonjour ${profile.name ? "<strong>" + escapeHtml(profile.name) + "</strong>" : ""}, voici votre parcours sur 21 jours, adapté à votre profil <strong>${t.emoji} ${t.name}</strong> (ton ${t.tone}). Un exercice par jour, à lire ou à écouter.`;
  }

  function renderProgress() {
    const done = EQ.completedDays();
    document.getElementById("progressLabel").textContent = `Progression : ${done}/21 jours`;
    document.getElementById("progressBar").style.width = Math.round((done / 21) * 100) + "%";
  }

  function renderGrid() {
    const grid = document.getElementById("daysGrid");
    const current = EQ.currentDay();
    grid.innerHTML = "";
    PCM.DAYS.forEach((d) => {
      const st = EQ.getDayState(d.day);
      const done = st.read || st.listen;
      const cell = document.createElement("div");
      cell.className = "day-cell" + (done ? " done" : "") + (d.day === viewDay ? " current" : "");
      cell.innerHTML = `<span>${d.day}</span><small>S${d.week}</small>${done ? '<span class="check">✓</span>' : ""}`;
      cell.title = "Jour " + d.day + " — " + d.title + (d.day > current ? " (à venir)" : "");
      cell.addEventListener("click", () => { viewDay = d.day; renderAll(); document.getElementById("reader").scrollIntoView({ behavior: "smooth" }); });
      grid.appendChild(cell);
    });
  }

  function renderReader() {
    const d = dayObj(viewDay);
    const week = PCM.WEEKS[d.week - 1];
    document.getElementById("weekTheme").textContent = `Semaine ${d.week} · ${week.theme}`;
    document.getElementById("dayTitle").textContent = `Jour ${d.day} — ${d.title}`;
    document.getElementById("dayMeta").textContent = `Semaine ${d.week} : ${week.theme}`;

    const built = PCM.buildDayText(profile.pcmType, d);
    document.getElementById("dayBody").innerHTML = built.paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join("");
    document.getElementById("dayAffirmation").textContent = "« " + built.affirmation + " »";

    document.getElementById("reflection").value = EQ.getDayState(d.day).reflection || "";

    if (!EQ.Speech.supported) document.getElementById("ttsWarn").classList.remove("hidden");
  }

  function renderAll() { renderHeader(); renderProgress(); renderGrid(); renderReader(); resetAudioButtons(); }

  // --- Audio ---
  let isPaused = false;
  function resetAudioButtons() {
    EQ.Speech.stop();
    isPaused = false;
    document.getElementById("listenBtn").disabled = false;
    document.getElementById("pauseBtn").disabled = true;
    document.getElementById("stopBtn").disabled = true;
    document.getElementById("pauseBtn").textContent = "⏸ Pause";
  }
  function startListen() {
    const d = dayObj(viewDay);
    const text = PCM.plainText(profile.pcmType, d);
    const ok = EQ.Speech.speak(text, {
      onstart: () => {
        document.getElementById("pauseBtn").disabled = false;
        document.getElementById("stopBtn").disabled = false;
        document.getElementById("listenBtn").disabled = true;
      },
      onend: () => {
        resetAudioButtons();
        // L'écoute complète vaut réalisation de l'exercice
        EQ.setDayState(d.day, { listen: true });
        renderProgress(); renderGrid();
      },
      onerror: () => document.getElementById("ttsWarn").classList.remove("hidden")
    });
    if (!ok) document.getElementById("ttsWarn").classList.remove("hidden");
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  document.addEventListener("DOMContentLoaded", () => {
    profile = EQ.getProfile();
    if (!profile || !profile.pcmType) {
      document.getElementById("noProfile").classList.remove("hidden");
      return;
    }
    document.getElementById("programWrap").classList.remove("hidden");
    viewDay = EQ.currentDay();
    renderAll();

    document.getElementById("listenBtn").addEventListener("click", startListen);
    document.getElementById("pauseBtn").addEventListener("click", () => {
      if (!isPaused) { EQ.Speech.pause(); isPaused = true; document.getElementById("pauseBtn").textContent = "▶ Reprendre"; }
      else { EQ.Speech.resume(); isPaused = false; document.getElementById("pauseBtn").textContent = "⏸ Pause"; }
    });
    document.getElementById("stopBtn").addEventListener("click", resetAudioButtons);

    document.getElementById("markRead").addEventListener("click", () => {
      const refl = document.getElementById("reflection").value.trim();
      EQ.setDayState(viewDay, { read: true, reflection: refl });
      const msg = document.getElementById("readerMsg");
      msg.textContent = "Exercice du jour validé. Fier(e) de vous ! 🌿";
      msg.classList.remove("hidden");
      renderProgress(); renderGrid();
      setTimeout(() => msg.classList.add("hidden"), 2600);
    });

    document.getElementById("reflection").addEventListener("blur", () => {
      const st = EQ.getDayState(viewDay);
      EQ.setDayState(viewDay, { reflection: document.getElementById("reflection").value.trim(), read: st.read, listen: st.listen });
    });

    document.getElementById("prevDay").addEventListener("click", () => {
      if (viewDay > 1) { viewDay--; renderAll(); }
    });
    document.getElementById("nextDay").addEventListener("click", () => {
      if (viewDay < 21) { viewDay++; renderAll(); }
    });

    // Arrête la lecture si on quitte la page
    window.addEventListener("beforeunload", () => EQ.Speech.stop());
  });
})();
