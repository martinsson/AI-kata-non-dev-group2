(() => {
  'use strict';

  const STORAGE_KEY = 'gestion-locative-v1';

  const defaultState = () => ({
    apartments: [],
    tenants: [],
    leases: [],
    payments: [],
    charges: [],
  });

  let state = load();
  let currentView = 'dashboard';

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultState();
      const parsed = JSON.parse(raw);
      return { ...defaultState(), ...parsed };
    } catch (e) {
      console.warn('Données corrompues, réinitialisation', e);
      return defaultState();
    }
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function fmtMoney(n) {
    const v = Number(n) || 0;
    return v.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 });
  }

  function fmtDate(s) {
    if (!s) return '';
    const d = new Date(s);
    if (isNaN(d)) return s;
    return d.toLocaleDateString('fr-FR');
  }

  function todayISO() {
    return new Date().toISOString().slice(0, 10);
  }

  function findApartment(id) { return state.apartments.find(a => a.id === id); }
  function findTenant(id) { return state.tenants.find(t => t.id === id); }
  function findLease(id) { return state.leases.find(l => l.id === id); }

  function leaseLabel(lease) {
    if (!lease) return '—';
    const apt = findApartment(lease.apartmentId);
    const ten = findTenant(lease.tenantId);
    const aptName = apt ? apt.name : 'Appartement supprimé';
    const tenName = ten ? `${ten.firstName} ${ten.lastName}`.trim() : 'Locataire supprimé';
    return `${aptName} — ${tenName}`;
  }

  function isLeaseActive(lease) {
    const today = todayISO();
    if (lease.endDate && lease.endDate < today) return false;
    if (lease.startDate && lease.startDate > today) return false;
    return true;
  }

  // ---------- Rendering ----------

  function setView(name) {
    currentView = name;
    document.querySelectorAll('#nav button').forEach(b => {
      b.classList.toggle('active', b.dataset.view === name);
    });
    render();
  }

  function render() {
    const app = document.getElementById('app');
    app.innerHTML = '';
    const tpl = document.getElementById(`tpl-${currentView}`);
    if (!tpl) return;
    const node = tpl.content.cloneNode(true);
    app.appendChild(node);
    const renderers = {
      dashboard: renderDashboard,
      apartments: renderApartments,
      tenants: renderTenants,
      leases: renderLeases,
      payments: renderPayments,
      charges: renderCharges,
    };
    renderers[currentView]?.();
  }

  function renderDashboard() {
    const stats = computeStats();
    setStat('apartments', stats.apartments);
    setStat('tenants', stats.tenants);
    setStat('activeLeases', stats.activeLeases);
    setStat('monthlyRent', fmtMoney(stats.monthlyRent));
    setStat('unpaid', fmtMoney(stats.unpaid));
    setStat('yearCharges', fmtMoney(stats.yearCharges));

    const activeBody = document.querySelector('[data-list="active-leases"] tbody');
    const active = state.leases.filter(isLeaseActive);
    if (!active.length) {
      activeBody.innerHTML = `<tr><td colspan="6" class="empty-state">Aucune location active</td></tr>`;
    } else {
      activeBody.innerHTML = active.map(l => {
        const apt = findApartment(l.apartmentId);
        const ten = findTenant(l.tenantId);
        return `<tr>
          <td>${escape(apt?.name || '—')}</td>
          <td>${escape(ten ? `${ten.firstName} ${ten.lastName}` : '—')}</td>
          <td>${fmtDate(l.startDate)}</td>
          <td>${fmtDate(l.endDate) || '—'}</td>
          <td>${fmtMoney(l.monthlyRent)}</td>
          <td>${fmtMoney(l.monthlyCharges)}</td>
        </tr>`;
      }).join('');
    }

    const recentBody = document.querySelector('[data-list="recent-payments"] tbody');
    const recent = [...state.payments].sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 8);
    if (!recent.length) {
      recentBody.innerHTML = `<tr><td colspan="5" class="empty-state">Aucun paiement</td></tr>`;
    } else {
      recentBody.innerHTML = recent.map(p => `<tr>
        <td>${fmtDate(p.date)}</td>
        <td>${escape(leaseLabel(findLease(p.leaseId)))}</td>
        <td>${p.type === 'charges' ? 'Charges' : 'Loyer'}</td>
        <td>${fmtMoney(p.amount)}</td>
        <td>${statusBadge(p.status)}</td>
      </tr>`).join('');
    }
  }

  function setStat(name, value) {
    const el = document.querySelector(`[data-stat="${name}"]`);
    if (el) el.textContent = value;
  }

  function computeStats() {
    const active = state.leases.filter(isLeaseActive);
    const monthlyRent = active.reduce((s, l) => s + (Number(l.monthlyRent) || 0) + (Number(l.monthlyCharges) || 0), 0);
    const unpaid = state.payments.filter(p => p.status === 'pending').reduce((s, p) => s + (Number(p.amount) || 0), 0);
    const oneYearAgo = new Date(); oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const yearCharges = state.charges
      .filter(c => c.date && new Date(c.date) >= oneYearAgo)
      .reduce((s, c) => s + (Number(c.amount) || 0), 0);
    return {
      apartments: state.apartments.length,
      tenants: state.tenants.length,
      activeLeases: active.length,
      monthlyRent,
      unpaid,
      yearCharges,
    };
  }

  function renderApartments() {
    bindAdd(() => openApartmentForm());
    const tbody = document.querySelector('[data-list="apartments"] tbody');
    if (!state.apartments.length) {
      tbody.innerHTML = `<tr><td colspan="6" class="empty-state">Aucun appartement. Ajoutez-en un pour commencer.</td></tr>`;
      return;
    }
    tbody.innerHTML = state.apartments.map(a => `<tr>
      <td>${escape(a.name)}</td>
      <td>${escape(a.address || '')}</td>
      <td>${a.surface ? a.surface + ' m²' : ''}</td>
      <td>${a.rooms || ''}</td>
      <td>${escape(a.notes || '')}</td>
      <td class="row-actions">
        <button class="small" data-edit="${a.id}">Modifier</button>
        <button class="small danger" data-delete="${a.id}">Supprimer</button>
      </td>
    </tr>`).join('');
    tbody.querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', () => openApartmentForm(b.dataset.edit)));
    tbody.querySelectorAll('[data-delete]').forEach(b => b.addEventListener('click', () => deleteApartment(b.dataset.delete)));
  }

  function renderTenants() {
    bindAdd(() => openTenantForm());
    const tbody = document.querySelector('[data-list="tenants"] tbody');
    if (!state.tenants.length) {
      tbody.innerHTML = `<tr><td colspan="6" class="empty-state">Aucun locataire.</td></tr>`;
      return;
    }
    tbody.innerHTML = state.tenants.map(t => `<tr>
      <td>${escape(t.lastName)}</td>
      <td>${escape(t.firstName)}</td>
      <td>${escape(t.email || '')}</td>
      <td>${escape(t.phone || '')}</td>
      <td>${escape(t.notes || '')}</td>
      <td class="row-actions">
        <button class="small" data-edit="${t.id}">Modifier</button>
        <button class="small danger" data-delete="${t.id}">Supprimer</button>
      </td>
    </tr>`).join('');
    tbody.querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', () => openTenantForm(b.dataset.edit)));
    tbody.querySelectorAll('[data-delete]').forEach(b => b.addEventListener('click', () => deleteTenant(b.dataset.delete)));
  }

  function renderLeases() {
    bindAdd(() => openLeaseForm());
    const tbody = document.querySelector('[data-list="leases"] tbody');
    if (!state.leases.length) {
      tbody.innerHTML = `<tr><td colspan="9" class="empty-state">Aucune location.</td></tr>`;
      return;
    }
    tbody.innerHTML = state.leases.map(l => {
      const apt = findApartment(l.apartmentId);
      const ten = findTenant(l.tenantId);
      const active = isLeaseActive(l);
      return `<tr>
        <td>${escape(apt?.name || '—')}</td>
        <td>${escape(ten ? `${ten.firstName} ${ten.lastName}` : '—')}</td>
        <td>${fmtDate(l.startDate)}</td>
        <td>${fmtDate(l.endDate) || '—'}</td>
        <td>${fmtMoney(l.monthlyRent)}</td>
        <td>${fmtMoney(l.monthlyCharges)}</td>
        <td>${fmtMoney(l.deposit)}</td>
        <td>${active ? '<span class="badge active">Active</span>' : '<span class="badge ended">Terminée</span>'}</td>
        <td class="row-actions">
          <button class="small" data-edit="${l.id}">Modifier</button>
          <button class="small danger" data-delete="${l.id}">Supprimer</button>
        </td>
      </tr>`;
    }).join('');
    tbody.querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', () => openLeaseForm(b.dataset.edit)));
    tbody.querySelectorAll('[data-delete]').forEach(b => b.addEventListener('click', () => deleteLease(b.dataset.delete)));
  }

  function renderPayments() {
    bindAdd(() => openPaymentForm());
    const generateBtn = document.querySelector('[data-action="generate"]');
    generateBtn?.addEventListener('click', generateMonthlyPayments);

    const leaseSelect = document.querySelector('[data-filter="lease"]');
    state.leases.forEach(l => {
      const o = document.createElement('option');
      o.value = l.id;
      o.textContent = leaseLabel(l);
      leaseSelect.appendChild(o);
    });

    const apply = () => {
      const leaseFilter = leaseSelect.value;
      const statusFilter = document.querySelector('[data-filter="status"]').value;
      let rows = [...state.payments];
      if (leaseFilter) rows = rows.filter(p => p.leaseId === leaseFilter);
      if (statusFilter) rows = rows.filter(p => p.status === statusFilter);
      rows.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      const tbody = document.querySelector('[data-list="payments"] tbody');
      if (!rows.length) {
        tbody.innerHTML = `<tr><td colspan="7" class="empty-state">Aucun paiement.</td></tr>`;
        return;
      }
      tbody.innerHTML = rows.map(p => `<tr>
        <td>${fmtDate(p.date)}</td>
        <td>${escape(leaseLabel(findLease(p.leaseId)))}</td>
        <td>${p.type === 'charges' ? 'Charges' : 'Loyer'}</td>
        <td>${fmtMoney(p.amount)}</td>
        <td>${statusBadge(p.status)}</td>
        <td>${escape(p.note || '')}</td>
        <td class="row-actions">
          ${p.status === 'pending' ? `<button class="small" data-mark="${p.id}">Marquer payé</button>` : ''}
          <button class="small" data-edit="${p.id}">Modifier</button>
          <button class="small danger" data-delete="${p.id}">Supprimer</button>
        </td>
      </tr>`).join('');
      tbody.querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', () => openPaymentForm(b.dataset.edit)));
      tbody.querySelectorAll('[data-delete]').forEach(b => b.addEventListener('click', () => deletePayment(b.dataset.delete)));
      tbody.querySelectorAll('[data-mark]').forEach(b => b.addEventListener('click', () => markPaid(b.dataset.mark)));
    };
    leaseSelect.addEventListener('change', apply);
    document.querySelector('[data-filter="status"]').addEventListener('change', apply);
    apply();
  }

  function renderCharges() {
    bindAdd(() => openChargeForm());
    const aptSelect = document.querySelector('[data-filter="apartment"]');
    state.apartments.forEach(a => {
      const o = document.createElement('option');
      o.value = a.id;
      o.textContent = a.name;
      aptSelect.appendChild(o);
    });

    const apply = () => {
      const f = aptSelect.value;
      let rows = [...state.charges];
      if (f) rows = rows.filter(c => c.apartmentId === f);
      rows.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      const tbody = document.querySelector('[data-list="charges"] tbody');
      if (!rows.length) {
        tbody.innerHTML = `<tr><td colspan="6" class="empty-state">Aucune charge.</td></tr>`;
        return;
      }
      tbody.innerHTML = rows.map(c => `<tr>
        <td>${fmtDate(c.date)}</td>
        <td>${escape(findApartment(c.apartmentId)?.name || '—')}</td>
        <td>${escape(c.category || '')}</td>
        <td>${escape(c.label || '')}</td>
        <td>${fmtMoney(c.amount)}</td>
        <td class="row-actions">
          <button class="small" data-edit="${c.id}">Modifier</button>
          <button class="small danger" data-delete="${c.id}">Supprimer</button>
        </td>
      </tr>`).join('');
      tbody.querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', () => openChargeForm(b.dataset.edit)));
      tbody.querySelectorAll('[data-delete]').forEach(b => b.addEventListener('click', () => deleteCharge(b.dataset.delete)));
    };
    aptSelect.addEventListener('change', apply);
    apply();
  }

  function bindAdd(handler) {
    const btn = document.querySelector('[data-action="add"]');
    btn?.addEventListener('click', handler);
  }

  function statusBadge(status) {
    if (status === 'paid') return '<span class="badge paid">Payé</span>';
    return '<span class="badge pending">En attente</span>';
  }

  function escape(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  // ---------- Modal forms ----------

  const modal = document.getElementById('modal');
  const modalTitle = document.getElementById('modal-title');
  const modalForm = document.getElementById('modal-form');

  document.getElementById('modal-close').addEventListener('click', closeModal);
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !modal.hidden) closeModal(); });

  function openModal(title, fields, initial, onSubmit) {
    modalTitle.textContent = title;
    modalForm.innerHTML = '';
    const data = { ...initial };
    fields.forEach(f => {
      if (f.type === 'row') {
        const row = document.createElement('div');
        row.className = 'field-row';
        f.fields.forEach(sub => row.appendChild(buildField(sub, data)));
        modalForm.appendChild(row);
      } else {
        modalForm.appendChild(buildField(f, data));
      }
    });
    const actions = document.createElement('div');
    actions.className = 'modal-actions';
    actions.innerHTML = `<button type="button" class="ghost" id="cancel-btn">Annuler</button><button type="submit" class="primary">Enregistrer</button>`;
    modalForm.appendChild(actions);
    modalForm.querySelector('#cancel-btn').addEventListener('click', closeModal);
    modalForm.onsubmit = (e) => {
      e.preventDefault();
      const formData = collect(modalForm, fields);
      onSubmit(formData);
      closeModal();
      render();
    };
    modal.hidden = false;
    setTimeout(() => modalForm.querySelector('input,select,textarea')?.focus(), 30);
  }

  function buildField(f, data) {
    const wrap = document.createElement('div');
    wrap.className = 'field';
    const id = `f-${f.name}`;
    wrap.innerHTML = `<label for="${id}">${f.label}${f.required ? ' *' : ''}</label>`;
    let el;
    const value = data[f.name] ?? f.default ?? '';
    if (f.type === 'select') {
      el = document.createElement('select');
      el.id = id; el.name = f.name;
      if (!f.required) el.appendChild(new Option('—', ''));
      f.options.forEach(o => {
        const opt = new Option(o.label, o.value);
        if (String(value) === String(o.value)) opt.selected = true;
        el.appendChild(opt);
      });
    } else if (f.type === 'textarea') {
      el = document.createElement('textarea');
      el.id = id; el.name = f.name;
      el.value = value;
    } else {
      el = document.createElement('input');
      el.id = id; el.name = f.name;
      el.type = f.type || 'text';
      if (f.step) el.step = f.step;
      if (f.min !== undefined) el.min = f.min;
      el.value = value;
    }
    if (f.required) el.required = true;
    wrap.appendChild(el);
    return wrap;
  }

  function flatten(fields) {
    const out = [];
    fields.forEach(f => f.type === 'row' ? out.push(...f.fields) : out.push(f));
    return out;
  }

  function collect(form, fields) {
    const flat = flatten(fields);
    const out = {};
    flat.forEach(f => {
      const el = form.elements[f.name];
      if (!el) return;
      let v = el.value;
      if (f.type === 'number') v = v === '' ? null : Number(v);
      out[f.name] = v;
    });
    return out;
  }

  function closeModal() {
    modal.hidden = true;
    modalForm.innerHTML = '';
  }

  // ---------- Apartments ----------

  function openApartmentForm(id) {
    const editing = id ? findApartment(id) : null;
    openModal(editing ? 'Modifier l\'appartement' : 'Nouvel appartement', [
      { name: 'name', label: 'Nom / référence', required: true },
      { name: 'address', label: 'Adresse' },
      { type: 'row', fields: [
        { name: 'surface', label: 'Surface (m²)', type: 'number', step: '0.1', min: 0 },
        { name: 'rooms', label: 'Nombre de pièces', type: 'number', min: 0 },
      ]},
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ], editing || {}, (data) => {
      if (editing) Object.assign(editing, data);
      else state.apartments.push({ id: uid(), ...data });
      save();
    });
  }

  function deleteApartment(id) {
    const used = state.leases.some(l => l.apartmentId === id) || state.charges.some(c => c.apartmentId === id);
    if (used && !confirm('Cet appartement est utilisé par des locations ou charges. Supprimer quand même ?')) return;
    if (!used && !confirm('Supprimer cet appartement ?')) return;
    state.apartments = state.apartments.filter(a => a.id !== id);
    save(); render();
  }

  // ---------- Tenants ----------

  function openTenantForm(id) {
    const editing = id ? findTenant(id) : null;
    openModal(editing ? 'Modifier le locataire' : 'Nouveau locataire', [
      { type: 'row', fields: [
        { name: 'lastName', label: 'Nom', required: true },
        { name: 'firstName', label: 'Prénom', required: true },
      ]},
      { name: 'email', label: 'Email', type: 'email' },
      { name: 'phone', label: 'Téléphone' },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ], editing || {}, (data) => {
      if (editing) Object.assign(editing, data);
      else state.tenants.push({ id: uid(), ...data });
      save();
    });
  }

  function deleteTenant(id) {
    const used = state.leases.some(l => l.tenantId === id);
    if (used && !confirm('Ce locataire a des locations. Supprimer quand même ?')) return;
    if (!used && !confirm('Supprimer ce locataire ?')) return;
    state.tenants = state.tenants.filter(t => t.id !== id);
    save(); render();
  }

  // ---------- Leases ----------

  function openLeaseForm(id) {
    if (!state.apartments.length || !state.tenants.length) {
      alert('Ajoutez au moins un appartement et un locataire avant de créer une location.');
      return;
    }
    const editing = id ? findLease(id) : null;
    openModal(editing ? 'Modifier la location' : 'Nouvelle location', [
      { name: 'apartmentId', label: 'Appartement', type: 'select', required: true,
        options: state.apartments.map(a => ({ value: a.id, label: a.name })) },
      { name: 'tenantId', label: 'Locataire', type: 'select', required: true,
        options: state.tenants.map(t => ({ value: t.id, label: `${t.firstName} ${t.lastName}` })) },
      { type: 'row', fields: [
        { name: 'startDate', label: 'Date de début', type: 'date', required: true, default: todayISO() },
        { name: 'endDate', label: 'Date de fin' , type: 'date' },
      ]},
      { type: 'row', fields: [
        { name: 'monthlyRent', label: 'Loyer mensuel (€)', type: 'number', step: '0.01', min: 0, required: true },
        { name: 'monthlyCharges', label: 'Charges mensuelles (€)', type: 'number', step: '0.01', min: 0, default: 0 },
      ]},
      { name: 'deposit', label: 'Dépôt de garantie (€)', type: 'number', step: '0.01', min: 0 },
    ], editing || {}, (data) => {
      if (editing) Object.assign(editing, data);
      else state.leases.push({ id: uid(), ...data });
      save();
    });
  }

  function deleteLease(id) {
    const used = state.payments.some(p => p.leaseId === id);
    if (used && !confirm('Cette location a des paiements. Supprimer quand même ?')) return;
    if (!used && !confirm('Supprimer cette location ?')) return;
    state.leases = state.leases.filter(l => l.id !== id);
    save(); render();
  }

  // ---------- Payments ----------

  function openPaymentForm(id) {
    if (!state.leases.length) {
      alert('Créez d\'abord une location.');
      return;
    }
    const editing = id ? state.payments.find(p => p.id === id) : null;
    openModal(editing ? 'Modifier le paiement' : 'Nouveau paiement', [
      { name: 'leaseId', label: 'Location', type: 'select', required: true,
        options: state.leases.map(l => ({ value: l.id, label: leaseLabel(l) })) },
      { type: 'row', fields: [
        { name: 'date', label: 'Date', type: 'date', required: true, default: todayISO() },
        { name: 'amount', label: 'Montant (€)', type: 'number', step: '0.01', min: 0, required: true },
      ]},
      { type: 'row', fields: [
        { name: 'type', label: 'Type', type: 'select', required: true,
          options: [{ value: 'rent', label: 'Loyer' }, { value: 'charges', label: 'Charges' }] },
        { name: 'status', label: 'Statut', type: 'select', required: true,
          options: [{ value: 'paid', label: 'Payé' }, { value: 'pending', label: 'En attente' }] },
      ]},
      { name: 'note', label: 'Note', type: 'textarea' },
    ], editing || { type: 'rent', status: 'paid' }, (data) => {
      if (editing) Object.assign(editing, data);
      else state.payments.push({ id: uid(), ...data });
      save();
    });
  }

  function deletePayment(id) {
    if (!confirm('Supprimer ce paiement ?')) return;
    state.payments = state.payments.filter(p => p.id !== id);
    save(); render();
  }

  function markPaid(id) {
    const p = state.payments.find(x => x.id === id);
    if (!p) return;
    p.status = 'paid';
    save(); render();
  }

  function generateMonthlyPayments() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const monthPrefix = `${y}-${m}`;
    let added = 0;
    state.leases.filter(isLeaseActive).forEach(l => {
      const exists = state.payments.some(p => p.leaseId === l.id && p.type === 'rent' && (p.date || '').startsWith(monthPrefix));
      if (!exists && Number(l.monthlyRent) > 0) {
        state.payments.push({
          id: uid(),
          leaseId: l.id,
          date: `${monthPrefix}-05`,
          amount: Number(l.monthlyRent) + (Number(l.monthlyCharges) || 0),
          type: 'rent',
          status: 'pending',
          note: 'Généré automatiquement',
        });
        added++;
      }
    });
    save();
    render();
    alert(added ? `${added} paiement(s) généré(s) pour ${monthPrefix}.` : 'Tous les paiements du mois en cours existent déjà.');
  }

  // ---------- Charges ----------

  function openChargeForm(id) {
    if (!state.apartments.length) {
      alert('Ajoutez d\'abord un appartement.');
      return;
    }
    const editing = id ? state.charges.find(c => c.id === id) : null;
    openModal(editing ? 'Modifier la charge' : 'Nouvelle charge', [
      { name: 'apartmentId', label: 'Appartement', type: 'select', required: true,
        options: state.apartments.map(a => ({ value: a.id, label: a.name })) },
      { type: 'row', fields: [
        { name: 'date', label: 'Date', type: 'date', required: true, default: todayISO() },
        { name: 'amount', label: 'Montant (€)', type: 'number', step: '0.01', min: 0, required: true },
      ]},
      { name: 'category', label: 'Catégorie', type: 'select', required: true,
        options: [
          { value: 'Taxe foncière', label: 'Taxe foncière' },
          { value: 'Copropriété', label: 'Copropriété' },
          { value: 'Travaux', label: 'Travaux' },
          { value: 'Assurance', label: 'Assurance' },
          { value: 'Entretien', label: 'Entretien' },
          { value: 'Autre', label: 'Autre' },
        ] },
      { name: 'label', label: 'Libellé' },
    ], editing || {}, (data) => {
      if (editing) Object.assign(editing, data);
      else state.charges.push({ id: uid(), ...data });
      save();
    });
  }

  function deleteCharge(id) {
    if (!confirm('Supprimer cette charge ?')) return;
    state.charges = state.charges.filter(c => c.id !== id);
    save(); render();
  }

  // ---------- Import / Export ----------

  document.getElementById('export-btn').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gestion-locative-${todayISO()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  document.getElementById('import-btn').addEventListener('click', () => {
    document.getElementById('import-file').click();
  });

  document.getElementById('import-file').addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (!confirm('Remplacer les données actuelles par celles du fichier ?')) return;
        state = { ...defaultState(), ...parsed };
        save();
        render();
      } catch (err) {
        alert('Fichier invalide : ' + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  });

  // ---------- Init ----------

  document.querySelectorAll('#nav button').forEach(b => {
    b.addEventListener('click', () => setView(b.dataset.view));
  });

  render();
})();
