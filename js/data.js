// Demo data + store + business actions.
// Everything lives in memory and is saved to localStorage so the demo survives a refresh.
// DEMO.locked: sections shown in the menu as "قريبًا" (code kept, just switched off for this presentation).
// DEMO.rolePicker / DEMO.tour: role selection on the login screen and the guided tour.
// In the real system each action below becomes a REST API call to the Node.js server.

const KEY = 'venice-erp-demo-v1';

export const DEMO = {
  locked: [],
  rolePicker: true,
  tour: true,
};

export const STAGES = [
  { key: 'design', name: 'اعتماد التصميم' },
  { key: 'prep', name: 'تجهيز الخامات' },
  { key: 'cnc', name: 'القص CNC' },
  { key: 'edge', name: 'تركيب الحواف' },
  { key: 'assembly', name: 'التجميع' },
  { key: 'paint', name: 'الدهان' },
  { key: 'qc', name: 'فحص الجودة' },
  { key: 'install', name: 'التوصيل والتركيب' },
];
export const DONE = STAGES.length; // stage index meaning "delivered"

export const ROLES = [
  { key: 'admin', name: 'المدير العام', person: 'مصطفى', desc: 'جميع الأقسام', nav: '*' },
  { key: 'sales', name: 'المبيعات', person: 'ريم يوسف', desc: 'العملاء والعروض والفواتير', nav: ['dashboard', 'customers', 'statements', 'sales', 'projects'] },
  { key: 'accountant', name: 'المحاسب', person: 'محمود السيد', desc: 'الحسابات والتحصيل والتقارير', nav: ['dashboard', 'customers', 'statements', 'sales', 'purchases', 'costing', 'reports'] },
  { key: 'production', name: 'مدير الإنتاج', person: 'جاسم علي', desc: 'الورشة ومراحل التصنيع', nav: ['dashboard', 'projects', 'production', 'inventory', 'costing'] },
  { key: 'store', name: 'أمين المخزن', person: 'سامي حداد', desc: 'الخامات والاستلام والصرف', nav: ['dashboard', 'inventory', 'purchases'] },
  { key: 'hr', name: 'الموارد البشرية', person: 'نورة أحمد', desc: 'الموظفون والحضور والرواتب', nav: ['dashboard', 'hr'] },
  { key: 'tech', name: 'الفني', person: 'راجو كومار', desc: 'مهام الورشة المسندة إليه', nav: ['production'] },
];

export const NAV = [
  { key: 'dashboard', name: 'لوحة التحكم', icon: 'dashboard' },
  { key: 'customers', name: 'العملاء', icon: 'users' },
  { key: 'statements', name: 'كشف حساب العملاء', icon: 'statement' },
  { key: 'sales', name: 'عروض الأسعار والفواتير', icon: 'receipt' },
  { key: 'projects', name: 'المشاريع', icon: 'folder' },
  { key: 'production', name: 'الإنتاج', icon: 'factory' },
  { key: 'inventory', name: 'المخازن', icon: 'box' },
  { key: 'purchases', name: 'المشتريات والموردون', icon: 'cart' },
  { key: 'costing', name: 'تكلفة المشاريع', icon: 'coins' },
  { key: 'hr', name: 'الموظفون', icon: 'badge' },
  { key: 'reports', name: 'التقارير', icon: 'chart' },
  { key: 'settings', name: 'الإعدادات', icon: 'settings' },
];

export const TERMS = [
  'اعتماد التصميم والمقاسات والخامات نهائي، وأي تغيير بعد الاعتماد يتطلب موافقة مكتوبة وتكلفة إضافية.',
  'يحدد المصنع موعد التوريد والتركيب وفق خطة الإنتاج والتوافر.',
  'يجب على العميل تجهيز الموقع والكهرباء والسباكة والأرضيات قبل التركيب.',
  'إذا طلب العميل تأجيل الموعد، يعاد الجدول حسب توافر المصنع.',
  'يجوز تعليق التصنيع أو العمل عند عدم الالتزام بالدفعات أو متطلبات الموقع.',
  'يتم توقيع محضر استلام نهائي بعد إتمام الأعمال.',
  'يشمل الضمان عيوب التصنيع، ولا يشمل سوء الاستخدام أو التلف الناتج عن عوامل خارجية.',
  'تطبق أحكام الظروف الخارجة عن السيطرة وفق العقد المعتمد.',
];

