// Guided "full cycle" tour: walks the client through one kitchen order end to end.
import { store, act, find, paidOf, invoiceStatus, DONE, STAGES } from './data.js';
import { icon } from './icons.js';
import { esc, toast } from './ui.js';
import { nav } from './nav.js';

const KEY = 'venice-tour';
let T = load();
window.__tourState = T;
function load() { try { return JSON.parse(sessionStorage.getItem(KEY)) || { active: false }; } catch { return { active: false }; } }
function save() { try { sessionStorage.setItem(KEY, JSON.stringify(T)); } catch { /* ignore */ } window.__tourState = T; }

const S = () => store.state;
const lastNew = (arr, base) => (arr.length > base ? arr[arr.length - 1] : null);

const STEPS = [
  { title: 'جولة الدورة الكاملة', route: () => 'dashboard',
    text: 'رحلة مطبخ كامل لعميلة جديدة (منى حسين): عرض سعر، ثم فاتورة، ثم الإنتاج وصرف الخامات، ثم التكلفة والربح، حتى التسليم والتحصيل.',
    why: 'في كل خطوة يُميَّز الزر المطلوب باللون الذهبي، والبيانات تُعبَّأ تلقائيًا.' },
  { title: 'عميل جديد', route: () => 'customers', target: 'new-customer',
    text: 'اضغط «عميل جديد»، ثم «تعبئة تلقائية»، ثم «حفظ العميل».',
    why: 'لكل عميل ملف واحد يجمع مشاريعه وفواتيره ودفعاته.',
    done: () => { const c = S().customers.find((x) => x.name === 'منى حسين'); if (c) T.customerId = c.id; return !!c; } },
  { title: 'عرض سعر من ملف العميل', route: () => `customers/${T.customerId}`, target: 'quote-from-customer', alt: 'autofill-quote',
    text: 'من ملف العميلة اضغط «عرض سعر جديد»، ثم «تعبئة تلقائية»، ثم «حفظ وإرسال للعميل».',
    why: 'الإجمالي والمقدّم يُحسبان تلقائيًا، ويُطبع العرض بهوية الشركة.',
    done: () => { const q = S().quotes.find((x) => x.customerId === T.customerId); if (q) T.quoteId = q.id; return !!q; } },
  { title: 'موافقة العميلة', route: () => `sales/${T.quoteId}`, target: 'convert',
    text: 'اضغط «تحويل إلى فاتورة».',
    why: 'تُنشأ فاتورة على دفعتين (50% مقدّمًا و50% قبل التركيب) ومشروع جديد في الإنتاج، دون إعادة إدخال أي بيانات.',
    done: () => { const i = S().invoices.find((x) => x.quoteId === T.quoteId); if (i) { T.invoiceId = i.id; T.projectId = i.projectId; } return !!i; } },
  { title: 'تسجيل المقدّم', route: () => `sales/${T.invoiceId}`, target: 'pay-0',
    text: 'اضغط «تسجيل الدفعة» بجانب الدفعة الأولى، واختر طريقة الدفع، ثم احفظ.',
    why: 'يصدر سند قبض يمكن إرساله عبر واتساب، وتتحدّث حالة الفاتورة وكشف حساب العميل تلقائيًا.',
    done: () => T.invoiceId && paidOf(find.invoice(T.invoiceId)) > 0 },
  { title: 'اعتماد التصميم', route: () => `projects/${T.projectId}`, target: 'advance',
    text: 'هذا ملف المشروع الذي أُنشئ تلقائيًا. اضغط الزر الذهبي لاعتماد التصميم والانتقال إلى تجهيز الخامات.',
    why: 'تُسجَّل كل مرحلة بتاريخها والمستخدم الذي نقلها.',
    done: () => find.project(T.projectId)?.stage >= 1 },
  { title: 'صرف الخامات', route: () => `projects/${T.projectId}`, target: 'issue-from-project',
    text: 'اضغط «صرف خامات»، واختر MDF 18 مم بكمية 12، ثم «تأكيد الصرف».',
    why: 'ينقص الرصيد من المخزن وتُضاف التكلفة إلى المشروع، ويظهر تنبيه عند الوصول إلى حد الطلب.',
    done: () => S().movements.some((m) => m.projectId === T.projectId) },
  { title: 'تنبيه حد الطلب', route: () => 'inventory', target: 'reorder-MAT-001',
    text: 'أصبح MDF 18 مم أقل من حد الطلب. اضغط «طلب شراء»، ثم «إرسال أمر الشراء».',
    why: 'المورد والكمية مقترحان تلقائيًا.',
    done: () => { const p = S().pos.find((x) => x.materialId === 'MAT-001' && x.id !== 'PO-2026-002'); if (p) T.poId = p.id; return !!p; } },
  { title: 'استلام البضاعة', route: () => 'purchases', target: () => `receive-${T.poId}`,
    text: 'اضغط «استلام» على أمر الشراء، ثم «تأكيد الاستلام».',
    why: 'يزيد رصيد المخزن، ويُسجَّل المبلغ مستحقًا للمورد.',
    done: () => S().pos.find((x) => x.id === T.poId)?.status === 'received' },
  { title: 'لوحة الإنتاج', route: () => 'production', target: () => `knext-${T.projectId}`,
    text: 'كل مشروع بطاقة، وكل عمود مرحلة. انقل المشروع بزر «المرحلة التالية» أو بالسحب، أو استخدم الاختصار أدناه.',
    why: 'حالة الورشة كلها في شاشة واحدة، والبطاقة الحمراء تعني تأخيرًا.',
    shortcut: { label: 'الانتقال مباشرة إلى مرحلة التركيب', run: () => { act.setStage(T.projectId, DONE - 1); } },
    done: () => find.project(T.projectId)?.stage >= DONE - 1 },
  { title: 'تكلفة المشروع وربحه', route: () => `costing/${T.projectId}`,
    text: 'تظهر الخامات المصروفة بتكلفتها. أدخل ساعات العمل (40 مثلًا) واضغط «حفظ».',
    why: 'التكلفة تُحسب من العمل الفعلي على المشروع.' },
  { title: 'الدفعة الثانية', route: () => `sales/${T.invoiceId}`, target: 'pay-1',
    text: 'قبل التركيب تُحصَّل الـ50% المتبقية. اضغط «تسجيل الدفعة» ثم احفظ.',
    why: 'تنبّه لوحة التحكم بالدفعات المستحقة والمتأخرة.',
    done: () => T.invoiceId && invoiceStatus(find.invoice(T.invoiceId)) === 'paid' },
  { title: 'التسليم', route: () => `projects/${T.projectId}`, target: 'advance',
    text: 'اكتمل التركيب. اضغط «تسليم المشروع».',
    why: 'يُغلق المشروع ويظهر في تقرير الربحية بأرقامه النهائية.',
    done: () => find.project(T.projectId)?.stage >= DONE },
  { title: 'اكتملت الدورة', route: () => 'dashboard',
    text: 'من عميل جديد حتى مشروع مُسلَّم ومُحصَّل، وكل خطوة انعكست على ما بعدها.',
    why: 'يمكنك تغيير الدور من القائمة الجانبية لرؤية ما يظهر لكل مستخدم، وفي الإعدادات «سجل التعديلات» بكل ما تم.', last: true },
];

