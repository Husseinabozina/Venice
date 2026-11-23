import { store, act, find } from '../data.js';
import { icon } from '../icons.js';
import { esc, money, fmtDate, chip, toast, modal, closeModal, formData, confirmBox } from '../ui.js';
import { nav } from '../nav.js';

let tab = 'pos';

export function openPO(materialId = '') {
  const s = store.state; const m = find.material(materialId) || s.materials[0];
  const qty = Math.max(10, m.min * 2 - m.qty);
  const sup = { 'MAT-006': 'SUP-004', 'MAT-005': 'SUP-003', 'MAT-001': 'SUP-001', 'MAT-002': 'SUP-002', 'MAT-003': 'SUP-002' }[m.id] || 'SUP-001';
  modal('أمر شراء جديد', `<form class="stack" data-form="savePO">
    ${materialId ? `<div class="note">${icon('alert', 18)}<span>${esc(m.name)}: الرصيد ${m.qty} ${m.unit} · حد الطلب ${m.min} ${m.unit}</span></div>` : ''}
    <div class="grid2"><label class="f">المورد<select name="supplierId">${s.suppliers.map((x) => `<option value="${x.id}" ${x.id === sup ? 'selected' : ''}>${esc(x.name)} · ${esc(x.category)}</option>`).join('')}</select></label>
    <label class="f">الصنف<select name="materialId" data-change="poCost">${s.materials.map((x) => `<option value="${x.id}" ${x.id === m.id ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select></label></div>
    <div class="grid2"><label class="f">الكمية<input name="qty" type="number" min="1" value="${qty}" data-input="poCost"></label>
    <label class="f">التكلفة التقديرية (د.ب)<input name="cost" type="number" step="0.001" value="${(qty * m.cost).toFixed(3)}"></label></div>
    <div class="row end"><button type="button" class="btn ghost" data-act="closeModal">إلغاء</button><button class="btn primary" data-tour="save-po">${icon('send', 16)} إرسال أمر الشراء</button></div></form>`);
}

export default {
  render() {
    const s = store.state;
    const pos = `<table><thead><tr><th>رقم الأمر</th><th>المورد</th><th>الصنف</th><th class="num">الكمية</th><th class="num">القيمة</th><th>التاريخ</th><th>الحالة</th><th></th></tr></thead><tbody>
      ${s.pos.map((p) => { const m = find.material(p.materialId); return `<tr><td><b>${p.id}</b></td><td>${esc(find.supplier(p.supplierId).name)}</td><td>${esc(m.name)}</td><td class="num">${p.qty} ${m.unit}</td><td class="num">${money(p.cost)}</td><td>${fmtDate(p.date)}</td><td>${p.status === 'received' ? chip('received') : chip('sent', 'بانتظار التوريد')}</td><td>${p.status === 'sent' && store.can('inventory') ? `<button class="btn sm primary" data-act="receivePO" data-id="${p.id}" data-tour="receive-${p.id}">${icon('truck', 14)} استلام</button>` : ''}</td></tr>`; }).join('')}</tbody></table>`;
    const sups = `<table><thead><tr><th>المورد</th><th>التصنيف</th><th>الهاتف</th><th class="num">أوامر مفتوحة</th><th class="num">إجمالي المشتريات</th><th class="num">المستحق للمورد</th></tr></thead><tbody>
      ${s.suppliers.map((x) => { const mine = s.pos.filter((p) => p.supplierId === x.id); const due = mine.filter((p) => p.status === 'received').reduce((a, p) => a + p.cost, 0); return `<tr><td><b>${esc(x.name)}</b><span class="sub">${x.id}</span></td><td>${esc(x.category)}</td><td><span class="ltr">${esc(x.phone)}</span></td><td class="num">${mine.filter((p) => p.status !== 'received').length}</td><td class="num">${money(mine.reduce((a, p) => a + p.cost, 0))}</td><td class="num">${money(due)}</td></tr>`; }).join('')}</tbody></table>`;
    return `<div class="page-head"><div><h1>المشتريات والموردون</h1></div>
      <button class="btn primary" data-act="newPO">${icon('plus', 16)} أمر شراء جديد</button></div>
    <div class="card"><div class="card-head"><div class="tabs"><button data-act="purTab" data-v="pos" class="${tab === 'pos' ? 'on' : ''}">أوامر الشراء</button><button data-act="purTab" data-v="sups" class="${tab === 'sups' ? 'on' : ''}">الموردون</button></div></div>
    <div class="table-wrap">${tab === 'pos' ? pos : sups}</div></div>`;
  },
};

export const handlers = {
  purTab(el) { tab = el.dataset.v; nav.render(); },
  newPO() { openPO(); },
  poCost(el) { const f = el.closest('form'); const m = find.material(f.elements.materialId.value); f.elements.cost.value = (Number(f.elements.qty.value || 0) * m.cost).toFixed(3); },
  savePO(form) { const d = formData(form); const po = act.createPO({ supplierId: d.supplierId, materialId: d.materialId, qty: Number(d.qty), cost: Number(d.cost) }); closeModal(); toast(`تم إرسال أمر الشراء ${po.id} إلى ${find.supplier(po.supplierId).name}`); nav.render(); },
  async receivePO(el) {
    const p = store.state.pos.find((x) => x.id === el.dataset.id); const m = find.material(p.materialId);
    if (!(await confirmBox('تأكيد الاستلام', `سيتم إضافة ${p.qty} ${m.unit} من ${m.name} إلى المخزون، وتسجيل ${money(p.cost)} مستحقًا للمورد ${esc(find.supplier(p.supplierId).name)}.`, 'تأكيد الاستلام'))) return;
    act.receivePO(p.id); toast(`تم استلام ${p.qty} ${m.unit} من ${m.name} · الرصيد الحالي ${m.qty}`); nav.render();
  },
};