const iso = (d) => d.toISOString().slice(0, 10);
export const today = () => iso(new Date());
export const daysFrom = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return iso(d); };

function seed() {
  const D = daysFrom;
  const customers = [
    { id: 'CUS-001', name: 'أحمد محمد', type: 'فرد', phone: '+973 3333 1111', email: 'ahmed.mohamed@gmail.com', city: 'المنامة', address: 'طريق 2805، المنامة', parentId: null, since: D(-120) },
    { id: 'CUS-002', name: 'ABC Contracting', type: 'شركة', phone: '+973 1717 2222', email: 'info@abccontracting.com.bh', city: 'المحرق', address: 'المحرق، البحرين', parentId: null, since: D(-300) },
    { id: 'CUS-003', name: 'علي حسن', type: 'فرد', phone: '+973 3999 5555', email: 'ali.hasan@gmail.com', city: 'الرفاع', address: 'الرفاع الشرقي', parentId: null, since: D(-60) },
    { id: 'CUS-004', name: 'سارة عبدالله', type: 'فرد', phone: '+973 3666 4444', email: 'sara.abdulla@gmail.com', city: 'المحرق', address: 'مشروع فلل المحرق - فيلا 3', parentId: 'CUS-002', since: D(-40) },
    { id: 'CUS-005', name: 'خالد يوسف', type: 'فرد', phone: '+973 3888 7777', email: 'khalid.yousif@gmail.com', city: 'سترة', address: 'مشروع فلل سترة - فيلا 7', parentId: 'CUS-002', since: D(-35) },
  ];
  const materials = [
    { id: 'MAT-001', name: 'MDF 18 مم', unit: 'لوح', qty: 28, min: 30, cost: 12 },
    { id: 'MAT-002', name: 'MDF 16 مم', unit: 'لوح', qty: 65, min: 25, cost: 10 },
    { id: 'MAT-003', name: 'HDF', unit: 'لوح', qty: 40, min: 15, cost: 7 },
    { id: 'MAT-004', name: 'شريط حواف PVC', unit: 'متر', qty: 450, min: 100, cost: 0.18 },
    { id: 'MAT-005', name: 'قطاعات ألومنيوم', unit: 'قطعة', qty: 32, min: 20, cost: 4 },
    { id: 'MAT-006', name: 'زجاج', unit: 'م²', qty: 9, min: 10, cost: 16 },
    { id: 'MAT-007', name: 'إكسسوارات (مفصلات ومقابض)', unit: 'قطعة', qty: 210, min: 50, cost: 1.2 },
  ];
  const suppliers = [
    { id: 'SUP-001', name: 'Star Wood', category: 'ألواح خشب', phone: '+973 1700 1001' },
    { id: 'SUP-002', name: 'Kastamonu Entegre', category: 'ألواح MDF وHDF', phone: '+973 1771 4400' },
    { id: 'SUP-003', name: 'مورد الألومنيوم المحلي', category: 'ألومنيوم', phone: '+973 1700 2002' },
    { id: 'SUP-004', name: 'مورد الزجاج', category: 'زجاج', phone: '+973 1700 3003' },
  ];
  const DUR = [3, 2, 4, 2, 3, 2, 1, 2];
  const at = (i) => DUR.slice(0, i).reduce((a, b) => a + b, 0);
  const stagesFor = (current, startOffset) => STAGES.map((s, i) => ({
    key: s.key,
    start: i <= current ? D(startOffset + at(i)) : null,
    end: i < current ? D(startOffset + at(i + 1)) : null,
  }));
  const projects = [
    { id: 'VEN-2026-0001', name: 'مطبخ فيلا حديث', customerId: 'CUS-001', type: 'مطبخ', value: 4500, stage: 2, stages: stagesFor(2, -10), location: 'المنامة، البحرين', dimensions: 'حسب المخططات المعتمدة (4.2م × 3.1م)', materials: 'MDF / HPL / إكسسوارات', notes: 'اعتماد اللون قبل بدء التصنيع', files: [{ name: 'kitchen-plan.pdf', size: '2.4 MB' }, { name: 'kitchen-3d.skp', size: '18.1 MB' }], expected: D(14), assignee: 'جاسم علي', laborHours: 46, machineHours: 12, otherCosts: 180 },
    { id: 'VEN-2026-0002', name: 'دواليب غرف نوم', customerId: 'CUS-004', type: 'أثاث', value: 1850, stage: 0, stages: stagesFor(0, -2), location: 'المحرق - فيلا 3', dimensions: 'قيد الاعتماد', materials: 'MDF / PVC', notes: 'العميل التابع لـ ABC Contracting', files: [{ name: 'wardrobes.dwg', size: '3.2 MB' }], expected: D(25), assignee: 'جاسم علي', laborHours: 0, machineHours: 0, otherCosts: 0 },
    { id: 'VEN-2026-0003', name: 'ديكور صالة معيشة', customerId: 'CUS-003', type: 'ديكور', value: 2700, stage: 7, stages: stagesFor(7, -20), location: 'الرفاع، البحرين', dimensions: 'حسب الموقع', materials: 'خشب / بانوهات ديكور', notes: '', files: [{ name: 'living-room.jpg', size: '1.1 MB' }], expected: D(1), assignee: 'فريق التركيب', laborHours: 60, machineHours: 9, otherCosts: 220 },
    { id: 'VEN-2026-0004', name: 'مطبخ فيلا سترة', customerId: 'CUS-005', type: 'مطبخ', value: 3900, stage: 2, stages: stagesFor(2, -15), location: 'سترة - فيلا 7', dimensions: '3.6م × 2.8م', materials: 'MDF / زجاج / ألومنيوم', notes: 'العميل التابع لـ ABC Contracting', files: [], expected: D(8), assignee: 'جاسم علي', laborHours: 30, machineHours: 10, otherCosts: 90, lateSince: D(-6) },
  ];
  const sched = (total, paidFirst, firstDue, secondDue) => [
    { label: 'الدفعة الأولى (مقدّم)', pct: 50, amount: total * 0.5, due: firstDue },
    { label: 'الدفعة الثانية (قبل التركيب)', pct: 50, amount: total * 0.5, due: secondDue },
  ];
  const quotes = [
    { id: 'QUO-2026-001', customerId: 'CUS-001', title: 'مطبخ فيلا حديث', type: 'مطبخ', date: D(-14), validDays: 15, status: 'converted', items: [{ desc: 'وحدات مطبخ سفلية وعلوية MDF مع HPL', qty: 1, price: 3800 }, { desc: 'إكسسوارات ومفصلات هيدروليك', qty: 1, price: 400 }, { desc: 'توصيل وتركيب', qty: 1, price: 300 }] },
    { id: 'QUO-2026-002', customerId: 'CUS-004', title: 'دواليب غرف نوم', type: 'أثاث', date: D(-5), validDays: 15, status: 'converted', items: [{ desc: 'دولاب غرفة نوم رئيسية', qty: 1, price: 1100 }, { desc: 'دولاب غرفة أطفال', qty: 1, price: 750 }] },
    { id: 'QUO-2026-003', customerId: 'CUS-003', title: 'ديكور صالة معيشة', type: 'ديكور', date: D(-25), validDays: 15, status: 'converted', items: [{ desc: 'بانوهات ديكور خشب ووحدة تلفزيون', qty: 1, price: 2700 }] },
    { id: 'QUO-2026-004', customerId: 'CUS-005', title: 'مطبخ فيلا سترة', type: 'مطبخ', date: D(-18), validDays: 15, status: 'converted', items: [{ desc: 'مطبخ كامل مع جزيرة', qty: 1, price: 3600 }, { desc: 'زجاج وألومنيوم', qty: 1, price: 300 }] },
    { id: 'QUO-2026-005', customerId: 'CUS-003', title: 'دولاب غرفة نوم', type: 'أثاث', date: D(-3), validDays: 15, status: 'sent', items: [{ desc: 'دولاب 4 درف بمرايا', qty: 1, price: 1250 }] },
    { id: 'QUO-2026-006', customerId: 'CUS-002', title: 'مطابخ 3 فلل - مشروع المحرق', type: 'مطبخ', date: D(-1), validDays: 15, status: 'draft', items: [{ desc: 'مطبخ فيلا نموذج A', qty: 3, price: 3200 }] },
  ];
  const invoices = [
    { id: 'INV-2026-001', quoteId: 'QUO-2026-001', customerId: 'CUS-001', projectId: 'VEN-2026-0001', date: D(-12), total: 4500, schedule: sched(4500, true, D(-12), D(13)) },
    { id: 'INV-2026-002', quoteId: 'QUO-2026-002', customerId: 'CUS-004', projectId: 'VEN-2026-0002', date: D(-3), total: 1850, schedule: sched(1850, false, D(-3), D(24)) },
    { id: 'INV-2026-003', quoteId: 'QUO-2026-003', customerId: 'CUS-003', projectId: 'VEN-2026-0003', date: D(-22), total: 2700, schedule: sched(2700, true, D(-22), D(1)) },
    { id: 'INV-2026-004', quoteId: 'QUO-2026-004', customerId: 'CUS-005', projectId: 'VEN-2026-0004', date: D(-16), total: 3900, schedule: sched(3900, true, D(-16), D(7)) },
  ];
  const receipts = [
    { id: 'REC-2026-001', invoiceId: 'INV-2026-001', date: D(-12), amount: 2250, method: 'تحويل بنكي', installment: 0 },
    { id: 'REC-2026-002', invoiceId: 'INV-2026-003', date: D(-22), amount: 1350, method: 'BenefitPay', installment: 0 },
    { id: 'REC-2026-003', invoiceId: 'INV-2026-004', date: D(-16), amount: 1950, method: 'شيك', installment: 0 },
  ];
  const movements = [
    { id: 'MOV-001', materialId: 'MAT-001', type: 'out', qty: 22, date: D(-8), projectId: 'VEN-2026-0001', by: 'سامي حداد' },
    { id: 'MOV-002', materialId: 'MAT-007', type: 'out', qty: 120, date: D(-8), projectId: 'VEN-2026-0001', by: 'سامي حداد' },
    { id: 'MOV-003', materialId: 'MAT-004', type: 'out', qty: 200, date: D(-7), projectId: 'VEN-2026-0001', by: 'سامي حداد' },
    { id: 'MOV-004', materialId: 'MAT-002', type: 'out', qty: 30, date: D(-18), projectId: 'VEN-2026-0003', by: 'سامي حداد' },
    { id: 'MOV-005', materialId: 'MAT-003', type: 'out', qty: 12, date: D(-18), projectId: 'VEN-2026-0003', by: 'سامي حداد' },
    { id: 'MOV-006', materialId: 'MAT-001', type: 'out', qty: 18, date: D(-12), projectId: 'VEN-2026-0004', by: 'سامي حداد' },
    { id: 'MOV-007', materialId: 'MAT-006', type: 'out', qty: 6, date: D(-11), projectId: 'VEN-2026-0004', by: 'سامي حداد' },
    { id: 'MOV-008', materialId: 'MAT-005', type: 'out', qty: 14, date: D(-11), projectId: 'VEN-2026-0004', by: 'سامي حداد' },
  ];
  const pos = [
    { id: 'PO-2026-001', supplierId: 'SUP-004', materialId: 'MAT-006', qty: 20, cost: 320, date: D(-2), status: 'sent' },
    { id: 'PO-2026-002', supplierId: 'SUP-002', materialId: 'MAT-002', qty: 40, cost: 400, date: D(-20), status: 'received' },
  ];
  const employees = [
    { id: 'EMP-001', name: 'جاسم علي', dept: 'الإنتاج', job: 'مدير إنتاج', salary: 650, today: 'present' },
    { id: 'EMP-002', name: 'راجو كومار', dept: 'الورشة', job: 'نجار', salary: 320, today: 'present' },
    { id: 'EMP-003', name: 'سانجاي ناير', dept: 'الورشة', job: 'مشغّل CNC', salary: 380, today: 'present' },
    { id: 'EMP-004', name: 'محمد رفيق', dept: 'الورشة', job: 'فني ألومنيوم', salary: 300, today: 'absent' },
    { id: 'EMP-005', name: 'أنيل شارما', dept: 'الورشة', job: 'دهان', salary: 300, today: 'present' },
    { id: 'EMP-006', name: 'عبدالله سالم', dept: 'التركيب', job: 'فني تركيب', salary: 340, today: 'present' },
    { id: 'EMP-007', name: 'سامي حداد', dept: 'المخازن', job: 'أمين مخزن', salary: 420, today: 'present' },
    { id: 'EMP-008', name: 'ريم يوسف', dept: 'المبيعات', job: 'مسؤولة مبيعات', salary: 550, today: 'leave' },
    { id: 'EMP-009', name: 'محمود السيد', dept: 'الحسابات', job: 'محاسب', salary: 600, today: 'present' },
    { id: 'EMP-010', name: 'نورة أحمد', dept: 'الإدارة', job: 'موارد بشرية', salary: 520, today: 'present' },
  ];
  const activity = [
    { ts: D(-1) + ' 10:15', user: 'ريم يوسف', text: 'إنشاء عرض السعر QUO-2026-006 لـ ABC Contracting', ref: 'sales/QUO-2026-006' },
    { ts: D(-2) + ' 13:40', user: 'سامي حداد', text: 'إرسال أمر الشراء PO-2026-001 إلى مورد الزجاج', ref: 'purchases' },
    { ts: D(-3) + ' 09:05', user: 'ريم يوسف', text: 'إرسال عرض السعر QUO-2026-005 إلى علي حسن عبر واتساب', ref: 'sales/QUO-2026-005' },
    { ts: D(-6) + ' 11:30', user: 'جاسم علي', text: 'نقل مطبخ فيلا سترة إلى مرحلة القص CNC', ref: 'projects/VEN-2026-0004' },
  ];
  return {
    company: { name: 'VENICE FURNITURE WORKSHOP W.L.L', nameAr: 'مطابخ · أثاث · ديكورات', country: 'مملكة البحرين', currency: 'د.ب', users: '10–20' },
    rates: { labor: 3, machine: 8 },
    terms: TERMS.slice(),
    customers, materials, suppliers, projects, quotes, invoices, receipts, movements, pos, employees, activity,
    seq: { CUS: 5, QUO: 6, INV: 4, REC: 3, VEN: 4, MOV: 8, PO: 2, SUP: 4, MAT: 7 },
  };
}

