/* ==========================================================================
   Facil Dashboard — Dynamic Data Layer
   Fetches from GitHub API with localStorage caching (5-min TTL)
   ========================================================================== */

(function () {
  'use strict';

  // ---------- Constants ----------
  const REPO_OWNER = 'KouemouSah';
  const REPO_NAME = 'taxasge';
  const API_BASE = 'https://api.github.com';
  const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  const CACHE_PREFIX = 'facil_dash_';

  // Workflow file names we track
  const TRACKED_WORKFLOWS = [
    { file: 'ci.yml', label: 'CI Tests' },
    { file: 'deploy-backend-staging.yml', label: 'Backend Staging' },
    { file: 'deploy-frontend-staging.yml', label: 'Frontend Staging' },
    { file: 'mobile-build.yml', label: 'Mobile Build' },
    { file: 'inspector-build.yml', label: 'Inspector Build' },
    { file: 'inspector-ci.yml', label: 'Inspector CI' }
  ];

  // ---------- Cache Helpers ----------
  function cacheGet(key) {
    try {
      const raw = localStorage.getItem(CACHE_PREFIX + key);
      if (!raw) return null;
      const entry = JSON.parse(raw);
      if (Date.now() - entry.ts > CACHE_TTL) {
        localStorage.removeItem(CACHE_PREFIX + key);
        return null;
      }
      return entry.data;
    } catch {
      return null;
    }
  }

  function cacheSet(key, data) {
    try {
      localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ ts: Date.now(), data: data }));
    } catch {
      // localStorage full or unavailable — silent fail
    }
  }

  // ---------- Fetch with Cache ----------
  async function fetchCached(key, url) {
    var cached = cacheGet(key);
    if (cached) return { data: cached, fromCache: true };

    var resp = await fetch(url, {
      headers: { 'Accept': 'application/vnd.github.v3+json' }
    });

    // Rate limited
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

  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  // ---------- DOM Helpers ----------
  function $(sel) { return document.querySelector(sel); }
  function $$(sel) { return document.querySelectorAll(sel); }

  function showRateLimit(container) {
    if (!container) return;
    container.innerHTML =
      '<div class="rate-limit-notice" role="alert">' +
        '<span aria-hidden="true">&#9888;</span> ' +
        'GitHub API rate limit reached (60 requests/hour for unauthenticated). ' +
        'Data will refresh automatically when the limit resets.' +
      '</div>';
  }

  // ---------- 1. Header Timestamp ----------
  function updateTimestamp() {
    var el = $('#last-updated');
    if (el) {
      el.textContent = 'Last updated: ' + new Date().toLocaleString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      });
    }
  }

  // ---------- 2. CI/CD Status ----------
  async function loadCIStatus() {
    var container = $('#ci-container');
    if (!container) return;

    try {
      // Fetch all workflows
      var result = await fetchCached('workflows',
        API_BASE + '/repos/' + REPO_OWNER + '/' + REPO_NAME + '/actions/workflows');
      var workflows = result.data.workflows || [];

      // Build a map: filename -> workflow
      var wfMap = {};
      workflows.forEach(function (wf) {
        // path is like ".github/workflows/ci.yml"
        var filename = wf.path.split('/').pop();
        wfMap[filename] = wf;
      });

      // For each tracked workflow, fetch latest run
      var html = '';
      var promises = TRACKED_WORKFLOWS.map(async function (tw) {
        var wf = wfMap[tw.file];
        if (!wf) {
          return {
            label: tw.label,
            status: 'unknown',
            statusText: 'Not found',
            date: ''
          };
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

      html = results.map(function (r) {
        return '<div class="ci-item animate-in">' +
          '<div class="ci-dot ' + r.status + '" aria-label="Status: ' + r.statusText + '"></div>' +
          '<div class="ci-info">' +
            '<div class="ci-name">' + r.label + '</div>' +
            '<div class="ci-status-text">' + r.statusText +
              (r.date ? ' &middot; ' + r.date : '') +
            '</div>' +
          '</div>' +
        '</div>';
      }).join('');

      container.innerHTML = html;
    } catch (e) {
      if (e.name === 'RateLimitError') {
        showRateLimit(container);
      } else {
        container.innerHTML = '<div class="loading-text">Unable to load CI status</div>';
        console.error('CI fetch error:', e);
      }
    }
  }

  // ---------- 3. Milestones ----------
  async function loadMilestones() {
    var container = $('#milestones-container');
    if (!container) return;

    // Try local JSON first
    var milestones = null;
    try {
      var localResp = await fetch('data/milestones.json');
      if (localResp.ok) {
        milestones = await localResp.json();
      }
    } catch { /* ignore */ }

    // Fallback to GitHub API
    if (!milestones) {
      try {
        var result = await fetchCached('milestones',
          API_BASE + '/repos/' + REPO_OWNER + '/' + REPO_NAME + '/milestones?state=all&sort=due_on&direction=asc&per_page=20');
        milestones = result.data.map(function (m) {
          var total = (m.open_issues || 0) + (m.closed_issues || 0);
          var pct = total > 0 ? Math.round((m.closed_issues / total) * 100) : 0;
          var state = m.state === 'closed' ? 'completed' :
                      pct > 0 ? 'in-progress' : 'planned';
          return {
            title: m.title,
            percent: pct,
            state: state,
            open: m.open_issues,
            closed: m.closed_issues,
            due: m.due_on
          };
        });
      } catch (e) {
        if (e.name === 'RateLimitError') {
          showRateLimit(container);
          return;
        }
        milestones = [];
      }
    }

    if (!milestones || milestones.length === 0) {
      container.innerHTML = '<div class="loading-text">No milestones found</div>';
      return;
    }

    container.innerHTML = milestones.map(function (m) {
      var colorClass = m.state === 'completed' ? 'completed' :
                       m.state === 'in-progress' ? 'in-progress' : 'planned';
      var pctColor = m.state === 'completed' ? 'color:var(--ge-green)' :
                     m.state === 'in-progress' ? 'color:var(--ge-blue)' :
                     'color:var(--text-muted)';
      var dueText = m.due ? new Date(m.due).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '';

      return '<div class="milestone-item animate-in">' +
        '<div class="milestone-header">' +
          '<span class="milestone-name">' + escapeHtml(m.title) + '</span>' +
          '<span class="milestone-pct" style="' + pctColor + '">' + m.percent + '%</span>' +
        '</div>' +
        '<div class="milestone-bar">' +
          '<div class="milestone-fill ' + colorClass + '" style="width:' + m.percent + '%"></div>' +
        '</div>' +
        '<div class="milestone-meta">' +
          '<span>' + (m.closed || 0) + ' closed / ' + (m.open || 0) + ' open</span>' +
          (dueText ? '<span>Due ' + dueText + '</span>' : '') +
        '</div>' +
      '</div>';
    }).join('');
  }

  // ---------- 4. Recent Commits ----------
  async function loadCommits() {
    var container = $('#commits-container');
    if (!container) return;

    try {
      var result = await fetchCached('commits',
        API_BASE + '/repos/' + REPO_OWNER + '/' + REPO_NAME + '/commits?per_page=5');
      var commits = result.data;

      if (!commits || commits.length === 0) {
        container.innerHTML = '<div class="loading-text">No commits found</div>';
        return;
      }

      container.innerHTML = '<ul class="commit-list" role="list">' +
        commits.map(function (c) {
          var msg = c.commit.message.split('\n')[0]; // first line only
          var author = (c.commit.author && c.commit.author.name) || 'Unknown';
          var date = c.commit.author ? c.commit.author.date : '';
          var sha = c.sha.substring(0, 7);

          return '<li class="commit-item animate-in">' +
            '<div class="commit-dot" aria-hidden="true"></div>' +
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
    } catch (e) {
      if (e.name === 'RateLimitError') {
        showRateLimit(container);
      } else {
        container.innerHTML = '<div class="loading-text">Unable to load recent commits</div>';
      }
    }
  }

  // ---------- 5. Issue Statistics ----------
  async function loadIssueStats() {
    var container = $('#issues-container');
    if (!container) return;

    try {
      // Fetch open and closed counts
      var openResult = await fetchCached('issues_open',
        API_BASE + '/repos/' + REPO_OWNER + '/' + REPO_NAME + '?per_page=1');
      var openCount = openResult.data.open_issues_count || 0;

      // For closed, we need to search
      var closedResult = await fetchCached('issues_closed',
        API_BASE + '/search/issues?q=repo:' + REPO_OWNER + '/' + REPO_NAME + '+type:issue+state:closed&per_page=1');
      var closedCount = closedResult.data.total_count || 0;

      var maxVal = Math.max(openCount, closedCount, 1);

      var openHeight = Math.max(Math.round((openCount / maxVal) * 100), 4);
      var closedHeight = Math.max(Math.round((closedCount / maxVal) * 100), 4);

      container.innerHTML =
        '<div class="issue-stats">' +
          '<div class="issue-bar-group">' +
            '<div class="issue-bar-container">' +
              '<div class="issue-bar open" style="height:' + openHeight + 'px" role="img" aria-label="Open issues: ' + openCount + '">' +
                '<span class="issue-bar-value">' + openCount + '</span>' +
              '</div>' +
            '</div>' +
            '<div class="issue-bar-label">Open</div>' +
          '</div>' +
          '<div class="issue-bar-group">' +
            '<div class="issue-bar-container">' +
              '<div class="issue-bar closed" style="height:' + closedHeight + 'px" role="img" aria-label="Closed issues: ' + closedCount + '">' +
                '<span class="issue-bar-value">' + closedCount + '</span>' +
              '</div>' +
            '</div>' +
            '<div class="issue-bar-label">Closed</div>' +
          '</div>' +
        '</div>';
    } catch (e) {
      if (e.name === 'RateLimitError') {
        showRateLimit(container);
      } else {
        container.innerHTML = '<div class="loading-text">Unable to load issue statistics</div>';
      }
    }
  }

  // ---------- Escape HTML ----------
  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ---------- Initialize ----------
  function init() {
    updateTimestamp();

    // Fire all data loads in parallel
    loadCIStatus();
    loadMilestones();
    loadCommits();
    loadIssueStats();
  }

  // Run when DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
