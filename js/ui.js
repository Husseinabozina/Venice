import { icon } from './icons.js';

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const money = (n, unit = true) => `${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}${unit ? ' <span class="cur">د.ب</span>' : ''}`;
export const moneyShort = (n) => Math.round(Number(n || 0)).toLocaleString('en-US');
export const pct = (x) => `${Math.round(x * 100)}%`;

const MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
export function fmtDate(iso) {
  if (!iso) return '—';
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}
export function relDays(iso) {
  if (!iso) return '';
  const a = new Date(iso.slice(0, 10)); const b = new Date(new Date().toISOString().slice(0, 10));
  const d = Math.round((a - b) / 864e5);
  if (d === 0) return 'النهارده';
  if (d === 1) return 'بكرة';
  if (d === -1) return 'امبارح';
  if (d > 1) return `بعد ${d} أيام`;
  return `من ${-d} أيام`;
}
export const daysSince = (iso) => Math.round((new Date(new Date().toISOString().slice(0, 10)) - new Date(iso.slice(0, 10))) / 864e5);

const CHIPS = {
  draft: ['مسودة', 'neutral'], sent: ['اتبعت', 'info'], converted: ['اتحول لفاتورة', 'ok'], rejected: ['مرفوض', 'bad'],
  paid: ['مدفوعة', 'ok'], partial: ['مدفوعة جزئيًا', 'warn'], unpaid: ['غير مدفوعة', 'bad'],
  received: ['اتستلم', 'ok'], pending: ['معلّق', 'neutral'],
  present: ['حاضر', 'ok'], absent: ['غايب', 'bad'], leave: ['إجازة', 'warn'],
  low: ['إعادة طلب', 'bad'], okstock: ['متوفر', 'ok'], late: ['متأخر', 'bad'], done: ['اتسلّم', 'ok'],
};
export function chip(key, text) {
  const [label, tone] = CHIPS[key] || [key, 'neutral'];
  return `<span class="chip ${tone}">${esc(text || label)}</span>`;
}

// ---------- toast ----------
export function toast(msg, tone = 'ok') {
  const box = document.getElementById('toasts');
  const t = document.createElement('div');
  t.className = `toast ${tone}`;
  t.innerHTML = `${icon(tone === 'bad' ? 'alert' : 'check', 18)}<span>${msg}</span>`;
  box.appendChild(t);
  requestAnimationFrame(() => t.classList.add('in'));
  setTimeout(() => { t.classList.remove('in'); setTimeout(() => t.remove(), 300); }, 3200);
}

// ---------- modal ----------
let closeCurrent = null;
export function modal(title, body, { wide = false, onMount } = {}) {
  closeModal();
  const root = document.getElementById('modal-root');
  root.innerHTML = `<div class="overlay" data-close="1"><div class="modal ${wide ? 'wide' : ''}" role="dialog" aria-modal="true" aria-label="${esc(title)}">
    <div class="modal-head"><h3>${title}</h3><button class="icon-btn" data-close="1" aria-label="إغلاق">${icon('x', 18)}</button></div>
    <div class="modal-body">${body}</div></div></div>`;
  const ov = root.firstElementChild;
  requestAnimationFrame(() => ov.classList.add('in'));
  ov.addEventListener('click', (e) => { if (e.target.closest('[data-close]') && (e.target === ov || e.target.closest('.icon-btn'))) closeModal(); });
  closeCurrent = () => { root.innerHTML = ''; closeCurrent = null; };
  const first = ov.querySelector('input:not([type=hidden]),select,textarea,button.primary');
  if (first) setTimeout(() => first.focus(), 60);
  if (onMount) onMount(ov.querySelector('.modal'));
  return ov.querySelector('.modal');
}
export function closeModal() { if (closeCurrent) closeCurrent(); }
export function confirmBox(title, text, okLabel = 'تأكيد', tone = 'primary') {
  return new Promise((resolve) => {
    const m = modal(title, `<p class="muted" style="margin:0 0 18px">${text}</p>
      <div class="row end"><button class="btn ghost" data-no>إلغاء</button><button class="btn ${tone}" data-yes>${okLabel}</button></div>`);
    m.querySelector('[data-yes]').onclick = () => { closeModal(); resolve(true); };
    m.querySelector('[data-no]').onclick = () => { closeModal(); resolve(false); };
  });
}

export function formData(form) {
  const o = {};
  new FormData(form).forEach((v, k) => { o[k] = typeof v === 'string' ? v.trim() : v; });
  return o;
}
export function emptyState(ic, title, text, action = '') {
  return `<div class="empty">${icon(ic, 32)}<h4>${title}</h4><p>${text}</p>${action}</div>`;
}
export function downloadCSV(name, rows) {
  const csv = '﻿' + rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  a.download = name; document.body.appendChild(a); a.click(); a.remove();
}
