import { store, act, find, childrenOf, customerBalance, balanceOf, invoiceStatus, quoteTotal, STAGES, DONE } from '../data.js';
import { icon } from '../icons.js';
import { esc, money, fmtDate, relDays, chip, toast, modal, closeModal, formData, emptyState } from '../ui.js';
import { nav } from '../nav.js';

let filter = { q: '', type: 'all' };
const initials = (n) => esc(n.split(' ').map((w) => w[0]).join('').slice(0, 2));

function listRows() {
  const s = store.state; const q = filter.q.replace(/\s/g, '').toLowerCase();
  return s.customers.filter((c) => (filter.type === 'all' || c.type === filter.type) && (!q || (c.name + c.phone + c.id + c.city).replace(/[\s+()-]/g, '').toLowerCase().includes(q)));
}
function tableHtml() {
  const rows = listRows();
  if (!rows.length) return emptyState('search', 'لا يوجد عميل مطابق', 'جرّب البحث بجزء من الاسم أو برقم الهاتف.');
  return `<div class="table-wrap"><table><thead><tr><th>العميل</th><th>الهاتف</th><th>المدينة</th><th>المشاريع</th><th class="num">الرصيد المستحق</th></tr></thead><tbody>
    ${rows.map((c) => { const bal = customerBalance(c.id); const parent = c.parentId && find.customer(c.parentId); const kids = childrenOf(c.id).length; const pc = store.state.projects.filter((p) => p.customerId === c.id).length;
      return `<tr class="click" data-href="customers/${c.id}"><td><div class="row" style="gap:10px;flex-wrap:nowrap"><span class="avatar">${initials(c.name)}</span><span><b>${esc(c.name)}</b><span class="sub">${c.id} · ${c.type}${parent ? ` · تابع لـ ${esc(parent.name)}` : ''}${kids ? ` · ${kids} عملاء تابعون` : ''}</span></span></div></td>
      <td><span class="ltr">${esc(c.phone)}</span></td><td>${esc(c.city)}</td><td>${pc}</td><td class="num">${bal ? money(bal) : '<span class="muted">—</span>'}</td></tr>`; }).join('')}
  </tbody></table></div>`;
}

