/* Facil Documentation Web - shared utilities
   Vanilla JS, no framework. Mermaid CDN handled by each page.
*/

(function () {
  'use strict';

  // ---------- DOM helpers ----------
  window.qs = function (sel, root) { return (root || document).querySelector(sel); };
  window.qsa = function (sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  };

  window.el = function (tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === 'className') node.className = attrs[k];
        else if (k === 'text') node.textContent = attrs[k];
        else if (k === 'html') node.innerHTML = attrs[k];
        else if (k.indexOf('data-') === 0) node.setAttribute(k, attrs[k]);
        else if (k === 'aria-pressed' || k === 'aria-label' || k === 'role') node.setAttribute(k, attrs[k]);
        else node[k] = attrs[k];
      });
    }
    if (children) {
      if (!Array.isArray(children)) children = [children];
      children.forEach(function (c) {
        if (c == null) return;
        if (typeof c === 'string') node.appendChild(document.createTextNode(c));
        else node.appendChild(c);
      });
    }
    return node;
  };

  // ---------- Data loaders (works offline file:// — inline JS globals + fetch fallback) ----------
  var _prdCache = null;
  var _bpmnCache = null;

  window.loadPRD = function () {
    if (_prdCache) return Promise.resolve(_prdCache);
    // Primary: inline global (works offline file://)
    if (window.PRD_DATA) { _prdCache = window.PRD_DATA; return Promise.resolve(_prdCache); }
    // Fallback: fetch JSON (HTTP server required)
    return fetch('assets/prd-data.json').then(function (r) {
      if (!r.ok) throw new Error('Failed to load prd-data.json: ' + r.status);
      return r.json();
    }).then(function (d) { _prdCache = d; return d; });
  };

  window.loadBPMN = function () {
    if (_bpmnCache) return Promise.resolve(_bpmnCache);
    if (window.BPMN_DATA) { _bpmnCache = window.BPMN_DATA; return Promise.resolve(_bpmnCache); }
    return fetch('assets/bpmn-data.json').then(function (r) {
      if (!r.ok) throw new Error('Failed to load bpmn-data.json: ' + r.status);
      return r.json();
    }).then(function (d) { _bpmnCache = d; return d; });
  };

  // ---------- Mermaid loader ----------
  // Render Mermaid diagram. Source can be:
  //   - workflow object with mermaid_content (inline, works file://)
  //   - string path to .mmd file (fetch fallback, needs HTTP server)
  window.loadMermaid = function (source, container) {
    function renderText(text) {
      container.innerHTML = '';
      var div = document.createElement('div');
      div.className = 'mermaid';
      div.textContent = text;
      container.appendChild(div);
      if (window.mermaid && typeof window.mermaid.run === 'function') {
        return window.mermaid.run({ nodes: [div] });
      } else if (window.mermaid && typeof window.mermaid.init === 'function') {
        window.mermaid.init(undefined, div);
      }
    }
    // Case 1: workflow object with inline mermaid_content (offline-friendly)
    if (source && typeof source === 'object' && source.mermaid_content) {
      try { renderText(source.mermaid_content); return Promise.resolve(); }
      catch (err) {
        container.innerHTML = '<div class="empty-state">Diagramme indisponible : ' + (err.message || err) + '</div>';
        return Promise.resolve();
      }
    }
    // Case 2: path string OR workflow with only mermaid_file (HTTP server required)
    var path = typeof source === 'string' ? source : (source && source.mermaid_file);
    if (!path) {
      container.innerHTML = '<div class="empty-state">Diagramme indisponible : ni contenu inline ni chemin .mmd fourni.</div>';
      return Promise.resolve();
    }
    return fetch(path).then(function (r) {
      if (!r.ok) throw new Error('Failed to load ' + path + ': ' + r.status);
      return r.text();
    }).then(renderText).catch(function (err) {
      container.innerHTML = '<div class="empty-state">Diagramme indisponible : ' + (err.message || err) + '</div>';
    });
  };

  // ---------- Sidebar toggle (mobile) ----------
  window.initSidebarToggle = function () {
    var btn = qs('.sidebar-toggle');
    var sidebar = qs('.sidebar');
    if (!btn || !sidebar) return;
    btn.addEventListener('click', function () {
      var open = sidebar.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    // Close sidebar on link click (mobile UX)
    qsa('.sidebar a').forEach(function (a) {
      a.addEventListener('click', function () {
        if (window.innerWidth <= 768) sidebar.classList.remove('open');
      });
    });
  };

  // ---------- Active nav highlighting ----------
  window.markActiveNav = function (currentPage) {
    qsa('.site-header nav a').forEach(function (a) {
      var href = a.getAttribute('href');
      if (href === currentPage) {
        a.classList.add('active');
        a.setAttribute('aria-current', 'page');
      }
    });
  };

  // ---------- Initialize Mermaid (one-time) ----------
  window.initMermaid = function () {
    if (window.mermaid && !window.__mermaidInited) {
      window.mermaid.initialize({
        startOnLoad: false,
        theme: 'default',
        flowchart: { useMaxWidth: true, htmlLabels: true, curve: 'basis' },
        sequence: { useMaxWidth: true },
        themeVariables: {
          primaryColor: '#1F4E79',
          primaryTextColor: '#FFFFFF',
          primaryBorderColor: '#163A5A',
          lineColor: '#4A5567',
          tertiaryColor: '#F5F7FA'
        }
      });
      window.__mermaidInited = true;
    }
  };

  // ---------- Persona helpers ----------
  window.personaBadge = function (personaId, personas) {
    var p = personas.find(function (x) { return x.id === personaId; }) || { name: personaId, id: personaId };
    return el('span', { className: 'badge', 'data-persona': personaId, text: p.name });
  };

  window.statusBadge = function (status) {
    var labels = { implemented: 'Implémenté', partial: 'Partiel', planned: 'Planifié' };
    var icons = { implemented: 'OK', partial: 'En cours', planned: 'Planifié' };
    return el('span', {
      className: 'status-badge ' + (status || 'planned'),
      text: labels[status] || status || 'Inconnu',
      'aria-label': 'Statut : ' + (labels[status] || status)
    });
  };

})();
