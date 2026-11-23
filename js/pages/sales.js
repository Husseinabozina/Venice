import { store, act, find, quoteTotal, paidOf, balanceOf, invoiceStatus, nextDue, today } from '../data.js';
import { icon } from '../icons.js';
import { esc, money, fmtDate, relDays, chip, toast, modal, closeModal, confirmBox, formData, emptyState } from '../ui.js';
import { quoteDoc, invoiceDoc, receiptDoc, printDoc } from '../docs.js';
import { nav } from '../nav.js';

let tab = 'quotes';
let draft = null; // quote being edited in the form

const m3 = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 });

function flow(steps, cur) {
  return `<div class="flow">${steps.map((s, i) => `${i ? `<span class="ln ${i <= cur ? 'done' : ''}"></span>` : ''}<span class="st ${i < cur ? 'done' : i === cur ? 'cur' : ''}"><span class="c">${i < cur ? icon('check', 13) : i + 1}</span>${s}</span>`).join('')}</div>`;
}
function quoteStage(q) {
  if (q.status === 'draft') return 0;
  if (q.status === 'sent') return 1;
  if (q.status === 'rejected') return 1;
  const inv = store.state.invoices.find((i) => i.quoteId === q.id);
  if (!inv) return 2;
  const st = invoiceStatus(inv);
  return st === 'paid' ? 5 : st === 'partial' ? 4 : 3;
}
const FLOW = ['مسودة', 'أُرسل للعميل', 'موافقة العميل', 'فاتورة', 'سداد المقدّم', 'السداد الكامل'];

// ---------- list ----------
function list() {
  const s = store.state;
  const q = s.quotes, inv = s.invoices, rec = s.receipts;
  let body = '';
  if (tab === 'quotes') body = q.length ? `<table><thead><tr><th>رقم العرض</th><th>العميل / المشروع</th><th>التاريخ</th><th class="num">الإجمالي</th><th>الحالة</th></tr></thead><tbody>
    ${q.map((x) => `<tr class="click" data-href="sales/${x.id}"><td><b>${x.id}</b></td><td>${esc(find.customer(x.customerId)?.name)}<span class="sub">${esc(x.title)}</span></td><td>${fmtDate(x.date)}<span class="sub">${relDays(x.date)}</span></td><td class="num">${money(quoteTotal(x))}</td><td>${chip(x.status)}</td></tr>`).join('')}</tbody></table>` : emptyState('receipt', 'لا توجد عروض أسعار', 'أنشئ أول عرض سعر.');
  if (tab === 'invoices') body = `<table><thead><tr><th>رقم الفاتورة</th><th>العميل</th><th>الدفعة القادمة</th><th class="num">الإجمالي</th><th class="num">المتبقي</th><th>الحالة</th></tr></thead><tbody>
    ${inv.map((x) => { const d = nextDue(x); return `<tr class="click" data-href="sales/${x.id}"><td><b>${x.id}</b><span class="sub">${esc(find.project(x.projectId)?.name)}</span></td><td>${esc(find.customer(x.customerId)?.name)}</td><td>${d ? `${fmtDate(d.due)}<span class="sub" style="color:${d.due < today() ? 'var(--bad)' : ''}">${relDays(d.due)}</span>` : '<span class="muted">—</span>'}</td><td class="num">${money(x.total)}</td><td class="num">${money(balanceOf(x))}</td><td>${chip(invoiceStatus(x))}</td></tr>`; }).join('')}</tbody></table>`;
  if (tab === 'receipts') body = `<table><thead><tr><th>رقم السند</th><th>العميل</th><th>الفاتورة</th><th>التاريخ</th><th>طريقة الدفع</th><th class="num">المبلغ</th><th></th></tr></thead><tbody>
    ${rec.map((r) => { const i = find.invoice(r.invoiceId); return `<tr><td><b>${r.id}</b></td><td>${esc(find.customer(i.customerId)?.name)}</td><td><a href="#/sales/${i.id}">${i.id}</a></td><td>${fmtDate(r.date)}</td><td>${esc(r.method)}</td><td class="num">${money(r.amount)}</td><td><button class="btn sm" data-act="showReceipt" data-id="${r.id}">${icon('eye', 14)} عرض</button></td></tr>`; }).join('')}</tbody></table>`;
  const open = q.filter((x) => x.status === 'sent').length;
  return `<div class="page-head"><div><h1>عروض الأسعار والفواتير</h1></div>
    <a class="btn primary" href="#/sales/new" data-tour="new-quote">${icon('plus', 16)} عرض سعر جديد</a></div>
  <div class="card"><div class="card-head"><div class="tabs">
    <button data-act="salesTab" data-v="quotes" class="${tab === 'quotes' ? 'on' : ''}">عروض الأسعار ${open ? `<span class="chip info" style="height:20px">${open} بانتظار الرد</span>` : ''}</button>
    <button data-act="salesTab" data-v="invoices" class="${tab === 'invoices' ? 'on' : ''}">الفواتير</button>
    <button data-act="salesTab" data-v="receipts" class="${tab === 'receipts' ? 'on' : ''}">سندات القبض</button></div></div>
    <div class="table-wrap">${body}</div></div>`;
}

