import { store, act, ROLES, NAV } from '../data.js';
import { icon } from '../icons.js';
import { esc, money, relDays, toast, confirmBox } from '../ui.js';
import { nav } from '../nav.js';

let tab = 'company';

export default {
  render() {
    const s = store.state;
    let body = '';
    if (tab === 'company') body = `<div class="cols even"><div class="card card-pad"><div class="row" style="gap:14px;margin-bottom:14px"><div class="mark" style="background:var(--ink)">V</div><div><b style="font-size:16px">${esc(s.company.name)}</b><div class="muted">${esc(s.company.nameAr)}</div></div></div>
        <dl class="kv"><dt>الدولة</dt><dd>${esc(s.company.country)}</dd><dt>العملة</dt><dd>دينار بحريني (BHD) · ٣ أرقام عشرية</dd><dt>الضريبة</dt><dd>غير مطبّقة (Without VAT)</dd><dt>اللغات</dt><dd>عربي / English</dd><dt>المستخدمين</dt><dd>${s.company.users} مستخدم</dd><dt>الاستضافة</dt><dd>سحابية (Cloud)</dd></dl></div>
      <form class="card card-pad stack" data-form="saveRates"><b>أسعار الساعة (بتدخل في تكلفة المشاريع)</b>
        <div class="grid2"><label class="f">ساعة العامل (د.ب)<input type="number" step="0.001" name="labor" value="${s.rates.labor}"></label><label class="f">ساعة الماكينة (د.ب)<input type="number" step="0.001" name="machine" value="${s.rates.machine}"></label></div>
        <div class="row end"><button class="btn primary">${icon('check', 16)} حفظ</button></div>
        <div class="note">${icon('refresh', 18)}<span>دي نسخة تجريبية. تقدر ترجّع كل البيانات لأولها في أي وقت.</span><button type="button" class="btn sm" data-act="resetDemo" style="margin-inline-start:auto">إعادة البيانات</button></div></form></div>`;
    if (tab === 'roles') body = `<div class="card"><div class="card-head"><h3>مين يشوف إيه</h3><span class="small muted">الصلاحية بتتأكد على السيرفر مع كل طلب، مش بس بإخفاء الزرار</span></div><div class="table-wrap"><table class="matrix"><thead><tr><th>الدور</th>${NAV.map((n) => `<th title="${n.name}">${icon(n.icon, 16)}<span class="sub">${n.name.split(' ')[0]}</span></th>`).join('')}</tr></thead><tbody>
      ${ROLES.map((r) => `<tr><td><b>${r.name}</b><span class="sub">${r.person}</span></td>${NAV.map((n) => `<td>${r.nav === '*' || r.nav.includes(n.key) ? `<span class="y">${icon('check', 16)}</span>` : '<span class="n">—</span>'}</td>`).join('')}</tr>`).join('')}</tbody></table></div></div>`;
    if (tab === 'terms') body = `<form class="card card-pad stack" data-form="saveTerms"><b>بنود العقد وعرض السعر</b><span class="small muted">بتتطبع تلقائيًا على كل عرض سعر. كل بند في سطر.</span>
      <textarea name="terms" style="min-height:260px">${esc(s.terms.join('\n'))}</textarea>
      <div class="note">${icon('alert', 18)}<span>صياغة تشغيلية أولية وليست مراجعة قانونية نهائية، ومافيهاش غرامة تأخير تلقائية.</span></div>
      <div class="row end"><button class="btn primary">${icon('check', 16)} حفظ البنود</button></div></form>`;
    if (tab === 'log') body = `<div class="card"><div class="card-head"><h3>سجل التعديلات</h3><span class="small muted">مين عمل إيه وإمتى</span></div><div class="table-wrap"><table><thead><tr><th>الوقت</th><th>المستخدم</th><th>العملية</th></tr></thead><tbody>${s.activity.map((a) => `<tr ${a.ref ? `class="click" data-href="${a.ref}"` : ''}><td>${esc(a.ts)}<span class="sub">${relDays(a.ts)}</span></td><td>${esc(a.user)}</td><td>${esc(a.text)}</td></tr>`).join('')}</tbody></table></div></div>`;
    return `<div class="page-head"><div><h1>الإعدادات</h1><p>بيانات الشركة، والصلاحيات، وبنود العقد، وسجل التعديلات.</p></div></div>
    <div class="tabs" style="margin-bottom:16px">${[['company', 'الشركة'], ['roles', 'الأدوار والصلاحيات'], ['terms', 'بنود العقد'], ['log', 'سجل التعديلات']].map(([k, l]) => `<button data-act="setTab" data-v="${k}" class="${tab === k ? 'on' : ''}">${l}</button>`).join('')}</div>${body}`;
  },
};

export const handlers = {
  setTab(el) { tab = el.dataset.v; nav.render(); },
  saveRates(form) { store.state.rates = { labor: Number(form.elements.labor.value), machine: Number(form.elements.machine.value) }; store.save(); toast('اتحفظت الأسعار، والتكلفة اتحسبت من جديد'); nav.render(); },
  saveTerms(form) { act.setTerms(form.elements.terms.value.split('\n').map((x) => x.trim()).filter(Boolean)); toast('اتحفظت البنود وهتظهر على العروض الجاية'); },
  async resetDemo() { if (await confirmBox('ترجّع البيانات التجريبية؟', 'أي حاجة ضفتها هتتمسح والنظام يرجع زي أول مرة.', 'أيوه، رجّعها', 'danger')) { store.reset(); toast('رجعت البيانات لأولها'); nav.render(); } },
};
export { money };
