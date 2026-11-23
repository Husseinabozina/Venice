import { store, ROLES, NAV, DEMO, find, lowStock, isLate, balanceOf, quoteTotal, nextDue, today } from './data.js';
import { icon, logo, kitchenArt } from './icons.js';
import { esc, toast, closeModal } from './ui.js';
import { pages, handlers } from './pages/index.js';
import { tour, TOUR_STEPS } from './tour.js';
import { nav } from './nav.js';

const app = document.getElementById('app');
let sideOpen = false;

export function go(path) { if (location.hash !== '#/' + path) location.hash = '#/' + path; else render(); }
window.__go = go;

function route() {
  const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  return { page: parts[0] || 'dashboard', id: parts[1] ? decodeURIComponent(parts[1]) : null, sub: parts[2] ? decodeURIComponent(parts[2]) : null };
}

// ---------- login ----------
let loginRole = 'admin';
const initials = (n) => esc(n.split(' ').map((w) => w[0]).join('').slice(0, 2));
const roleEmail = (k) => `${k}@venice.bh`;
function rolePickerView() {
  return `<div class="role-pick" role="radiogroup" aria-label="الحساب">
      ${ROLES.map((r) => `<button type="button" class="rp ${r.key === loginRole ? 'on' : ''}" role="radio" aria-checked="${r.key === loginRole}" data-act="pickRole" data-role="${r.key}">
        <span class="avatar">${initials(r.person)}</span><span class="rp-t"><b>${esc(r.name)}</b><span>${esc(r.person)}</span></span></button>`).join('')}
    </div>`;
}
function loginView() {
  return `<div class="login">
    <section class="login-brand">
      <i class="lb-corner tl"></i><i class="lb-corner tr"></i><i class="lb-corner bl"></i><i class="lb-corner br"></i>
      <div class="lb-head"><div class="mark">${logo(58)}</div><div class="wordmark"><div class="brand-name">VENICE</div><div class="brand-tag">FURNITURE WORKSHOP</div></div></div>
      <div class="lb-hero">
        <h1>نظام إدارة <em>المصنع</em></h1>
        <p>المبيعات، والمشاريع، والإنتاج، في نظام واحد.</p>
      </div>
      <figure class="lb-art" aria-hidden="true">${kitchenArt()}</figure>
      <div class="lb-foot"><span>VENICE FURNITURE WORKSHOP W.L.L</span><span>مملكة البحرين</span></div>
    </section>
    <section class="login-side">
      <div class="login-card ${DEMO.rolePicker ? 'has-roles' : ''}">
        <div class="lc-mark">${logo(44)}</div>
        <h2>تسجيل الدخول</h2>
        <p class="muted">${DEMO.rolePicker ? 'اختر الحساب للدخول' : 'مرحبًا بك في VENICE ERP'}</p>
        ${DEMO.rolePicker ? rolePickerView() : ''}
        <form class="stack" data-form="fakeLogin">
          <label class="f">البريد الإلكتروني<input name="email" value="${roleEmail(loginRole)}" dir="ltr" autocomplete="username"></label>
          <label class="f">كلمة المرور<input name="password" type="password" value="venice2026" dir="ltr" autocomplete="current-password"></label>
          <label class="row small muted" style="gap:8px;cursor:pointer"><input type="checkbox" checked style="width:16px;height:16px"> تذكرني</label>
          <button class="btn dark" type="submit">${icon('lock', 17)} تسجيل الدخول</button>
        </form>
      </div>
      ${DEMO.tour ? `<button class="tour-link" type="button" data-act="startTour"><span class="play">${icon('play', 15)}</span><span><b>جولة الدورة الكاملة</b><span>${TOUR_STEPS} خطوة من العميل حتى التسليم</span></span>${icon('chevron', 15)}</button>` : ''}
      <div class="login-copy">© 2026 VENICE ERP</div>
    </section>
  </div>`;
}


