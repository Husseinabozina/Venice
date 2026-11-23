import { store, act, find, STAGES, DONE, projectCost, isLate, invoiceStatus, balanceOf, paidOf } from '../data.js';
import { icon } from '../icons.js';
import { esc, money, fmtDate, relDays, chip, toast, modal, closeModal, formData, emptyState, pct, dayCount } from '../ui.js';
import { openIssue } from './inventory.js';
import { nav } from '../nav.js';

let tab = 'active';

export function stageBar(p) {
  return `<div class="stagebar">${STAGES.map((s, i) => `<div class="stg ${i < p.stage ? 'done' : i === p.stage ? 'cur' : ''}"><i></i><span>${s.name}</span></div>`).join('')}</div>`;
}
export const stageLabel = (p) => (p.stage >= DONE ? chip('done') : isLate(p) ? chip('late', `متأخر · ${STAGES[p.stage].name}`) : `<span class="chip gold">${STAGES[p.stage].name}</span>`);

function list() {
  const s = store.state;
  const groups = { active: s.projects.filter((p) => p.stage < DONE), late: s.projects.filter(isLate), done: s.projects.filter((p) => p.stage >= DONE), all: s.projects };
  const rows = groups[tab];
  return `<div class="page-head"><div><h1>المشاريع</h1></div>
    ${store.can('sales') ? `<a class="btn primary" href="#/sales/new">${icon('plus', 16)} مشروع جديد من عرض سعر</a>` : ''}</div>
  <div class="card"><div class="card-head"><div class="tabs">${[['active', 'قيد التنفيذ'], ['late', 'متأخرة'], ['done', 'مُسلَّمة'], ['all', 'الكل']].map(([k, l]) => `<button data-act="projTab" data-v="${k}" class="${tab === k ? 'on' : ''}">${l} <span class="muted small">${groups[k].length}</span></button>`).join('')}</div></div>
  ${rows.length ? `<div class="table-wrap"><table><thead><tr><th>المشروع</th><th>العميل</th><th>المرحلة</th><th style="width:160px">التقدم</th><th>التسليم المتوقع</th><th class="num">القيمة</th></tr></thead><tbody>
    ${rows.map((p) => `<tr class="click" data-href="projects/${p.id}"><td><b>${esc(p.name)}</b><span class="sub">${p.id} · ${p.type}</span></td><td>${esc(find.customer(p.customerId)?.name)}</td><td>${stageLabel(p)}</td><td><div class="bar"><span style="width:${(p.stage / DONE) * 100}%"></span></div></td><td>${fmtDate(p.expected)}<span class="sub">${p.stage < DONE ? relDays(p.expected) : ''}</span></td><td class="num">${money(p.value)}</td></tr>`).join('')}
  </tbody></table></div>` : emptyState('folder', 'لا توجد مشاريع', tab === 'late' ? 'لا توجد مشاريع متأخرة.' : '')}</div>`;
}