// ---------- store ----------
export const store = {
  state: null,
  session: { role: null },
  listeners: [],
  load() {
    try { this.state = JSON.parse(localStorage.getItem(KEY)) || seed(); } catch { this.state = seed(); }
    try { this.session = JSON.parse(sessionStorage.getItem(KEY + '-s')) || { role: null }; } catch { this.session = { role: null }; }
  },
  save() {
    try { localStorage.setItem(KEY, JSON.stringify(this.state)); sessionStorage.setItem(KEY + '-s', JSON.stringify(this.session)); } catch { /* storage may be blocked */ }
    this.listeners.forEach((f) => f());
  },
  reset() { this.state = seed(); this.save(); },
  role() { return ROLES.find((r) => r.key === this.session.role); },
  can(page) { if (DEMO.locked.includes(page)) return false; const r = this.role(); return !!r && (r.nav === '*' || r.nav.includes(page)); },
  locked(page) { return DEMO.locked.includes(page); },
};

const S = () => store.state;
const pad = (n, w) => String(n).padStart(w, '0');
function nextId(prefix) {
  const s = S();
  s.seq[prefix] += 1;
  const n = s.seq[prefix];
  if (prefix === 'VEN') return `VEN-2026-${pad(n, 4)}`;
  if (['CUS', 'SUP', 'MAT', 'MOV'].includes(prefix)) return `${prefix}-${pad(n, 3)}`;
  return `${prefix}-2026-${pad(n, 3)}`;
}
function log(text, ref = '') {
  const r = store.role();
  const now = new Date();
  S().activity.unshift({ ts: `${today()} ${pad(now.getHours(), 2)}:${pad(now.getMinutes(), 2)}`, user: r ? r.person : 'النظام', text, ref });
}

