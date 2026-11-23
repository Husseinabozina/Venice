// Branded printable documents (quotation, invoice, receipt) + print helper.
import { store, find, quoteTotal, paidOf, balanceOf } from './data.js';
import { esc } from './ui.js';

const m3 = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 });

function head(title, id, date) {
  return `<div class="doc-head">
    <div style="display:flex;align-items:center;gap:13px"><div class="mk">V</div><div><div class="nm">VENICE</div><div class="tg">FURNITURE AND WORKSHOP W.L.L</div></div></div>
    <div class="ttl"><b>${title}</b><div>${esc(id)}</div><div>${esc(date)}</div></div>
  </div><div class="doc-stripe"></div>`;
}
function party(label, c) {
  return `<div style="display:flex;justify-content:space-between;gap:20px;flex-wrap:wrap">
    <div><div style="color:#9b7a42;font-size:11px;font-weight:700;letter-spacing:1px">${label}</div><b style="font-size:18px">${esc(c?.name)}</b><div>${esc(c?.phone)}</div><div>${esc(c?.email)}</div></div>
    <div style="text-align:right"><b>VENICE FURNITURE WORKSHOP</b><div>Kingdom of Bahrain</div><div>Kitchens • Furniture • Interiors</div></div></div>`;
}
const foot = (t) => `<div class="doc-foot">${t}</div>`;

export function quoteDoc(q) {
  const c = find.customer(q.customerId); const total = quoteTotal(q);
  const terms = store.state.terms;
  return `<div class="doc">${head('QUOTATION', q.id, q.date)}
  <div class="doc-body">${party('PREPARED FOR', c)}
    <table><thead><tr><th>Description</th><th style="text-align:center">Qty</th><th style="text-align:right">Unit price</th><th style="text-align:right">Amount (BHD)</th></tr></thead><tbody>
      ${q.items.map((it) => `<tr><td>${esc(it.desc)}</td><td style="text-align:center">${it.qty}</td><td class="r">${m3(it.price)}</td><td class="r">${m3(it.qty * it.price)}</td></tr>`).join('')}
    </tbody></table>
    <div style="margin-left:auto;width:min(300px,100%);display:grid;gap:6px">
      <div style="display:flex;justify-content:space-between"><span>Subtotal</span><b>${m3(total)}</b></div>
      <div style="display:flex;justify-content:space-between;background:#f1e7d4;padding:12px;font-size:17px;font-weight:800"><span>TOTAL BHD</span><span>${m3(total)}</span></div>
      <div style="font-size:11px;color:#777">Valid for ${q.validDays} days · No VAT applied</div>
    </div>
    <div class="doc-terms"><b>Payment Terms / شروط الدفع</b>
      <div>50% advance upon order confirmation; remaining 50% payable one day before the scheduled installation.</div>
      <div dir="rtl">٥٠٪ مقدمًا عند تأكيد الطلب، و٥٠٪ المتبقية قبل موعد التركيب بيوم واحد.</div>
      <b style="display:block;margin-top:10px">الشروط والأحكام</b>
      <ol dir="rtl" style="margin:6px 0;padding-right:18px">${terms.map((t) => `<li>${esc(t)}</li>`).join('')}</ol>
    </div>
  </div>${foot('Thank you for choosing VENICE • Bahrain')}</div>`;
}

export function invoiceDoc(inv) {
  const c = find.customer(inv.customerId); const paid = paidOf(inv); const q = find.quote(inv.quoteId);
  return `<div class="doc">${head('INVOICE', inv.id, inv.date)}
  <div class="doc-body">${party('BILL TO', c)}
    <table><thead><tr><th>Description</th><th style="text-align:right">Amount (BHD)</th></tr></thead><tbody>
      ${(q ? q.items : [{ desc: find.project(inv.projectId)?.name, qty: 1, price: inv.total }]).map((it) => `<tr><td>${esc(it.desc)}${it.qty > 1 ? ` × ${it.qty}` : ''}</td><td class="r">${m3(it.qty * it.price)}</td></tr>`).join('')}
    </tbody></table>
    <div style="margin-left:auto;width:min(320px,100%);display:grid;gap:6px">
      <div style="display:flex;justify-content:space-between"><span>Total invoice</span><b>${m3(inv.total)}</b></div>
      <div style="display:flex;justify-content:space-between"><span>Amount paid</span><b>${m3(paid)}</b></div>
      <div style="display:flex;justify-content:space-between;background:#f1e7d4;padding:12px;font-size:17px;font-weight:800"><span>BALANCE DUE</span><span>${m3(inv.total - paid)}</span></div>
    </div>
    <div><b>Payment schedule / جدول الدفعات</b>
    <table style="margin-top:8px"><thead><tr><th>Payment</th><th>Due</th><th style="text-align:right">Amount (BHD)</th></tr></thead><tbody>
      ${inv.schedule.map((s, i) => `<tr><td>${i === 0 ? 'First payment (advance)' : 'Second payment (before installation)'}</td><td>${esc(s.due)}</td><td class="r">${m3(s.amount)}</td></tr>`).join('')}
    </tbody></table></div>
  </div>${foot('VENICE FURNITURE AND WORKSHOP W.L.L · Kingdom of Bahrain')}</div>`;
}

export function receiptDoc(r) {
  const inv = find.invoice(r.invoiceId); const c = find.customer(inv.customerId);
  const paidUpTo = store.state.receipts.filter((x) => x.invoiceId === inv.id && x.date <= r.date).reduce((a, x) => a + x.amount, 0);
  return `<div class="doc">${head('PAYMENT RECEIPT', r.id, r.date)}
  <div class="doc-body">
    <div style="background:#f7f3ea;padding:16px"><div style="color:#99783c;font-size:11px;font-weight:700">RECEIVED FROM</div><b style="font-size:19px">${esc(c.name)}</b><div>${esc(c.phone)}</div></div>
    <table><tbody>
      <tr><td>Invoice number</td><td class="r">${inv.id}</td></tr>
      <tr><td>Installment / نوع الدفعة</td><td class="r">${r.installment ? 'Second payment / الدفعة الثانية' : 'First payment / الدفعة الأولى'}</td></tr>
      <tr><td>Payment method</td><td class="r">${esc(r.method)}</td></tr>
      <tr><td>Payment date</td><td class="r">${r.date}</td></tr>
    </tbody></table>
    <div style="background:#171b20;color:#fff;padding:16px;display:flex;justify-content:space-between;align-items:center"><span>AMOUNT RECEIVED</span><b style="font-size:22px;color:#e4c17c">${m3(r.amount)} BHD</b></div>
    <div style="text-align:right">Remaining balance: <b>${m3(Math.max(0, inv.total - paidUpTo))} BHD</b></div>
  </div>${foot('This receipt confirms payment recorded by VENICE FURNITURE WORKSHOP W.L.L.')}</div>`;
}

export function printDoc(html) {
  const area = document.getElementById('print-area');
  area.innerHTML = html;
  document.body.classList.add('printing');
  setTimeout(() => { window.print(); }, 50);
}
export { balanceOf };