function detail(p) {
  const c = find.customer(p.customerId); const cost = projectCost(p);
  const inv = store.state.invoices.find((i) => i.projectId === p.id);
  const moves = store.state.movements.filter((m) => m.projectId === p.id);
  const acts = store.state.activity.filter((a) => a.ref.includes(p.id));
  const next = p.stage < DONE ? (p.stage + 1 < DONE ? STAGES[p.stage + 1].name : 'تم التسليم') : null;
  const daysIn = p.stages[p.stage]?.start ? Math.max(0, Math.round((new Date() - new Date(p.stages[p.stage].start)) / 864e5)) : 0;
  const canMove = store.can('production');
  return `<div class="crumb"><a href="#/projects">المشاريع</a>${icon('chevron', 13)}<span>${p.id}</span></div>
  <div class="page-head"><div><h1>${esc(p.name)}</h1><p><a href="#/customers/${c.id}">${esc(c.name)}</a> · ${p.id} · ${p.type} · ${stageLabel(p)} ${p.stage < DONE ? `<span class="small muted">في هذه المرحلة منذ ${dayCount(daysIn)}</span>` : ''}</p></div>
    <div class="row">${canMove && next ? `<button class="btn primary" data-act="advance" data-id="${p.id}" data-tour="advance">${icon('check', 16)} ${p.stage === DONE - 1 ? 'تسليم المشروع' : `إنهاء «${STAGES[p.stage].name}»`}</button>` : ''}
      ${canMove && p.stage > 0 ? `<button class="btn ghost" data-act="back" data-id="${p.id}">إرجاع مرحلة</button>` : ''}
      ${store.can('inventory') && p.stage < DONE ? `<button class="btn" data-act="issueForProject" data-id="${p.id}" data-tour="issue-from-project">${icon('box', 16)} صرف خامات</button>` : ''}
      <button class="btn ghost" data-act="editProject" data-id="${p.id}">${icon('settings', 16)} تعديل البيانات</button></div></div>
  <div class="card card-pad" style="margin-bottom:18px">${stageBar(p)}${p.stage >= DONE ? '<div class="note" style="margin-top:12px;background:var(--ok-bg);border-color:#bfe0cd;color:var(--ok)">' + icon('check', 18) + '<span>تم تسليم المشروع للعميل.</span></div>' : ''}</div>
  <div class="cols">
    <div class="stack">
      <div class="card card-pad"><dl class="kv"><dt>الموقع</dt><dd>${esc(p.location || '—')}</dd><dt>المقاسات</dt><dd>${esc(p.dimensions || '—')}</dd><dt>الخامات</dt><dd>${esc(p.materials || '—')}</dd><dt>المسؤول</dt><dd>${esc(p.assignee || '—')}</dd><dt>التسليم المتوقع</dt><dd>${fmtDate(p.expected)} ${p.stage < DONE ? `<span class="muted small">(${relDays(p.expected)})</span>` : ''}</dd><dt>ملاحظات</dt><dd>${esc(p.notes || '—')}</dd></dl></div>
      <div class="card"><div class="card-head"><h3>الرسومات والمرفقات</h3><span class="chip neutral">${p.files.length}</span></div><div class="card-pad files">
        ${p.files.map((f) => `<div class="file">${icon('file', 18)}<span style="flex:1">${esc(f.name)}</span><span class="small muted">${esc(f.size)}</span><button class="btn sm ghost" data-act="fakeOpen" data-name="${esc(f.name)}">${/\.(pdf|jpg|png)$/i.test(f.name) ? 'معاينة' : 'تنزيل'}</button></div>`).join('')}
        <label class="drop">${icon('upload', 20)}<div>اسحب الملف هنا أو انقر للرفع</div><div class="small">PDF، صور، SketchUp، CAD</div><input type="file" hidden data-change="uploadFile" data-id="${p.id}" accept=".pdf,.jpg,.jpeg,.png,.skp,.dwg,.dxf"></label></div></div>
      <div class="card"><div class="card-head"><h3>الخامات المصروفة</h3><span class="num">${money(cost.mat)}</span></div>
        ${moves.length ? `<div class="table-wrap"><table><tbody>${moves.map((m) => { const mt = find.material(m.materialId); return `<tr><td>${esc(mt.name)}</td><td class="num">${m.qty} ${mt.unit}</td><td>${fmtDate(m.date)}<span class="sub">${esc(m.by || '')}</span></td><td class="num">${money(m.qty * mt.cost)}</td></tr>`; }).join('')}</tbody></table></div>` : '<div class="empty"><p>لم تُصرف خامات بعد.</p></div>'}</div>
    </div>
    <div class="stack">
      <div class="card"><div class="card-head"><h3>الربحية</h3>${store.can('costing') ? `<a class="btn sm ghost" href="#/costing/${p.id}">التفاصيل ${icon('chevron', 14)}</a>` : ''}</div><div class="card-pad stack">
        <div class="row between"><span class="muted">سعر البيع</span><b class="num">${money(p.value)}</b></div>
        <div class="row between"><span class="muted">التكلفة الفعلية</span><b class="num">${money(cost.total)}</b></div>
        <div class="row between" style="border-top:1px solid var(--line);padding-top:10px"><span>الربح</span><b class="num" style="font-size:18px;color:${cost.profit >= 0 ? 'var(--ok)' : 'var(--bad)'}">${money(cost.profit)}</b></div>
        <div class="bar"><span style="width:${Math.max(0, Math.min(100, cost.margin * 100))}%"></span></div><div class="small muted">هامش الربح ${pct(cost.margin)}</div></div></div>
      ${inv ? `<div class="card"><div class="card-head"><h3>الوضع المالي</h3>${chip(invoiceStatus(inv))}</div><div class="card-pad stack"><div class="row between"><span class="muted">الفاتورة</span><a href="#/sales/${inv.id}">${inv.id}</a></div><div class="row between"><span class="muted">المدفوع</span><b class="num">${money(paidOf(inv))}</b></div><div class="row between"><span class="muted">المتبقي</span><b class="num">${money(balanceOf(inv))}</b></div></div></div>` : ''}
      <div class="card"><div class="card-head"><h3>مراحل المشروع</h3></div><div class="act">${STAGES.map((s, i) => { const st = p.stages[i]; return `<div class="a"><span class="ico ${i < p.stage ? 'ok' : i === p.stage && p.stage < DONE ? 'gold' : ''}" style="width:30px;height:30px;border-radius:50%;${i > p.stage || p.stage === DONE && i === p.stage ? 'background:#efebe3;color:#aaa' : ''}">${i < p.stage ? icon('check', 14) : i + 1}</span><div><div>${s.name}</div><div class="s">${st?.start ? `بدأت ${fmtDate(st.start)}` : 'لم تبدأ'}${st?.end ? ` · انتهت ${fmtDate(st.end)}` : ''}</div></div></div>`; }).join('')}</div></div>
      <div class="card"><div class="card-head"><h3>سجل المشروع</h3></div><div class="act">${acts.length ? acts.slice(0, 8).map((a) => `<div class="a"><span class="avatar">${esc(a.user.split(' ').map((w) => w[0]).join('').slice(0, 2))}</span><div><div>${esc(a.text)}</div><div class="s">${esc(a.user)} · ${relDays(a.ts)}</div></div></div>`).join('') : '<div class="empty"><p>لا توجد تحركات.</p></div>'}</div></div>
    </div>
  </div>`;
}

