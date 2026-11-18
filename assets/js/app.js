/* SeedWool 交互：导航 / 询盘弹层 / 产品渲染 / 指标渲染 / 批次验真 / 证书放大 */
import { DataAdapter } from './data-adapter.js';
const LANG = document.documentElement.lang || 'zh';
const T = {
  zh: { mailto: '请注明产品规格、数量与所在地区', subject: '邮件主题建议', subjectTip: '"SeedWool 询盘 + 产品名称 + 所在地区"，便于快速匹配规格与报价。', close: '关闭', miss: '未查询到该批次。请核对批次号，或通过邮件联系我们核验。', hit: '查询命中（演示数据）', demo: '当前为工程示意数据，仅供演示；正式验真以权威检测报告为准。', loading: '查询中…', invalid: '批次号格式应为 SW-YYYYMMDD-XXX', noData: '数据暂不可用，请稍后重试或通过邮件联系我们。' },
  en: { mailto: 'Please include product spec, quantity and your region', subject: 'Subject suggestion', subjectTip: '"SeedWool Inquiry + Product + Region" helps us reply faster.', close: 'Close', miss: 'No matching batch. Please check the code or contact us by email.', hit: 'Match found (demo data)', demo: 'Engineering-illustrative demo data only; official verification requires a test report.', loading: 'Searching…', invalid: 'Format should be SW-YYYYMMDD-XXX', noData: 'Data unavailable. Please retry or contact us by email.' }
}[LANG] || {};

/* 移动端菜单 */
const menuBtn = document.querySelector('.menu-btn');
const mobileNav = document.getElementById('mobileNav');
if (menuBtn && mobileNav) menuBtn.addEventListener('click', () => mobileNav.classList.toggle('on'));

/* 询盘弹层：拦截所有带 data-inquiry 或询盘语义的可点击元素 */
function openInquiry() { document.getElementById('inqMask').classList.add('on'); }
function closeInquiry() { document.getElementById('inqMask').classList.remove('on'); }
window.openInquiry = openInquiry; window.closeInquiry = closeInquiry;
const mask = document.getElementById('inqMask');
if (mask) {
  mask.addEventListener('click', e => { if (e.target === mask) closeInquiry(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeInquiry(); });
}
document.addEventListener('click', e => {
  const el = e.target.closest('[data-inquiry],.inq-btn');
  if (!el) return;
  e.preventDefault();
  openInquiry();
});

/* 产品区：数据驱动渲染（当期 JSON，未来 API 零改页面） */
const productHost = document.getElementById('productHost');
if (productHost) {
  DataAdapter.getProducts().then(({ data }) => {
    const list = (data.items || []).filter(p => p.status === 'published' && !p.deleted_at);
    productHost.innerHTML = list.map(p => {
      const img = p.images && p.images[0] ? p.images[0] : 'assets/img/ali1.webp';
      const title = LANG === 'en' ? (p.title_en || p.title_zh) : p.title_zh;
      const summary = LANG === 'en' ? (p.summary_en || p.summary_zh) : p.summary_zh;
      const spec = Object.entries(p.specs || {}).map(([k, v]) => `${k} ${v}`).join(' · ');
      return `<article class="product"><picture><source srcset="${img.replace('.jpg','.webp')}" type="image/webp"><img src="${img}" alt="${title}" loading="lazy" decoding="async"></picture><div class="body"><h3>${title}</h3><div class="spec">${spec}</div><div class="spec">${summary}</div><div class="disclaimer">${p.disclaimer || ''}</div><button class="btn btn-outline inq-btn" type="button">${LANG === 'en' ? 'Request a quote' : '咨询报价'} →</button></div></article>`;
    }).join('');
  }).catch(() => {
    productHost.innerHTML = `<div class="notice">${T.noData || '数据暂不可用'}</div>`;
  });
}

/* 指标表格 */
const indicatorHost = document.getElementById('indicatorHost');
if (indicatorHost) {
  DataAdapter.getIndicators().then(({ data }) => {
    const rows = (data.items || []).filter(x => x.status === 'published' && !x.deleted_at);
    indicatorHost.innerHTML = `<div class="table-wrap"><table><thead><tr><th>${LANG === 'en' ? 'Code' : '编号'}</th><th>${LANG === 'en' ? 'Indicator' : '指标'}</th><th>${LANG === 'en' ? 'Value' : '数值'}</th><th>${LANG === 'en' ? 'Type' : '类型'}</th></tr></thead><tbody>${rows.map(r => `<tr><td class="code">${r.code}</td><td>${LANG === 'en' ? r.name_en || r.name_zh : r.name_zh}</td><td><b>${r.value}${r.unit || ''}</b></td><td>${r.value_type === 'measured' ? (LANG === 'en' ? 'Measured' : '实测') : (LANG === 'en' ? 'Illustrative*' : '工程示意*')}</td></tr>`).join('')}</tbody></table></div><div class="foot-note">* ${data.disclaimer || ''}</div>`;
  }).catch(() => { indicatorHost.innerHTML = `<div class="notice">${T.noData || '数据暂不可用'}</div>`; });
}

/* 批次验真 */
const verifyForm = document.getElementById('verifyForm');
if (verifyForm) {
  const input = document.getElementById('batchCode');
  const result = document.getElementById('verifyResult');
  verifyForm.addEventListener('submit', e => {
    e.preventDefault();
    const code = (input.value || '').trim().toUpperCase();
    result.className = 'verify-result'; result.textContent = '';
    if (!/^SW-\d{8}-\d{3}$/.test(code)) { result.className = 'verify-result miss'; result.textContent = T.invalid; return; }
    result.textContent = T.loading; result.style.display = 'block';
    DataAdapter.getBatches().then(({ data }) => {
      const hit = (data.items || []).find(b => b.batch_code === code && !b.deleted_at);
      result.style.display = '';
      if (!hit) { result.className = 'verify-result miss'; result.textContent = T.miss; return; }
      result.className = 'verify-result ok';
      result.innerHTML = `<b>${T.hit}：${hit.batch_code}</b><br>${LANG === 'en' ? 'Product' : '产品'}：${LANG === 'en' ? hit.product_en || hit.product : hit.product}<br>${LANG === 'en' ? 'Produced' : '生产日期'}：${hit.produced_at}<br>${T.demo}`;
    }).catch(() => { result.style.display = ''; result.className = 'verify-result err'; result.textContent = T.noData; });
  });
}

/* 证书点击放大 */
document.addEventListener('click', e => {
  const card = e.target.closest('.cert-card');
  if (!card) return;
  const img = card.querySelector('img');
  if (!img) return;
  const lb = document.getElementById('lightbox');
  if (!lb) return;
  lb.querySelector('img').src = img.currentSrc || img.src;
  lb.classList.add('on');
});
const lightbox = document.getElementById('lightbox');
if (lightbox) {
  lightbox.addEventListener('click', () => lightbox.classList.remove('on'));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') lightbox.classList.remove('on'); });
}
