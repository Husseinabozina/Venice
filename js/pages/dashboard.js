import { store, DEMO, STAGES, DONE, find, balanceOf, nextDue, lowStock, isLate, projectCost, quoteTotal, today, daysFrom } from '../data.js';
import { icon } from '../icons.js';
import { esc, money, moneyShort, relDays, daysSince, chip } from '../ui.js';

const kpi = (label, value, ic, href, extra = '', gold = false) =>
  `<${store.can(href.split('/')[0]) ? `a href="#/${href}"` : 'div'} class="kcard"><div class="l">${icon(ic, 17)}${label}</div><div class="v ${gold ? 'gold' : ''}">${value}</div>${extra ? `<div>${extra}</div>` : ''}</${store.can(href.split('/')[0]) ? 'a' : 'div'}>`;

function attentionItems(role) {
  const s = store.state; const out = [];
  const can = (p) => store.can(p);
  if (can('production') || can('projects')) {
    s.projects.filter(isLate).forEach((p) => out.push({ tone: 'bad', ic: 'alert', t: `${p.name} متأخر`, s: `${find.customer(p.customerId)?.name} · في مرحلة ${STAGES[p.stage].name} ${relDays(p.lateSince)}`, to: `projects/${p.id}`, tag: chip('late') }));
    s.projects.filter((p) => p.stage < DONE && p.expected <= daysFrom(2)).forEach((p) => out.push({ tone: 'warn', ic: 'truck', t: `تسليم ${p.name}`, s: `${find.customer(p.customerId)?.name} · ${relDays(p.expected)}`, to: `projects/${p.id}`, tag: chip('x', relDays(p.expected)) }));
  }
  if (can('sales') || can('statements')) {
    s.invoices.forEach((inv) => {
      const d = nextDue(inv); if (!d) return;
      if (d.due <= daysFrom(3) && inv.schedule.indexOf(d) > 0 || d.due < today()) out.push({ tone: d.due < today() ? 'bad' : 'warn', ic: 'wallet', t: `دفعة ${find.customer(inv.customerId)?.name}`, s: `${moneyShort(d.amount)} د.ب · ${d.label} · ${relDays(d.due)}`, to: `sales/${inv.id}`, tag: chip(d.due < today() ? 'late' : 'partial', d.due < today() ? 'متأخرة' : 'مستحقة قريبًا') });
    });
    s.quotes.filter((q) => q.status === 'sent').forEach((q) => out.push({ tone: 'info', ic: 'send', t: `عرض ${q.id} بانتظار الرد`, s: `${find.customer(q.customerId)?.name} · أُرسل ${relDays(q.date)}`, to: `sales/${q.id}`, tag: chip('sent') }));
  }
  if (can('inventory')) lowStock().forEach((m) => out.push({ tone: 'warn', ic: 'box', t: `${m.name} تحت حد الطلب`, s: `الرصيد ${m.qty} ${m.unit} · الحد ${m.min}`, to: 'inventory', tag: chip('low') }));
  if (role === 'hr') s.employees.filter((e) => e.today !== 'present').forEach((e) => out.push({ tone: e.today === 'absent' ? 'bad' : 'warn', ic: 'badge', t: e.name, s: `${e.job} · ${e.dept}`, to: 'hr', tag: chip(e.today) }));
  return out;
}