// ---------- quote form ----------
function quoteForm(custId) {
  const s = store.state;
  if (!draft || draft.forCustomer !== (custId || null)) draft = { forCustomer: custId || null, customerId: custId || '', title: '', type: 'مطبخ', validDays: 15, notes: '', items: [{ desc: '', qty: 1, price: 0 }] };
  return `<div class="crumb"><a href="#/sales">عروض الأسعار والفواتير</a>${icon('chevron', 13)}<span>عرض سعر جديد</span></div>
  <div class="page-head"><div><h1>عرض سعر جديد</h1></div>
    <button type="button" class="autofill" data-act="autofillQuote" data-tour="autofill-quote">${icon('spark', 14)} تعبئة بيانات تجريبية</button></div>
  <form class="cols" data-form="saveQuote" id="qform">
    <div class="card card-pad stack">
      <div class="grid2"><label class="f">العميل<select name="customerId" required data-change="draftField"><option value="">اختر العميل…</option>${s.customers.map((c) => `<option value="${c.id}" ${draft.customerId === c.id ? 'selected' : ''}>${esc(c.name)} · ${c.phone}</option>`).join('')}</select></label>
      <label class="f">نوع المشروع<select name="type" data-change="draftField">${['مطبخ', 'أثاث', 'ديكور'].map((t) => `<option ${draft.type === t ? 'selected' : ''}>${t}</option>`).join('')}</select></label></div>
      <div class="grid2"><label class="f">اسم المشروع<input name="title" required placeholder="مطبخ فيلا حديث" value="${esc(draft.title)}" data-input="draftField"></label>
      <label class="f">صلاحية العرض (أيام)<input name="validDays" type="number" min="1" value="${draft.validDays}" data-input="draftField"></label></div>
      <div><div class="row between" style="margin-bottom:8px"><b>البنود</b><button type="button" class="btn sm" data-act="addLine">${icon('plus', 14)} إضافة بند</button></div>
      <div class="table-wrap"><table class="lines"><thead><tr><th style="width:55%">الوصف</th><th>الكمية</th><th>سعر الوحدة</th><th class="num">الإجمالي</th><th></th></tr></thead><tbody id="lines">${linesHtml()}</tbody></table></div></div>
      <label class="f">ملاحظات وشروط خاصة<textarea name="notes" data-input="draftField" placeholder="التوريد والتركيب وفق الجدول الذي يحدده المصنع…">${esc(draft.notes)}</textarea></label>
    </div>
    <div class="stack">
      <div class="card card-pad stack"><div class="total-box" style="width:100%">
        <div class="row"><span class="muted">المجموع</span><b class="num" id="qsub">${money(draftTotal())}</b></div>
        <div class="row"><span class="muted">ضريبة القيمة المضافة</span><span class="muted">غير مطبّقة</span></div>
        <div class="row grand"><span>الإجمالي</span><span class="num" id="qtotal">${money(draftTotal())}</span></div>
        <div class="row small muted"><span>المقدم المطلوب (٥٠٪)</span><span class="num" id="qdep">${money(draftTotal() / 2)}</span></div></div>
        <button class="btn primary" name="mode" value="send" data-tour="save-quote">${icon('send', 16)} حفظ وإرسال للعميل</button>
        <button class="btn" name="mode" value="draft">${icon('file', 16)} حفظ كمسودة</button>
      </div>
    </div>
  </form>`;
}
function linesHtml() {
  return draft.items.map((it, i) => `<tr><td><input data-input="qline" data-i="${i}" data-k="desc" value="${esc(it.desc)}" placeholder="وحدات مطبخ سفلية وعلوية"></td>
    <td><input type="number" min="0" step="1" data-input="qline" data-i="${i}" data-k="qty" value="${it.qty}" style="width:70px"></td>
    <td><input type="number" min="0" step="0.001" data-input="qline" data-i="${i}" data-k="price" value="${it.price}" style="width:120px"></td>
    <td class="num" id="lt${i}">${m3(it.qty * it.price)}</td>
    <td>${draft.items.length > 1 ? `<button type="button" class="icon-btn" data-act="removeLine" data-i="${i}" aria-label="حذف البند">${icon('trash', 16)}</button>` : ''}</td></tr>`).join('');
}
const draftTotal = () => draft.items.reduce((a, it) => a + Number(it.qty || 0) * Number(it.price || 0), 0);
function refreshTotals() {
  const t = draftTotal();
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.innerHTML = v; };
  set('qsub', money(t)); set('qtotal', money(t)); set('qdep', money(t / 2));
  draft.items.forEach((it, i) => set(`lt${i}`, m3(it.qty * it.price)));
}

