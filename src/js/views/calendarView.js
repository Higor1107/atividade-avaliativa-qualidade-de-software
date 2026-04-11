/**
 * calendarView.js — Calendário interativo + gestão de horários
 */
import { generateCalendarDays, getMonthName, formatTime, getTodayStr } from '../utils/dateUtils.js';
import { isValidTimeRange } from '../utils/validators.js';
import { getMyEstablishment } from '../services/establishmentService.js';
import { getSlotsByEstablishment, createTimeSlot, deleteTimeSlot } from '../services/timeSlotService.js';
import { getEstablishmentAppointments, updateAppointmentStatus } from '../services/appointmentService.js';
import { formatStatus, getStatusColor } from '../utils/formatters.js';

export async function renderCalendarView(container, profile, showToast) {
  const today = getTodayStr();
  const [ty, tm] = today.split('-').map(Number);
  let currentYear = ty;
  let currentMonth = tm;
  let selectedDate = today;
  let establishment = null;
  let slots = [];

  try {
    establishment = await getMyEstablishment(profile.id);
  } catch (e) { /* ignore */ }

  if (!establishment) {
    container.innerHTML = `
      <div class="glass-card empty-state">
        <div class="empty-icon">🏢</div>
        <p>Configure seu estabelecimento primeiro para gerenciar horários.</p>
      </div>
    `;
    return;
  }

  async function loadSlots() {
    try {
      slots = await getSlotsByEstablishment(establishment.id, selectedDate);
    } catch (e) {
      slots = [];
    }
  }

  async function render() {
    await loadSlots();
    const days = generateCalendarDays(currentYear, currentMonth);

    container.innerHTML = `
      <div class="dashboard-header">
        <h2>📅 Calendário de Horários</h2>
        <p>${establishment.name}</p>
      </div>

      <div class="calendar-container">
        <div class="glass-card">
          <div class="calendar-header">
            <h3>${getMonthName(currentMonth)} ${currentYear}</h3>
            <div class="calendar-nav">
              <button id="btn-prev-month" aria-label="Mês anterior">‹</button>
              <button id="btn-next-month" aria-label="Próximo mês">›</button>
            </div>
          </div>
          <div class="calendar-weekdays">
            <span>Dom</span><span>Seg</span><span>Ter</span><span>Qua</span><span>Qui</span><span>Sex</span><span>Sáb</span>
          </div>
          <div class="calendar-grid">
            ${days.map((d) => `
              <button class="calendar-day ${!d.isCurrentMonth ? 'other-month' : ''} ${d.dateStr === today ? 'today' : ''} ${d.dateStr === selectedDate ? 'selected' : ''}"
                data-date="${d.dateStr}" ${!d.isCurrentMonth ? 'disabled' : ''}>
                ${d.day}
              </button>
            `).join('')}
          </div>
        </div>

        <div class="glass-card slots-panel">
          <h3>Horários — ${selectedDate.split('-').reverse().join('/')}</h3>

          <div style="display:flex;gap:var(--space-sm);margin:var(--space-md) 0;">
            <input class="form-input" type="time" id="input-start-time" style="flex:1;" />
            <input class="form-input" type="time" id="input-end-time" style="flex:1;" />
            <button class="btn btn-primary btn-sm" id="btn-add-slot">+</button>
          </div>

          <div class="slot-list" id="slot-list">
            ${slots.length > 0 ? slots.map((slot) => `
              <div class="slot-item">
                <div>
                  <div class="slot-time">${formatTime(slot.start_time)} - ${formatTime(slot.end_time)}</div>
                  <div class="slot-status">${slot.is_available ? '🟢 Disponível' : '🔴 Ocupado'}</div>
                </div>
                ${slot.is_available ? `<button class="btn btn-danger btn-sm" data-delete-slot="${slot.id}">✕</button>` : ''}
              </div>
            `).join('') : `
              <div class="empty-state" style="padding:var(--space-xl);">
                <div class="empty-icon">🕐</div>
                <p>Nenhum horário neste dia</p>
              </div>
            `}
          </div>
        </div>
      </div>
    `;

    // Event listeners
    document.getElementById('btn-prev-month').addEventListener('click', () => {
      currentMonth--;
      if (currentMonth < 1) { currentMonth = 12; currentYear--; }
      render();
    });

    document.getElementById('btn-next-month').addEventListener('click', () => {
      currentMonth++;
      if (currentMonth > 12) { currentMonth = 1; currentYear++; }
      render();
    });

    container.querySelectorAll('.calendar-day:not([disabled])').forEach((btn) => {
      btn.addEventListener('click', () => {
        selectedDate = btn.dataset.date;
        render();
      });
    });

    // Add slot
    document.getElementById('btn-add-slot').addEventListener('click', async () => {
      const start = document.getElementById('input-start-time').value;
      const end = document.getElementById('input-end-time').value;

      if (!isValidTimeRange(start, end)) {
        showToast('Horário inválido. Início deve ser antes do fim.', 'error');
        return;
      }

      try {
        await createTimeSlot({
          establishment_id: establishment.id,
          slot_date: selectedDate,
          start_time: start,
          end_time: end,
          is_available: true,
        });
        showToast('Horário adicionado!', 'success');
        render();
      } catch (err) {
        showToast(err.message || 'Erro ao adicionar horário', 'error');
      }
    });

    // Delete slot
    container.querySelectorAll('[data-delete-slot]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        try {
          await deleteTimeSlot(btn.dataset.deleteSlot);
          showToast('Horário removido', 'info');
          render();
        } catch (err) {
          showToast(err.message || 'Erro ao remover', 'error');
        }
      });
    });
  }

  render();
}