// ---------- lookups / computed ----------
export const find = {
  customer: (id) => S().customers.find((x) => x.id === id),
  project: (id) => S().projects.find((x) => x.id === id),
  quote: (id) => S().quotes.find((x) => x.id === id),
  invoice: (id) => S().invoices.find((x) => x.id === id),
  material: (id) => S().materials.find((x) => x.id === id),
  supplier: (id) => S().suppliers.find((x) => x.id === id),
};
export const quoteTotal = (q) => q.items.reduce((a, it) => a + Number(it.qty) * Number(it.price), 0);
export const paidOf = (inv) => S().receipts.filter((r) => r.invoiceId === inv.id).reduce((a, r) => a + r.amount, 0);
export const balanceOf = (inv) => Math.max(0, inv.total - paidOf(inv));
export function invoiceStatus(inv) {
  const p = paidOf(inv);
  if (p >= inv.total - 0.0005) return 'paid';
  if (p > 0) return 'partial';
  return 'unpaid';
}
export function nextDue(inv) {
  let acc = 0; const paid = paidOf(inv);
  for (const s of inv.schedule) { acc += s.amount; if (paid < acc - 0.0005) return s; }
  return null;
}
export const customerBalance = (cid) => S().invoices.filter((i) => i.customerId === cid).reduce((a, i) => a + balanceOf(i), 0);
export const childrenOf = (cid) => S().customers.filter((c) => c.parentId === cid);
export function projectCost(p) {
  const s = S();
  const mat = s.movements.filter((m) => m.type === 'out' && m.projectId === p.id)
    .reduce((a, m) => a + m.qty * (find.material(m.materialId)?.cost || 0), 0);
  const labor = (p.laborHours || 0) * s.rates.labor;
  const machine = (p.machineHours || 0) * s.rates.machine;
  const other = p.otherCosts || 0;
  const total = mat + labor + machine + other;
  return { mat, labor, machine, other, total, profit: p.value - total, margin: p.value ? (p.value - total) / p.value : 0 };
}
export const lowStock = () => S().materials.filter((m) => m.qty <= m.min);
export const isLate = (p) => !!p.lateSince && p.stage < DONE;

