import { store, act, find, DONE } from '../data.js';
import { icon } from '../icons.js';
import { esc, money, fmtDate, chip, toast, modal, closeModal, formData } from '../ui.js';
import { openPO } from './purchases.js';
import { nav } from '../nav.js';

let tab = 'stock';

export function openIssue(projectId = '', materialId = '') {
  const s = store.state; const active = s.projects.filter((p) => p.stage < DONE);
  const tp = window.__tourState?.projectId;
  const pid = projectId || tp || active[0]?.id;
  const mid = materialId || 'MAT-001';
  modal('صرف خامات على مشروع', `<form class="stack" data-form="saveIssue">
    <label class="f">المشروع<select name="projectId">${active.map((p) => `<option value="${p.id}" ${p.id === pid ? 'selected' : ''}>${esc(p.name)} · ${esc(find.customer(p.customerId).name)}</option>`).join('')}</select></label>
    <div class="grid2"><label class="f">الخامة<select name="materialId" data-change="issuePreview">${s.materials.map((m) => `<option value="${m.id}" ${m.id === mid ? 'selected' : ''}>${esc(m.name)} (متاح ${m.qty} ${m.unit})</option>`).join('')}</select></label>
    <label class="f">الكمية<input name="qty" type="number" min="1" step="1" value="12" data-input="issuePreview"></label></div>
    <div class="note" id="issue-preview"></div>
    <div class="row end"><button type="button" class="btn ghost" data-act="closeModal">إلغاء</button><button class="btn primary" data-tour="save-issue">${icon('check', 16)} صرف وتسجيل على المشروع</button></div></form>`,
  { onMount: (m) => preview(m.querySelector('form')) });
}
function preview(form) {
  const m = find.material(form.elements.materialId.value); const q = Number(form.elements.qty.value || 0);
  const left = m.qty - q;
  document.getElementById('issue-preview').innerHTML = `${icon('coins', 18)}<span>تكلفة المشروع هتزيد <b>${money(q * m.cost)}</b> (${q} × ${money(m.cost)}). الرصيد بعد الصرف: <b>${left} ${m.unit}</b>${left <= m.min ? ' ← هيبقى تحت حد الطلب وهيطلع تنبيه' : ''}.</span>`;
}

export default {
  render() {
    const s = store.state;
    const stock = `<table><thead><tr><th>الصنف</th><th>الوحدة</th><th class="num">الرصيد</th><th class="num">حد الطلب</th><th class="num">تكلفة الوحدة</th><th class="num">قيمة المخزون</th><th>الحالة</th><th></th></tr></thead><tbody>
      ${s.materials.map((m) => { const low = m.qty <= m.min; return `<tr><td><b>${esc(m.name)}</b><span class="sub">${m.id}</span></td><td>${m.unit}</td><td class="num"><b style="color:${low ? 'var(--bad)' : ''}">${m.qty}</b></td><td class="num">${m.min}</td><td class="num">${money(m.cost, false)}</td><td class="num">${money(m.qty * m.cost, false)}</td><td>${chip(low ? 'low' : 'okstock')}</td>
        <td><div class="row" style="flex-wrap:nowrap">${store.can('inventory') ? `<button class="btn sm" data-act="issueRow" data-id="${m.id}">صرف</button>` : ''}${low && store.can('purchases') ? `<button class="btn sm primary" data-act="reorder" data-id="${m.id}" data-tour="reorder-${m.id}">${icon('cart', 14)} اطلب من المورد</button>` : ''}</div></td></tr>`; }).join('')}</tbody></table>`;
    const moves = `<table><thead><tr><th>التاريخ</th><th>الحركة</th><th>الصنف</th><th class="num">الكمية</th><th>المشروع / أمر الشراء</th><th>بواسطة</th></tr></thead><tbody>
      ${s.movements.map((mv) => { const m = find.material(mv.materialId); return `<tr><td>${fmtDate(mv.date)}</td><td>${mv.type === 'in' ? chip('received', 'دخول') : chip('neutral', 'صرف')}</td><td>${esc(m.name)}</td><td class="num">${mv.type === 'in' ? '+' : '−'}${mv.qty} ${m.unit}</td><td>${mv.projectId ? `<a href="#/projects/${mv.projectId}">${esc(find.project(mv.projectId)?.name)}</a>` : esc(mv.poId || '')}</td><td>${esc(mv.by || '')}</td></tr>`; }).join('')}</tbody></table>`;
    const total = s.materials.reduce((a, m) => a + m.qty * m.cost, 0);
    const low = s.materials.filter((m) => m.qty <= m.min).length;
    return `<div class="page-head"><div><h1>المخازن</h1><p>MDF وHDF وألومنيوم وزجاج وإكسسوارات. كل صرف بيتسجل على مشروع ويدخل في تكلفته.</p></div>
      <button class="btn primary" data-act="issueRow" data-tour="issue">${icon('box', 16)} صرف خامات على مشروع</button></div>
    <div class="kpis" style="grid-template-columns:repeat(3,1fr)"><div class="kcard"><div class="l">${icon('box', 17)}قيمة المخزون</div><div class="v num">${money(total)}</div></div>
      <div class="kcard"><div class="l">${icon('alert', 17)}أصناف تحت حد الطلب</div><div class="v" style="color:${low ? 'var(--bad)' : ''}">${low}</div></div>
      <div class="kcard"><div class="l">${icon('truck', 17)}بضاعة جاية من الموردين</div><div class="v">${s.pos.filter((p) => p.status === 'sent').length}</div></div></div>
    <div class="card"><div class="card-head"><div class="tabs"><button data-act="invTab" data-v="stock" class="${tab === 'stock' ? 'on' : ''}">الرصيد</button><button data-act="invTab" data-v="moves" class="${tab === 'moves' ? 'on' : ''}">حركات المخزن</button></div></div>
    <div class="table-wrap">${tab === 'stock' ? stock : moves}</div></div>`;
  },
};

export const handlers = {
  invTab(el) { tab = el.dataset.v; nav.render(); },
  issueRow(el) { openIssue('', el.dataset.id || ''); },
  issuePreview(el) { preview(el.closest('form')); },
  reorder(el) { openPO(el.dataset.id); },
  saveIssue(form) {
    const d = formData(form);
    try {
      const m = act.issueMaterial({ materialId: d.materialId, qty: Number(d.qty), projectId: d.projectId });
      closeModal(); toast(`اتصرف ${d.qty} ${m.unit} ${m.name} على المشروع`);
      if (m.qty <= m.min) setTimeout(() => toast(`تنبيه: ${m.name} بقى تحت حد الطلب (${m.qty} ${m.unit})`, 'bad'), 600);
      nav.render();
    } catch (err) { toast(err.message, 'bad'); }
  },
};
