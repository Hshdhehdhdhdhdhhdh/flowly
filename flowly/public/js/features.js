/* Interactive extras: product tour, AI builder demo, savings calculator */
(() => {
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];

  /* ================= Product tour ================= */
  const shots = {
    board: { src: 'images/screen-board.svg', url: 'app.flowly.io/board', alt: 'Flowly board view with tasks in To do, In progress and Done columns' },
    timeline: { src: 'images/screen-timeline.svg', url: 'app.flowly.io/timeline', alt: 'Flowly timeline view showing onboarding steps across the week' },
    insights: { src: 'images/screen-insights.svg', url: 'app.flowly.io/insights', alt: 'Flowly insights view with weekly completion chart and team workload' },
  };
  Object.values(shots).forEach((s) => { const i = new Image(); i.src = s.src; }); // preload
  const shot = $('#tourShot');
  const tabs = $$('[data-shot]');
  function showShot(key) {
    tabs.forEach((t) => t.setAttribute('aria-selected', String(t.dataset.shot === key)));
    shot.classList.add('is-fading');
    setTimeout(() => {
      shot.src = shots[key].src;
      shot.alt = shots[key].alt;
      $('#tourUrl').textContent = shots[key].url;
      shot.classList.remove('is-fading');
    }, 200);
  }
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => showShot(t.dataset.shot));
    t.addEventListener('keydown', (e) => {
      const d = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      const next = tabs[(i + d + tabs.length) % tabs.length];
      next.focus(); showShot(next.dataset.shot);
    });
  });

  /* ================= AI builder demo ================= */
  const people = [
    { name: 'Priya', img: 'a1' }, { name: 'Daniel', img: 'a2' }, { name: 'Aisha', img: 'a3' },
    { name: 'Marco', img: 'a5' }, { name: 'Sofia', img: 'a6' }, { name: 'Wei', img: 'a7' },
  ];
  const templates = [
    { keys: ['onboard', 'client', 'customer'], steps: [
      ['Collect signed contract', 'Day 1'], ['Create client workspace and accounts', 'Day 1'], ['Schedule kickoff call', 'Day 2'],
      ['Send welcome pack', 'Day 2'], ['Run first training session', 'Day 3'], ['Check in after one week', 'Day 8']] },
    { keys: ['hire', 'recruit', 'designer', 'developer', 'candidate', 'job'], steps: [
      ['Write the job description', 'Day 1'], ['Manager approves the role', 'Day 2'], ['Post on job boards', 'Day 3'],
      ['Screen applications', 'Week 2'], ['Run interviews', 'Week 3'], ['Send offer and plan onboarding', 'Week 4']] },
    { keys: ['launch', 'campaign', 'marketing', 'newsletter', 'event'], steps: [
      ['Set goal and audience', 'Day 1'], ['Draft copy and visuals', 'Day 3'], ['Review with brand team', 'Day 4'],
      ['Schedule across channels', 'Day 5'], ['Launch and monitor', 'Day 6'], ['Share results report', 'Day 10']] },
    { keys: ['approve', 'purchase', 'budget', 'expense', 'invoice', 'buy'], steps: [
      ['Submit request with quote', 'Day 1'], ['Manager review', 'Day 1'], ['Finance approval (if over $5k)', 'Day 2'],
      ['Raise purchase order', 'Day 2'], ['Confirm delivery', 'Day 7']] },
    { keys: ['bug', 'issue', 'fix', 'triage'], steps: [
      ['Log the bug with steps to reproduce', 'Hour 1'], ['Set priority and assign an engineer', 'Hour 2'], ['Fix and open a code review', 'Day 2'],
      ['Test the fix', 'Day 2'], ['Release and tell the reporter', 'Day 3']] },
  ];
  function buildSteps(text) {
    const lower = text.toLowerCase();
    const t = templates.find((tpl) => tpl.keys.some((k) => lower.includes(k)));
    if (t) return t.steps;
    const goal = text.replace(/[.!?]+$/, '');
    return [
      [`Define the goal: ${goal.length > 40 ? goal.slice(0, 40) + '…' : goal}`, 'Day 1'], ['Gather inputs from the team', 'Day 1'],
      ['Draft the first version', 'Day 3'], ['Review and approve', 'Day 4'], ['Deliver and share update', 'Day 5'],
    ];
  }

  const tryForm = $('#tryForm');
  const tryInput = $('#tryInput');
  const list = $('#trySteps');
  async function generate(text) {
    text = text.trim();
    if (!text) { tryInput.focus(); UI.toast('Describe a process first, e.g. “Hire a new designer”', 'error'); return; }
    const btn = tryForm.querySelector('button');
    UI.setLoading(btn, true);
    $('#tryTitle').textContent = 'Building your workflow…';
    list.innerHTML = '<li class="try__placeholder">Thinking about steps, owners and timing…</li>';
    $('#tryFoot').hidden = true;
    await new Promise((r) => setTimeout(r, 750));
    const steps = buildSteps(text);
    $('#tryTitle').textContent = text.charAt(0).toUpperCase() + text.slice(1);
    list.innerHTML = '';
    steps.forEach(([title, when], i) => {
      const p = people[(i + text.length) % people.length];
      const li = document.createElement('li');
      li.style.animationDelay = i * 110 + 'ms';
      li.innerHTML = `<span class="n">${i + 1}</span><span><b></b><small></small></span><img src="images/avatars/${p.img}.svg" alt="">`;
      li.querySelector('b').textContent = title;
      li.querySelector('small').textContent = `${p.name} · ${when}`;
      li.querySelector('img').alt = p.name;
      list.appendChild(li);
    });
    $('#tryMeta').textContent = `${steps.length} steps · ${new Set(steps.map((_, i) => (i + text.length) % people.length)).size} owners · built in 0.7s`;
    $('#tryFoot').hidden = false;
    UI.setLoading(btn, false);
  }
  tryForm.addEventListener('submit', (e) => { e.preventDefault(); generate(tryInput.value); });
  $$('[data-try]').forEach((c) => c.addEventListener('click', () => { tryInput.value = c.dataset.try; generate(c.dataset.try); }));

  /* ================= Savings calculator ================= */
  const team = $('#roiTeam'), hours = $('#roiHours'), rate = $('#roiRate');
  const money = (n) => '$' + Math.round(n).toLocaleString('en-US');
  function calc() {
    const t = +team.value, h = +hours.value, r = +rate.value;
    $('#roiTeamOut').textContent = `${t} ${t === 1 ? 'person' : 'people'}`;
    $('#roiHoursOut').textContent = `${h} h`;
    $('#roiRateOut').textContent = `$${r}`;
    const savedHours = t * h * 0.6 * 48; // 48 working weeks
    const cost = t * 12 * 12 * 0.8; // Pro yearly price
    $('#roiHrs').textContent = Math.round(savedHours).toLocaleString('en-US');
    $('#roiMoney').textContent = money(savedHours * r - cost);
    $('#roiCost').textContent = money(cost);
  }
  [team, hours, rate].forEach((el) => el.addEventListener('input', calc));
  calc();
})();

