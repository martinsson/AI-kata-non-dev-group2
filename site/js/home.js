/* Page d'accueil : configuration du profil + mini-quiz Process Com. */
(function () {
  const PCM = window.EQ_PCM;
  let selectedType = null;

  // --- Affiche le résumé si un profil existe déjà ---
  function renderSummary() {
    const p = EQ.getProfile();
    const summary = document.getElementById("profileSummary");
    const start = document.getElementById("start");
    if (p && p.pcmType) {
      const t = PCM.TYPES[p.pcmType];
      document.getElementById("pName").textContent = p.name || "à vous";
      document.getElementById("pType").textContent = t.name;
      document.getElementById("pEmoji").textContent = t.emoji;
      document.getElementById("pTone").textContent = "ton " + t.tone;
      document.getElementById("pDay").textContent = EQ.currentDay();
      summary.classList.remove("hidden");
      start.classList.add("hidden");
    }
  }

  // --- Construit les cartes de sélection des 6 types ---
  function renderPicker() {
    const wrap = document.getElementById("pcmPick");
    wrap.innerHTML = "";
    PCM.TYPE_ORDER.forEach((key) => {
      const t = PCM.TYPES[key];
      const div = document.createElement("div");
      div.className = "pcm-opt";
      div.dataset.type = key;
      div.innerHTML = `<h4>${t.emoji} ${t.name} <span class="muted" style="font-weight:400">(${t.alias})</span></h4><p>${t.short}</p>`;
      div.addEventListener("click", () => selectType(key));
      wrap.appendChild(div);
    });
  }

  function selectType(key) {
    selectedType = key;
    document.querySelectorAll(".pcm-opt").forEach((el) => {
      el.classList.toggle("selected", el.dataset.type === key);
    });
    document.getElementById("saveProfileBtn").disabled = false;
  }

  // --- Mini-quiz ---
  function renderQuiz() {
    const box = document.getElementById("quizQuestions");
    box.innerHTML = "";
    PCM.QUIZ.forEach((item, qi) => {
      const block = document.createElement("div");
      block.style.marginBottom = "16px";
      const opts = item.a.map((opt, oi) =>
        `<label class="chip" style="display:inline-flex;align-items:center;gap:6px">
           <input type="radio" name="q${qi}" value="${opt.t}" ${oi === 0 ? "" : ""}> ${opt.label}
         </label>`).join("");
      block.innerHTML = `<p style="font-weight:600;margin:0 0 8px">${qi + 1}. ${item.q}</p><div class="chips">${opts}</div>`;
      box.appendChild(block);
    });
    // Surbrillance de la puce sélectionnée
    box.addEventListener("change", (e) => {
      if (e.target.name) {
        box.querySelectorAll(`input[name="${e.target.name}"]`).forEach((r) =>
          r.closest(".chip").classList.toggle("selected", r.checked));
      }
    });
  }

  function computeQuiz() {
    const answers = [];
    PCM.QUIZ.forEach((item, qi) => {
      const sel = document.querySelector(`input[name="q${qi}"]:checked`);
      if (sel) answers.push(sel.value);
    });
    if (answers.length < PCM.QUIZ.length) {
      const msg = document.getElementById("quizMsg");
      msg.textContent = "Répondez à toutes les questions pour découvrir votre profil.";
      msg.classList.remove("hidden");
      return;
    }
    const best = PCM.scoreQuiz(answers);
    const t = PCM.TYPES[best];
    const msg = document.getElementById("quizMsg");
    msg.innerHTML = `Votre profil dominant : <strong>${t.emoji} ${t.name}</strong>. ${t.desc} <br><em>Profil sélectionné ci-dessous — ajustez-le si vous le souhaitez.</em>`;
    msg.classList.remove("hidden");
    selectType(best);
    document.getElementById("pcmPick").scrollIntoView({ behavior: "smooth", block: "center" });
  }

  // --- Initialisation ---
  document.addEventListener("DOMContentLoaded", () => {
    renderSummary();
    renderPicker();
    renderQuiz();

    // Pré-remplit si on modifie un profil existant
    const existing = EQ.getProfile();
    if (existing) {
      if (existing.name) document.getElementById("nameInput").value = existing.name;
      if (existing.pcmType) selectType(existing.pcmType);
    }

    document.getElementById("toggleQuiz").addEventListener("click", () => {
      document.getElementById("quizBox").classList.toggle("hidden");
    });
    document.getElementById("quizResult").addEventListener("click", computeQuiz);

    const editBtn = document.getElementById("editProfile");
    if (editBtn) editBtn.addEventListener("click", () => {
      document.getElementById("profileSummary").classList.add("hidden");
      document.getElementById("start").classList.remove("hidden");
      document.getElementById("start").scrollIntoView({ behavior: "smooth" });
    });

    document.getElementById("saveProfileBtn").addEventListener("click", () => {
      if (!selectedType) return;
      const existing = EQ.getProfile();
      const profile = {
        name: document.getElementById("nameInput").value.trim(),
        pcmType: selectedType,
        startDate: (existing && existing.startDate) ? existing.startDate : EQ.todayISO()
      };
      EQ.saveProfile(profile);
      const msg = document.getElementById("saveMsg");
      const t = PCM.TYPES[selectedType];
      msg.innerHTML = `Profil enregistré : ${t.emoji} <strong>${t.name}</strong>. Redirection vers votre programme…`;
      msg.classList.remove("hidden");
      setTimeout(() => { location.href = "reprogrammation.html"; }, 1100);
    });
  });
})();