function panel() {
  const root = document.getElementById('tour-root');
  if (!T.active || !store.session.role) { root.innerHTML = ''; return; }
  const st = STEPS[T.i]; const n = STEPS.length; const ok = st.done ? !!st.done() : false;
  root.innerHTML = `<div class="tour ${T.min ? 'min' : ''}" role="dialog" aria-label="جولة الدورة الكاملة">
    <div class="tour-top">${icon('play', 14)}<b>جولة الدورة الكاملة · ${T.i + 1} من ${n}</b>
      <button class="icon-btn" data-act="tourMin" aria-label="${T.min ? 'تكبير' : 'تصغير'}">${icon(T.min ? 'plus' : 'chevron', 16)}</button><button class="icon-btn" data-act="tourStop" aria-label="إنهاء الجولة" style="margin:0">${icon('x', 16)}</button></div>
    <div class="tour-prog"><span style="width:${((T.i + (ok ? 1 : 0)) / n) * 100}%"></span></div>
    <div class="tour-body"><h4>${esc(st.title)}</h4><p>${esc(st.text)}</p>${st.why ? `<div class="why">${esc(st.why)}</div>` : ''}
      ${ok ? `<span class="done-step">${icon('check', 15)} تم إنجاز هذه الخطوة</span>` : ''}
      <div class="row">
        ${st.route && currentRoute() !== st.route() && !ok ? `<button class="btn sm primary" data-act="tourGo">${icon('next', 14)} الانتقال إلى الصفحة</button>` : ''}
        ${st.shortcut && !ok ? `<button class="btn sm" data-act="tourShortcut">${esc(st.shortcut.label)}</button>` : ''}
        <span class="spacer"></span>
        ${T.i > 0 ? `<button class="btn sm ghost" data-act="tourPrev">السابق</button>` : ''}
        ${st.last ? `<button class="btn sm primary" data-act="tourStop">إنهاء الجولة</button>` : `<button class="btn sm ${ok || !st.done ? 'primary' : 'ghost'}" data-act="tourNext">${ok || !st.done ? 'التالي' : 'تخطّي'}</button>`}
      </div></div></div>`;
}
const currentRoute = () => location.hash.replace(/^#\/?/, '') || 'dashboard';

function highlight() {
  document.querySelectorAll('.pulse').forEach((x) => x.classList.remove('pulse'));
  if (!T.active || !store.session.role) return;
  const st = STEPS[T.i]; if (st.done && st.done()) return;
  const keys = [st.target, st.alt].map((t) => (typeof t === 'function' ? t() : t)).filter(Boolean);
  for (const k of keys) {
    const el = document.querySelector(`[data-tour="${k}"]`);
    if (el) { el.classList.add('pulse'); if (!T.scrolled) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); T.scrolled = true; } break; }
  }
}

