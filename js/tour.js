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
  { title: 'أهلًا بيك في فينيسيا', route: () => 'dashboard',
    text: 'هتمشي بنفسك في رحلة مطبخ كامل: زبونة جديدة اسمها منى عايزة مطبخ لفيلتها في الجفير. هنعمل لها عرض سعر، ونحوّله لفاتورة، ونتابعه في الورشة، ونصرف خامات، ونشوف الربح، لحد ما نسلّم ونحصّل.',
    why: 'في كل خطوة هتلاقي زرار منوّر بالدهبي. اضغط عليه، والبيانات بتتملي لوحدها.' },
  { title: 'عميل جديد', route: () => 'customers', target: 'new-customer',
    text: 'اضغط «عميل جديد»، وبعدين «املأ ببيانات تجريبية»، واحفظ.',
    why: 'كل عميل ليه ملف واحد فيه مشاريعه وفواتيره ودفعاته، والنظام بيمنع تكرار نفس رقم التليفون.',
    done: () => { const c = S().customers.find((x) => x.name === 'منى حسين'); if (c) T.customerId = c.id; return !!c; } },
  { title: 'عرض سعر من ملف العميل', route: () => `customers/${T.customerId}`, target: 'quote-from-customer', alt: 'autofill-quote',
    text: 'من ملف منى اضغط «عرض سعر جديد». في الصفحة الجاية اضغط «املأ ببيانات تجريبية»، وبعدين «حفظ وإرسال للعميل».',
    why: 'العرض فيه بنود، والإجمالي والمقدم بيتحسبوا لوحدهم. والعرض بيتطبع بهوية الشركة الأسود والدهبي.',
    done: () => { const q = S().quotes.find((x) => x.customerId === T.customerId); if (q) T.quoteId = q.id; return !!q; } },
  { title: 'منى وافقت!', route: () => `sales/${T.quoteId}`, target: 'convert',
    text: 'اضغط «العميل وافق: حوّل لفاتورة». ضغطة واحدة بتعمل ٣ حاجات مع بعض.',
    why: 'فاتورة بدفعتين (٥٠٪ مقدم و٥٠٪ قبل التركيب)، ومشروع جديد في الورشة، والعرض يتقفل. مافيش حاجة بتتكتب مرتين.',
    done: () => { const i = S().invoices.find((x) => x.quoteId === T.quoteId); if (i) { T.invoiceId = i.id; T.projectId = i.projectId; } return !!i; } },
  { title: 'تسجيل المقدم', route: () => `sales/${T.invoiceId}`, target: 'pay-0',
    text: 'اضغط «سجّل الدفعة» جنب الدفعة الأولى. المبلغ متعبي جاهز، اختار طريقة الدفع (BenefitPay مثلًا) واحفظ.',
    why: 'بيطلع سند قبض رسمي تبعته على الواتساب، وحالة الفاتورة تتغير لوحدها لـ«مدفوعة جزئيًا»، وكشف حساب العميل يتحدث.',
    done: () => T.invoiceId && paidOf(find.invoice(T.invoiceId)) > 0 },
  { title: 'اعتماد التصميم', route: () => `projects/${T.projectId}`, target: 'advance',
    text: 'ده ملف المشروع اللي اتفتح لوحده. منى اعتمدت التصميم؟ اضغط الزرار الدهبي عشان المشروع يدخل مرحلة تجهيز الخامات.',
    why: 'كل مرحلة بتتسجل بتاريخها ومين نقلها. ولو أحمد اتصل يسأل «مطبخي فين؟» أي موظف يرد في ثانية.',
    done: () => find.project(T.projectId)?.stage >= 1 },
  { title: 'صرف خامات على المطبخ', route: () => `projects/${T.projectId}`, target: 'issue-from-project',
    text: 'اضغط «صرف خامات». اختار MDF 18 مم والكمية ١٢، واحفظ.',
    why: 'الرصيد ينقص من المخزن، والتكلفة تتسجل على مطبخ منى بسعرها. ولو الخامة نزلت تحت حد الطلب، النظام ينبّه.',
    done: () => S().movements.some((m) => m.projectId === T.projectId) },
  { title: 'الخشب قرّب يخلص', route: () => 'inventory', target: 'reorder-MAT-001',
    text: 'MDF 18 مم بقى تحت حد الطلب (بالأحمر). اضغط «اطلب من المورد»: المورد والكمية متعبيين، ابعت أمر الشراء.',
    why: 'كده الورشة مش هتقف عشان لوح ناقص.',
    done: () => { const p = S().pos.find((x) => x.materialId === 'MAT-001' && x.id !== 'PO-2026-002'); if (p) T.poId = p.id; return !!p; } },
  { title: 'البضاعة وصلت', route: () => 'purchases', target: () => `receive-${T.poId}`,
    text: 'اضغط «استلام» على أمر الشراء، وأكّد.',
    why: 'المخزن يزيد لوحده، والمبلغ يتسجل على الشركة للمورد في تقرير مستحقات الموردين.',
    done: () => S().pos.find((x) => x.id === T.poId)?.status === 'received' },
  { title: 'الورشة (كانبان)', route: () => 'production', target: () => `knext-${T.projectId}`,
    text: 'كل مطبخ كارت، وكل عمود مرحلة. حرّك مطبخ منى للأمام بالسهم أو بالسحب. أو اضغط «اختصر» تحت عشان يروح للتركيب على طول.',
    why: 'المدير يشوف الورشة كلها في شاشة واحدة، والكارت الأحمر يعني متأخر.',
    shortcut: { label: 'اختصر: وديه لمرحلة التركيب', run: () => { act.setStage(T.projectId, DONE - 1); } },
    done: () => find.project(T.projectId)?.stage >= DONE - 1 },
  { title: 'المطبخ ده كسّب كام؟', route: () => `costing/${T.projectId}`,
    text: 'ده أهم سؤال عند صاحب الشركة. شوف الخامات اللي صرفتها ظاهرة بسعرها. جرّب تكتب ساعات العمال (٤٠ مثلًا) واضغط «حفظ وإعادة الحساب».',
    why: 'في النموذج القديم الأرقام دي كانت ثابتة. هنا بتتحسب من الشغل الفعلي.' },
  { title: 'الدفعة التانية قبل التركيب', route: () => `sales/${T.invoiceId}`, target: 'pay-1',
    text: 'التركيب بكرة، يبقى نحصّل الـ٥٠٪ الباقية. اضغط «سجّل الدفعة» واحفظ.',
    why: 'لوحة التحكم بتنبّه المحاسب بالدفعات اللي ميعادها قرّب أو اتأخر.',
    done: () => T.invoiceId && invoiceStatus(find.invoice(T.invoiceId)) === 'paid' },
  { title: 'التسليم', route: () => `projects/${T.projectId}`, target: 'advance',
    text: 'الفريق ركّب المطبخ. اضغط «تم التركيب: سلّم المشروع».',
    why: 'المشروع يتقفل، ويظهر في تقرير الربحية بأرقامه النهائية.',
    done: () => find.project(T.projectId)?.stage >= DONE },
  { title: 'خلصت الدورة كلها', route: () => 'dashboard',
    text: 'من عميل جديد لحد مطبخ متسلّم ومتحصّل، وكل خطوة أثّرت في اللي بعدها من غير ما حد يكتب حاجة مرتين.',
    why: 'جرّب كمان تغيّر الدور من تحت (المحاسب أو الفني) وشوف إن كل واحد شايف حاجات مختلفة. وفي الإعدادات هتلاقي «سجل التعديلات» فيه كل اللي عملته.', last: true },
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
      ${ok ? `<span class="done-step">${icon('check', 15)} تمام، خلصت الخطوة دي</span>` : ''}
      <div class="row">
        ${st.route && currentRoute() !== st.route() && !ok ? `<button class="btn sm primary" data-act="tourGo">${icon('next', 14)} وديني هناك</button>` : ''}
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
    toast('بدأنا الجولة على بيانات تجريبية نضيفة', 'gold');
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
    tourStop() { tour.stop(); toast('انتهت الجولة. النظام كله قدامك تجرّبه براحتك', 'gold'); },
    tourMin() { T.min = !T.min; save(); panel(); },
    tourShortcut() { const st = STEPS[T.i]; st.shortcut.run(); toast(`${find.project(T.projectId).name} وصل لمرحلة ${STAGES[DONE - 1].name}`); nav.render(); },
  },
};
export const TOUR_STEPS = STEPS.length;