// ---------- actions (each = one API call in the real system) ----------
export const act = {
  addCustomer(data) {
    const c = { id: nextId('CUS'), since: today(), parentId: null, ...data };
    S().customers.push(c); log(`إضافة العميل ${c.name}`, `customers/${c.id}`); store.save(); return c;
  },
  saveQuote(data) {
    const q = { id: nextId('QUO'), date: today(), validDays: 15, status: 'draft', ...data };
    S().quotes.unshift(q); log(`إنشاء عرض السعر ${q.id} لـ ${find.customer(q.customerId)?.name}`, `sales/${q.id}`); store.save(); return q;
  },
  sendQuote(id, channel) {
    const q = find.quote(id); if (q.status === 'draft') q.status = 'sent';
    log(`إرسال عرض السعر ${id} عبر ${channel}`, `sales/${id}`); store.save();
  },
  rejectQuote(id) { const q = find.quote(id); q.status = 'rejected'; log(`تسجيل رفض العميل لعرض السعر ${id}`, `sales/${id}`); store.save(); },
  convertQuote(id) {
    const s = S(); const q = find.quote(id); const total = quoteTotal(q);
    const pid = nextId('VEN');
    const project = { id: pid, name: q.title, customerId: q.customerId, type: q.type, value: total, stage: 0, stages: STAGES.map((st, i) => ({ key: st.key, start: i === 0 ? today() : null, end: null })), location: find.customer(q.customerId)?.address || '', dimensions: 'قيد الاعتماد', materials: '', notes: '', files: [], expected: daysFrom(30), assignee: 'جاسم علي', laborHours: 0, machineHours: 0, otherCosts: 0 };
    const inv = { id: nextId('INV'), quoteId: q.id, customerId: q.customerId, projectId: pid, date: today(), total, schedule: [
      { label: 'الدفعة الأولى (مقدّم)', pct: 50, amount: total * 0.5, due: today() },
      { label: 'الدفعة الثانية (قبل التركيب)', pct: 50, amount: total * 0.5, due: daysFrom(29) },
    ] };
    q.status = 'converted';
    s.projects.unshift(project); s.invoices.unshift(inv);
    log(`تحويل عرض السعر ${q.id} إلى الفاتورة ${inv.id} وفتح المشروع ${pid}`, `sales/${inv.id}`); store.save();
    return { inv, project };
  },
  addReceipt({ invoiceId, amount, method, date }) {
    const inv = find.invoice(invoiceId); const bal = balanceOf(inv);
    if (amount <= 0) throw new Error('يرجى إدخال مبلغ أكبر من صفر');
    if (amount > bal + 0.0005) throw new Error(`المبلغ أكبر من الرصيد المتبقي (${bal.toFixed(3)})`);
    const installment = paidOf(inv) >= inv.schedule[0].amount - 0.0005 ? 1 : 0;
    const r = { id: nextId('REC'), invoiceId, amount, method, date: date || today(), installment };
    S().receipts.unshift(r); log(`تسجيل دفعة ${amount.toLocaleString('en-US', { minimumFractionDigits: 3 })} د.ب على ${invoiceId} (سند ${r.id})`, `sales/${invoiceId}`); store.save(); return r;
  },
  moveStage(pid, dir = 1) {
    const p = find.project(pid); const from = p.stage; const to = Math.max(0, Math.min(DONE, from + dir));
    if (to === from) return p;
    if (dir > 0) { if (p.stages[from]) p.stages[from].end = today(); if (p.stages[to]) p.stages[to].start = today(); }
    p.stage = to; delete p.lateSince;
    log(to === DONE ? `تسليم المشروع ${p.name} للعميل` : `نقل ${p.name} إلى مرحلة ${STAGES[to].name}`, `projects/${pid}`); store.save(); return p;
  },
  setStage(pid, to) { const p = find.project(pid); const dir = to - p.stage; if (!dir) return; for (let i = 0; i < Math.abs(dir); i++) this.moveStage(pid, Math.sign(dir)); },
  issueMaterial({ materialId, qty, projectId }) {
    const m = find.material(materialId);
    if (!(qty > 0)) throw new Error('يرجى إدخال كمية صحيحة');
    if (qty > m.qty) throw new Error(`الرصيد المتاح ${m.qty} ${m.unit} فقط`);
    m.qty -= qty;
    S().movements.unshift({ id: nextId('MOV'), materialId, type: 'out', qty, date: today(), projectId, by: store.role()?.person });
    log(`صرف ${qty} ${m.unit} ${m.name} لمشروع ${find.project(projectId)?.name}`, `projects/${projectId}`); store.save(); return m;
  },
  createPO({ supplierId, materialId, qty, cost }) {
    const po = { id: nextId('PO'), supplierId, materialId, qty, cost, date: today(), status: 'sent' };
    S().pos.unshift(po); log(`إرسال أمر الشراء ${po.id} إلى ${find.supplier(supplierId)?.name}`, 'purchases'); store.save(); return po;
  },
  receivePO(id) {
    const po = S().pos.find((p) => p.id === id); const m = find.material(po.materialId);
    po.status = 'received'; po.received = today(); m.qty += po.qty;
    S().movements.unshift({ id: nextId('MOV'), materialId: m.id, type: 'in', qty: po.qty, date: today(), poId: po.id, by: store.role()?.person });
    log(`استلام ${po.qty} ${m.unit} ${m.name} من أمر الشراء ${po.id}`, 'inventory'); store.save(); return po;
  },
  updateProject(pid, patch) { Object.assign(find.project(pid), patch); log(`تعديل بيانات المشروع ${pid}`, `projects/${pid}`); store.save(); },
  addFile(pid, name) { const p = find.project(pid); p.files.push({ name, size: '—' }); log(`رفع الملف ${name} إلى ${p.name}`, `projects/${pid}`); store.save(); },
  setAttendance(eid, v) { const e = S().employees.find((x) => x.id === eid); e.today = v; store.save(); },
  setTerms(list) { S().terms = list; log('تعديل بنود العقد'); store.save(); },
};
