/**
 * dashboardView.js — Painel principal adaptativo por role
 */
import { getMyEstablishment } from '../services/establishmentService.js';
import { getMyAppointments, getEstablishmentAppointments } from '../services/appointmentService.js';
import { formatDate, formatTime, getDayOfWeek } from '../utils/dateUtils.js';
import { formatStatus, formatRole, generateInitials, getStatusColor, formatCount } from '../utils/formatters.js';

export async function renderDashboardView(container, profile, navigate) {
  container.innerHTML = `
    <div class="dashboard-header">
      <h2>👋 Olá, ${profile.full_name?.split(' ')[0] || 'Usuário'}!</h2>
      <p>Papel: <strong>${formatRole(profile.role)}</strong></p>
    </div>
    <div class="stats-grid" id="stats-grid">
      <div class="glass-card stat-card"><div class="loading-spinner" style="width:24px;height:24px;margin:0 auto;"></div></div>
    </div>
    <div id="dashboard-content"></div>
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
        <div class="empty-icon">⚠️</div>
        <p>${err.message || 'Erro ao carregar painel'}</p>
      </div>
    `;
  }
}

async function renderEstablishmentDashboard(container, profile, navigate) {
  const establishment = await getMyEstablishment(profile.id);
  const statsGrid = document.getElementById('stats-grid');
  const content = document.getElementById('dashboard-content');

  if (!establishment) {
    statsGrid.innerHTML = '';
    content.innerHTML = `
      <div class="glass-card" style="text-align:center;padding:var(--space-3xl);">
        <div class="empty-icon" style="font-size:3rem;margin-bottom:var(--space-md);">🏢</div>
        <h3 style="margin-bottom:var(--space-sm);">Configure seu Estabelecimento</h3>
        <p style="color:var(--text-secondary);margin-bottom:var(--space-lg);">Você ainda não cadastrou seu estabelecimento. Configure agora para começar a receber agendamentos.</p>
        <button class="btn btn-primary btn-lg" id="btn-setup-establishment">Configurar Estabelecimento</button>
      </div>
    `;
    document.getElementById('btn-setup-establishment')?.addEventListener('click', () => navigate('establishment'));
    return;
  }

  const appointments = await getEstablishmentAppointments(establishment.id);
  const pending = appointments.filter((a) => a.status === 'pending').length;
  const confirmed = appointments.filter((a) => a.status === 'confirmed').length;
  const total = appointments.length;

  statsGrid.innerHTML = `
    <div class="glass-card stat-card" style="animation-delay:0.1s">
      <div class="stat-value">${total}</div>
      <div class="stat-label">Agendamentos Total</div>
    </div>
    <div class="glass-card stat-card" style="animation-delay:0.2s">
      <div class="stat-value">${pending}</div>
      <div class="stat-label">Pendentes</div>
    </div>
    <div class="glass-card stat-card" style="animation-delay:0.3s">
      <div class="stat-value">${confirmed}</div>
      <div class="stat-label">Confirmados</div>
    </div>
  `;

  // Recent appointments
  const recent = appointments.slice(0, 5);
  content.innerHTML = `
    <h3 class="section-title">📋 Agendamentos Recentes</h3>
    ${recent.length > 0 ? `
      <div class="appointments-list">
        ${recent.map((apt) => {
          const slot = apt.time_slots;
          const visitor = apt.profiles;
          return `
            <div class="glass-card appointment-card">
              <div class="appointment-date">
                <div class="apt-day">${slot?.slot_date ? slot.slot_date.split('-')[2] : '--'}</div>
                <div class="apt-month">${slot?.slot_date ? slot.slot_date.split('-')[1] : ''}</div>
              </div>
              <div class="appointment-info">
                <div class="apt-establishment">${visitor?.full_name || 'Visitante'}</div>
                <div class="apt-time">${slot ? formatTime(slot.start_time) + ' - ' + formatTime(slot.end_time) : 'Horário não definido'}</div>
              </div>
              <span class="badge ${getStatusColor(apt.status)}">${formatStatus(apt.status)}</span>
            </div>
          `;
        }).join('')}
      </div>
    ` : `
      <div class="glass-card empty-state">
        <div class="empty-icon">📭</div>
        <p>Nenhum agendamento ainda</p>
      </div>
    `}
    <div style="margin-top:var(--space-lg);display:flex;gap:var(--space-sm);">
      <button class="btn btn-primary" id="btn-go-calendar">📅 Gerenciar Horários</button>
      <button class="btn btn-ghost" id="btn-go-establishment">🏢 Editar Estabelecimento</button>
    </div>
  `;

  document.getElementById('btn-go-calendar')?.addEventListener('click', () => navigate('calendar'));
  document.getElementById('btn-go-establishment')?.addEventListener('click', () => navigate('establishment'));
}

async function renderVisitorDashboard(container, profile, navigate) {
  const appointments = await getMyAppointments(profile.id);
  const statsGrid = document.getElementById('stats-grid');
  const content = document.getElementById('dashboard-content');

  const pending = appointments.filter((a) => a.status === 'pending').length;
  const confirmed = appointments.filter((a) => a.status === 'confirmed').length;

  statsGrid.innerHTML = `
    <div class="glass-card stat-card" style="animation-delay:0.1s">
      <div class="stat-value">${appointments.length}</div>
      <div class="stat-label">Meus Agendamentos</div>
    </div>
    <div class="glass-card stat-card" style="animation-delay:0.2s">
      <div class="stat-value">${pending}</div>
      <div class="stat-label">Pendentes</div>
    </div>
    <div class="glass-card stat-card" style="animation-delay:0.3s">
      <div class="stat-value">${confirmed}</div>
      <div class="stat-label">Confirmados</div>
    </div>
  `;

  const upcoming = appointments.filter((a) => a.status !== 'cancelled').slice(0, 5);
  content.innerHTML = `
    <h3 class="section-title">📋 Próximos Agendamentos</h3>
    ${upcoming.length > 0 ? `
      <div class="appointments-list">
        ${upcoming.map((apt) => {
          const slot = apt.time_slots;
          const est = apt.establishments;
          return `
            <div class="glass-card appointment-card">
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
        <div class="empty-icon">📭</div>
        <p>Você ainda não tem agendamentos</p>
      </div>
    `}
    <div style="margin-top:var(--space-lg);">
      <button class="btn btn-primary" id="btn-browse">🔍 Buscar Estabelecimentos</button>
    </div>
  `;

  document.getElementById('btn-browse')?.addEventListener('click', () => navigate('browse'));
}