/* Templates gallery with filters; "Use template" sends it to the AI builder */
(() => {
  const data = [
    { cat: 'ops', emoji: '🤝', title: 'Client onboarding', text: 'Contract to kickoff in three days.', steps: 6, c: '#3355FF', prompt: 'Onboard a new client' },
    { cat: 'hr', emoji: '🧑‍💼', title: 'Hire a new teammate', text: 'From job post to signed offer.', steps: 6, c: '#E64980', prompt: 'Hire a new designer' },
    { cat: 'marketing', emoji: '📣', title: 'Campaign launch', text: 'Plan, review and ship on schedule.', steps: 6, c: '#F59F00', prompt: 'Launch a marketing campaign' },
    { cat: 'finance', emoji: '💳', title: 'Purchase approval', text: 'Fast sign-off with the right checks.', steps: 5, c: '#12B886', prompt: 'Approve a purchase request' },
    { cat: 'hr', emoji: '🎓', title: 'Employee onboarding', text: 'Laptop, accounts and a buddy, day one.', steps: 6, c: '#7048E8', prompt: 'Onboard a new client' },
    { cat: 'finance', emoji: '🧾', title: 'Monthly invoicing', text: 'Send, track and chase invoices.', steps: 5, c: '#0C8599', prompt: 'Approve a purchase request' },
    { cat: 'marketing', emoji: '✉️', title: 'Newsletter', text: 'Draft, edit and send every month.', steps: 6, c: '#E8590C', prompt: 'Launch a marketing campaign' },
    { cat: 'ops', emoji: '🛠️', title: 'Bug triage', text: 'Report, assign, fix and verify.', steps: 5, c: '#1C7ED6', prompt: 'Triage and fix a reported bug' },
  ];
  const grid = document.getElementById('templates-grid');
  const btns = [...document.querySelectorAll('[data-filter]')];
  function render(filter) {
    grid.innerHTML = '';
    data.filter((d) => filter === 'all' || d.cat === filter).forEach((d, i) => {
      const el = document.createElement('article');
      el.className = 'tpl';
      el.style.animationDelay = i * 50 + 'ms';
      const bars = [40, 70, 55, 85].map((h) => `<span style="--h:${h}%"></span>`).join('');
      el.innerHTML = `<div class="tpl__art" style="--c:${d.c}"><span class="tpl__emoji" aria-hidden="true">${d.emoji}</span>${bars}</div>
        <div class="tpl__body"><h3></h3><p></p><div class="tpl__meta"><small>${d.steps} steps</small><button type="button">Use template</button></div></div>`;
      el.querySelector('h3').textContent = d.title;
      el.querySelector('p').textContent = d.text;
      el.querySelector('button').addEventListener('click', () => {
        const input = document.getElementById('tryInput');
        input.value = d.prompt;
        document.getElementById('try').scrollIntoView({ behavior: 'smooth' });
        setTimeout(() => document.getElementById('tryForm').requestSubmit(), 500);
      });
      grid.appendChild(el);
    });
  }
  btns.forEach((b) => b.addEventListener('click', () => {
    btns.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    render(b.dataset.filter);
  }));
  render('all');
})();
