/* Flowly API client
 * Talks to the Node/Express backend (/api/...).
 * If the backend isn't reachable (static hosting or opening index.html directly),
 * it switches to "local mode" and stores data in the browser, so every form still
 * works without errors.
 */
const FlowlyAPI = (() => {
  let modePromise = null;

  function detectMode() {
    if (!modePromise) {
      modePromise = (async () => {
        if (location.protocol === 'file:') return 'local';
        try {
          const ctrl = new AbortController();
          const timer = setTimeout(() => ctrl.abort(), 2500);
          const res = await fetch('/api/health', { signal: ctrl.signal, credentials: 'same-origin' });
          clearTimeout(timer);
          const type = res.headers.get('content-type') || '';
          if (res.ok && type.includes('application/json')) return 'server';
        } catch (_) { /* fall through */ }
        return 'local';
      })();
    }
    return modePromise;
  }

  class ApiError extends Error {
    constructor(message, fields = {}, status = 400) {
      super(message);
      this.fields = fields;
      this.status = status;
    }
  }

  async function server(method, url, body) {
    let res;
    try {
      res = await fetch(url, {
        method,
        credentials: 'same-origin',
        headers: body ? { 'Content-Type': 'application/json' } : {},
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch {
      throw new ApiError('Can’t reach the server. Check your connection and try again.', {}, 0);
    }
    let data = {};
    try { data = await res.json(); } catch { /* empty body */ }
    if (!res.ok) throw new ApiError(data.error || 'Something went wrong. Try again.', data.fields || {}, res.status);
    return data;
  }

  /* ---------- local (browser) mode ---------- */
  const store = {
    read(key, fallback) {
      try { return JSON.parse(localStorage.getItem('flowly:' + key)) ?? fallback; }
      catch { return fallback; }
    },
    write(key, value) {
      try { localStorage.setItem('flowly:' + key, JSON.stringify(value)); } catch { /* storage full or blocked */ }
    },
  };
  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));
  async function hash(text) {
    if (!crypto.subtle) return 'plain:' + text;
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('flowly-salt:' + text));
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email, plan: u.plan, createdAt: u.createdAt });
  const currentLocalUser = () => {
    const id = store.read('session', null);
    return store.read('users', []).find((u) => u.id === id) || null;
  };
  const needUser = () => {
    const u = currentLocalUser();
    if (!u) throw new ApiError('Sign in to continue.', {}, 401);
    return u;
  };

  const local = {
    async register({ name, email, password }) {
      const users = store.read('users', []);
      email = email.trim().toLowerCase();
      if (users.some((u) => u.email === email))
        throw new ApiError('An account with this email already exists.', { email: 'Already registered — sign in instead.' }, 409);
      const user = { id: uid(), name: name.trim(), email, passwordHash: await hash(password), plan: 'Starter', createdAt: new Date().toISOString() };
      store.write('users', [...users, user]);
      const tasks = store.read('tasks', []);
      ['Invite your team', 'Connect your first app', 'Build an approval flow'].forEach((title, i) =>
        tasks.push({ id: uid(), userId: user.id, title, status: i === 0 ? 'doing' : 'todo', createdAt: new Date().toISOString() }));
      store.write('tasks', tasks);
      store.write('session', user.id);
      return { user: publicUser(user) };
    },
    async login({ email, password }) {
      email = email.trim().toLowerCase();
      const user = store.read('users', []).find((u) => u.email === email);
      if (!user || user.passwordHash !== (await hash(password)))
        throw new ApiError('Email or password is incorrect.', {}, 401);
      store.write('session', user.id);
      return { user: publicUser(user) };
    },
    async logout() { store.write('session', null); return { ok: true }; },
    async me() { const u = currentLocalUser(); return { user: u ? publicUser(u) : null }; },
    async listTasks() { const u = needUser(); return { tasks: store.read('tasks', []).filter((t) => t.userId === u.id) }; },
    async addTask(title) {
      const u = needUser();
      const task = { id: uid(), userId: u.id, title: title.trim(), status: 'todo', createdAt: new Date().toISOString() };
      store.write('tasks', [...store.read('tasks', []), task]);
      return { task };
    },
    async updateTask(id, patch) {
      const u = needUser();
      let task = null;
      store.write('tasks', store.read('tasks', []).map((t) => {
        if (t.id !== id || t.userId !== u.id) return t;
        task = { ...t, ...patch };
        return task;
      }));
      if (!task) throw new ApiError('Task not found.', {}, 404);
      return { task };
    },
    async deleteTask(id) {
      const u = needUser();
      store.write('tasks', store.read('tasks', []).filter((t) => !(t.id === id && t.userId === u.id)));
      return { ok: true };
    },
    async sendDemo(payload) {
      store.write('demoRequests', [...store.read('demoRequests', []), { id: uid(), ...payload, createdAt: new Date().toISOString() }]);
      return { ok: true };
    },
  };

  /* ---------- public API ---------- */
  const pick = async (serverFn, localFn) => ((await detectMode()) === 'server' ? serverFn() : localFn());

  return {
    ApiError,
    mode: detectMode,
    register: (d) => pick(() => server('POST', '/api/auth/register', d), () => local.register(d)),
    login: (d) => pick(() => server('POST', '/api/auth/login', d), () => local.login(d)),
    logout: () => pick(() => server('POST', '/api/auth/logout'), () => local.logout()),
    me: () => pick(() => server('GET', '/api/auth/me'), () => local.me()),
    listTasks: () => pick(() => server('GET', '/api/tasks'), () => local.listTasks()),
    addTask: (title) => pick(() => server('POST', '/api/tasks', { title }), () => local.addTask(title)),
    updateTask: (id, patch) => pick(() => server('PATCH', '/api/tasks/' + id, patch), () => local.updateTask(id, patch)),
    deleteTask: (id) => pick(() => server('DELETE', '/api/tasks/' + id), () => local.deleteTask(id)),
    sendDemo: async (d) => {
      if ((await detectMode()) === 'server') {
        try { return await server('POST', '/api/demo', d); }
        catch (err) {
          // Validation errors are shown to the user; a server/network failure falls back
          // to saving in the browser so the message is never lost.
          if (err.status === 400) throw err;
          return local.sendDemo(d);
        }
      }
      return local.sendDemo(d);
    },
  };
})();
