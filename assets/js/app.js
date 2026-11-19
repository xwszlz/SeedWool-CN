/* SeedWool app.js — 渲染层。数据优先读页面内联 JSON，回退 fetch，未来切 API 只改 ADAPTER。 */
(function(){
  'use strict';

  var ADAPTER = {
    type: 'static',
    apiBase: '/api/v1',
    read: function(id){
      var el = document.getElementById('data-' + id);
      if (el) { try { return Promise.resolve(JSON.parse(el.textContent)); } catch(e){} }
      return fetch('/assets/data/' + id + '.json').then(function(r){ return r.json(); })
        .then(function(d){ return d && d.items ? d : d; });
    }
  };

  function $(s, r){ return (r||document).querySelector(s); }
  function $$(s, r){ return Array.prototype.slice.call((r||document).querySelectorAll(s)); }
  function esc(v){ return String(v==null?'':v).replace(/[&<>"']/g, function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }

  /* ---------- 导航 ---------- */
  var burger = $('.burger'), mnav = $('.mnav');
  if (burger && mnav) burger.addEventListener('click', function(){
    var open = mnav.classList.toggle('open');
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  /* ---------- 询盘弹层 ---------- */
  var mask = $('#inqMask');
  function openInquiry(sector){
    if (!mask) return;
    if (sector) {
      var f = $('#inqSector'); if (f) f.value = sector;
      var t = $('#inqTitle');
      if (t && t.dataset.tpl) t.textContent = t.dataset.tpl.replace('{s}', sector);
    }
    mask.classList.add('open');
    document.body.style.overflow = 'hidden';
    var a = mask.querySelector('.x'); if (a) a.focus();
  }
  function closeInquiry(){
    if (!mask) return;
    mask.classList.remove('open');
    document.body.style.overflow = '';
  }
  window.openInquiry = openInquiry; window.closeInquiry = closeInquiry;
  if (mask) {
    mask.addEventListener('click', function(e){ if (e.target === mask) closeInquiry(); });
    document.addEventListener('keydown', function(e){ if (e.key === 'Escape') closeInquiry(); });
  }
  document.addEventListener('click', function(e){
    var t = e.target.closest('[data-inq]');
    if (!t) return;
    e.preventDefault();
    openInquiry(t.getAttribute('data-inq') || '');
  });

  /* ---------- 占比条：只对 ledger=A 求和，必须 = 1.00 ---------- */
  function renderShare(){
    var host = $('#shareBar'); if (!host) return;
    ADAPTER.read('sectors').then(function(d){
      var items = (d.items || []).filter(function(s){
        return s.ledger === 'A' && s.status === 'published' && typeof s.share_target === 'number';
      }).sort(function(a,b){ return a.display_order - b.display_order; });
      if (!items.length) return;
      var sum = items.reduce(function(a,s){ return a + s.share_target; }, 0);
      if (Math.abs(sum - 1) > 0.001) {
        console.error('[SeedWool] share_target 合计 ' + sum + ' ≠ 1.00，拒绝渲染');
        host.innerHTML = '<span class="note">占比数据校验未通过，已停止渲染。</span>';
        return;
      }
      var colors = ['#2F7D58','#3D9970','#7FB89A','#B9D5C5'];
      host.innerHTML = '<div class="bar" role="img" aria-label="2029 年目标营收结构">' +
        items.map(function(s,i){
          return '<i style="width:' + (s.share_target*100) + '%;background:' + colors[i%4] + '"></i>';
        }).join('') + '</div>' +
        '<div class="bar-legend">' + items.map(function(s,i){
          return '<span><i class="dot" style="background:' + colors[i%4] + '"></i>' +
            esc(s.name) + ' ' + Math.round(s.share_target*100) + '%</span>';
        }).join('') + '</div>' +
        '<p class="note mt2">占比为 2029 年目标营收结构，非当期销量结构；建筑与工业岩棉单列核算，不并入此口径。</p>';
    }).catch(function(){ host.innerHTML = '<span class="note">占比数据暂不可用。</span>'; });
  }

  /* ---------- 产品卡 ---------- */
  function renderProducts(){
    var host = $('#prodList'); if (!host) return;
    var lang = document.documentElement.lang.indexOf('zh') === 0 ? 'zh' : 'en';
    ADAPTER.read('products').then(function(d){
      var items = (d.items || []).filter(function(p){ return p.status === 'published' && !p.deleted_at; });
      if (!items.length){ host.innerHTML = '<p class="note">产品数据待补。</p>'; return; }
      host.innerHTML = items.map(function(p){
        var name = lang === 'zh' ? p.name_zh : p.name_en;
        var spec = lang === 'zh' ? p.spec_zh : p.spec_en;
        var cta  = lang === 'zh' ? '咨询此型号' : 'Enquire about this model';
        return '<article class="card">' +
          '<div class="k mono">' + esc(p.form).toUpperCase() + '</div>' +
          '<h3 class="h3 mt2" style="font-size:17px">' + esc(name) + '</h3>' +
          '<p class="note mt2">' + esc(spec) + '</p>' +
          '<p class="note">' + (lang==='zh'?'适用：':'For: ') + esc(lang==='zh'?p.crops_zh:p.crops_en) + '</p>' +
          '<div class="spread" style="margin-top:12px;border-top:1px solid var(--line);padding-top:10px">' +
            '<span class="tag tag-line">' + (lang==='zh'?'价格面议':'Price on request') + '</span>' +
            '<a href="#" data-inq="' + esc(name) + '" class="btn-l">' + cta + ' →</a>' +
          '</div></article>';
      }).join('');
    }).catch(function(){ host.innerHTML = '<p class="note">产品数据暂不可用，请邮件联系我们。</p>'; });
  }

  /* ---------- 批次验真 ---------- */
  function bindVerify(){
    var form = $('#verifyForm'); if (!form) return;
    var input = $('#batchInput'), out = $('#vresult');
    var lang = document.documentElement.lang.indexOf('zh') === 0 ? 'zh' : 'en';
    var re = /^SW-\d{4}-\d{4}$/;
    form.addEventListener('submit', function(e){
      e.preventDefault();
      var code = (input.value || '').trim().toUpperCase();
      out.className = 'vresult show';
      if (!code){ out.innerHTML = '<div class="vmiss">' + (lang==='zh'?'请输入批次号。':'Please enter a batch code.') + '</div>'; return; }
      if (!re.test(code)){
        out.innerHTML = '<div class="vmiss">' + (lang==='zh'
          ? '格式不符。正确格式为 SW-YYYY-NNNN，例如 SW-2026-0001。'
          : 'Invalid format. Expected SW-YYYY-NNNN, e.g. SW-2026-0001.') + '</div>';
        return;
      }
      out.innerHTML = '<div class="vhit">' + (lang==='zh'?'查询中…':'Looking up…') + '</div>';
      ADAPTER.read('batches').then(function(d){
        var hit = (d.items || []).filter(function(b){ return b.batch_code === code; })[0];
        if (!hit){
          out.innerHTML = '<div class="vmiss"><strong>' + (lang==='zh'?'未查询到该批次':'Batch not found') + '</strong>' +
            '<p class="note mt2">' + (lang==='zh'
              ? '该批次号不在公开数据库中。请核对包装喷码，或邮件提供采购凭证，我们人工核验。'
              : 'This code is not in the public database. Check the package code, or email us with your purchase record for manual verification.') +
            '</p><a href="#" data-inq="' + (lang==='zh'?'批次验真':'Batch verification') + '" class="btn btn-s mt3">' +
            (lang==='zh'?'人工核验':'Request manual check') + '</a></div>';
          return;
        }
        var rows = lang === 'zh'
          ? [['产品', hit.product_zh], ['生产日期', hit.produced_at], ['产线', hit.line_zh], ['执行规程', hit.spec_zh]]
          : [['Product', hit.product_en], ['Produced', hit.produced_at], ['Line', hit.line_en], ['Protocol', hit.spec_en]];
        out.innerHTML = '<div class="vhit"><div class="spread"><strong class="mono">' + esc(hit.batch_code) + '</strong>' +
          '<span class="tag tag-now">' + (lang==='zh'?'已登记':'Registered') + '</span></div>' +
          '<table class="tb mt3"><tbody>' + rows.map(function(r){
            return '<tr><th scope="row" style="width:110px">' + esc(r[0]) + '</th><td>' + esc(r[1]) + '</td></tr>';
          }).join('') + '</tbody></table>' +
          '<p class="note mt3">' + (lang==='zh'
            ? '验真结果为批次登记信息，检测项与指标以随附检测报告为准。'
            : 'Verification returns batch registration data; test items and figures are per the accompanying test report.') + '</p></div>';
      }).catch(function(){
        out.innerHTML = '<div class="vmiss">' + (lang==='zh'?'查询服务暂不可用，请稍后重试或邮件联系。':'Lookup unavailable. Please retry later or email us.') + '</div>';
      });
    });
  }

  /* ---------- 咨询主题带入邮件 ---------- */
  function bindSectorSelect(){
    $$('[data-mail-sector]').forEach(function(a){
      a.addEventListener('click', function(){
        var s = a.getAttribute('data-mail-sector') || '';
        var base = a.getAttribute('data-mail') || '';
        if (!base) return;
        var sub = encodeURIComponent('[SeedWool] ' + s + ' — technical enquiry');
        a.href = 'mailto:' + base + '?subject=' + sub;
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function(){
    renderShare(); renderProducts(); bindVerify(); bindSectorSelect();
  });
})();