function customerForm(defaults = {}) {
  const companies = store.state.customers.filter((c) => c.type === 'شركة');
  return `<form class="stack" data-form="saveCustomer">
    <div class="row between"><span class="small muted">الاسم ورقم الهاتف حقلان إلزاميان</span><button type="button" class="autofill" data-act="autofillCustomer">${icon('spark', 14)} تعبئة بيانات تجريبية</button></div>
    <div class="grid2"><label class="f">اسم العميل<input name="name" required value="${esc(defaults.name || '')}"></label>
    <label class="f">رقم الهاتف<input name="phone" required dir="ltr" placeholder="+973" value="${esc(defaults.phone || '')}"></label></div>
    <div class="grid2"><label class="f">النوع<select name="type"><option>فرد</option><option>شركة</option></select></label>
    <label class="f">المدينة<input name="city" value="${esc(defaults.city || '')}"></label></div>
    <label class="f">العنوان<input name="address" value="${esc(defaults.address || '')}"></label>
    <div class="grid2"><label class="f">البريد الإلكتروني<input name="email" dir="ltr" value="${esc(defaults.email || '')}"></label>
    <label class="f">تابع لعميل (شركة مقاولات / مصمم)<select name="parentId"><option value="">لا، عميل مستقل</option>${companies.map((c) => `<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select></label></div>
    <div class="row end"><button type="button" class="btn ghost" data-close="1" data-act="closeModal">إلغاء</button><button class="btn primary" data-tour="save-customer">${icon('check', 16)} حفظ العميل</button></div>
  </form>`;
}
export function openNewCustomer() { modal('عميل جديد', customerForm()); }

function profile(id) {
  const s = store.state; const c = find.customer(id);
  if (!c) return emptyState('user', 'العميل غير موجود', 'ربما تم حذفه أو أن الرابط غير صحيح.', '<a class="btn" href="#/customers">العودة إلى العملاء</a>');
  const parent = c.parentId && find.customer(c.parentId); const kids = childrenOf(c.id);
  const ids = [c.id, ...kids.map((k) => k.id)];
  const projects = s.projects.filter((p) => ids.includes(p.customerId));
  const quotes = s.quotes.filter((q) => ids.includes(q.customerId));
  const invoices = s.invoices.filter((i) => ids.includes(i.customerId));
  const bal = invoices.reduce((a, i) => a + balanceOf(i), 0);
  const acts = s.activity.filter((a) => a.text.includes(c.name) || projects.some((p) => a.ref.includes(p.id)) || quotes.some((q) => a.ref.includes(q.id)));
  const maps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.address + '، البحرين')}`;
  return `<div class="crumb"><a href="#/customers">العملاء</a>${icon('chevron', 13)}<span>${esc(c.name)}</span></div>
  <div class="page-head"><div class="row" style="gap:14px"><span class="avatar" style="width:52px;height:52px;font-size:18px">${initials(c.name)}</span><div><h1>${esc(c.name)}</h1><p>${c.id} · ${chip('neutral', c.type)} ${parent ? `· تابع لـ <a href="#/customers/${parent.id}">${esc(parent.name)}</a>` : ''} · عميل منذ ${fmtDate(c.since)}</p></div></div>
    <div class="row">${store.can('sales') ? `<a class="btn primary" href="#/sales/new/${c.id}" data-tour="quote-from-customer">${icon('plus', 16)} عرض سعر جديد</a>` : ''}${store.can('statements') ? `<a class="btn" href="#/statements/${c.id}">${icon('statement', 16)} كشف حساب</a>` : ''}</div></div>
  <div class="smart" style="margin-bottom:18px">
    <a href="#/projects"><b>${projects.length}</b><span>مشاريع</span></a>
    <a href="#/sales"><b>${quotes.length}</b><span>عروض أسعار</span></a>
    <a href="#/sales"><b>${invoices.length}</b><span>فواتير</span></a>
    <a href="#/statements/${c.id}"><b class="num">${money(bal)}</b><span>الرصيد المستحق</span></a>
  </div>
  <div class="cols">
    <div class="stack">
      ${kids.length ? `<div class="card"><div class="card-head"><h3>العملاء التابعون لـ ${esc(c.name)}</h3><span class="chip gold">${kids.length}</span></div><div class="list">${kids.map((k) => `<a class="li" href="#/customers/${k.id}"><span class="avatar">${initials(k.name)}</span><span style="flex:1"><span class="t" style="display:block">${esc(k.name)}</span><span class="s">${esc(k.address)}</span></span><span class="num">${money(customerBalance(k.id))}</span></a>`).join('')}</div></div>` : ''}
      <div class="card"><div class="card-head"><h3>المشاريع</h3></div><div class="list">${projects.length ? projects.map((p) => `<a class="li" href="#/projects/${p.id}"><span class="ico gold">${icon('folder', 17)}</span><span style="flex:1"><span class="t" style="display:block">${esc(p.name)}</span><span class="s">${p.id} · ${p.stage >= DONE ? 'تم التسليم' : STAGES[p.stage].name}${p.customerId !== c.id ? ` · ${esc(find.customer(p.customerId).name)}` : ''}</span></span>${p.stage >= DONE ? chip('done') : `<span class="chip gold">${Math.round((p.stage / DONE) * 100)}%</span>`}</a>`).join('') : '<div class="empty">' + icon('folder', 26) + '<p>لا توجد مشاريع حتى الآن.</p></div>'}</div></div>
      <div class="card"><div class="card-head"><h3>عروض الأسعار والفواتير</h3></div>${!quotes.length && !invoices.length ? '<div class="empty"><p>لا توجد عروض أو فواتير.</p></div>' : ''}<div class="table-wrap"><table><tbody>
        ${quotes.map((q) => `<tr class="click" data-href="sales/${q.id}"><td><b>${q.id}</b><span class="sub">${esc(q.title)}</span></td><td>${fmtDate(q.date)}</td><td class="num">${money(quoteTotal(q))}</td><td>${chip(q.status)}</td></tr>`).join('')}
        ${invoices.map((i) => `<tr class="click" data-href="sales/${i.id}"><td><b>${i.id}</b><span class="sub">فاتورة</span></td><td>${fmtDate(i.date)}</td><td class="num">${money(i.total)}</td><td>${chip(invoiceStatus(i))}</td></tr>`).join('')}
      </tbody></table></div></div>
    </div>
    <div class="stack">
      <div class="card card-pad"><dl class="kv"><dt>الهاتف</dt><dd><a class="ltr" href="tel:${esc(c.phone)}">${esc(c.phone)}</a></dd><dt>البريد الإلكتروني</dt><dd class="ltr">${esc(c.email || '—')}</dd><dt>المدينة</dt><dd>${esc(c.city)}</dd><dt>العنوان</dt><dd>${esc(c.address)}</dd></dl>
        <div class="row" style="margin-top:14px"><a class="btn sm" href="${maps}" target="_blank" rel="noopener">${icon('pin', 15)} الموقع على الخريطة</a><a class="btn sm" href="https://wa.me/${c.phone.replace(/\D/g, '')}" target="_blank" rel="noopener">${icon('chat', 15)} واتساب</a></div></div>
      <div class="card"><div class="card-head"><h3>سجل النشاط</h3></div><div class="act">${acts.length ? acts.slice(0, 8).map((a) => `<div class="a"><span class="avatar">${initials(a.user)}</span><div><div>${esc(a.text)}</div><div class="s">${esc(a.user)} · ${relDays(a.ts)}</div></div></div>`).join('') : '<div class="empty"><p>لا يوجد نشاط مسجل.</p></div>'}</div></div>
    </div>
  </div>`;
}

