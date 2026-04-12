/**
 * loginView.js — Tela de login e registro
 */
import { signIn, signUp } from '../services/authService.js';
import { isValidEmail, isValidPassword, isValidName, isValidCity, isValidPhone } from '../utils/validators.js';

export function renderLoginView(container, onLoginSuccess) {
  let isLogin = true;
  let selectedRole = 'visitor';

  function render() {
    container.innerHTML = `
      <div class="dor-layout" style="margin-top: var(--space-2xl);">
        <div class="dor-title-col">
          <h2>Vamos começar</h2>
          <p>Faça login ou crie uma conta para buscar e agendar consultas.</p>
        </div>
        
        <div class="dor-content-col">
          <div class="dor-tabs">
            <button type="button" class="dor-tab-btn ${isLogin ? 'active' : ''}" id="btn-login-tab">Já tenho conta</button>
            <button type="button" class="dor-tab-btn ${!isLogin ? 'active' : ''}" id="btn-register-tab">Novo cadastro</button>
          </div>

          <form id="auth-form">
            ${!isLogin ? `
              <div class="form-group">
                <label class="form-label" for="input-name">Nome Completo</label>
                <input class="form-input" type="text" id="input-name" placeholder="Ex: Gabriel Sanches de Souza" required />
                <span class="form-error" id="error-name"></span>
              </div>

              <div class="form-group">
                <label class="form-label">Tipo de Conta</label>
                <div class="role-selector">
                  <div class="role-option ${selectedRole === 'visitor' ? 'selected' : ''}" data-role="visitor">
                    <span class="role-name">Paciente</span>
                  </div>
                  <div class="role-option ${selectedRole === 'establishment' ? 'selected' : ''}" data-role="establishment">
                    <span class="role-name">Clínica / Médicos</span>
                  </div>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label" for="input-city">Cidade</label>
                  <input class="form-input" type="text" id="input-city" placeholder="Ex: São Paulo" />
                  <span class="form-error" id="error-city"></span>
                </div>
                <div class="form-group">
                  <label class="form-label" for="input-phone">Telefone</label>
                  <input class="form-input" type="tel" id="input-phone" placeholder="(11) 99999-9999" />
                  <span class="form-error" id="error-phone"></span>
                </div>
              </div>
            ` : ''}

            <div class="form-group">
              <label class="form-label" for="input-email">E-mail</label>
              <input class="form-input" type="email" id="input-email" placeholder="seu@email.com" required />
              <span class="form-error" id="error-email"></span>
            </div>

            <div class="form-group">
              <label class="form-label" for="input-password">Senha</label>
              <input class="form-input" type="password" id="input-password" placeholder="Mínimo 6 caracteres" required />
              <span class="form-error" id="error-password"></span>
            </div>

            <button type="submit" class="btn btn-primary btn-lg btn-block" style="margin-top: var(--space-md);" id="btn-submit">
              ${isLogin ? 'Acessar Conta' : 'Concluir Cadastro'}
            </button>
          </form>
        </div>
      </div>
    `;

    // Event listeners
    document.getElementById('btn-login-tab').addEventListener('click', () => {
      isLogin = true; render();
    });

    document.getElementById('btn-register-tab').addEventListener('click', () => {
      isLogin = false; render();
    });

    // Role selector
    container.querySelectorAll('.role-option').forEach((el) => {
      el.addEventListener('click', () => {
        selectedRole = el.dataset.role;
        container.querySelectorAll('.role-option').forEach((o) => o.classList.remove('selected'));
        el.classList.add('selected');
      });
    });

    // Form submit
    document.getElementById('auth-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('btn-submit');
      const originalText = btn.textContent;
      btn.disabled = true;
      btn.textContent = 'Aguarde...';

      try {
        const email = document.getElementById('input-email').value.trim();
        const password = document.getElementById('input-password').value;

        // Validate
        let hasError = false;
        if (!isValidEmail(email)) {
          showError('error-email', 'E-mail inválido');
          hasError = true;
        }
        if (!isValidPassword(password)) {
          showError('error-password', 'Senha deve ter pelo menos 6 caracteres');
          hasError = true;
        }

        if (!isLogin) {
          const name = document.getElementById('input-name').value.trim();
          if (!isValidName(name)) {
            showError('error-name', 'Informe o nome completo');
            hasError = true;
          }
          const phone = document.getElementById('input-phone')?.value.trim() || '';
          if (phone && !isValidPhone(phone)) {
            showError('error-phone', 'Telefone inválido (mín. 10 dígitos com DDD)');
            hasError = true;
          }
        }

        if (hasError) {
          btn.disabled = false;
          btn.textContent = originalText;
          return;
        }

        if (isLogin) {
          await signIn(email, password);
        } else {
          const name = document.getElementById('input-name').value.trim();
          const city = document.getElementById('input-city')?.value.trim() || '';
          const phone = document.getElementById('input-phone')?.value.trim() || '';
          await signUp(email, password, {
            fullName: name,
            role: selectedRole,
            city,
            phone,
          });
        }

        onLoginSuccess();
      } catch (err) {
        showError('error-email', err.message || 'Erro ao autenticar');
        btn.disabled = false;
        btn.textContent = originalText;
      }
    });
  }

  function showError(id, message) {
    const el = document.getElementById(id);
    if (el) el.textContent = message;
  }

  render();
}