// ---------- shell ----------
function counts() {
  const s = store.state;
  return {
    sales: s.invoices.filter((i) => { const d = nextDue(i); return d && d.due < today(); }).length,
    production: s.projects.filter(isLate).length,
    inventory: lowStock().length,
  };
}
function shellView(content, page) {
  const r = store.role();
  const c = counts();
  const navItems = NAV.filter((n) => store.locked(n.key) || store.can(n.key));
  return `<div class="shell">
    <aside class="side ${sideOpen ? 'open' : ''}" aria-label="القائمة">
      <div class="side-brand"><div class="mark">${logo(38)}</div><div><div class="brand-name">VENICE</div><div class="brand-tag">ERP · FACTORY</div></div></div>
      <nav class="nav">
        ${navItems.map((n) => store.locked(n.key)
          ? `<a href="#/${n.key}" class="locked" aria-disabled="true" data-locked="1">${icon(n.icon, 18)}<span>${n.name}</span><span class="soon">قريبًا</span></a>`
          : `<a href="#/${n.key}" class="${page === n.key ? 'on' : ''}" data-tour="nav-${n.key}">${icon(n.icon, 18)}<span>${r.key === 'tech' && n.key === 'production' ? 'مهامي في الورشة' : n.name}</span>${c[n.key] ? `<span class="badge">${c[n.key]}</span>` : ''}</a>`).join('')}
      </nav>
      <div class="side-foot">
        <div class="side-user"><span class="avatar">${esc(r.person.split(' ').map((w) => w[0]).join('').slice(0, 2))}</span><div><b>${esc(r.person)}</b><span>${esc(r.name)}</span></div></div>
        ${DEMO.rolePicker ? `<label class="small" style="color:#8f887b">تغيير الدور
          <select data-change="switchRole" aria-label="تغيير الدور">${ROLES.map((x) => `<option value="${x.key}" ${x.key === r.key ? 'selected' : ''}>${x.name} · ${x.person}</option>`).join('')}</select>
        </label>` : ''}
        <div class="row">${DEMO.tour ? `<button class="btn sm ghost" style="color:#bfb8aa" data-act="startTour">${icon('play', 14)} الجولة</button>` : ''}<span class="spacer"></span><button class="btn sm ghost" style="color:#bfb8aa" data-act="logout">${icon('logout', 14)} تسجيل الخروج</button></div>
      </div>
    </aside>
    <div class="main">
      <header class="top">
        <button class="icon-btn menu-btn" data-act="toggleSide" aria-label="القائمة">${icon('menu', 20)}</button>
        <div class="search">${icon('search', 17)}<input id="gsearch" placeholder="بحث عن عميل أو رقم هاتف أو مشروع أو فاتورة…" autocomplete="off" aria-label="بحث"><kbd>Ctrl K</kbd><div class="search-results" hidden></div></div>
        <span class="spacer"></span>
        <div class="lang" role="group" aria-label="اللغة"><button class="on" type="button" aria-pressed="true">ع</button><button type="button" data-act="langEn" aria-pressed="false">EN</button></div>
        <button class="icon-btn" data-act="notifications" aria-label="التنبيهات">${icon('bell', 20)}${c.sales + c.production + c.inventory ? '<span class="dot"></span>' : ''}</button>
      </header>
      <main class="page" id="page">${content}</main>
    </div>
  </div>`;
}

export function render() {
  if (!store.session.role) { app.innerHTML = loginView(); tour.sync(); return; }
  let { page, id, sub } = route();
  if (!store.can(page)) { page = store.can('dashboard') ? 'dashboard' : 'production'; id = undefined; sub = undefined; history.replaceState(null, '', `#/${page}`); }
  const P = pages[page] || pages.dashboard;
  let html;
  try { html = P.render(id, sub); } catch (e) { console.error(e); html = `<div class="note">تعذّر عرض الصفحة: ${esc(e.message)}</div>`; }
  app.innerHTML = shellView(html, page);
  if (P.mount) P.mount(document.getElementById('page'), id, sub);
  tour.sync();
}