// ---------- quote detail ----------
function quoteView(q) {
  const c = find.customer(q.customerId); const inv = store.state.invoices.find((i) => i.quoteId === q.id);
  const expires = new Date(q.date); expires.setDate(expires.getDate() + q.validDays);
  const exp = expires.toISOString().slice(0, 10);
  return `<div class="crumb"><a href="#/sales">عروض الأسعار والفواتير</a>${icon('chevron', 13)}<span>${q.id}</span></div>
  <div class="page-head"><div><h1>عرض سعر ${q.id}</h1><p>${esc(q.title)} · <a href="#/customers/${c.id}">${esc(c.name)}</a> · ${chip(q.status)} ${q.status === 'sent' ? `<span class="small muted">صالح حتى ${fmtDate(exp)}</span>` : ''}</p></div>
    <div class="row">
      ${['draft', 'sent'].includes(q.status) ? `<button class="btn primary" data-act="convertQuote" data-id="${q.id}" data-tour="convert">${icon('check', 16)} تحويل إلى فاتورة</button>` : ''}
      ${inv ? `<a class="btn primary" href="#/sales/${inv.id}" data-tour="go-invoice">${icon('receipt', 16)} عرض الفاتورة ${inv.id}</a>` : ''}
      <button class="btn" data-act="sendQuote" data-id="${q.id}">${icon('send', 16)} إرسال</button>
      <button class="btn" data-act="printQuote" data-id="${q.id}">${icon('printer', 16)} PDF / طباعة</button>
      <button class="btn ghost" data-act="duplicateQuote" data-id="${q.id}">${icon('file', 16)} نسخ العرض</button>
      ${q.status === 'sent' ? `<button class="btn ghost" data-act="rejectQuote" data-id="${q.id}">تسجيل الرفض</button>` : ''}
    </div></div>
  <div class="card card-pad" style="margin-bottom:18px;overflow-x:auto">${flow(FLOW, quoteStage(q))}</div>
  <div class="cols"><div>${quoteDoc(q)}</div>
    <div class="stack"><div class="card card-pad"><dl class="kv"><dt>العميل</dt><dd><a href="#/customers/${c.id}">${esc(c.name)}</a></dd><dt>الهاتف</dt><dd class="ltr">${esc(c.phone)}</dd><dt>التاريخ</dt><dd>${fmtDate(q.date)}</dd><dt>الإجمالي</dt><dd class="num"><b>${money(quoteTotal(q))}</b></dd><dt>المقدّم</dt><dd class="num">${money(quoteTotal(q) / 2)}</dd></dl></div>
    ${inv ? `<div class="card card-pad"><div class="row between"><b>المستندات المرتبطة</b></div><div class="list" style="margin-top:8px"><a class="li" style="padding:10px 0" href="#/sales/${inv.id}"><span class="ico gold">${icon('receipt', 16)}</span><span style="flex:1">الفاتورة ${inv.id}</span>${chip(invoiceStatus(inv))}</a><a class="li" style="padding:10px 0" href="#/projects/${inv.projectId}"><span class="ico gold">${icon('folder', 16)}</span><span style="flex:1">المشروع ${inv.projectId}</span></a></div></div>` : ''}
    </div></div>`;
}