let advTimer = null;
export const tour = {
  start() {
    store.reset();
    T = { active: true, i: 0, min: false };
    store.session.role = 'admin'; store.save(); save();
    toast('بدأت الجولة', 'gold');
    nav.go('dashboard');
  },
  stop() { T = { active: false }; save(); panel(); highlight(); },
  sync() { panel(); highlight(); },
  check() {
    if (!T.active) return;
    const st = STEPS[T.i];
    if (st.done && st.done()) {
      save(); panel();
      clearTimeout(advTimer);
      advTimer = setTimeout(() => { if (T.active && STEPS[T.i] === st && T.i < STEPS.length - 1) { T.i += 1; T.scrolled = false; save(); const next = STEPS[T.i]; if (next.route && !document.querySelector('#modal-root .overlay')) nav.go(next.route()); else tour.sync(); } }, 1400);
    } else save();
  },
  handlers: {
    tourGo() { const st = STEPS[T.i]; T.scrolled = false; save(); nav.go(st.route()); },
    tourNext() { if (T.i < STEPS.length - 1) { T.i += 1; T.scrolled = false; save(); const st = STEPS[T.i]; if (st.route && currentRoute() !== st.route()) nav.go(st.route()); else tour.sync(); } },
    tourPrev() { if (T.i > 0) { T.i -= 1; T.scrolled = false; save(); const st = STEPS[T.i]; nav.go(st.route()); } },
    tourStop() { tour.stop(); toast('انتهت الجولة', 'gold'); },
    tourMin() { T.min = !T.min; save(); panel(); },
    tourShortcut() { const st = STEPS[T.i]; st.shortcut.run(); toast(`انتقل ${find.project(T.projectId).name} إلى مرحلة ${STAGES[DONE - 1].name}`); nav.render(); },
  },
};
export const TOUR_STEPS = STEPS.length;
