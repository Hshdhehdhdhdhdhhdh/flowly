/* Shared UI helpers used by the landing page and the workspace */
const UI = (() => {
  /* ---------- Theme ---------- */
  const root = document.documentElement;
  function readTheme() {
    try { return localStorage.getItem('flowly:theme'); } catch { return null; }
  }
  function applyTheme(theme) {
    root.dataset.theme = theme;
    const btn = document.getElementById('themeToggle');
    if (btn) btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
  }
  applyTheme(readTheme() || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
  function initTheme() {
    document.getElementById('themeToggle')?.addEventListener('click', () => {
      const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      try { localStorage.setItem('flowly:theme', next); } catch { /* ignore */ }
    });
  }

  /* ---------- Toasts ---------- */
  function toast(message, type = 'ok') {
    const box = document.getElementById('toasts');
    if (!box) return;
    const el = document.createElement('div');
    el.className = 'toast' + (type === 'error' ? ' toast--error' : '');
    el.textContent = message;
    box.appendChild(el);
    setTimeout(() => { el.classList.add('is-leaving'); setTimeout(() => el.remove(), 300); }, 3600);
  }

  /* ---------- Form validation ---------- */
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const rules = {
    name: (v) => (v.trim().length < 2 ? 'Enter your full name.' : ''),
    email: (v) => (!v.trim() ? 'Enter your email address.' : !EMAIL_RE.test(v.trim()) ? 'Enter a valid email, like name@company.com.' : ''),
    company: (v) => (!v.trim() ? 'Enter your company name.' : ''),
    teamSize: (v) => (!v ? 'Choose your team size.' : ''),
    password: (v) => (v.length < 8 || !/[A-Za-z]/.test(v) || !/\d/.test(v) ? 'Use 8+ characters with at least one letter and one number.' : ''),
    loginPassword: (v) => (!v ? 'Enter your password.' : ''),
  };

  function setFieldError(input, message) {
    const field = input.closest('.field');
    if (!field) return;
    const err = field.querySelector('.field__error');
    field.classList.toggle('is-invalid', !!message);
    field.classList.toggle('is-valid', !message && input.value.trim() !== '');
    input.setAttribute('aria-invalid', message ? 'true' : 'false');
    if (err) err.textContent = message || '';
  }

  // checks: { inputElement: ruleName }
  function validate(checks) {
    let first = null;
    for (const [input, rule] of checks) {
      const msg = rules[rule](input.value);
      setFieldError(input, msg);
      if (msg && !first) first = input;
    }
    if (first) first.focus();
    return !first;
  }

  function liveValidate(checks) {
    for (const [input, rule] of checks) {
      input.addEventListener('blur', () => { if (input.value) setFieldError(input, rules[rule](input.value)); });
      input.addEventListener('input', () => {
        if (input.closest('.field')?.classList.contains('is-invalid')) setFieldError(input, rules[rule](input.value));
      });
    }
  }

  function showServerErrors(form, err) {
    const alert = form.querySelector('.form__alert');
    let focused = false;
    for (const [name, msg] of Object.entries(err.fields || {})) {
      const input = form.elements[name];
      if (input) { setFieldError(input, msg); if (!focused) { input.focus(); focused = true; } }
    }
    if (alert) { alert.textContent = err.message; alert.hidden = false; }
  }

  function setLoading(button, on) {
    button.disabled = on;
    button.classList.toggle('is-loading', on);
  }

  /* ---------- Session ---------- */
  let currentUser = null;
  const initials = (name) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('') || 'U';

  async function loadUser() {
    try { currentUser = (await FlowlyAPI.me()).user; }
    catch { currentUser = null; }
    return currentUser;
  }

  return { initTheme, toast, validate, liveValidate, setFieldError, showServerErrors, setLoading, loadUser, initials, get user() { return currentUser; }, set user(u) { currentUser = u; } };
})();