// ---------- invoice detail ----------
function invoiceView(inv) {
  const c = find.customer(inv.customerId); const paid = paidOf(inv); const bal = balanceOf(inv); const st = invoiceStatus(inv);
  const recs = store.state.receipts.filter((r) => r.invoiceId === inv.id);
  let acc = 0;
  const rows = inv.schedule.map((s, i) => { acc += s.amount; const done = paid >= acc - 0.0005; const isNext = !done && nextDue(inv) === s;
    return `<tr><td><b>${s.label}</b><span class="sub">${s.pct}% من الإجمالي</span></td><td>${fmtDate(s.due)}<span class="sub" style="color:${!done && s.due < today() ? 'var(--bad)' : ''}">${done ? '' : relDays(s.due)}</span></td><td class="num">${money(s.amount)}</td><td>${done ? chip('paid', 'مدفوعة') : isNext ? `<button class="btn sm primary" data-act="openReceipt" data-id="${inv.id}" data-tour="pay-${i}">${icon('wallet', 14)} تسجيل الدفعة</button>` : chip('neutral', 'لم تُستحق')}</td></tr>`; }).join('');
  const q = find.quote(inv.quoteId);
  return `<div class="crumb"><a href="#/sales">عروض الأسعار والفواتير</a>${icon('chevron', 13)}<span>${inv.id}</span></div>
  <div class="page-head"><div><h1>فاتورة ${inv.id}</h1><p><a href="#/customers/${c.id}">${esc(c.name)}</a> · المشروع <a href="#/projects/${inv.projectId}" data-tour="go-project">${esc(find.project(inv.projectId)?.name)}</a> · ${chip(st)}</p></div>
    <div class="row">${bal > 0 ? `<button class="btn primary" data-act="openReceipt" data-id="${inv.id}">${icon('wallet', 16)} تسجيل دفعة</button>` : ''}<button class="btn" data-act="printInvoice" data-id="${inv.id}">${icon('printer', 16)} PDF / طباعة</button><a class="btn" href="#/projects/${inv.projectId}">${icon('folder', 16)} المشروع</a></div></div>
  ${q ? `<div class="card card-pad" style="margin-bottom:18px;overflow-x:auto">${flow(FLOW, quoteStage(q))}</div>` : ''}
  <div class="kpis" style="grid-template-columns:repeat(3,1fr)"><div class="kcard"><div class="l">${icon('receipt', 17)}إجمالي الفاتورة</div><div class="v num">${money(inv.total)}</div></div>
    <div class="kcard"><div class="l">${icon('check', 17)}المدفوع</div><div class="v num" style="color:var(--ok)">${money(paid)}</div></div>
    <div class="kcard"><div class="l">${icon('wallet', 17)}المتبقي</div><div class="v num gold">${money(bal)}</div></div></div>
  <div class="cols">
    <div class="stack"><div class="card"><div class="card-head"><h3>جدول الدفعات</h3><span class="small muted">٥٠٪ مقدّمًا · ٥٠٪ قبل التركيب بيوم واحد</span></div><div class="table-wrap"><table><thead><tr><th>الدفعة</th><th>الاستحقاق</th><th class="num">المبلغ</th><th></th></tr></thead><tbody>${rows}</tbody></table></div></div>
      <div class="card"><div class="card-head"><h3>سندات القبض</h3></div>${recs.length ? `<div class="table-wrap"><table><tbody>${recs.map((r) => `<tr><td><b>${r.id}</b><span class="sub">${r.installment ? 'الدفعة الثانية' : 'الدفعة الأولى'}</span></td><td>${fmtDate(r.date)}</td><td>${esc(r.method)}</td><td class="num">${money(r.amount)}</td><td><button class="btn sm" data-act="showReceipt" data-id="${r.id}">${icon('eye', 14)} عرض</button></td></tr>`).join('')}</tbody></table></div>` : '<div class="empty"><p>لا توجد دفعات مسجلة.</p></div>'}</div></div>
    <div>${invoiceDoc(inv)}</div>
  </div>`;
}

