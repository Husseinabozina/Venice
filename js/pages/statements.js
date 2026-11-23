import { store, find, childrenOf, today } from '../data.js';
import { icon, logo } from '../icons.js';
import { esc, money, fmtDate } from '../ui.js';
import { printDoc } from '../docs.js';
import { nav } from '../nav.js';

let opts = { from: '', to: '', withKids: true };
const m3 = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 });

function compute(cid) {
  const s = store.state; const c = find.customer(cid);
  const ids = opts.withKids ? [cid, ...childrenOf(cid).map((k) => k.id)] : [cid];
  const tx = [];
  s.invoices.filter((i) => ids.includes(i.customerId)).forEach((i) => tx.push({ date: i.date, ref: i.id, desc: `فاتورة · ${find.project(i.projectId)?.name || ''}${i.customerId !== cid ? ` (${find.customer(i.customerId).name})` : ''}`, debit: i.total, credit: 0 }));
  s.receipts.forEach((r) => { const i = find.invoice(r.invoiceId); if (i && ids.includes(i.customerId)) tx.push({ date: r.date, ref: r.id, desc: `دفعة مستلمة · ${r.method} · ${i.id}`, debit: 0, credit: r.amount }); });
  tx.sort((a, b) => a.date.localeCompare(b.date) || a.ref.localeCompare(b.ref));
  const from = opts.from || '0000'; const to = opts.to || '9999';
  const opening = tx.filter((t) => t.date < from).reduce((a, t) => a + t.debit - t.credit, 0);
  let bal = opening; let td = 0; let tc = 0;
  const rows = tx.filter((t) => t.date >= from && t.date <= to).map((t) => { bal += t.debit - t.credit; td += t.debit; tc += t.credit; return { ...t, bal }; });
  return { c, opening, rows, td, tc, closing: bal, kids: childrenOf(cid) };
}

function statementDoc(d) {
  return `<div class="doc"><div class="doc-head"><div style="display:flex;align-items:center;gap:13px"><div class="mk">${logo(54)}</div><div><div class="nm">VENICE</div><div class="tg">FURNITURE WORKSHOP W.L.L</div></div></div>
    <div class="ttl"><b>CUSTOMER STATEMENT</b><div>${opts.from || 'All dates'} — ${opts.to || today()}</div></div></div><div class="doc-stripe"></div>
  <div class="doc-body"><div><b style="font-size:18px">${esc(d.c.name)}</b><div>${esc(d.c.phone)} · ${esc(d.c.email || '')}</div></div>
    <div style="background:#f7f3ea;padding:12px">Opening balance: <b>${m3(d.opening)} BHD</b></div>
    <table><thead><tr><th>Date</th><th>Reference</th><th>Description</th><th style="text-align:right">Debit</th><th style="text-align:right">Credit</th><th style="text-align:right">Balance</th></tr></thead><tbody>
    ${d.rows.map((r) => `<tr><td>${r.date}</td><td>${r.ref}</td><td dir="rtl" style="text-align:right">${esc(r.desc)}</td><td class="r">${r.debit ? m3(r.debit) : '—'}</td><td class="r">${r.credit ? m3(r.credit) : '—'}</td><td class="r"><b>${m3(r.bal)}</b></td></tr>`).join('')}</tbody></table>
    <div style="background:#171b20;color:#fff;padding:14px;text-align:right">CLOSING BALANCE: <b style="color:#e4c17c;font-size:20px">${m3(d.closing)} BHD</b></div></div></div>`;
}

export default {
  render(id) {
    const s = store.state; const cid = id || s.customers[0].id; const d = compute(cid);
    return `<div class="page-head"><div><h1>كشف حساب العملاء</h1></div>
      <button class="btn primary" data-act="printStatement" data-id="${cid}">${icon('printer', 16)} طباعة / PDF</button></div>
    <div class="card card-pad" style="margin-bottom:18px"><div class="grid3" style="grid-template-columns:2fr 1fr 1fr">
      <label class="f">العميل<select data-change="stCustomer">${s.customers.map((c) => `<option value="${c.id}" ${c.id === cid ? 'selected' : ''}>${esc(c.name)}${c.parentId ? ` (تابع لـ ${esc(find.customer(c.parentId).name)})` : ''}</option>`).join('')}</select></label>
      <label class="f">من تاريخ<input type="date" value="${opts.from}" data-change="stFrom"></label>
      <label class="f">إلى تاريخ<input type="date" value="${opts.to}" data-change="stTo"></label></div>
      <div class="row" style="margin-top:12px"><button class="btn sm" data-act="stMonth">الشهر الحالي</button><button class="btn sm" data-act="stAll">كل الفترات</button>
      ${d.kids.length ? `<label class="row small" style="gap:6px;margin-inline-start:auto;cursor:pointer"><input type="checkbox" style="width:16px;height:16px" ${opts.withKids ? 'checked' : ''} data-change="stKids"> يشمل العملاء التابعين (${d.kids.length})</label>` : ''}</div></div>
    <div class="kpis" style="grid-template-columns:repeat(4,1fr)">
      <div class="kcard"><div class="l">الرصيد الافتتاحي</div><div class="v num" style="font-size:20px">${money(d.opening)}</div></div>
      <div class="kcard"><div class="l">فواتير الفترة (مدين)</div><div class="v num" style="font-size:20px">${money(d.td)}</div></div>
      <div class="kcard"><div class="l">دفعات الفترة (دائن)</div><div class="v num" style="font-size:20px;color:var(--ok)">${money(d.tc)}</div></div>
      <div class="kcard"><div class="l">الرصيد الختامي</div><div class="v num gold" style="font-size:20px">${money(d.closing)}</div></div></div>
    <div class="card"><div class="table-wrap"><table><thead><tr><th>التاريخ</th><th>المرجع</th><th>البيان</th><th class="num">مدين</th><th class="num">دائن</th><th class="num">الرصيد</th></tr></thead>
      <tbody>${d.rows.length ? d.rows.map((r) => `<tr class="click" data-href="sales/${r.ref.startsWith('REC') ? store.state.receipts.find((x) => x.id === r.ref).invoiceId : r.ref}"><td>${fmtDate(r.date)}</td><td><b>${r.ref}</b></td><td>${esc(r.desc)}</td><td class="num">${r.debit ? money(r.debit, false) : '—'}</td><td class="num" style="color:var(--ok)">${r.credit ? money(r.credit, false) : '—'}</td><td class="num"><b>${money(r.bal, false)}</b></td></tr>`).join('') : '<tr><td colspan="6" class="muted" style="text-align:center;padding:24px">لا توجد حركات في هذه الفترة</td></tr>'}</tbody>
      <tfoot><tr><td colspan="3">إجمالي الفترة</td><td class="num">${money(d.td, false)}</td><td class="num">${money(d.tc, false)}</td><td class="num">${money(d.closing, false)}</td></tr></tfoot></table></div></div>`;
  },
};

export const handlers = {
  stCustomer(el) { nav.go(`statements/${el.value}`); },
  stFrom(el) { opts.from = el.value; nav.render(); },
  stTo(el) { opts.to = el.value; nav.render(); },
  stKids(el) { opts.withKids = el.checked; nav.render(); },
  stMonth() { const t = today(); opts.from = t.slice(0, 8) + '01'; opts.to = t; nav.render(); },
  stAll() { opts.from = ''; opts.to = ''; nav.render(); },
  printStatement(el) { printDoc(statementDoc(compute(el.dataset.id))); },
};
