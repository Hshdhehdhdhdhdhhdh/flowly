/* Flowly workspace — a protected kanban board backed by the API */
(async () => {
  const $ = (s) => document.querySelector(s);
  UI.initTheme();

  const user = await UI.loadUser();
  if (!user) { location.replace('index.html#signin'); return; }

  $('#wsAvatar').textContent = UI.initials(user.name);
  $('#wsName').textContent = user.name;
  $('#wsPlan').textContent = user.plan + ' plan';
  const hour = new Date().getHours();
  $('#wsGreeting').textContent = `${hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'}, ${user.name.split(' ')[0]}`;

  const COLS = [
    { id: 'todo', label: 'To do', color: 'var(--ink-3)' },
    { id: 'doing', label: 'In progress', color: 'var(--blue)' },
    { id: 'done', label: 'Done', color: 'var(--green)' },
  ];
  let tasks = [];
  const board = $('#board');

  try { tasks = (await FlowlyAPI.listTasks()).tasks; }
  catch (err) { UI.toast(err.message, 'error'); }
  render();

  function render() {
    board.innerHTML = '';
    for (const col of COLS) {
      const items = tasks.filter((t) => t.status === col.id);
      const section = document.createElement('section');
      section.className = 'col';
      section.dataset.status = col.id;
      section.setAttribute('aria-label', col.label);
      section.innerHTML = `<div class="col__head"><i style="background:${col.color}"></i>${col.label}<span>${items.length}</span></div><div class="col__list"></div>`;
      const list = section.querySelector('.col__list');
      if (!items.length) list.innerHTML = `<p class="col__empty">${col.id === 'done' ? 'Finished tasks land here.' : 'Drop a task here.'}</p>`;
      items.forEach((t) => list.appendChild(card(t)));
      section.addEventListener('dragover', (e) => { e.preventDefault(); section.classList.add('is-over'); });
      section.addEventListener('dragleave', () => section.classList.remove('is-over'));
      section.addEventListener('drop', (e) => {
        e.preventDefault();
        section.classList.remove('is-over');
        const id = e.dataTransfer.getData('text/plain');
        if (id) move(id, col.id);
      });
      board.appendChild(section);
    }
    $('#cTodo').textContent = tasks.filter((t) => t.status === 'todo').length;
    $('#cDoing').textContent = tasks.filter((t) => t.status === 'doing').length;
    $('#cDone').textContent = tasks.filter((t) => t.status === 'done').length;
  }

  function card(t) {
    const el = document.createElement('article');
    el.className = 'task';
    el.draggable = true;
    const title = document.createElement('p');
    title.className = 'task__title';
    title.textContent = t.title;
    title.title = 'Double-click to rename';
    const actions = document.createElement('div');
    actions.className = 'task__actions';
    const idx = COLS.findIndex((c) => c.id === t.status);
    if (idx > 0) actions.appendChild(btn('← ' + COLS[idx - 1].label, () => move(t.id, COLS[idx - 1].id)));
    if (idx < COLS.length - 1) actions.appendChild(btn(COLS[idx + 1].label + ' →', () => move(t.id, COLS[idx + 1].id)));
    const del = btn('Delete', () => remove(t.id));
    del.classList.add('task__del');
    actions.appendChild(del);
    el.append(title, actions);

    el.addEventListener('dragstart', (e) => { e.dataTransfer.setData('text/plain', t.id); el.classList.add('is-dragging'); });
    el.addEventListener('dragend', () => el.classList.remove('is-dragging'));

    title.addEventListener('dblclick', () => {
      title.contentEditable = 'true';
      title.focus();
      document.getSelection().selectAllChildren(title);
    });
    title.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); title.blur(); }
      if (e.key === 'Escape') { title.textContent = t.title; title.blur(); }
    });
    title.addEventListener('blur', async () => {
      if (title.contentEditable !== 'true') return;
      title.contentEditable = 'false';
      const next = title.textContent.trim();
      if (!next || next === t.title) { title.textContent = t.title; return; }
      try {
        const { task } = await FlowlyAPI.updateTask(t.id, { title: next });
        Object.assign(t, task);
        UI.toast('Task renamed');
      } catch (err) { title.textContent = t.title; handle(err); }
    });
    return el;
  }

  function btn(label, onClick) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = label;
    b.addEventListener('click', onClick);
    return b;
  }

  async function move(id, status) {
    const t = tasks.find((x) => x.id === id);
    if (!t || t.status === status) return;
    const prev = t.status;
    t.status = status; render(); // optimistic update
    try {
      await FlowlyAPI.updateTask(id, { status });
      if (status === 'done') UI.toast('Nice! Task completed');
    } catch (err) { t.status = prev; render(); handle(err); }
  }

  async function remove(id) {
    const before = tasks;
    tasks = tasks.filter((t) => t.id !== id); render();
    try { await FlowlyAPI.deleteTask(id); UI.toast('Task deleted'); }
    catch (err) { tasks = before; render(); handle(err); }
  }

  $('#addForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = $('#newTask');
    const title = input.value.trim();
    if (!title) { UI.toast('Type a task name first', 'error'); input.focus(); return; }
    try {
      const { task } = await FlowlyAPI.addTask(title);
      tasks.push(task); render();
      input.value = '';
      UI.toast('Task added');
    } catch (err) { handle(err); }
  });

  $('#wsSignOut').addEventListener('click', async () => {
    try { await FlowlyAPI.logout(); } catch { /* ignore */ }
    location.href = 'index.html';
  });

  function handle(err) {
    if (err.status === 401) { location.replace('index.html#signin'); return; }
    UI.toast(err.message || 'Something went wrong', 'error');
  }
})();