// ---------- receipt modal ----------
function openReceipt(invId) {
  const inv = find.invoice(invId); const d = nextDue(inv); const bal = balanceOf(inv);
  const suggested = d ? Math.min(bal, d.amount - Math.max(0, paidOf(inv) - inv.schedule.slice(0, inv.schedule.indexOf(d)).reduce((a, s) => a + s.amount, 0))) : bal;
  modal(`تسجيل دفعة على ${inv.id}`, `<form class="stack" data-form="saveReceipt" data-id="${inv.id}">
    <div class="note">${icon('wallet', 18)}<span>${esc(find.customer(inv.customerId).name)} · المتبقي ${money(bal)}${d ? ` · ${d.label}` : ''}</span></div>
    <div class="grid2"><label class="f">المبلغ المستلم (د.ب)<input name="amount" type="number" step="0.001" min="0.001" value="${suggested.toFixed(3)}" required></label>
    <label class="f">طريقة الدفع<select name="method"><option>تحويل بنكي</option><option>نقدًا</option><option>شيك</option><option>BenefitPay</option></select></label></div>
    <label class="f">تاريخ الدفع<input name="date" type="date" value="${today()}"></label>
    <div class="row end"><button type="button" class="btn ghost" data-act="closeModal">إلغاء</button><button class="btn primary" data-tour="save-receipt">${icon('check', 16)} تسجيل وإصدار سند قبض</button></div>
  </form>`);
}
function showReceipt(id) {
  const r = store.state.receipts.find((x) => x.id === id); const c = find.customer(find.invoice(r.invoiceId).customerId);
  const msg = encodeURIComponent(`عزيزي ${c.name}، تم استلام دفعتكم بمبلغ ${m3(r.amount)} د.ب. رقم السند ${r.id}. شكرًا لاختياركم فينيسيا.`);
  modal(`سند قبض ${r.id}`, `${receiptDoc(r)}<div class="row end" style="margin-top:14px"><a class="btn" target="_blank" rel="noopener" href="https://wa.me/${c.phone.replace(/\D/g, '')}?text=${msg}">${icon('chat', 16)} إرسال عبر واتساب</a><button class="btn primary" data-act="printReceipt" data-id="${r.id}">${icon('printer', 16)} PDF / طباعة</button></div>`, { wide: true });
}

export default {
  render(id, sub) {
    if (id === 'new') return quoteForm(sub);
    if (id && id.startsWith('QUO')) { const q = find.quote(id); return q ? quoteView(q) : emptyState('receipt', 'العرض غير موجود', '', '<a class="btn" href="#/sales">رجوع</a>'); }
    if (id && id.startsWith('INV')) { const i = find.invoice(id); return i ? invoiceView(i) : emptyState('receipt', 'الفاتورة غير موجودة', '', '<a class="btn" href="#/sales">رجوع</a>'); }
    return list();
  },
};

