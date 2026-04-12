/**
 * visitorView.js — Painel do visitante com agendamentos
 */
import { getMyAppointments, cancelAppointment } from '../services/appointmentService.js';
import { formatTime, formatDate, getDayOfWeek } from '../utils/dateUtils.js';
import { formatStatus, getStatusColor, formatCount } from '../utils/formatters.js';
import { filterByStatus, sortByDate } from '../utils/filters.js';

export async function renderVisitorView(container, profile, showToast) {
  let appointments = [];
  let statusFilter = '';

  try {
    appointments = await getMyAppointments(profile.id);
  } catch (e) {
    container.innerHTML = `<div class="glass-card empty-state"><p>Erro ao carregar agendamentos</p></div>`;
    return;
  }

  function render() {
    let filtered = appointments;
    if (statusFilter) {
      filtered = filterByStatus(filtered, statusFilter);
    }
    filtered = sortByDate(
      filtered.map((a) => ({ ...a, date: a.time_slots?.slot_date || '' })),
      false
    );

    container.innerHTML = `
      <div class="dashboard-header">
        <h2>Meus Agendamentos</h2>
        <p>${formatCount(appointments.length, 'agendamento', 'agendamentos')} no total</p>
      </div>

      <div class="tabs">
        <button class="tab-btn ${statusFilter === '' ? 'active' : ''}" data-status="">Todos</button>
        <button class="tab-btn ${statusFilter === 'pending' ? 'active' : ''}" data-status="pending">Pendentes</button>
        <button class="tab-btn ${statusFilter === 'confirmed' ? 'active' : ''}" data-status="confirmed">Confirmados</button>
        <button class="tab-btn ${statusFilter === 'cancelled' ? 'active' : ''}" data-status="cancelled">Cancelados</button>
      </div>

      ${filtered.length > 0 ? `
        <div class="appointments-list">
          ${filtered.map((apt) => {
            const slot = apt.time_slots;
            const est = apt.establishments;
            const dateStr = slot?.slot_date || '';
            const parts = dateStr.split('-');
            return `
              <div class="glass-card appointment-card">
                <div class="appointment-date">
                  <div class="apt-day">${parts[2] || '--'}</div>
                  <div class="apt-month">${parts[1] || ''}</div>
                </div>
                <div class="appointment-info">
                  <div class="apt-establishment">${est?.name || 'Estabelecimento'}</div>
                  <div class="apt-time">
                    ${slot ? formatTime(slot.start_time) + ' - ' + formatTime(slot.end_time) : ''}
                    ${est?.city ? ' · ' + est.city : ''}
                    ${dateStr ? ' · ' + getDayOfWeek(dateStr) : ''}
                  </div>
                  ${apt.notes ? `<div style="font-size:var(--font-xs);color:var(--text-muted);margin-top:2px;">Nota: ${apt.notes}</div>` : ''}
                </div>
                <div style="display:flex;flex-direction:column;align-items:flex-end;gap:var(--space-xs);">
                  <span class="badge ${getStatusColor(apt.status)}">${formatStatus(apt.status)}</span>
                  ${apt.status === 'pending' || apt.status === 'confirmed' ? `
                    <button class="btn btn-danger btn-sm" data-cancel-id="${apt.id}">Cancelar</button>
                  ` : ''}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      ` : `
        <div class="glass-card empty-state">
          <p>${statusFilter ? 'Nenhum agendamento com este status' : 'Você ainda não tem agendamentos'}</p>
        </div>
      `}
    `;

    // Tab events
    container.querySelectorAll('.tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        statusFilter = btn.dataset.status;
        render();
      });
    });

    // Cancel events
    container.querySelectorAll('[data-cancel-id]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!confirm('Tem certeza que deseja cancelar este agendamento?')) return;
        try {
          await cancelAppointment(btn.dataset.cancelId);
          showToast('Agendamento cancelado', 'info');
          appointments = await getMyAppointments(profile.id);
          render();
        } catch (err) {
          showToast(err.message || 'Erro ao cancelar', 'error');
        }
      });
    });
  }

  render();
}
