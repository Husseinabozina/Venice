import { store, find, STAGES, DONE, projectCost, paidOf, balanceOf, invoiceStatus } from '../data.js';
import { icon } from '../icons.js';
import { esc, money, pct, fmtDate, chip, downloadCSV, toast } from '../ui.js';

const m3 = (n) => Number(n || 0).toFixed(3);
const REPORTS = {
  sales: { name: 'المبيعات والمستحقات', q: 'بعنا بكام، والزباين عليهم كام؟', ic: 'receipt' },
  profit: { name: 'ربحية المشاريع', q: 'أنهي مشروع كسّب وأنهي لأ؟', ic: 'coins' },
  production: { name: 'أداء الإنتاج والتأخير', q: 'أنهي مرحلة بتعطّل؟', ic: 'factory' },
  stock: { name: 'قيمة المخزون', q: 'الخامات اللي في المخزن قيمتها كام؟', ic: 'box' },
  suppliers: { name: 'مستحقات الموردين', q: 'إحنا علينا كام ولمين؟', ic: 'cart' },
  payroll: { name: 'الحضور والرواتب', q: 'مين غاب، والمرتبات كام؟', ic: 'badge' },
  cash: { name: 'التدفقات النقدية', q: 'الفلوس اللي دخلت وطلعت كام؟', ic: 'wallet' },
};

function data(key) {
  const s = store.state;
  if (key === 'sales') return { head: ['الفاتورة', 'العميل', 'التاريخ', 'الإجمالي', 'اتدفع', 'المتبقي', 'الحالة'], rows: s.invoices.map((i) => [i.id, find.customer(i.customerId).name, i.date, m3(i.total), m3(paidOf(i)), m3(balanceOf(i)), invoiceStatus(i)]), bars: s.customers.map((c) => [c.name, s.invoices.filter((i) => i.customerId === c.id).reduce((a, i) => a + i.total, 0)]).filter((x) => x[1]), total: ['الإجمالي', '', '', m3(s.invoices.reduce((a, i) => a + i.total, 0)), m3(s.invoices.reduce((a, i) => a + paidOf(i), 0)), m3(s.invoices.reduce((a, i) => a + balanceOf(i), 0)), ''] };
  if (key === 'profit') return { head: ['المشروع', 'العميل', 'سعر البيع', 'التكلفة', 'الربح', 'الهامش'], rows: s.projects.map((p) => { const c = projectCost(p); return [p.name, find.customer(p.customerId).name, m3(p.value), m3(c.total), m3(c.profit), pct(c.margin)]; }), bars: s.projects.map((p) => [p.name, projectCost(p).profit]) };
  if (key === 'production') {
    const avg = STAGES.map((st, i) => { const d = s.projects.map((p) => p.stages[i]).filter((x) => x?.start && x?.end).map((x) => (new Date(x.end) - new Date(x.start)) / 864e5); return [st.name, d.length ? d.reduce((a, b) => a + b, 0) / d.length : 0]; });
    return { head: ['المشروع', 'المرحلة الحالية', 'التسليم المتوقع', 'الحالة'], rows: s.projects.map((p) => [p.name, p.stage >= DONE ? 'اتسلّم' : STAGES[p.stage].name, p.expected, p.lateSince ? 'متأخر' : 'في ميعاده']), bars: avg, unit: 'يوم' };
  }
  if (key === 'stock') return { head: ['الصنف', 'الرصيد', 'تكلفة الوحدة', 'القيمة'], rows: s.materials.map((m) => [m.name, `${m.qty} ${m.unit}`, m3(m.cost), m3(m.qty * m.cost)]), bars: s.materials.map((m) => [m.name, m.qty * m.cost]), total: ['الإجمالي', '', '', m3(s.materials.reduce((a, m) => a + m.qty * m.cost, 0))] };
  if (key === 'suppliers') return { head: ['المورد', 'أوامر مستلمة', 'المستحق'], rows: s.suppliers.map((x) => { const r = s.pos.filter((p) => p.supplierId === x.id && p.status === 'received'); return [x.name, r.length, m3(r.reduce((a, p) => a + p.cost, 0))]; }), bars: s.suppliers.map((x) => [x.name, s.pos.filter((p) => p.supplierId === x.id && p.status === 'received').reduce((a, p) => a + p.cost, 0)]) };
  if (key === 'payroll') return { head: ['الموظف', 'القسم', 'الوظيفة', 'حالة النهارده', 'الراتب'], rows: s.employees.map((e) => [e.name, e.dept, e.job, { present: 'حاضر', absent: 'غايب', leave: 'إجازة' }[e.today], m3(e.salary)]), bars: s.employees.map((e) => [e.name, e.salary]), total: ['الإجمالي', '', '', '', m3(s.employees.reduce((a, e) => a + e.salary, 0))] };
  const ins = s.receipts.map((r) => [r.date, `سند قبض ${r.id}`, find.customer(find.invoice(r.invoiceId).customerId).name, m3(r.amount), '']);
  const outs = s.pos.filter((p) => p.status === 'received').map((p) => [p.received || p.date, `مشتريات ${p.id}`, find.supplier(p.supplierId).name, '', m3(p.cost)]);
  const tin = s.receipts.reduce((a, r) => a + r.amount, 0); const tout = s.pos.filter((p) => p.status === 'received').reduce((a, p) => a + p.cost, 0);
  return { head: ['التاريخ', 'البيان', 'الطرف', 'داخل', 'خارج'], rows: [...ins, ...outs].sort((a, b) => b[0].localeCompare(a[0])), bars: [['الفلوس اللي دخلت', tin], ['الفلوس اللي طلعت', tout]], total: ['الصافي', '', '', m3(tin - tout), ''] };
}

