/* ==========================================================================
   Facil Dashboard v2 — Dynamic Data Layer
   Fetches from GitHub API with localStorage caching (5-min TTL)
   ========================================================================== */

(function () {
  'use strict';

  // ---------- Constants ----------
  var REPO_OWNER = 'KouemouSah';
  var REPO_NAME = 'taxasge';
  var API_BASE = 'https://api.github.com';
  var CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  var CACHE_PREFIX = 'facil_dash_';

  // Workflow file names we track
  var TRACKED_WORKFLOWS = [
    { file: 'ci.yml', label: 'CI Tests' },
    { file: 'deploy-backend-staging.yml', label: 'Backend Staging' },
    { file: 'deploy-frontend-staging.yml', label: 'Frontend Staging' },
    { file: 'mobile-build.yml', label: 'Mobile Build' },
    { file: 'inspector-build.yml', label: 'Inspector Build' },
    { file: 'inspector-ci.yml', label: 'Inspector CI' }
  ];

  // Milestone progress data (known project state)
  var MILESTONE_DATA = [
    { key: 'infrastructure', name: 'M1 Infrastructure', icon: '\u2699', pct: 100, state: 'closed' },
    { key: 'backend',        name: 'M2 Backend',        icon: '\u2699', pct: 100, state: 'closed' },
    { key: 'frontend',       name: 'M3 Frontend',       icon: '\uD83C\uDF10', pct: 95,  state: 'closed' },
    { key: 'mobile',         name: 'M4 Mobile',         icon: '\uD83D\uDCF1', pct: 85,  state: 'open' },
    { key: 'ai_ocr',         name: 'M5 AI/OCR',         icon: '\uD83E\uDD16', pct: 90,  state: 'closed' },
    { key: 'bundle',         name: 'M6 Bundle',         icon: '\uD83D\uDCE6', pct: 75,  state: 'open' },
    { key: 'testing',        name: 'M7 Testing',        icon: '\uD83E\uDDEA', pct: 30,  state: 'open' },
    { key: 'production',     name: 'M8 Production',     icon: '\uD83D\uDE80', pct: 10,  state: 'open' },
    { key: 'csi',            name: 'M9 CSI',            icon: '\uD83D\uDCCB', pct: 0,   state: 'open' }
  ];

  // ---------- Cache Helpers ----------
  function cacheGet(key) {
    try {
      var raw = localStorage.getItem(CACHE_PREFIX + key);
      if (!raw) return null;
      var entry = JSON.parse(raw);
      if (Date.now() - entry.ts > CACHE_TTL) {
        localStorage.removeItem(CACHE_PREFIX + key);
        return null;
      }
      return entry.data;
    } catch (e) {
      return null;
    }
  }

  function cacheSet(key, data) {
    try {
      localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ ts: Date.now(), data: data }));
    } catch (e) {
      // localStorage full or unavailable
    }
  }

  // ---------- Fetch with Cache ----------
  async function fetchCached(key, url) {
    var cached = cacheGet(key);
    if (cached) return { data: cached, fromCache: true };

    var resp = await fetch(url, {
      headers: { 'Accept': 'application/vnd.github.v3+json' }
    });

    if (resp.status === 403 || resp.status === 429) {
      var remaining = resp.headers.get('X-RateLimit-Remaining');
      var resetEpoch = resp.headers.get('X-RateLimit-Reset');
      throw new RateLimitError(remaining, resetEpoch);
    }

    if (!resp.ok) throw new Error('GitHub API ' + resp.status);

    var data = await resp.json();
    cacheSet(key, data);
    return { data: data, fromCache: false };
  }

  function RateLimitError(remaining, resetEpoch) {
    this.name = 'RateLimitError';
    this.remaining = remaining;
    this.resetEpoch = resetEpoch;
    this.message = 'GitHub API rate limit reached';
  }
  RateLimitError.prototype = Object.create(Error.prototype);

  // ---------- Date formatting ----------
  function relativeTime(dateStr) {
    var now = Date.now();
    var then = new Date(dateStr).getTime();
    var diffSec = Math.floor((now - then) / 1000);

    if (diffSec < 60) return 'just now';
    if (diffSec < 3600) return Math.floor(diffSec / 60) + 'm ago';
    if (diffSec < 86400) return Math.floor(diffSec / 3600) + 'h ago';
    if (diffSec < 2592000) return Math.floor(diffSec / 86400) + 'd ago';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  // ---------- DOM Helpers ----------
  function $(sel) { return document.querySelector(sel); }

  function showRateLimit(container) {
    if (!container) return;
    container.innerHTML =
      '<div class="rate-limit-notice" role="alert">' +
        '<span aria-hidden="true">&#9888;</span> ' +
        'GitHub API rate limit (60 req/h). Auto-refreshes when reset.' +
      '</div>';
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ---------- Commit type detection ----------
  function getCommitType(msg) {
    if (!msg) return 'other';
    var lower = msg.toLowerCase();
    if (/^feat[\(:]/.test(lower)) return 'feat';
    if (/^fix[\(:]/.test(lower)) return 'fix';
    if (/^refactor[\(:]/.test(lower)) return 'refactor';
    if (/^chore[\(:]/.test(lower)) return 'chore';
    if (/^docs[\(:]/.test(lower)) return 'docs';
    if (/^test[\(:]/.test(lower)) return 'test';
    if (/^style[\(:]/.test(lower)) return 'style';
    return 'other';
  }

  // ---------- SVG Donut chart ----------
  function svgDonut(pct, size) {
    size = size || 48;
    var r = (size / 2) - 4;
    var circ = 2 * Math.PI * r;
    var offset = circ - (pct / 100) * circ;
    return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + ' ' + size + '">' +
      '<circle cx="' + (size/2) + '" cy="' + (size/2) + '" r="' + r + '" fill="none" stroke="var(--gray-200)" stroke-width="4"/>' +
      '<circle cx="' + (size/2) + '" cy="' + (size/2) + '" r="' + r + '" fill="none" stroke="var(--ge-green)" stroke-width="4" ' +
        'stroke-dasharray="' + circ + '" stroke-dashoffset="' + offset + '" ' +
        'transform="rotate(-90 ' + (size/2) + ' ' + (size/2) + ')" stroke-linecap="round"/>' +
      '<text x="' + (size/2) + '" y="' + (size/2) + '" text-anchor="middle" dominant-baseline="central" ' +
        'font-size="11" font-weight="700" fill="var(--text-primary)">' + pct + '%</text>' +
    '</svg>';
  }

  // ---------- 1. Header Timestamp ----------
  function updateTimestamp() {
    var el = $('#last-updated');
    if (el) {
      el.textContent = 'Updated: ' + new Date().toLocaleString('en-US', {
        month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    }
  }

  // ---------- 2. CI/CD Status ----------
  async function loadCIStatus() {
    var container = $('#ci-container');
    if (!container) return;

    try {
      var result = await fetchCached('workflows',
        API_BASE + '/repos/' + REPO_OWNER + '/' + REPO_NAME + '/actions/workflows');
      var workflows = result.data.workflows || [];

      var wfMap = {};
      workflows.forEach(function (wf) {
        var filename = wf.path.split('/').pop();
        wfMap[filename] = wf;
      });

      var promises = TRACKED_WORKFLOWS.map(async function (tw) {
        var wf = wfMap[tw.file];
        if (!wf) {
          return { label: tw.label, status: 'unknown', statusText: 'Not found', date: '' };
        }

        try {
          var runResult = await fetchCached('wf_run_' + wf.id,
            API_BASE + '/repos/' + REPO_OWNER + '/' + REPO_NAME +
            '/actions/workflows/' + wf.id + '/runs?per_page=1');
          var runs = runResult.data.workflow_runs || [];
          if (runs.length === 0) {
            return { label: tw.label, status: 'unknown', statusText: 'No runs', date: '' };
          }
          var run = runs[0];
          var status = run.conclusion || run.status;
          var mappedStatus = 'unknown';
          if (status === 'success') mappedStatus = 'success';
          else if (status === 'failure') mappedStatus = 'failure';
          else if (status === 'in_progress' || status === 'queued' || status === 'pending') mappedStatus = 'pending';

          var statusLabel = status === 'success' ? 'Passing' :
                            status === 'failure' ? 'Failing' :
                            status === 'in_progress' ? 'Running' :
                            status.charAt(0).toUpperCase() + status.slice(1);

          return {
            label: tw.label,
            status: mappedStatus,
            statusText: statusLabel,
            date: run.updated_at ? relativeTime(run.updated_at) : ''
          };
        } catch (e) {
          if (e.name === 'RateLimitError') throw e;
          return { label: tw.label, status: 'unknown', statusText: 'Error', date: '' };
        }
      });

      var results = await Promise.all(promises);

      container.innerHTML = results.map(function (r) {
        return '<div class="ci-item animate-in">' +
          '<div class="ci-dot ' + r.status + '" aria-label="' + r.statusText + '"></div>' +
          '<div class="ci-info">' +
            '<div class="ci-name">' + r.label + '</div>' +
            '<div class="ci-status-text">' + r.statusText +
              (r.date ? ' &middot; ' + r.date : '') +
            '</div>' +
          '</div>' +
        '</div>';
      }).join('');
    } catch (e) {
      if (e.name === 'RateLimitError') {
        showRateLimit(container);
      } else {
        container.innerHTML = '<div class="loading-text">Unable to load CI status</div>';
        console.error('CI fetch error:', e);
      }
    }
  }

  // ---------- 3. Milestones (compact 2-col grid) ----------
  function loadMilestones() {
    var container = $('#milestones-container');
    if (!container) return;

    container.innerHTML = MILESTONE_DATA.map(function (m) {
      var pctColor = m.state === 'closed' ? 'var(--ge-green)' :
                     m.pct >= 75 ? 'var(--ge-blue)' :
                     m.pct >= 30 ? '#B8860B' :
                     m.pct > 0  ? 'var(--ge-red)' : 'var(--text-muted)';
      var stateLabel = m.state === 'closed' ? 'Done' : (m.pct > 0 ? 'In Progress' : 'Planned');
      var stateClass = m.state === 'closed' ? 'done' : (m.pct > 0 ? 'progress' : 'planned');

      return '<div class="ms-card animate-in">' +
        '<div class="ms-left">' +
          '<span class="ms-icon" aria-hidden="true">' + m.icon + '</span>' +
          '<span class="ms-name">' + escapeHtml(m.name) + '</span>' +
        '</div>' +
        '<div class="ms-right">' +
          '<span class="ms-pct-circle" style="color:' + pctColor + '">' + m.pct + '%</span>' +
          '<span class="ms-badge ' + stateClass + '">' + stateLabel + '</span>' +
        '</div>' +
      '</div>';
    }).join('');

    // Build overall progress chart
    buildProgressChart();
  }

  // ---------- 3b. Overall Progress Mini-Rings ----------
  function buildProgressChart() {
    var overall = $('#overall-pct');
    var container = $('#progress-rings');
    if (!container) return;

    // Calculate overall average
    var total = 0;
    MILESTONE_DATA.forEach(function (m) { total += m.pct; });
    var avg = Math.round(total / MILESTONE_DATA.length);
    if (overall) overall.textContent = avg + '%';

    // Generate mini SVG rings for top 5 milestones
    var topItems = MILESTONE_DATA.slice(0, 5);
    container.innerHTML = topItems.map(function (m) {
      var r = 18;
      var circ = 2 * Math.PI * r;
      var offset = circ - (m.pct / 100) * circ;
      var color = m.state === 'closed' ? '#009A44' :
                  m.pct >= 75 ? '#0062A5' :
                  m.pct >= 30 ? '#B8860B' : '#D1D5DB';

      return '<div class="progress-ring-item">' +
        '<svg width="44" height="44" viewBox="0 0 44 44">' +
          '<circle cx="22" cy="22" r="' + r + '" fill="none" stroke="#E5E7EB" stroke-width="3"/>' +
          '<circle cx="22" cy="22" r="' + r + '" fill="none" stroke="' + color + '" stroke-width="3" ' +
            'stroke-dasharray="' + circ.toFixed(1) + '" stroke-dashoffset="' + offset.toFixed(1) + '" stroke-linecap="round"/>' +
          '<text x="22" y="22" text-anchor="middle" dominant-baseline="central" ' +
            'font-size="10" font-weight="700" fill="' + color + '" style="transform:rotate(90deg);transform-origin:center">' + m.pct + '</text>' +
        '</svg>' +
        '<span class="progress-ring-label">' + m.name.replace('M' + (MILESTONE_DATA.indexOf(m) + 1) + ' ', '') + '</span>' +
      '</div>';
    }).join('');
  }

  // ---------- 4. Recent Commits (with type colorization) ----------
  async function loadCommits() {
    var container = $('#commits-container');
    if (!container) return;

    try {
      var result = await fetchCached('commits',
        API_BASE + '/repos/' + REPO_OWNER + '/' + REPO_NAME + '/commits?per_page=30');
      var allCommits = result.data;

      if (!allCommits || allCommits.length === 0) {
        container.innerHTML = '<div class="loading-text">No commits found</div>';
        return;
      }

      // Show last 5 in the commit list
      var recentFive = allCommits.slice(0, 5);

      container.innerHTML = '<ul class="commit-list" role="list">' +
        recentFive.map(function (c) {
          var msg = c.commit.message.split('\n')[0];
          var author = (c.commit.author && c.commit.author.name) || 'Unknown';
          var date = c.commit.author ? c.commit.author.date : '';
          var sha = c.sha.substring(0, 7);
          var type = getCommitType(msg);

          return '<li class="commit-item animate-in">' +
            '<div class="commit-type-dot ' + type + '" aria-hidden="true" title="' + type + '"></div>' +
            '<div class="commit-body">' +
              '<div class="commit-msg" title="' + escapeHtml(msg) + '">' + escapeHtml(msg) + '</div>' +
              '<div class="commit-meta">' +
                '<span class="commit-sha">' + sha + '</span>' +
                '<span>' + escapeHtml(author) + '</span>' +
                (date ? '<span>' + relativeTime(date) + '</span>' : '') +
              '</div>' +
            '</div>' +
          '</li>';
        }).join('') +
      '</ul>';

      // Also build the activity chart from all 30 commits
      buildActivityChart(allCommits);
    } catch (e) {
      if (e.name === 'RateLimitError') {
        showRateLimit(container);
      } else {
        container.innerHTML = '<div class="loading-text">Unable to load commits</div>';
      }
    }
  }

  // ---------- 5. Weekly Activity Chart ----------
  function buildActivityChart(commits) {
    var container = $('#activity-chart-container');
    if (!container || !commits || commits.length === 0) return;

    // Group commits by week (last 4 weeks)
    var now = new Date();
    var weeks = [];
    for (var i = 0; i < 4; i++) {
      var weekEnd = new Date(now.getTime() - i * 7 * 86400000);
      var weekStart = new Date(weekEnd.getTime() - 7 * 86400000);
      weeks.push({
        start: weekStart,
        end: weekEnd,
        count: 0,
        label: weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      });
    }
    weeks.reverse();

    commits.forEach(function (c) {
      var commitDate = new Date(c.commit.author ? c.commit.author.date : c.commit.committer.date);
      for (var i = 0; i < weeks.length; i++) {
        if (commitDate >= weeks[i].start && commitDate < weeks[i].end) {
          weeks[i].count++;
          break;
        }
      }
    });

    var maxCount = Math.max.apply(null, weeks.map(function (w) { return w.count; }));
    if (maxCount === 0) maxCount = 1;

    container.innerHTML = '<div class="activity-bars">' +
      weeks.map(function (w) {
        var pct = Math.round((w.count / maxCount) * 100);
        if (w.count > 0 && pct < 5) pct = 5;
        return '<div class="activity-row">' +
          '<span class="activity-label">' + w.label + '</span>' +
          '<div class="activity-bar-track">' +
            '<div class="activity-bar-fill" style="width:' + pct + '%"></div>' +
          '</div>' +
          '<span class="activity-bar-count">' + w.count + '</span>' +
        '</div>';
      }).join('') +
    '</div>';
  }

  // ---------- 6. Issue Statistics (compact inline) ----------
  async function loadIssueStats() {
    var container = $('#issues-container');
    if (!container) return;

    try {
      var openResult = await fetchCached('issues_open',
        API_BASE + '/repos/' + REPO_OWNER + '/' + REPO_NAME + '?per_page=1');
      var openCount = openResult.data.open_issues_count || 0;

      var closedResult = await fetchCached('issues_closed',
        API_BASE + '/search/issues?q=repo:' + REPO_OWNER + '/' + REPO_NAME + '+type:issue+state:closed&per_page=1');
      var closedCount = closedResult.data.total_count || 0;

      var total = openCount + closedCount;
      var closedPct = total > 0 ? Math.round((closedCount / total) * 100) : 0;

      container.innerHTML =
        '<div class="issues-inline">' +
          '<div class="issue-stat">' +
            '<span class="issue-dot open"></span>' +
            '<div>' +
              '<div class="issue-count">' + openCount + '</div>' +
              '<div class="issue-label">Open</div>' +
            '</div>' +
          '</div>' +
          '<div class="issue-stat">' +
            '<span class="issue-dot closed"></span>' +
            '<div>' +
              '<div class="issue-count">' + closedCount + '</div>' +
              '<div class="issue-label">Closed</div>' +
            '</div>' +
          '</div>' +
          '<div class="issue-donut-wrap">' +
            svgDonut(closedPct, 52) +
          '</div>' +
        '</div>';
    } catch (e) {
      if (e.name === 'RateLimitError') {
        showRateLimit(container);
      } else {
        container.innerHTML = '<div class="loading-text">Unable to load issues</div>';
      }
    }
  }

  // ---------- Initialize ----------
  function init() {
    updateTimestamp();

    // Fire all data loads in parallel
    loadCIStatus();
    loadMilestones();
    loadCommits();     // also builds activity chart
    loadIssueStats();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
