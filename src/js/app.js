/**
 * app.js — Router SPA + Controller Principal
 */
import { getCurrentUser, getUserProfile, signOut, onAuthStateChange } from './services/authService.js';
import { renderLoginView } from './views/loginView.js';
import { renderDashboardView } from './views/dashboardView.js';
import { renderCalendarView } from './views/calendarView.js';
import { renderEstablishmentSetupView, renderBrowseView } from './views/establishmentView.js';
import { renderVisitorView } from './views/visitorView.js';
import { generateInitials, formatRole } from './utils/formatters.js';

// ─── State ───
let currentProfile = null;
let currentRoute = '';

// ─── DOM Cache ───
const loadingScreen = document.getElementById('loading-screen');
const app = document.getElementById('app');
const mainContent = document.getElementById('main-content');
const appNav = document.getElementById('app-nav');
const userMenu = document.getElementById('user-menu');
const userInitials = document.getElementById('user-initials');
const userNameDisplay = document.getElementById('user-name-display');
const userRoleDisplay = document.getElementById('user-role-display');
const userDropdown = document.getElementById('user-dropdown');
const userAvatarBtn = document.getElementById('user-avatar-btn');
const btnLogout = document.getElementById('btn-logout');

// ─── Toast System ───
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span>${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span>
    <span>${message}</span>
  `;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('toast-out');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ─── Navigation ───
function navigate(route) {
  window.location.hash = route;
}

function getNavItems(role) {
  const items = [
    { route: 'dashboard', label: '📊 Painel', roles: ['developer', 'establishment', 'visitor'] },
    { route: 'calendar', label: '📅 Calendário', roles: ['developer', 'establishment'] },
    { route: 'establishment', label: '🏢 Meu Estab.', roles: ['developer', 'establishment'] },
    { route: 'browse', label: '🔍 Buscar', roles: ['visitor'] },
    { route: 'appointments', label: '📋 Agendamentos', roles: ['visitor'] },
  ];
  return items.filter((item) => item.roles.includes(role));
}

function renderNav() {
  if (!currentProfile) {
    appNav.innerHTML = '';
    userMenu.style.display = 'none';
    return;
  }

  const items = getNavItems(currentProfile.role);
  appNav.innerHTML = items.map((item) => `
    <button class="nav-link ${currentRoute === item.route ? 'active' : ''}" data-route="${item.route}">${item.label}</button>
  `).join('');

  appNav.querySelectorAll('.nav-link').forEach((link) => {
    link.addEventListener('click', () => navigate(link.dataset.route));
  });

  // User menu
  userMenu.style.display = 'block';
  userInitials.textContent = generateInitials(currentProfile.full_name || '?');
  userNameDisplay.textContent = currentProfile.full_name || 'Usuário';
  userRoleDisplay.textContent = formatRole(currentProfile.role);
}

// ─── Router ───
async function handleRoute() {
  const hash = window.location.hash.replace('#', '') || '';
  currentRoute = hash;

  // If not logged in, show login
  if (!currentProfile) {
    if (hash !== 'login' && hash !== '') {
      navigate('login');
      return;
    }
    renderNav();
    mainContent.innerHTML = '';
    renderLoginView(mainContent, async () => {
      await loadUserProfile();
      navigate('dashboard');
    });
    return;
  }

  // Logged in
  renderNav();
  mainContent.innerHTML = '<div style="display:flex;justify-content:center;padding:var(--space-3xl);"><div class="loading-spinner"></div></div>';

  try {
    switch (hash) {
      case 'dashboard':
        await renderDashboardView(mainContent, currentProfile, navigate);
        break;

      case 'calendar':
        if (currentProfile.role === 'visitor') { navigate('browse'); return; }
        await renderCalendarView(mainContent, currentProfile, showToast);
        break;

      case 'establishment':
        if (currentProfile.role === 'visitor') { navigate('browse'); return; }
        await renderEstablishmentSetupView(mainContent, currentProfile, showToast, navigate);
        break;

      case 'browse':
        await renderBrowseView(mainContent, currentProfile, showToast);
        break;

      case 'appointments':
        await renderVisitorView(mainContent, currentProfile, showToast);
        break;

      default:
        navigate('dashboard');
        return;
    }
  } catch (err) {
    mainContent.innerHTML = `
      <div class="glass-card empty-state">
        <div class="empty-icon">⚠️</div>
        <p>Erro ao carregar página: ${err.message || 'Erro desconhecido'}</p>
      </div>
    `;
  }
}

// ─── Auth ───
async function loadUserProfile() {
  try {
    const user = await getCurrentUser();
    if (user) {
      currentProfile = await getUserProfile();
      if (!currentProfile) {
        // Profile may not exist yet (trigger might not have fired)
        currentProfile = {
          id: user.id,
          full_name: user.user_metadata?.full_name || 'Usuário',
          role: user.user_metadata?.role || 'visitor',
          city: user.user_metadata?.city || '',
          phone: user.user_metadata?.phone || '',
        };
      }
    } else {
      currentProfile = null;
    }
  } catch (err) {
    currentProfile = null;
  }
}

async function handleLogout() {
  try {
    await signOut();
    currentProfile = null;
    navigate('login');
    showToast('Logout realizado', 'info');
  } catch (err) {
    showToast('Erro ao sair', 'error');
  }
}

// ─── Init ───
async function init() {
  // Event listeners
  window.addEventListener('hashchange', handleRoute);

  userAvatarBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    userDropdown.style.display = userDropdown.style.display === 'none' ? 'block' : 'none';
  });

  document.addEventListener('click', () => {
    userDropdown.style.display = 'none';
  });

  btnLogout.addEventListener('click', handleLogout);

  // Auth state listener
  onAuthStateChange(async (session) => {
    if (session) {
      await loadUserProfile();
      if (currentRoute === 'login' || currentRoute === '') {
        navigate('dashboard');
      }
    } else {
      currentProfile = null;
      navigate('login');
    }
  });

  // Initial load
  await loadUserProfile();

  // Hide loading screen
  loadingScreen.classList.add('hidden');
  app.style.display = 'flex';

  // Route
  if (!window.location.hash || window.location.hash === '#') {
    navigate(currentProfile ? 'dashboard' : 'login');
  } else {
    handleRoute();
  }
}

init();
