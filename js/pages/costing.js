import { store, act, find, projectCost, STAGES, DONE } from '../data.js';
import { icon } from '../icons.js';
import { esc, money, pct, toast } from '../ui.js';
import { nav } from '../nav.js';

export default {
  render(id) {
    const s = store.state; const p = find.project(id) || s.projects[0]; const c = projectCost(p);
    const rows = s.projects.map((x) => ({ x, c: projectCost(x) }));
    const parts = [['الخامات', c.mat, 'box', 'من الخامات المصروفة من المخزن'], ['أجور العمال', c.labor, 'users', p.laborHours ? `${p.laborHours} ساعة × ${money(s.rates.labor)}` : 'لم تُسجل ساعات بعد'], ['تشغيل الماكينات', c.machine, 'factory', p.machineHours ? `${p.machineHours} ساعة × ${money(s.rates.machine)}` : 'لم تُسجل ساعات بعد'], ['نقل وتركيب ومصاريف', c.other, 'truck', 'المصاريف المسجلة على المشروع']];
    const maxPart = Math.max(1, ...parts.map((x) => x[1]));
    return `<div class="page-head"><div><h1>تكلفة وربحية المشاريع</h1></div></div>
    <div class="cols" style="grid-template-columns:1fr 1.25fr">
      <div class="card"><div class="card-head"><h3>المشاريع</h3></div><div class="list">
        ${rows.map(({ x, c: cc }) => `<a class="li" href="#/costing/${x.id}" style="${x.id === p.id ? 'background:#f7f2e7' : ''}"><span style="flex:1;min-width:0"><span class="t" style="display:block">${esc(x.name)}</span><span class="s">${esc(find.customer(x.customerId).name)} · ${x.stage >= DONE ? 'تم التسليم' : STAGES[x.stage].name}</span><div class="bar" style="margin-top:6px"><span style="width:${cc.total ? Math.max(0, Math.min(100, cc.margin * 100)) : 0}%;background:${cc.margin < 0.25 ? 'var(--bad)' : ''}"></span></div></span><span style="text-align:left"><b class="num" style="display:block;color:${cc.profit >= 0 ? 'var(--ok)' : 'var(--bad)'}">${money(cc.profit)}</b><span class="small muted">${cc.total ? `الهامش الحالي ${pct(cc.margin)}` : 'لم تُسجل تكاليف بعد'}</span></span></a>`).join('')}
      </div></div>
      <div class="stack">
        <div class="card"><div class="card-head"><div><h3>${esc(p.name)}</h3><span class="small muted">${p.id} · ${esc(find.customer(p.customerId).name)}</span></div><a class="btn sm" href="#/projects/${p.id}">ملف المشروع ${icon('chevron', 14)}</a></div>
          <div class="card-pad stack">
            <div class="kpis" style="grid-template-columns:repeat(3,1fr);margin:0">
              <div class="kcard"><div class="l">سعر البيع</div><div class="v num" style="font-size:20px">${money(p.value)}</div></div>
              <div class="kcard"><div class="l">التكلفة حتى الآن</div><div class="v num" style="font-size:20px">${money(c.total)}</div></div>
              <div class="kcard"><div class="l">الربح الحالي · ${pct(c.margin)}</div><div class="v num" style="font-size:20px;color:${c.profit >= 0 ? 'var(--ok)' : 'var(--bad)'}">${money(c.profit)}</div></div></div>
            <div class="hbars">${parts.map(([l, v, ic, sub]) => `<div class="r" style="grid-template-columns:210px 1fr 110px"><span>${icon(ic, 15)} ${l}<span class="sub small muted" style="display:block">${sub}</span></span><div class="bar" style="height:12px"><span style="width:${(v / maxPart) * 100}%"></span></div><span class="num">${money(v)}</span></div>`).join('')}</div>
          </div></div>
        ${store.can('production') ? `<div class="card"><div class="card-head"><h3>تسجيل الساعات والمصاريف</h3></div><form class="card-pad stack" data-form="saveHours" data-id="${p.id}">
          <div class="grid3"><label class="f">ساعات العمل<input type="number" min="0" name="laborHours" value="${p.laborHours || 0}"></label><label class="f">ساعات الماكينات<input type="number" min="0" name="machineHours" value="${p.machineHours || 0}"></label><label class="f">مصاريف أخرى (د.ب)<input type="number" min="0" step="0.001" name="otherCosts" value="${p.otherCosts || 0}"></label></div>
          <div class="row between"><span class="small muted">سعر الساعة: العمل ${money(s.rates.labor)} · الماكينات ${money(s.rates.machine)}</span><button class="btn primary">${icon('check', 16)} حفظ</button></div></form></div>` : ''}
      </div></div>`;
  },
};

export const handlers = {
  saveHours(form) {
    const f = form.elements; act.updateProject(form.dataset.id, { laborHours: Number(f.laborHours.value), machineHours: Number(f.machineHours.value), otherCosts: Number(f.otherCosts.value) });
    toast('تم تحديث التكلفة والربح'); nav.render();
  },
};
