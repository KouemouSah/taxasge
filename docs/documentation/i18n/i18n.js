/**
 * Trilingual i18n runtime — Facil documentation (JSON-based)
 *
 * Strategy: a single HTML file per page, all translatable text marked with
 * `data-i18n="key.path"` attributes. Translations live in
 * `i18n/messages/<lang>.json`. On boot, this script:
 *   1. Detects the user's preferred language (localStorage → navigator → en).
 *   2. Fetches the matching JSON.
 *   3. Replaces every `[data-i18n]` element's text/HTML.
 *   4. Wires the language switcher in the sidebar header.
 *   5. Updates <html lang>, <title>, document.dir, etc.
 *
 * Convention:
 *   - `data-i18n="page.title"` → replaces textContent
 *   - `data-i18n-html="page.intro"` → replaces innerHTML (for rich content
 *     with <strong>, <code>, <a>, etc.)
 *   - `data-i18n-attr-title="key"` → replaces a specific attribute (title, alt, aria-label)
 *
 * Without JavaScript, pages render in their author's language (EN here) —
 * progressive enhancement, no broken state.
 */

(function () {
  'use strict';

  var SUPPORTED = ['en', 'fr', 'es'];
  var DEFAULT_LANG = 'en';
  var STORAGE_KEY = 'facil.docs.lang';
  var LANG_NAMES = { en: 'English', fr: 'Français', es: 'Español' };
  var LANG_LABELS = { en: 'EN', fr: 'FR', es: 'ES' };

  var messagesCache = {}; // lang → loaded JSON
  var currentLang = null;

  /** Look up a dotted key in a nested object. Returns undefined if missing. */
  function getByPath(obj, path) {
    if (!obj || !path) return undefined;
    var keys = path.split('.');
    var cur = obj;
    for (var i = 0; i < keys.length; i++) {
      if (cur === null || typeof cur !== 'object') return undefined;
      cur = cur[keys[i]];
    }
    return cur;
  }

  /** Get user preference: localStorage → navigator → fallback. */
  function preferredLang() {
    try {
      var stored = localStorage.getItem(STORAGE_KEY);
      if (stored && SUPPORTED.indexOf(stored) !== -1) return stored;
    } catch (e) { /* private mode etc. */ }
    var nav = (navigator.language || navigator.userLanguage || DEFAULT_LANG)
      .slice(0, 2).toLowerCase();
    return SUPPORTED.indexOf(nav) !== -1 ? nav : DEFAULT_LANG;
  }

  /** Persist chosen language. */
  function setPreferred(lang) {
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) { /* ignore */ }
  }

  /** Resolve a path relative to this script's directory. */
  function messagesUrl(lang) {
    // i18n.js is at docs/documentation/i18n/i18n.js → messages/ sibling
    var scripts = document.getElementsByTagName('script');
    for (var i = 0; i < scripts.length; i++) {
      var src = scripts[i].src || '';
      if (src.indexOf('i18n.js') !== -1 || src.indexOf('i18n/i18n.js') !== -1) {
        var dir = src.substring(0, src.lastIndexOf('/') + 1);
        return dir + 'messages/' + lang + '.json';
      }
    }
    return 'i18n/messages/' + lang + '.json';
  }

  /** Fetch translations for a language (with cache). */
  function loadMessages(lang) {
    if (messagesCache[lang]) return Promise.resolve(messagesCache[lang]);
    return fetch(messagesUrl(lang), { cache: 'force-cache' })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (json) {
        messagesCache[lang] = json;
        return json;
      })
      .catch(function (err) {
        console.warn('[i18n] failed to load', lang, err);
        // Fallback to EN if not already trying EN
        if (lang !== DEFAULT_LANG) return loadMessages(DEFAULT_LANG);
        return {};
      });
  }

  /** Apply translations to all [data-i18n*] elements. */
  function applyTranslations(messages) {
    // textContent
    var els = document.querySelectorAll('[data-i18n]');
    Array.prototype.forEach.call(els, function (el) {
      var key = el.getAttribute('data-i18n');
      var val = getByPath(messages, key);
      if (typeof val === 'string') el.textContent = val;
    });
    // innerHTML
    var elsHtml = document.querySelectorAll('[data-i18n-html]');
    Array.prototype.forEach.call(elsHtml, function (el) {
      var key = el.getAttribute('data-i18n-html');
      var val = getByPath(messages, key);
      if (typeof val === 'string') el.innerHTML = val;
    });
    // Attributes (data-i18n-attr-<attrname>="key")
    var elsAttr = document.querySelectorAll('*');
    Array.prototype.forEach.call(elsAttr, function (el) {
      var attrs = el.attributes;
      if (!attrs) return;
      for (var i = 0; i < attrs.length; i++) {
        var name = attrs[i].name;
        if (name.indexOf('data-i18n-attr-') === 0) {
          var attrName = name.substring('data-i18n-attr-'.length);
          var key = attrs[i].value;
          var val = getByPath(messages, key);
          if (typeof val === 'string') el.setAttribute(attrName, val);
        }
      }
    });
    // Page <title>
    var titleKey = document.documentElement.getAttribute('data-i18n-title');
    if (titleKey) {
      var t = getByPath(messages, titleKey);
      if (typeof t === 'string') document.title = t;
    }
  }

  /** Inject the language switcher into the sidebar header. */
  function injectSwitcher() {
    var header = document.querySelector('.sidebar-header');
    if (!header || header.querySelector('.lang-switch')) return;
    var html =
      '<div class="lang-switch" role="group" aria-label="Language">' +
      SUPPORTED.map(function (l) {
        return '<button type="button" class="lang-switch-btn" data-lang="' + l +
               '" aria-label="' + LANG_NAMES[l] + '" title="' + LANG_NAMES[l] +
               '">' + LANG_LABELS[l] + '</button>';
      }).join('') +
      '</div>';
    header.insertAdjacentHTML('beforeend', html);
    var btns = header.querySelectorAll('.lang-switch-btn');
    Array.prototype.forEach.call(btns, function (btn) {
      btn.addEventListener('click', function () {
        var lang = btn.dataset.lang;
        setPreferred(lang);
        switchLang(lang);
      });
    });
  }

  /** Update the active state on the switcher buttons. */
  function updateSwitcherActive(lang) {
    var btns = document.querySelectorAll('.lang-switch-btn');
    Array.prototype.forEach.call(btns, function (btn) {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });
  }

  /** Switch to a new language: load JSON, apply, update DOM lang. */
  function switchLang(lang) {
    if (SUPPORTED.indexOf(lang) === -1) lang = DEFAULT_LANG;
    return loadMessages(lang).then(function (messages) {
      currentLang = lang;
      document.documentElement.lang = lang;
      applyTranslations(messages);
      updateSwitcherActive(lang);
    });
  }

  function init() {
    injectSwitcher();
    var lang = preferredLang();
    switchLang(lang);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