export default {
  render(id) {
    if (id && REPORTS[id]) {
      const r = REPORTS[id]; const d = data(id); const mx = Math.max(1, ...d.bars.map((b) => Math.abs(b[1])));
      return `<div class="crumb"><a href="#/reports">التقارير</a>${icon('chevron', 13)}<span>${r.name}</span></div>
      <div class="page-head"><div><h1>${r.name}</h1><p>${r.q}</p></div><div class="row"><button class="btn" data-act="exportCSV" data-id="${id}">${icon('download', 16)} تصدير Excel</button><button class="btn primary" data-act="printReport">${icon('printer', 16)} PDF / طباعة</button></div></div>
      <div class="cols even"><div class="card"><div class="card-head"><h3>نظرة سريعة</h3></div><div class="card-pad hbars">${d.bars.map(([l, v]) => `<div class="r"><span>${esc(l)}</span><div class="bar"><span style="width:${(Math.abs(v) / mx) * 100}%;background:${v < 0 ? 'var(--bad)' : ''}"></span></div><span class="num">${d.unit ? `${v.toFixed(1)} ${d.unit}` : Math.round(v).toLocaleString('en-US')}</span></div>`).join('')}</div></div>
      <div class="card"><div class="table-wrap"><table><thead><tr>${d.head.map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>${d.rows.map((row) => `<tr>${row.map((c) => `<td>${['paid', 'partial', 'unpaid'].includes(c) ? chip(c) : esc(c)}</td>`).join('')}</tr>`).join('')}</tbody>${d.total ? `<tfoot><tr>${d.total.map((c) => `<td>${esc(c)}</td>`).join('')}</tr></tfoot>` : ''}</table></div></div></div>`;
    }
    return `<div class="page-head"><div><h1>التقارير</h1><p>٧ تقارير، كل واحد بيجاوب على سؤال، وكلهم بيتصدروا Excel وPDF.</p></div></div>
    <div class="kpis" style="grid-template-columns:repeat(auto-fill,minmax(250px,1fr))">${Object.entries(REPORTS).map(([k, r]) => `<a class="kcard" href="#/reports/${k}"><div class="l">${icon(r.ic, 18)}<b style="color:var(--text);font-size:15px">${r.name}</b></div><div class="muted">${r.q}</div><div class="small" style="color:var(--gold-ink)">افتح التقرير ${icon('chevron', 12)}</div></a>`).join('')}</div>`;
  },
};

export const handlers = {
  exportCSV(el) { const d = data(el.dataset.id); downloadCSV(`venice-${el.dataset.id}-report.csv`, [d.head, ...d.rows, ...(d.total ? [d.total] : [])]); toast('اتصدر الملف، يفتح على Excel'); },
  printReport() { window.print(); },
};