export default {
  render(id) {
    if (id) { const p = find.project(id); return p ? detail(p) : emptyState('folder', 'المشروع غير موجود', '', '<a class="btn" href="#/projects">رجوع</a>'); }
    return list();
  },
};

export const handlers = {
  projTab(el) { tab = el.dataset.v; nav.render(); },
  advance(el) { const p = act.moveStage(el.dataset.id, 1); toast(p.stage >= DONE ? `تم تسليم ${p.name}` : `انتقل ${p.name} إلى مرحلة ${STAGES[p.stage].name}`); nav.render(); },
  back(el) { const p = act.moveStage(el.dataset.id, -1); toast(`أُعيد ${p.name} إلى مرحلة ${STAGES[p.stage].name}`, 'gold'); nav.render(); },
  issueForProject(el) { openIssue(el.dataset.id); },
  fakeOpen(el) { toast(`جارٍ فتح «${el.dataset.name}»`, 'gold'); },
  uploadFile(el) { const f = el.files[0]; if (!f) return; act.addFile(el.dataset.id, f.name); toast(`تم رفع ${f.name}`); nav.render(); },
  editProject(el) {
    const p = find.project(el.dataset.id);
    modal('تعديل بيانات المشروع', `<form class="stack" data-form="saveProject" data-id="${p.id}">
      <label class="f">اسم المشروع<input name="name" value="${esc(p.name)}"></label>
      <div class="grid2"><label class="f">الموقع<input name="location" value="${esc(p.location)}"></label><label class="f">المقاسات<input name="dimensions" value="${esc(p.dimensions)}"></label></div>
      <div class="grid2"><label class="f">الخامات<input name="materials" value="${esc(p.materials)}"></label><label class="f">التسليم المتوقع<input type="date" name="expected" value="${p.expected}"></label></div>
      <label class="f">ملاحظات<textarea name="notes">${esc(p.notes)}</textarea></label>
      <div class="row end"><button type="button" class="btn ghost" data-act="closeModal">إلغاء</button><button class="btn primary">${icon('check', 16)} حفظ</button></div></form>`);
  },
  saveProject(form) { act.updateProject(form.dataset.id, formData(form)); closeModal(); toast('تم حفظ بيانات المشروع'); nav.render(); },
};
