/**
 * establishmentView.js — Cadastro e edição de estabelecimento + browse para visitantes
 */
import { createEstablishment, getMyEstablishment, updateEstablishment, getAllEstablishments } from '../services/establishmentService.js';
import { getSlotsByEstablishment } from '../services/timeSlotService.js';
import { createAppointment } from '../services/appointmentService.js';
import { filterByCity, filterAvailableSlots, searchByName } from '../utils/filters.js';
import { formatTime, formatDate } from '../utils/dateUtils.js';
import { isValidName, isValidCity } from '../utils/validators.js';

/**
 * Renderiza a view de configuração do estabelecimento (para owner)
 */
export async function renderEstablishmentSetupView(container, profile, showToast, navigate) {
  let establishment = null;
  try {
    establishment = await getMyEstablishment(profile.id);
  } catch (e) { /* ignore */ }

  const isEdit = !!establishment;

  container.innerHTML = `
    <div class="dashboard-header">
      <h2>🏢 ${isEdit ? 'Editar' : 'Cadastrar'} Estabelecimento</h2>
      <p>${isEdit ? 'Atualize os dados do seu estabelecimento' : 'Configure seu estabelecimento para começar a receber agendamentos'}</p>
    </div>

    <div class="glass-card" style="max-width:600px;">
      <form id="establishment-form">
        <div class="form-group">
          <label class="form-label" for="est-name">Nome do Estabelecimento</label>
          <input class="form-input" type="text" id="est-name" value="${establishment?.name || ''}" placeholder="Ex: Salão Bela Vista" required />
          <span class="form-error" id="error-est-name"></span>
        </div>

        <div class="form-group">
          <label class="form-label" for="est-category">Categoria</label>
          <input class="form-input" type="text" id="est-category" value="${establishment?.category || ''}" placeholder="Ex: Salão de Beleza, Consultório, Academia..." />
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="est-city">Cidade</label>
            <input class="form-input" type="text" id="est-city" value="${establishment?.city || ''}" placeholder="Ex: São Paulo" required />
            <span class="form-error" id="error-est-city"></span>
          </div>
          <div class="form-group">
            <label class="form-label" for="est-phone">Telefone</label>
            <input class="form-input" type="tel" id="est-phone" value="${establishment?.phone || ''}" placeholder="(11) 99999-9999" />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" for="est-address">Endereço</label>
          <input class="form-input" type="text" id="est-address" value="${establishment?.address || ''}" placeholder="Rua, número, bairro" />
        </div>

        <div class="form-group">
          <label class="form-label" for="est-description">Descrição</label>
          <textarea class="form-input form-textarea" id="est-description" placeholder="Descreva seu estabelecimento...">${establishment?.description || ''}</textarea>
        </div>

        <div style="display:flex;gap:var(--space-sm);">
          <button type="submit" class="btn btn-primary btn-lg" id="btn-save-est">${isEdit ? 'Salvar Alterações' : 'Cadastrar'}</button>
          <button type="button" class="btn btn-ghost btn-lg" id="btn-back-dashboard">Voltar</button>
        </div>
      </form>
    </div>
  `;

  document.getElementById('btn-back-dashboard')?.addEventListener('click', () => navigate('dashboard'));

  document.getElementById('establishment-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-save-est');
    btn.disabled = true;
    btn.textContent = 'Salvando...';

    const data = {
      name: document.getElementById('est-name').value.trim(),
      category: document.getElementById('est-category').value.trim(),
      city: document.getElementById('est-city').value.trim(),
      phone: document.getElementById('est-phone').value.trim(),
      address: document.getElementById('est-address').value.trim(),
      description: document.getElementById('est-description').value.trim(),
    };

    // Validate
    if (!isValidName(data.name) || data.name.length < 2) {
      document.getElementById('error-est-name').textContent = 'Nome é obrigatório';
      btn.disabled = false;
      btn.textContent = isEdit ? 'Salvar Alterações' : 'Cadastrar';
      return;
    }

    try {
      if (isEdit) {
        await updateEstablishment(establishment.id, data);
        showToast('Estabelecimento atualizado!', 'success');
      } else {
        data.owner_id = profile.id;
        await createEstablishment(data);
        showToast('Estabelecimento cadastrado!', 'success');
      }
      navigate('dashboard');
    } catch (err) {
      showToast(err.message || 'Erro ao salvar', 'error');
      btn.disabled = false;
      btn.textContent = isEdit ? 'Salvar Alterações' : 'Cadastrar';
    }
  });
}

/**
 * Renderiza a view de busca de estabelecimentos (para visitante)
 */