export const handlers = {
  salesTab(el) { tab = el.dataset.v; nav.render(); },
  draftField(el) { draft[el.name] = el.type === 'number' ? Number(el.value) : el.value; },
  qline(el) { const it = draft.items[Number(el.dataset.i)]; const k = el.dataset.k; it[k] = k === 'desc' ? el.value : Number(el.value || 0); refreshTotals(); },
  addLine() { draft.items.push({ desc: '', qty: 1, price: 0 }); document.getElementById('lines').innerHTML = linesHtml(); refreshTotals(); },
  removeLine(el) { draft.items.splice(Number(el.dataset.i), 1); document.getElementById('lines').innerHTML = linesHtml(); refreshTotals(); },
  autofillQuote() {
    const s = store.state; const tourCust = window.__tourState?.customerId;
    draft.customerId = draft.customerId || tourCust || s.customers[0].id;
    Object.assign(draft, { title: 'مطبخ فيلا الجفير', type: 'مطبخ', validDays: 15, notes: 'التوريد والتركيب وفق الجدول الذي يحدده المصنع وبعد جاهزية الموقع.', items: [
      { desc: 'وحدات مطبخ سفلية وعلوية MDF مع سطح HPL', qty: 1, price: 3600 },
      { desc: 'جزيرة وسطية مع أدراج', qty: 1, price: 900 },
      { desc: 'إكسسوارات ومفصلات هيدروليك', qty: 1, price: 350 },
      { desc: 'توصيل وتركيب', qty: 1, price: 250 }] });
    nav.render(); toast('تمت تعبئة بيانات تجريبية', 'gold');
  },
  saveQuote(form, e) {
    const d = formData(form); const mode = e.submitter?.value || 'draft';
    if (!d.customerId) { toast('يرجى اختيار العميل', 'bad'); return; }
    if (!d.title) { toast('يرجى إدخال اسم المشروع', 'bad'); return; }
    const items = draft.items.filter((it) => it.desc && it.price > 0);
    if (!items.length) { toast('يرجى إضافة بند واحد على الأقل', 'bad'); return; }
    const q = act.saveQuote({ customerId: d.customerId, title: d.title, type: d.type, validDays: Number(d.validDays) || 15, notes: d.notes, items });
    draft = null;
    if (mode === 'send') { act.sendQuote(q.id, 'واتساب'); toast(`تم حفظ العرض ${q.id} وإرساله عبر واتساب`); } else toast(`تم حفظ العرض ${q.id} كمسودة`);
    nav.go(`sales/${q.id}`);
  },
  sendQuote(el) {
    const q = find.quote(el.dataset.id); const c = find.customer(q.customerId);
    const msg = encodeURIComponent(`عزيزي ${c.name}، مرفق عرض السعر ${q.id} لـ${q.title} بإجمالي ${m3(quoteTotal(q))} د.ب. فينيسيا للأثاث.`);
    modal(`إرسال العرض ${q.id}`, `<div class="stack"><p class="muted" style="margin:0">سيتم إرسال العرض إلى ${esc(c.name)} مع ملف PDF.</p>
      <div class="grid2"><a class="btn" target="_blank" rel="noopener" href="https://wa.me/${c.phone.replace(/\D/g, '')}?text=${msg}" data-act="markSent" data-id="${q.id}" data-ch="واتساب">${icon('chat', 16)} واتساب</a>
      <a class="btn" href="mailto:${esc(c.email)}?subject=${encodeURIComponent('Quotation ' + q.id)}&body=${msg}" data-act="markSent" data-id="${q.id}" data-ch="البريد الإلكتروني">${icon('send', 16)} البريد الإلكتروني</a></div></div>`);
  },
  markSent(el) { act.sendQuote(el.dataset.id, el.dataset.ch); closeModal(); toast(`تم تسجيل إرسال العرض عبر ${el.dataset.ch}`); window.open(el.href, '_blank', 'noopener'); nav.render(); },
  async convertQuote(el) {
    const q = find.quote(el.dataset.id);
    const ok = await confirmBox('تحويل العرض إلى فاتورة', `سيتم إنشاء:<br>• فاتورة بقيمة ${money(quoteTotal(q))} على دفعتين (٥٠٪ + ٥٠٪)<br>• مشروع جديد في مرحلة «اعتماد التصميم»`, 'تأكيد التحويل');
    if (!ok) return;
    const { inv, project } = act.convertQuote(q.id);
    toast(`تم إنشاء الفاتورة ${inv.id} والمشروع ${project.id}`);
    nav.go(`sales/${inv.id}`);
  },
  rejectQuote(el) { act.rejectQuote(el.dataset.id); toast('تم تسجيل رفض العرض', 'bad'); nav.render(); },
  duplicateQuote(el) { const q = find.quote(el.dataset.id); draft = { forCustomer: q.customerId, customerId: q.customerId, title: q.title + ' (نسخة)', type: q.type, validDays: q.validDays, notes: q.notes || '', items: q.items.map((x) => ({ ...x })) }; nav.go(`sales/new/${q.customerId}`); toast('تم نسخ العرض', 'gold'); },
  printQuote(el) { printDoc(quoteDoc(find.quote(el.dataset.id))); },
  printInvoice(el) { printDoc(invoiceDoc(find.invoice(el.dataset.id))); },
  printReceipt(el) { printDoc(receiptDoc(store.state.receipts.find((r) => r.id === el.dataset.id))); },
  openReceipt(el) { openReceipt(el.dataset.id); },
  showReceipt(el) { showReceipt(el.dataset.id); },
  saveReceipt(form) {
    const d = formData(form);
    try {
      const r = act.addReceipt({ invoiceId: form.dataset.id, amount: Number(d.amount), method: d.method, date: d.date });
      closeModal(); toast(`تم تسجيل الدفعة وإصدار سند القبض ${r.id}`); nav.render(); setTimeout(() => showReceipt(r.id), 250);
    } catch (err) { toast(err.message, 'bad'); }
  },
};
