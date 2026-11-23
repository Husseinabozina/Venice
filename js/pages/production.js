import { store, act, find, STAGES, DONE, isLate } from '../data.js';
import { icon } from '../icons.js';
import { esc, fmtDate, relDays, toast, dayCount } from '../ui.js';
import { nav } from '../nav.js';

function card(p, canMove) {
  const st = p.stages[p.stage]; const days = st?.start ? Math.max(0, Math.round((new Date() - new Date(st.start)) / 864e5)) : 0;
  const late = isLate(p);
  return `<div class="kitem ${late ? 'late' : ''}" draggable="${canMove}" data-pid="${p.id}" data-href="projects/${p.id}" data-tour="card-${p.id}">
    <div class="t">${esc(p.name)}</div>
    <div class="s">${esc(find.customer(p.customerId)?.name)} · ${esc(find.customer(p.customerId)?.city)}</div>
    <div class="row"><span class="chip ${late ? 'bad' : 'neutral'}">${icon('clock', 12)} ${dayCount(days)}</span>${p.stage < DONE ? `<span class="chip neutral">${icon('truck', 12)} ${relDays(p.expected)}</span>` : ''}</div>
    ${canMove && p.stage < DONE ? `<div class="kfoot" data-nohref><button class="kmove" draggable="false" data-act="kNext" data-id="${p.id}" aria-label="نقل إلى المرحلة التالية" data-tour="knext-${p.id}">${p.stage === DONE - 1 ? 'تسليم' : 'المرحلة التالية'} ${icon('next', 15)}</button></div>` : ''}</div>`;
}

export default {
  render() {
    const s = store.state; const role = store.role().key; const canMove = ['admin', 'production', 'tech'].includes(role);
    if (role === 'tech') {
      const mine = s.projects.filter((p) => p.stage >= 1 && p.stage <= 6);
      return `<div class="page-head"><div><h1>مهامي</h1></div></div>
      <div class="stack">${mine.map((p) => `<div class="card card-pad row between"><div><b style="font-size:16px">${esc(p.name)}</b><div class="muted small">${p.id} · المرحلة: <b>${STAGES[p.stage].name}</b> · ${esc(p.dimensions)}</div><div class="small muted">${esc(p.notes || '')}</div></div><button class="btn primary" data-act="kNext" data-id="${p.id}">${icon('check', 16)} إنهاء ${STAGES[p.stage].name}</button></div>`).join('') || '<div class="empty">' + icon('check', 28) + '<h4>لا توجد مهام حاليًا</h4></div>'}</div>`;
    }
    const cols = [...STAGES.map((st, i) => ({ i, name: st.name })), { i: DONE, name: 'تم التسليم' }];
    return `<div class="page-head"><div><h1>الإنتاج</h1></div>
      <div class="row"><span class="chip bad">${s.projects.filter(isLate).length} متأخر</span><span class="chip neutral">${s.projects.filter((p) => p.stage < DONE).length} في الورشة</span></div></div>
    <div class="kanban" id="kanban">${cols.map((c) => { const items = s.projects.filter((p) => p.stage === c.i);
      return `<div class="kcol ${c.i === DONE ? 'done' : ''}" data-stage="${c.i}" data-tour="col-${c.i}"><div class="kcol-head"><span>${c.name}</span><span class="n">${items.length}</span></div>${items.map((p) => card(p, canMove)).join('')}</div>`; }).join('')}</div>`;
  },
  mount(root) {
    const k = root.querySelector('#kanban'); if (!k) return;
    let dragId = null; let fromBtn = false;
    k.addEventListener('pointerdown', (e) => { fromBtn = !!e.target.closest('.kfoot'); });
    k.addEventListener('dragstart', (e) => { if (fromBtn) { e.preventDefault(); return; } const it = e.target.closest('.kitem'); if (!it) return; dragId = it.dataset.pid; it.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', dragId); });
    k.addEventListener('dragend', (e) => { e.target.closest('.kitem')?.classList.remove('dragging'); k.querySelectorAll('.over').forEach((x) => x.classList.remove('over')); });
    k.addEventListener('dragover', (e) => { const col = e.target.closest('.kcol'); if (!col) return; e.preventDefault(); k.querySelectorAll('.over').forEach((x) => x !== col && x.classList.remove('over')); col.classList.add('over'); });
    k.addEventListener('drop', (e) => { const col = e.target.closest('.kcol'); if (!col || !dragId) return; e.preventDefault();
      const to = Number(col.dataset.stage); const p = find.project(dragId); if (p.stage === to) return;
      act.setStage(dragId, to); toast(to >= DONE ? `تم تسليم ${p.name}` : `${p.name} ← ${STAGES[to].name}`); dragId = null; nav.render(); });
  },
};

export const handlers = {
  kNext(el) { const p = act.moveStage(el.dataset.id, 1); toast(p.stage >= DONE ? `تم تسليم ${p.name}` : `${p.name} ← ${STAGES[p.stage].name}`); nav.render(); },
};
