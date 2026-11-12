/* Flowly landing page interactions */
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  UI.initTheme();
  $('#year').textContent = new Date().getFullYear();

  /* ================= Navigation ================= */
  const nav = $('.nav');
  const menuBtn = $('#menuToggle');
  const links = $('#navLinks');
  const toTop = $('#toTop');

  function setMenu(open) {
    links.classList.toggle('is-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }
  menuBtn.addEventListener('click', () => setMenu(!links.classList.contains('is-open')));
  links.addEventListener('click', (e) => { if (e.target.closest('a, button')) setMenu(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

  window.addEventListener('scroll', () => {
    nav.classList.toggle('is-scrolled', scrollY > 8);
    toTop.hidden = scrollY < 700;
  }, { passive: true });
  toTop.addEventListener('click', () => scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }));

  // Highlight the nav link of the section in view
  const navMap = new Map($$('.nav__links > a').map((a) => [a.getAttribute('href').slice(1), a]));
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navMap.forEach((a) => a.classList.remove('is-active'));
      navMap.get(entry.target.id)?.classList.add('is-active');
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  navMap.forEach((_, id) => { const s = document.getElementById(id); if (s) spy.observe(s); });

  /* ================= Hero typing prompt ================= */
  const prompts = ['Onboard a new client in 3 days', 'Approve marketing budgets over $5k', 'Hire a designer by next month', 'Ship the monthly newsletter'];
  const typed = $('#typedPrompt');
  if (!reduceMotion) {
    let pi = 0, ci = prompts[0].length, deleting = true;
    const tick = () => {
      const text = prompts[pi];
      ci += deleting ? -1 : 1;
      typed.textContent = text.slice(0, ci);
      let delay = deleting ? 28 : 55;
      if (!deleting && ci === text.length) { deleting = true; delay = 2600; }
      else if (deleting && ci === 0) { deleting = false; pi = (pi + 1) % prompts.length; delay = 300; }
      setTimeout(tick, delay);
    };
    setTimeout(tick, 2600);
  }

  /* ================= Animated counters ================= */
  const counters = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      obs.unobserve(entry.target);
      const el = entry.target;
      const target = parseFloat(el.dataset.count);
      const dec = +(el.dataset.decimals || 0);
      const suffix = el.dataset.suffix || '';
      const fmt = (n) => n.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + suffix;
      if (reduceMotion) { el.textContent = fmt(target); return; }
      const start = performance.now();
      const step = (now) => {
        const t = Math.min((now - start) / 1400, 1);
        el.textContent = fmt(target * (1 - Math.pow(1 - t, 3)));
        if (t < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }, { threshold: .5 });
  $$('[data-count]').forEach((el) => counters.observe(el));

  /* ================= Modals (shared) ================= */
  let lastFocus = null;
  function openModal(modal) {
    lastFocus = document.activeElement;
    modal.hidden = false;
    document.body.classList.add('modal-open');
    setTimeout(() => (modal.querySelector('[autofocus], input, button:not(.modal__close)') || modal).focus(), 50);
  }
  function closeModal(modal) {
    modal.hidden = true;
    if (!$$('.modal').some((m) => !m.hidden)) document.body.classList.remove('modal-open');
    lastFocus?.focus?.();
  }
  $$('.modal').forEach((modal) => {
    modal.addEventListener('click', (e) => {
      if (e.target.closest('[data-close]')) {
        closeModal(modal);
        if (modal.id === 'authModal') sessionStorage.setItem('flowly:authDismissed', '1');
      }
    });
    modal.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { closeModal(modal); if (modal.id === 'authModal') sessionStorage.setItem('flowly:authDismissed', '1'); }
      if (e.key === 'Tab') { // keep focus inside the dialog
        const f = $$('button:not([disabled]), [href], input:not([type="hidden"]), select, textarea', modal).filter((el) => el.offsetParent !== null);
        if (!f.length) return;
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f.at(-1).focus(); }
        else if (!e.shiftKey && document.activeElement === f.at(-1)) { e.preventDefault(); f[0].focus(); }
      }
    });
  });

  /* ================= Feature previews ================= */
  const featureData = {
    ai: {
      title: 'AI workflow builder',
      text: 'Type a goal in plain language. Flowly drafts every step with owners and due dates.',
      list: ['Learns from your past workflows', 'Suggests approvals where needed', 'Edit anything before it runs'],
      art: () => `<div class="mini">${['Collect signed contract', 'Create client folder', 'Schedule kickoff call', 'Send welcome pack'].map((t, i) => `<div class="mini__row">${t}<span class="mini__tag">Day ${i + 1}</span></div>`).join('')}</div>`,
    },
    automate: {
      title: 'Smart automations',
      text: 'Set simple “when this, then that” rules so routine updates happen on their own.',
      list: ['Auto-assign by request type', 'Remind owners before due dates', 'Post updates to Slack'],
      art: () => `<div class="mini">${[['When a task is done', 'Trigger'], ['Move the next step forward', 'Action'], ['Notify the owner on Slack', 'Action']].map(([t, g]) => `<div class="mini__row">${t}<span class="mini__tag">${g}</span></div>`).join('')}</div>`,
    },
    board: {
      title: 'Live boards',
      text: 'One shared view of every request. Drag cards between stages and everyone sees it instantly.',
      list: ['Board, list and timeline views', 'Filters by owner or priority', 'Blocked work is flagged in red'],
      art: () => `<div class="mini">${[['Design review', 'To do'], ['Budget approval', 'Doing'], ['Vendor contract', 'Done']].map(([t, g]) => `<div class="mini__row">${t}<span class="mini__tag">${g}</span></div>`).join('')}</div>`,
    },
    integrations: {
      title: '120+ integrations',
      text: 'Bring the tools your team already uses into one flow.',
      list: ['Two-click setup', 'Two-way sync', 'Custom webhooks on Pro'],
      art: () => `<div class="mini__apps">${['Slack', 'Gmail', 'Drive', 'Jira', 'Notion', 'Zoom'].map((a, i) => `<span style="animation-delay:${i * 60}ms">${a}</span>`).join('')}</div>`,
    },
    insights: {
      title: 'Workload insights',
      text: 'See who’s overloaded and where work gets stuck, so you can fix it before deadlines slip.',
      list: ['Weekly email reports', 'Cycle time by team', 'Export to CSV'],
      art: () => `<div class="mini__bars">${[45, 70, 55, 90, 65, 80].map((h, i) => `<span style="--h:${h}%;animation-delay:${i * 70}ms"></span>`).join('')}</div>`,
    },
  };
  const featureModal = $('#featureModal');
  $$('[data-feature]').forEach((btn) => btn.addEventListener('click', () => {
    const d = featureData[btn.dataset.feature];
    $('#previewTitle').textContent = d.title;
    $('#previewText').textContent = d.text;
    $('#previewList').innerHTML = d.list.map((li) => `<li>${li}</li>`).join('');
    $('#previewArt').innerHTML = d.art();
    openModal(featureModal);
  }));

  /* ================= Testimonials ================= */
  const quotes = $$('.quote');
  const dots = $$('.quotes__dots button');
  let qi = 0, qTimer;
  function showQuote(i) {
    qi = i;
    quotes.forEach((q, n) => q.classList.toggle('is-active', n === i));
    dots.forEach((d, n) => d.setAttribute('aria-selected', String(n === i)));
  }
  const autoplay = () => { if (!reduceMotion) qTimer = setInterval(() => showQuote((qi + 1) % quotes.length), 6000); };
  dots.forEach((d, i) => d.addEventListener('click', () => { clearInterval(qTimer); showQuote(i); autoplay(); }));
  autoplay();

  /* ================= Pricing toggle ================= */
  const billing = $('#billingToggle');
  billing.addEventListener('click', () => {
    const yearly = billing.getAttribute('aria-checked') !== 'true';
    billing.setAttribute('aria-checked', String(yearly));
    $('#lblMonthly').classList.toggle('is-on', !yearly);
    $('#lblYearly').classList.toggle('is-on', yearly);
    $$('.plan__amount').forEach((el) => {
      const v = +el.dataset[yearly ? 'yearly' : 'monthly'];
      el.textContent = '$' + (Number.isInteger(v) ? v : v.toFixed(2));
      el.classList.remove('is-changing'); void el.offsetWidth; el.classList.add('is-changing');
    });
  });
  $$('[data-plan]').forEach((btn) => btn.addEventListener('click', () => {
    const plan = btn.dataset.plan;
    if (plan === 'Business') {
      $('#dMessage').value = 'I’d like to talk to sales about the Business plan.';
      $('#dMessage').dispatchEvent(new Event('input'));
      $('#contact').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
      setTimeout(() => $('#dName').focus({ preventScroll: true }), 600);
      return;
    }
    if (UI.user) { location.href = 'workspace.html'; return; }
    selectedPlan = plan;
    openAuth('signup');
  }));

  /* ================= Demo / contact form ================= */
  const demoForm = $('#demoForm');
  const demoChecks = [[$('#dName'), 'name'], [$('#dEmail'), 'email'], [$('#dCompany'), 'company'], [$('#dTeam'), 'teamSize']];
  UI.liveValidate(demoChecks);
  $('#dTeam').addEventListener('change', (e) => UI.setFieldError(e.target, e.target.value ? '' : 'Choose your team size.'));
  $('#dMessage').addEventListener('input', (e) => { $('#msgCount').textContent = e.target.value.length; });

  demoForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const alert = $('#demoAlert');
    alert.hidden = true;
    if (!UI.validate(demoChecks)) return;
    const btn = $('#demoSubmit');
    UI.setLoading(btn, true);
    const payload = Object.fromEntries(new FormData(demoForm));
    try {
      await FlowlyAPI.sendDemo(payload);
      $('#demoSuccessText').textContent = `Thanks, ${payload.name.split(' ')[0]}! We’ll email ${payload.email} within one business day.`;
      demoForm.querySelector('.form__body').hidden = true;
      $('#demoSuccess').hidden = false;
      $('#demoSuccess').focus();
      UI.toast('Message sent');
    } catch (err) {
      UI.showServerErrors(demoForm, err);
    } finally {
      UI.setLoading(btn, false);
    }
  });
  $('#demoAgain').addEventListener('click', () => {
    demoForm.reset();
    $('#msgCount').textContent = '0';
    $$('.field', demoForm).forEach((f) => f.classList.remove('is-valid', 'is-invalid'));
    $('#demoSuccess').hidden = true;
    demoForm.querySelector('.form__body').hidden = false;
    $('#dName').focus();
  });

  /* ================= Newsletter ================= */
  $('#newsletter').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = $('#nlEmail');
    const msg = $('#nlMsg');
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.value.trim());
    msg.className = 'newsletter__msg ' + (ok ? 'is-ok' : 'is-err');
    msg.textContent = ok ? 'Subscribed. Watch your inbox for the next update.' : 'Enter a valid email address.';
    if (ok) { input.value = ''; UI.toast('Subscribed to updates'); }
  });

  /* ================= Authentication ================= */
  const authModal = $('#authModal');
  const tabs = $('.tabs');
  const signinForm = $('#signinForm');
  const signupForm = $('#signupForm');
  let selectedPlan = null;

  function setTab(which) {
    const signup = which === 'signup';
    tabs.dataset.active = which;
    $('#tabSignin').setAttribute('aria-selected', String(!signup));
    $('#tabSignup').setAttribute('aria-selected', String(signup));
    signinForm.hidden = signup;
    signupForm.hidden = !signup;
    const form = signup ? signupForm : signinForm;
    form.classList.remove('is-switching'); void form.offsetWidth; form.classList.add('is-switching');
    $('#authTitle').textContent = signup ? 'Create your account' : 'Welcome back';
    $('#authSub').textContent = signup
      ? (selectedPlan ? `Start on the ${selectedPlan} plan. It’s free to try.` : 'Free forever on Starter. No card needed.')
      : 'Sign in to open your workspace.';
    $$('.form__alert', authModal).forEach((a) => (a.hidden = true));
  }
  function openAuth(which = 'signin') {
    setTab(which);
    openModal(authModal);
    setTimeout(() => (which === 'signup' ? $('#suName') : $('#siEmail')).focus(), 60);
  }

  $$('[data-auth-open]').forEach((b) => b.addEventListener('click', () => { setMenu(false); openAuth(b.dataset.authOpen); }));
  $('#tabSignin').addEventListener('click', () => setTab('signin'));
  $('#tabSignup').addEventListener('click', () => setTab('signup'));
  $$('[data-auth-tab]').forEach((b) => b.addEventListener('click', () => setTab(b.dataset.authTab)));
  tabs.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      const next = tabs.dataset.active === 'signup' ? 'signin' : 'signup';
      setTab(next); $(next === 'signup' ? '#tabSignup' : '#tabSignin').focus();
    }
  });

  // Show / hide password
  $$('.password__toggle').forEach((btn) => btn.addEventListener('click', () => {
    const input = btn.previousElementSibling;
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    btn.textContent = show ? 'Hide' : 'Show';
    btn.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
  }));

  // Password strength meter
  $('#suPassword').addEventListener('input', (e) => {
    const v = e.target.value;
    let score = 0;
    if (v.length >= 8) score++;
    if (/[A-Za-z]/.test(v) && /\d/.test(v)) score++;
    if (/[A-Z]/.test(v) && /[a-z]/.test(v)) score++;
    if (/[^A-Za-z0-9]/.test(v) || v.length >= 12) score++;
    $('.strength').dataset.level = v ? Math.max(score, 1) : 0;
    $('#strengthLabel').textContent = !v ? 'Use 8+ characters with a letter and a number.' : ['Too weak', 'Weak', 'Good', 'Strong', 'Very strong'][score];
  });

  const signinChecks = [[$('#siEmail'), 'email'], [$('#siPassword'), 'loginPassword']];
  const signupChecks = [[$('#suName'), 'name'], [$('#suEmail'), 'email'], [$('#suPassword'), 'password']];
  UI.liveValidate([...signinChecks, ...signupChecks]);

  signinForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    signinForm.querySelector('.form__alert').hidden = true;
    if (!UI.validate(signinChecks)) return;
    const btn = signinForm.querySelector('[type="submit"]');
    UI.setLoading(btn, true);
    try {
      const { user } = await FlowlyAPI.login({ email: $('#siEmail').value, password: $('#siPassword').value });
      onSignedIn(user, `Welcome back, ${user.name.split(' ')[0]}!`);
    } catch (err) {
      UI.showServerErrors(signinForm, err);
    } finally { UI.setLoading(btn, false); }
  });

  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    signupForm.querySelector('.form__alert').hidden = true;
    let ok = UI.validate(signupChecks);
    const terms = $('#suTerms');
    const termsErr = $('.check__error');
    termsErr.textContent = terms.checked ? '' : 'Please accept the terms to continue.';
    if (!terms.checked) { if (ok) terms.focus(); ok = false; }
    if (!ok) return;
    const btn = signupForm.querySelector('[type="submit"]');
    UI.setLoading(btn, true);
    try {
      const { user } = await FlowlyAPI.register({ name: $('#suName').value, email: $('#suEmail').value, password: $('#suPassword').value });
      onSignedIn(user, `Account created. Welcome to Flowly, ${user.name.split(' ')[0]}!`);
    } catch (err) {
      UI.showServerErrors(signupForm, err);
    } finally { UI.setLoading(btn, false); }
  });
  $('#suTerms').addEventListener('change', (e) => { if (e.target.checked) $('.check__error').textContent = ''; });

  function onSignedIn(user, message) {
    UI.user = user;
    signinForm.reset(); signupForm.reset();
    $$('.field', authModal).forEach((f) => f.classList.remove('is-valid', 'is-invalid'));
    $('.strength').dataset.level = 0;
    closeModal(authModal);
    renderSession();
    UI.toast(message);
  }

  /* ---------- Signed-in state in the nav ---------- */
  const avatarBtn = $('#avatarBtn');
  const userPanel = $('#userPanel');
  function renderSession() {
    const u = UI.user;
    $$('[data-guest]').forEach((el) => (el.hidden = !!u));
    $$('[data-member]').forEach((el) => (el.hidden = !u));
    if (u) {
      avatarBtn.textContent = UI.initials(u.name);
      $('#userName').textContent = u.name;
      $('#userEmail').textContent = u.email;
    }
  }
  avatarBtn.addEventListener('click', () => {
    const open = userPanel.hidden;
    userPanel.hidden = !open;
    avatarBtn.setAttribute('aria-expanded', String(open));
  });
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.user-menu')) { userPanel.hidden = true; avatarBtn.setAttribute('aria-expanded', 'false'); }
  });
  $('#signOutBtn').addEventListener('click', async () => {
    try { await FlowlyAPI.logout(); } catch { /* clear locally anyway */ }
    UI.user = null;
    userPanel.hidden = true;
    renderSession();
    UI.toast('You’re signed out');
  });

  /* ---------- Start: show sign in / create account first ---------- */
  (async () => {
    await UI.loadUser();
    renderSession();
    const hash = location.hash.slice(1);
    if (hash === 'signin' || hash === 'signup') {
      if (!UI.user) openAuth(hash);
      history.replaceState(null, '', location.pathname);
      return;
    }
    if (!UI.user && !sessionStorage.getItem('flowly:authDismissed')) {
      setTimeout(() => { if (!UI.user && $$('.modal').every((m) => m.hidden)) openAuth('signup'); }, 900);
    }
  })();
})();