// ---------- global search ----------
function searchItems(q) {
  const s = store.state; const n = q.trim().toLowerCase().replace(/\s+/g, '');
  if (!n) return [];
  const norm = (x) => String(x || '').toLowerCase().replace(/[\s+()-]/g, '');
  const out = [];
  s.customers.filter((c) => norm(c.name + c.phone + c.id).includes(n)).slice(0, 5).forEach((c) => out.push({ g: 'العملاء', ic: 'user', t: c.name, s: `${c.id} · ${c.phone}`, to: `customers/${c.id}`, show: store.can('customers') }));
  s.projects.filter((p) => norm(p.name + p.id + find.customer(p.customerId)?.name).includes(n)).slice(0, 5).forEach((p) => out.push({ g: 'المشاريع', ic: 'folder', t: p.name, s: `${p.id} · ${find.customer(p.customerId)?.name}`, to: `projects/${p.id}`, show: store.can('projects') }));
  s.quotes.filter((x) => norm(x.id + x.title + find.customer(x.customerId)?.name).includes(n)).slice(0, 4).forEach((x) => out.push({ g: 'العروض والفواتير', ic: 'receipt', t: `${x.id} · ${x.title}`, s: `${find.customer(x.customerId)?.name} · ${quoteTotal(x).toLocaleString('en-US')} د.ب`, to: `sales/${x.id}`, show: store.can('sales') }));
  s.invoices.filter((x) => norm(x.id + find.customer(x.customerId)?.name).includes(n)).slice(0, 4).forEach((x) => out.push({ g: 'العروض والفواتير', ic: 'receipt', t: `${x.id}`, s: `${find.customer(x.customerId)?.name} · المتبقي ${balanceOf(x).toLocaleString('en-US')} د.ب`, to: `sales/${x.id}`, show: store.can('sales') }));
  s.materials.filter((m) => norm(m.name + m.id).includes(n)).slice(0, 4).forEach((m) => out.push({ g: 'الخامات', ic: 'box', t: m.name, s: `الرصيد ${m.qty} ${m.unit}`, to: 'inventory', show: store.can('inventory') }));
  const actions = [
    { k: 'عرض سعر جديد', to: 'sales/new', perm: 'sales' }, { k: 'عميل جديد', to: 'customers/new', perm: 'customers' },
    { k: 'لوحة الإنتاج', to: 'production', perm: 'production' }, { k: 'التقارير', to: 'reports', perm: 'reports' },
  ].filter((a) => a.k.replace(/\s/g, '').includes(n) && store.can(a.perm));
  actions.forEach((a) => out.push({ g: 'إجراءات', ic: 'plus', t: a.k, s: 'إجراء سريع', to: a.to, show: true }));
  return out.filter((x) => x.show);
}
let selIdx = 0;
function renderResults(box, items) {
  if (!items.length) { box.innerHTML = '<div class="muted small" style="padding:12px">لا توجد نتائج مطابقة.</div>'; box.hidden = false; return; }
  let html = ''; let last = '';
  items.forEach((it, i) => {
    if (it.g !== last) { html += `<div class="grp">${it.g}</div>`; last = it.g; }
    html += `<a href="#/${it.to}" class="${i === selIdx ? 'sel' : ''}">${icon(it.ic, 17)}<span><span style="display:block;font-weight:500">${esc(it.t)}</span><span class="small muted">${esc(it.s)}</span></span></a>`;
  });
  box.innerHTML = html; box.hidden = false;
}