export default {
  render() {
    const s = store.state; const r = store.role(); const role = r.key;
    const active = s.projects.filter((p) => p.stage < DONE);
    const receivable = s.invoices.reduce((a, i) => a + balanceOf(i), 0);
    const overdue = s.invoices.filter((i) => { const d = nextDue(i); return d && d.due < today(); }).length;
    const low = lowStock().length;
    const activeValue = active.reduce((a, p) => a + p.value, 0);
    let kpis = '';
    if (role === 'admin') kpis = kpi('مستحقات العملاء', money(receivable), 'wallet', 'statements', overdue ? chip('late', `${overdue} متأخرة`) : chip('paid', 'لا توجد متأخرات'))
      + kpi('مشاريع في الورشة', active.length, 'factory', 'production', chip('neutral', `${active.filter(isLate).length} متأخر`))
      + kpi('قيمة المشاريع الجارية', money(activeValue), 'coins', 'projects', chip('neutral', `${active.length} مشاريع`), true)
      + kpi('خامات تحت حد الطلب', low, 'box', 'inventory', low ? chip('low', 'تحتاج إلى طلب') : chip('okstock'));
    else if (role === 'accountant') {
      const month = today().slice(0, 7);
      const collected = s.receipts.filter((x) => x.date.startsWith(month)).reduce((a, x) => a + x.amount, 0);
      const due7 = s.invoices.map(nextDue).filter((d) => d && d.due <= daysFrom(7)).reduce((a, d) => a + d.amount, 0);
      kpis = kpi('مستحقات العملاء', money(receivable), 'wallet', 'statements') + kpi('مستحق خلال 7 أيام', money(due7), 'clock', 'sales') + kpi('المحصّل هذا الشهر', money(collected), 'check', 'sales', '', true) + kpi('أوامر شراء مفتوحة', s.pos.filter((p) => p.status !== 'received').length, 'cart', 'purchases');
    } else if (role === 'sales') {
      const open = s.quotes.filter((q) => ['draft', 'sent'].includes(q.status));
      kpis = kpi('عروض بانتظار الرد', s.quotes.filter((q) => q.status === 'sent').length, 'send', 'sales') + kpi('قيمة العروض المفتوحة', money(open.reduce((a, q) => a + quoteTotal(q), 0)), 'receipt', 'sales', '', true) + kpi('العملاء', s.customers.length, 'users', 'customers') + kpi('المشاريع الجارية', active.length, 'folder', 'projects');
    } else if (role === 'production') {
      kpis = kpi('في الورشة', active.length, 'factory', 'production') + kpi('متأخر', active.filter(isLate).length, 'alert', 'production') + kpi('تسليم خلال أسبوع', active.filter((p) => p.expected <= daysFrom(7)).length, 'truck', 'projects') + kpi('خامات تحت الحد', low, 'box', 'inventory');
    } else if (role === 'store') {
      kpis = kpi('خامات تحت الحد', low, 'alert', 'inventory') + kpi('شحنات قيد الوصول', s.pos.filter((p) => p.status === 'sent').length, 'truck', 'purchases') + kpi('عدد الأصناف', s.materials.length, 'box', 'inventory') + kpi('حركات اليوم', s.movements.filter((m) => m.date === today()).length, 'history', 'inventory');
    } else if (role === 'hr') {
      const c = (v) => s.employees.filter((e) => e.today === v).length;
      kpis = kpi('عدد الموظفين', s.employees.length, 'users', 'hr') + kpi('الحاضرون اليوم', c('present'), 'check', 'hr') + kpi('الغائبون', c('absent'), 'alert', 'hr') + kpi('إجازة', c('leave'), 'clock', 'hr');
    }

    const att = attentionItems(role);
    const stageCounts = STAGES.map((st, i) => ({ name: st.name, n: active.filter((p) => p.stage === i).length }));
    const maxN = Math.max(1, ...stageCounts.map((x) => x.n));
    const greet = new Date().getHours() < 12 ? 'صباح الخير' : 'مساء الخير';

    return `
    <div class="page-head"><div><p style="margin:0">${greet}</p><h1>مرحبًا، ${esc(r.person.split(' ')[0])}</h1></div>
      <div class="row">${store.can('sales') ? `<a class="btn primary" href="#/sales/new" data-tour="new-quote-top">${icon('plus', 16)} عرض سعر جديد</a>` : ''}${store.can('customers') ? `<a class="btn" href="#/customers/new">${icon('user', 16)} عميل جديد</a>` : ''}</div></div>
    ${role === 'admin' && DEMO.tour ? `<button class="tour-cta" style="margin-bottom:18px" data-act="startTour"><span class="play">${icon('play', 20)}</span><span><b>جولة الدورة الكاملة</b><span>امشي بنفسك في رحلة مطبخ كامل: عميل ← عرض سعر ← فاتورة ← ورشة ← مخزن ← ربح ← تسليم</span></span></button>` : ''}
    <div class="kpis">${kpis}</div>
    <div class="cols">
      <div class="card" id="attention"><div class="card-head"><h3>بحاجة إلى متابعة اليوم</h3><span class="chip neutral">${att.length}</span></div>
        <div class="list">${att.length ? att.map((a) => `<a class="li" href="#/${a.to}"><span class="ico ${a.tone}">${icon(a.ic, 17)}</span><span style="flex:1;min-width:0"><span class="t" style="display:block">${esc(a.t)}</span><span class="s">${esc(a.s)}</span></span>${a.tag}</a>`).join('') : '<div class="empty">' + icon('check', 28) + '<h4>لا توجد متأخرات</h4><p>جميع الأعمال تسير وفق الجدول.</p></div>'}</div>
      </div>
      <div class="stack">
        ${store.can('production') || store.can('projects') ? `<div class="card"><div class="card-head"><h3>الورشة الآن</h3><a class="btn sm ghost" href="#/production">لوحة الإنتاج ${icon('chevron', 14)}</a></div>
          <div class="card-pad hbars">${stageCounts.map((x) => `<div class="r"><span>${x.name}</span><div class="bar"><span style="width:${(x.n / maxN) * 100}%"></span></div><span class="num muted" style="white-space:nowrap">${x.n} مشروع</span></div>`).join('')}</div></div>` : ''}
        <div class="card"><div class="card-head"><h3>آخر النشاطات</h3></div>
          <div class="act">${s.activity.slice(0, 6).map((a) => `<div class="a"><span class="avatar">${esc(a.user.split(' ').map((w) => w[0]).join('').slice(0, 2))}</span><div><div>${esc(a.text)}</div><div class="s">${esc(a.user)} · ${esc(a.ts.slice(11))} · ${relDays(a.ts)}</div></div></div>`).join('')}</div></div>
      </div>
    </div>`;
  },
};
export { daysSince };
