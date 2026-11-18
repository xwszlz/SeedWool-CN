/*
 * SeedWool 多语言路由 (lang.js)  v1.0  2026-11-17
 * ------------------------------------------------------------------
 * 目标：按「浏览器语言 + IP 国家」自动选择中文 / 英文版本，
 *       并提供手动切换按钮。两个版本同域名互跳，绝不跳到未部署的 seedwool.cn。
 *
 * 版本映射（唯一可信来源）：
 *   英文  ->  https://<当前域名>/            (index.html)
 *   中文  ->  https://<当前域名>/cn.html      (cn.html)
 *
 * 优先级：URL 参数(?lang=) > 用户手动选择(localStorage) > 自动判定(本会话一次)
 * 防循环：自动判定只写 sessionStorage；目标页看到标记/同语言即停，永不来回跳。
 * ------------------------------------------------------------------
 */
(function () {
  'use strict';

  var LANG_KEY = 'seedwool_lang';      // 用户手动选择（长期）
  var SESSION_KEY = 'seedwool_auto';   // 本会话自动判定标记（关标签页即失效）
  var ZH_PATH = '/cn.html';
  var EN_PATH = '/';
  var IP_API = 'https://ipapi.co/json/';
  var IP_TIMEOUT = 2500;               // IP 接口超时，超时即降级浏览器语言

  // ---------- 工具 ----------
  function currentLang() {
    return /^zh/i.test(document.documentElement.lang || '') ? 'zh' : 'en';
  }

  function targetPath(lang) {
    return lang === 'zh' ? ZH_PATH : EN_PATH;
  }

  // 只在不同语言时才跳转；用 replace 避免浏览器后退陷入死循环
  function go(lang) {
    if (lang !== currentLang()) {
      window.location.replace(targetPath(lang));
      return true;
    }
    return false;
  }

  function readStore(key, isSession) {
    try {
      var s = isSession ? window.sessionStorage : window.localStorage;
      return s.getItem(key);
    } catch (e) { return null; }
  }

  function writeStore(key, value, isSession) {
    try {
      var s = isSession ? window.sessionStorage : window.localStorage;
      s.setItem(key, value);
    } catch (e) { /* 隐私模式下存储不可用，静默降级 */ }
  }

  // 从 URL 读取显式语言参数 ?lang=zh / ?lang=en
  function langFromUrl() {
    var m = /[?&]lang=(zh|en)(?=&|#|$)/.exec(window.location.search);
    return m ? m[1] : null;
  }

  // 浏览器语言列表：任一以 zh 开头即判中文
  function langFromBrowser() {
    var list = navigator.languages && navigator.languages.length
      ? navigator.languages
      : [navigator.language || navigator.userLanguage || ''];
    for (var i = 0; i < list.length; i++) {
      if (/^zh/i.test(list[i])) return 'zh';
      if (/^en/i.test(list[i])) return 'en';
    }
    return null;
  }

  // IP 国家兜底：仅中国大陆(CN)判中文，其余判英文；失败返回 null 交给调用方降级
  function langFromIP(callback) {
    var settled = false;
    function done(lang) {
      if (settled) return;
      settled = true;
      callback(lang);
    }
    var timer = window.setTimeout(function () { done(null); }, IP_TIMEOUT);
    try {
      fetch(IP_API, { cache: 'no-store' })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (d) {
          window.clearTimeout(timer);
          var cc = d && (d.country_code || d.countryCode || '');
          done(String(cc).toUpperCase() === 'CN' ? 'zh' : 'en');
        })
        .catch(function () { window.clearTimeout(timer); done(null); });
    } catch (e) {
      window.clearTimeout(timer);
      done(null);
    }
  }

  // ---------- 手动切换按钮 ----------
  function bindToggle() {
    var btns = document.querySelectorAll('.lang-toggle');
    if (!btns.length) return;
    Array.prototype.forEach.call(btns, function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        var next = currentLang() === 'zh' ? 'en' : 'zh';
        writeStore(LANG_KEY, next, false);   // 手动选择长期记住，最高优先级
        writeStore(SESSION_KEY, '1', true);  // 同时封锁自动判定，防止跳回
        go(next);
      });
    });
  }

  // ---------- 主流程 ----------
  function init() {
    bindToggle();

    // 1) URL 显式参数最高优先级
    var urlLang = langFromUrl();
    if (urlLang) {
      writeStore(LANG_KEY, urlLang, false);
      writeStore(SESSION_KEY, '1', true);
      go(urlLang);
      return;
    }

    // 2) 用户手动选择
    var saved = readStore(LANG_KEY, false);
    if (saved === 'zh' || saved === 'en') {
      go(saved);
      return;
    }

    // 3) 本会话已自动判定过 -> 保持现状，绝不重复跳转
    if (readStore(SESSION_KEY, true) === '1') return;

    // 4) 自动判定：先打标记再判断，从根上杜绝循环
    writeStore(SESSION_KEY, '1', true);

    var browserLang = langFromBrowser();
    if (browserLang === 'zh') {          // 浏览器中文 -> 直接中文，不等 IP
      go('zh');
      return;
    }
    if (browserLang === 'en') {          // 浏览器英文 -> 查 IP 兜底
      langFromIP(function (ipLang) {
        go(ipLang === 'zh' ? 'zh' : 'en'); // IP 失败/超时 -> 保持英文
      });
      return;
    }
    // 语言未知 -> 查 IP，失败保持当前页
    langFromIP(function (ipLang) {
      if (ipLang) go(ipLang);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