// ---------- events ----------
const coreHandlers = {
  login(el) { store.session.role = el.dataset.role; store.save(); const r = store.role(); toast(`مرحبًا ${r.person}`, 'gold'); go(r.key === 'tech' ? 'production' : 'dashboard'); },
  logout() { store.session.role = null; store.save(); tour.stop(); location.hash = ''; render(); },
  toggleSide() { sideOpen = !sideOpen; document.querySelector('.side')?.classList.toggle('open', sideOpen); },
  pickRole(el) {
    loginRole = el.dataset.role;
    document.querySelectorAll('.rp').forEach((b) => { const on = b.dataset.role === loginRole; b.classList.toggle('on', on); b.setAttribute('aria-checked', on); });
    const em = document.querySelector('form[data-form=fakeLogin] input[name=email]'); if (em) em.value = roleEmail(loginRole);
  },
  startTour() { if (DEMO.tour) tour.start(); },
  langEn() { toast('الواجهة الإنجليزية ستتوفر في المرحلة القادمة', 'gold'); },
  notifications() { go('dashboard'); setTimeout(() => document.getElementById('attention')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50); },
};
const coreForms = {
  fakeLogin() { coreHandlers.login({ dataset: { role: DEMO.rolePicker ? loginRole : 'admin' } }); },
};
const changeHandlers = {
  switchRole(el) { store.session.role = el.value; store.save(); const r = store.role(); toast(`تم التبديل إلى ${r.name}`, 'gold'); go(r.key === 'tech' ? 'production' : 'dashboard'); },
};

document.addEventListener('click', (e) => {
  const link = e.target.closest('a[href^="#/"]');
  if (link) {
    const pg = link.getAttribute('href').slice(2).split('/')[0];
    if (store.locked(pg)) { e.preventDefault(); toast('هذا القسم سيتوفر في المرحلة القادمة', 'gold'); return; }
  }
  const a = e.target.closest('[data-act]');
  if (a && !a.disabled) {
    const name = a.dataset.act; const fn = coreHandlers[name] || handlers[name] || tour.handlers[name];
    if (fn) { e.preventDefault(); fn(a, e); }
    return;
  }
  const row = e.target.closest('[data-href]');
  if (row && !e.target.closest('a,button,input,select,label,[data-nohref]')) { go(row.dataset.href); return; }
  if (sideOpen && e.target.closest('.nav a')) { sideOpen = false; }
  if (!e.target.closest('.search')) document.querySelector('.search-results')?.setAttribute('hidden', '');
});
document.addEventListener('submit', (e) => {
  const f = e.target.closest('[data-form]'); if (!f) return;
  e.preventDefault();
  const fn = coreForms[f.dataset.form] || handlers[f.dataset.form];
  if (fn) fn(f, e);
});
document.addEventListener('change', (e) => {
  const el = e.target.closest('[data-change]'); if (!el) return;
  const fn = changeHandlers[el.dataset.change] || handlers[el.dataset.change];
  if (fn) fn(el, e);
});
document.addEventListener('input', (e) => {
  if (e.target.id === 'gsearch') {
    const box = e.target.parentElement.querySelector('.search-results'); selIdx = 0;
    if (!e.target.value.trim()) { box.hidden = true; return; }
    renderResults(box, searchItems(e.target.value));
    return;
  }
  const el = e.target.closest('[data-input]'); if (!el) return;
  const fn = handlers[el.dataset.input]; if (fn) fn(el, e);
});
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); document.getElementById('gsearch')?.focus(); }
  if (e.key === 'Escape') { closeModal(); document.querySelector('.search-results')?.setAttribute('hidden', ''); }
  if (e.target.id === 'gsearch') {
    const box = e.target.parentElement.querySelector('.search-results'); const items = searchItems(e.target.value);
    if (!items.length) return;
    if (e.key === 'ArrowDown') { selIdx = Math.min(items.length - 1, selIdx + 1); renderResults(box, items); e.preventDefault(); }
    if (e.key === 'ArrowUp') { selIdx = Math.max(0, selIdx - 1); renderResults(box, items); e.preventDefault(); }
    if (e.key === 'Enter') { go(items[selIdx].to); e.target.value = ''; box.hidden = true; }
  }
});
window.addEventListener('hashchange', () => { closeModal(); sideOpen = false; render(); window.scrollTo(0, 0); });
window.addEventListener('afterprint', () => document.body.classList.remove('printing'));

nav.go = go;
nav.render = render;
store.load();
if (!DEMO.rolePicker && store.session.role && store.session.role !== 'admin') store.session.role = 'admin';
store.listeners.push(() => tour.check());
render();
