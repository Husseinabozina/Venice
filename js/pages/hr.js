import { store, act } from '../data.js';
import { icon } from '../icons.js';
import { esc, money, chip, toast } from '../ui.js';
import { nav } from '../nav.js';

export default {
  render() {
    const s = store.state; const c = (v) => s.employees.filter((e) => e.today === v).length;
    const payroll = s.employees.reduce((a, e) => a + e.salary, 0);
    const depts = [...new Set(s.employees.map((e) => e.dept))];
    return `<div class="page-head"><div><h1>الموظفون والحضور</h1></div></div>
    <div class="kpis"><div class="kcard"><div class="l">${icon('users', 17)}عدد الموظفين</div><div class="v">${s.employees.length}</div></div>
      <div class="kcard"><div class="l">${icon('check', 17)}الحضور اليوم</div><div class="v" style="color:var(--ok)">${c('present')}</div></div>
      <div class="kcard"><div class="l">${icon('alert', 17)}الغياب</div><div class="v" style="color:var(--bad)">${c('absent')}</div></div>
      <div class="kcard"><div class="l">${icon('wallet', 17)}إجمالي الرواتب الشهرية</div><div class="v num gold">${money(payroll)}</div></div></div>
    <div class="cols">
      <div class="card"><div class="card-head"><h3>حضور اليوم</h3></div><div class="table-wrap"><table><thead><tr><th>الموظف</th><th>القسم</th><th>الحالة</th></tr></thead><tbody>
        ${s.employees.map((e) => `<tr><td><b>${esc(e.name)}</b><span class="sub">${esc(e.job)}</span></td><td>${esc(e.dept)}</td><td><div class="tabs" style="padding:3px">${[['present', 'حاضر'], ['absent', 'غائب'], ['leave', 'إجازة']].map(([k, l]) => `<button data-act="att" data-id="${e.id}" data-v="${k}" class="${e.today === k ? 'on' : ''}" style="padding:4px 10px">${l}</button>`).join('')}</div></td></tr>`).join('')}
      </tbody></table></div></div>
      <div class="stack"><div class="card"><div class="card-head"><h3>الرواتب حسب القسم</h3></div><div class="card-pad hbars">${(() => { const vals = depts.map((d) => [d, s.employees.filter((e) => e.dept === d).reduce((a, e) => a + e.salary, 0)]); const mx = Math.max(...vals.map((x) => x[1])); return vals.map(([d, v]) => `<div class="r"><span>${esc(d)}</span><div class="bar"><span style="width:${(v / mx) * 100}%"></span></div><span class="num">${money(v, false)}</span></div>`).join(''); })()}</div></div></div>
    </div>`;
  },
};

export const handlers = {
  att(el) { act.setAttendance(el.dataset.id, el.dataset.v); toast('تم تسجيل الحضور'); nav.render(); },
};
