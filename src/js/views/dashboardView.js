/**
 * dashboardView.js — Painel principal adaptativo por role
 */
import { getMyEstablishment } from '../services/establishmentService.js';
import { getMyAppointments, getEstablishmentAppointments, updateAppointmentStatus } from '../services/appointmentService.js';
import { formatDate, formatTime, getDayOfWeek } from '../utils/dateUtils.js';
import { formatStatus, formatRole, generateInitials, getStatusColor, formatCount } from '../utils/formatters.js';

export async function renderDashboardView(container, profile, navigate) {
  container.innerHTML = `
    <div class="dor-layout" style="margin-top: var(--space-2xl);">
      <div class="dor-title-col">
        <h2>Olá, ${profile.full_name?.split(' ')[0] || 'Usuário'}</h2>
        <p>Perfil: <strong>${formatRole(profile.role)}</strong></p>
      </div>
      <div class="dor-content-col" id="dashboard-content">
        <div class="loading-spinner" style="margin:2rem auto;"></div>
      </div>
    </div>
  `;

  try {
    const role = profile.role;

    if (role === 'establishment') {
      await renderEstablishmentDashboard(container, profile, navigate);
    } else {
      await renderVisitorDashboard(container, profile, navigate);
    }
  } catch (err) {
    document.getElementById('dashboard-content').innerHTML = `
      <div class="glass-card empty-state">
        <p>${err.message || 'Erro ao carregar painel'}</p>
      </div>
    `;
  }
}

async function renderEstablishmentDashboard(container, profile, navigate) {
  const content = document.getElementById('dashboard-content');
  const establishment = await getMyEstablishment(profile.id);

  if (!establishment) {
    content.innerHTML = `
      <div class="glass-card" style="text-align:center;padding:var(--space-3xl);">
        <h3 style="margin-bottom:var(--space-sm);">Configure seu Estabelecimento</h3>
        <p style="color:var(--text-secondary);margin-bottom:var(--space-lg);">Você ainda não cadastrou seu estabelecimento. Configure agora para começar a receber agendamentos.</p>
        <button class="btn btn-primary btn-lg" id="btn-setup-establishment">Configurar Estabelecimento</button>
      </div>
    `;
    document.getElementById('btn-setup-establishment')?.addEventListener('click', () => navigate('establishment'));
    return;
  }

  const appointments = await getEstablishmentAppointments(establishment.id);
  const recent = appointments.slice(0, 5);
  
  content.innerHTML = `
    <div class="dor-tabs">
      <div class="dor-tab-btn active">Agendamentos Recentes</div>
    </div>
    ${recent.length > 0 ? `
      <div class="appointments-list">
        ${recent.map((apt) => {
          const slot = apt.time_slots;
          const visitor = apt.profiles;
          return `
            <div class="glass-card appointment-card" style="margin-bottom: var(--space-sm);">
              <div class="appointment-date">
                <div class="apt-day">${slot?.slot_date ? slot.slot_date.split('-')[2] : '--'}</div>
                <div class="apt-month">${slot?.slot_date ? slot.slot_date.split('-')[1] : ''}</div>
              </div>
              <div class="appointment-info" style="flex: 1;">
                <div class="apt-establishment">${visitor?.full_name || 'Visitante'}</div>
                <div class="apt-time">${slot ? formatTime(slot.start_time) + ' - ' + formatTime(slot.end_time) : 'Horário não definido'}</div>
              </div>
              <div style="display: flex; gap: var(--space-xs); align-items: center;">
                <span class="badge ${getStatusColor(apt.status)}">${formatStatus(apt.status)}</span>
                ${apt.status === 'pending' ? `
                  <button class="btn btn-primary btn-sm btn-confirm-apt" data-apt-id="${apt.id}">✓</button>
                  <button class="btn btn-danger btn-sm btn-cancel-apt" data-apt-id="${apt.id}">✕</button>
                ` : ''}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    ` : `
      <div class="glass-card empty-state">
        <p>Nenhum agendamento ainda</p>
      </div>
    `}
    <div style="margin-top:var(--space-lg);display:flex;gap:var(--space-sm);">
      <button class="btn btn-primary" id="btn-go-calendar">Gerenciar Horários</button>
      <button class="btn btn-ghost" id="btn-go-establishment">Editar Estabelecimento</button>
    </div>
  `;

  // Action listeners for confirm/cancel
  document.querySelectorAll('.btn-confirm-apt').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const aptId = e.target.dataset.aptId;
      try {
        await updateAppointmentStatus(aptId, 'confirmed');
        renderDashboardView(container, profile, navigate);
      } catch (err) {
        alert(err.message || 'Erro ao confirmar agendamento');
      }
    });
  });

  document.querySelectorAll('.btn-cancel-apt').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const aptId = e.target.dataset.aptId;
      if (confirm('Tem certeza que deseja cancelar este agendamento?')) {
        try {
          await updateAppointmentStatus(aptId, 'cancelled');
          renderDashboardView(container, profile, navigate);
        } catch (err) {
          alert(err.message || 'Erro ao cancelar agendamento');
        }
      }
    });
  });

  document.getElementById('btn-go-calendar')?.addEventListener('click', () => navigate('calendar'));
  document.getElementById('btn-go-establishment')?.addEventListener('click', () => navigate('establishment'));
}

async function renderVisitorDashboard(container, profile, navigate) {
  const appointments = await getMyAppointments(profile.id);
  const statsGrid = document.getElementById('stats-grid');
  const content = document.getElementById('dashboard-content');

  const pending = appointments.filter((a) => a.status === 'pending').length;
  const confirmed = appointments.filter((a) => a.status === 'confirmed').length;

  const upcoming = appointments.filter((a) => a.status !== 'cancelled').slice(0, 5);
  
  content.innerHTML = `
    <div class="dor-tabs">
      <div class="dor-tab-btn active">Próximos Agendamentos</div>
    </div>
    ${upcoming.length > 0 ? `
      <div class="appointments-list">
        ${upcoming.map((apt) => {
          const slot = apt.time_slots;
          const est = apt.establishments;
          return `
            <div class="glass-card appointment-card" style="margin-bottom: var(--space-sm);">
              <div class="appointment-date">
                <div class="apt-day">${slot?.slot_date ? slot.slot_date.split('-')[2] : '--'}</div>
                <div class="apt-month">${slot?.slot_date ? slot.slot_date.split('-')[1] : ''}</div>
              </div>
              <div class="appointment-info">
                <div class="apt-establishment">${est?.name || 'Estabelecimento'}</div>
                <div class="apt-time">${slot ? formatTime(slot.start_time) + ' - ' + formatTime(slot.end_time) : ''} ${est?.city ? '· ' + est.city : ''}</div>
              </div>
              <span class="badge ${getStatusColor(apt.status)}">${formatStatus(apt.status)}</span>
            </div>
          `;
        }).join('')}
      </div>
    ` : `
      <div class="glass-card empty-state">
        <p>Você ainda não tem agendamentos</p>
      </div>
    `}
    <div style="margin-top:var(--space-lg);">
      <button class="btn btn-primary" id="btn-browse">Buscar Especialistas</button>
    </div>
  `;

  document.getElementById('btn-browse')?.addEventListener('click', () => navigate('browse'));
}