export async function renderBrowseView(container, profile, showToast) {
  let allEstablishments = [];
  let filtered = [];
  let cityFilter = '';
  let nameFilter = '';
  let selectedEstId = null;
  let selectedSlots = [];
  let selectedDate = '';

  try {
    allEstablishments = await getAllEstablishments();
    filtered = allEstablishments;
  } catch (e) {
    container.innerHTML = `<div class="glass-card empty-state"><p>Erro ao carregar estabelecimentos</p></div>`;
    return;
  }

  function renderList() {
    let items = allEstablishments;
    if (cityFilter) items = filterByCity(items, cityFilter);
    if (nameFilter) items = searchByName(items, nameFilter);
    filtered = items;

    const listEl = document.getElementById('establishments-list');
    if (!listEl) return;

    listEl.innerHTML = filtered.length > 0 ? filtered.map((est) => `
      <div class="glass-card establishment-card" data-est-id="${est.id}">
        <div class="est-name">${est.name}</div>
        ${est.category ? `<div class="est-category">${est.category}</div>` : ''}
        <div class="est-city">📍 ${est.city || 'Cidade não informada'}</div>
        ${est.description ? `<p style="color:var(--text-secondary);font-size:var(--font-sm);margin-top:var(--space-sm);">${est.description.substring(0, 100)}${est.description.length > 100 ? '...' : ''}</p>` : ''}
      </div>
    `).join('') : `
      <div class="glass-card empty-state">
        <div class="empty-icon">🔍</div>
        <p>Nenhum estabelecimento encontrado</p>
      </div>
    `;

    // Click handlers
    listEl.querySelectorAll('.establishment-card').forEach((card) => {
      card.addEventListener('click', () => showEstablishmentDetail(card.dataset.estId));
    });
  }

  async function showEstablishmentDetail(estId) {
    selectedEstId = estId;
    const est = allEstablishments.find((e) => e.id === estId);
    if (!est) return;

    const today = new Date();
    selectedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    try {
      selectedSlots = await getSlotsByEstablishment(estId, selectedDate);
    } catch (e) {
      selectedSlots = [];
    }

    const available = filterAvailableSlots(selectedSlots);

    // Show modal
    const existingModal = document.querySelector('.modal-overlay');
    if (existingModal) existingModal.remove();

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="glass-card modal">
        <div class="modal-header">
          <h3>${est.name}</h3>
          <button class="modal-close" id="modal-close">✕</button>
        </div>
        ${est.category ? `<p style="color:var(--accent-violet-light);font-size:var(--font-sm);margin-bottom:var(--space-sm);">${est.category}</p>` : ''}
        <p style="color:var(--text-secondary);margin-bottom:var(--space-md);">📍 ${est.city || ''} ${est.address ? '· ' + est.address : ''}</p>
        ${est.description ? `<p style="margin-bottom:var(--space-lg);">${est.description}</p>` : ''}

        <div class="form-group">
          <label class="form-label">Data</label>
          <input class="form-input" type="date" id="modal-date" value="${selectedDate}" min="${selectedDate}" />
        </div>

        <h4 style="margin-bottom:var(--space-sm);">Horários Disponíveis</h4>
        <div id="modal-slots" class="slot-list" style="max-height:200px;">
          ${available.length > 0 ? available.map((s) => `
            <div class="slot-item" style="cursor:pointer;" data-slot-id="${s.id}">
              <div class="slot-time">${formatTime(s.start_time)} - ${formatTime(s.end_time)}</div>
              <span class="badge status-confirmed">Agendar</span>
            </div>
          `).join('') : `
            <div class="empty-state" style="padding:var(--space-md);"><p>Sem horários disponíveis nesta data</p></div>
          `}
        </div>

        <div class="form-group" style="margin-top:var(--space-md);">
          <label class="form-label">Observações (opcional)</label>
          <textarea class="form-input form-textarea" id="modal-notes" placeholder="Alguma observação para o estabelecimento..."></textarea>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Close modal
    modal.querySelector('#modal-close').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

    // Date change
    modal.querySelector('#modal-date').addEventListener('change', async (e) => {
      selectedDate = e.target.value;
      try {
        selectedSlots = await getSlotsByEstablishment(estId, selectedDate);
        const avail = filterAvailableSlots(selectedSlots);
        const slotsContainer = modal.querySelector('#modal-slots');
        slotsContainer.innerHTML = avail.length > 0 ? avail.map((s) => `
          <div class="slot-item" style="cursor:pointer;" data-slot-id="${s.id}">
            <div class="slot-time">${formatTime(s.start_time)} - ${formatTime(s.end_time)}</div>
            <span class="badge status-confirmed">Agendar</span>
          </div>
        `).join('') : `<div class="empty-state" style="padding:var(--space-md);"><p>Sem horários disponíveis</p></div>`;

        // Re-bind click
        slotsContainer.querySelectorAll('.slot-item').forEach((item) => {
          item.addEventListener('click', () => bookSlot(estId, item.dataset.slotId, modal));
        });
      } catch (err) { /* ignore */ }
    });

    // Book slot
    modal.querySelectorAll('.slot-item').forEach((item) => {
      item.addEventListener('click', () => bookSlot(estId, item.dataset.slotId, modal));
    });
  }

  async function bookSlot(estId, slotId, modal) {
    const notes = modal.querySelector('#modal-notes')?.value || '';
    try {
      await createAppointment({
        visitor_id: profile.id,
        establishment_id: estId,
        time_slot_id: slotId,
        status: 'pending',
        notes,
      });
      showToast('Agendamento realizado! Status: Pendente', 'success');
      modal.remove();
    } catch (err) {
      showToast(err.message || 'Erro ao agendar', 'error');
    }
  }

  // Initial render
  container.innerHTML = `
    <div class="dashboard-header">
      <h2>🔍 Buscar Estabelecimentos</h2>
      <p>Encontre estabelecimentos e agende sua visita</p>
    </div>

    <div class="filter-bar">
      <input class="form-input" type="text" id="filter-name" placeholder="🔍 Buscar por nome..." />
      <input class="form-input" type="text" id="filter-city" placeholder="📍 Filtrar por cidade..." />
    </div>

    <div class="establishment-grid" id="establishments-list"></div>
  `;

  renderList();

  document.getElementById('filter-city').addEventListener('input', (e) => {
    cityFilter = e.target.value;
    renderList();
  });

  document.getElementById('filter-name').addEventListener('input', (e) => {
    nameFilter = e.target.value;
    renderList();
  });
}