export default {
  render(id) {
    if (id && id !== 'new') return profile(id);
    const s = store.state;
    return `<div class="page-head"><div><h1>العملاء</h1><p>${s.customers.length} عميل</p></div>
      <button class="btn primary" data-act="newCustomer" data-tour="new-customer">${icon('plus', 16)} عميل جديد</button></div>
    <div class="card"><div class="card-head" style="flex-wrap:wrap">
      <div class="tabs">${[['all', 'الكل'], ['فرد', 'أفراد'], ['شركة', 'شركات']].map(([k, l]) => `<button data-act="custType" data-v="${k}" class="${filter.type === k ? 'on' : ''}">${l}</button>`).join('')}</div>
      <div class="search" style="max-width:300px"><span style="position:absolute;right:12px;top:11px;color:var(--muted)">${icon('search', 16)}</span><input data-input="custSearch" placeholder="الاسم أو رقم الهاتف…" value="${esc(filter.q)}" style="padding-inline-start:36px"></div>
    </div><div id="cust-table">${tableHtml()}</div></div>`;
  },
  mount(root, id) { if (id === 'new') openNewCustomer(); },
};

export const handlers = {
  newCustomer() { openNewCustomer(); },
  closeModal() { closeModal(); },
  custType(el) { filter.type = el.dataset.v; nav.render(); },
  custSearch(el) { filter.q = el.value; document.getElementById('cust-table').innerHTML = tableHtml(); },
  autofillCustomer(el) {
    const f = el.closest('form'); const v = { name: 'منى حسين', phone: '+973 3555 2020', city: 'الجفير', address: 'فيلا 12، الجفير', email: 'mona@example.com' };
    Object.entries(v).forEach(([k, val]) => { f.elements[k].value = val; });
    f.elements.type.value = 'فرد';
  },
  saveCustomer(form) {
    const d = formData(form);
    if (!d.name || !d.phone) { toast('يرجى إدخال اسم العميل ورقم الهاتف', 'bad'); return; }
    if (store.state.customers.some((c) => c.phone.replace(/\D/g, '') === d.phone.replace(/\D/g, ''))) { toast('يوجد عميل مسجل بنفس رقم الهاتف', 'bad'); return; }
    const c = act.addCustomer({ ...d, parentId: d.parentId || null });
    closeModal(); toast(`تم حفظ العميل ${c.name} (${c.id})`); nav.go(`customers/${c.id}`);
  },
};
