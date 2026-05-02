/**
 * Facil Direct — Looker Studio community connector (Phase B.1 skeleton)
 *
 * Reference: https://developers.google.com/looker-studio/connector/build
 *
 * What this implements:
 *   - getAuthType()       : USER_PASS (B.1 quick-start; B.2 will switch to OAUTH2)
 *   - validateCredentials : verify email + API key against Facil backend
 *   - getConfig()         : ask user for dashboard_id (drop-down)
 *   - getSchema()         : pull schema from backend GET /dashboards/<id>/schema
 *   - getData()           : pull rows from backend GET /dashboards/<id>/data
 *   - resetAuth()         : clear stored credentials
 *
 * Phase B.1 limitations (intentional):
 *   - One dashboard supported: 'recaudacion'
 *   - Backend endpoint returns full table (no RLS) — Phase B.2 adds ministry filter
 *   - 5-min connector cache (defaults match B.2 plan target)
 *
 * Phase B.2 will:
 *   - Switch authType -> OAUTH2 (against /api/v1/auth/oauth2/*)
 *   - Add ministry_id RLS in backend
 *   - Add per-user audit logging
 *
 * Deployment: see packages/looker-connector/README.md (deploy via `clasp push`).
 */

/* eslint-disable */

// ----------------------------------------------------------------------------
// Constants
// ----------------------------------------------------------------------------

var BACKEND_URL = 'https://taxasge-backend-staging-xrlbgdr5eq-uc.a.run.app';
var CACHE_TTL_SECONDS = 300;          // 5 min connector-side cache (Q5 default)

var DASHBOARDS = [
  { value: 'recaudacion', label: 'Recaudación Fiscal (Treasury)' },
  // B.3 will add: adopcion, agentes, services
];

// ----------------------------------------------------------------------------
// Auth — USER_PASS for B.1 (email + API key)
// ----------------------------------------------------------------------------

function getAuthType() {
  return DataStudioApp.createCommunityConnector()
    .newAuthTypeResponse()
    .setAuthType(DataStudioApp.createCommunityConnector().AuthType.USER_PASS)
    .setHelpUrl('https://www.taxasge.com/support/looker-connector')
    .build();
}

function isAuthValid() {
  var props = PropertiesService.getUserProperties();
  var email = props.getProperty('dscc.username');
  var apiKey = props.getProperty('dscc.password');
  if (!email || !apiKey) return false;
  return _ping(email, apiKey);
}

function setCredentials(request) {
  var creds = request.userPass;
  var ok = _ping(creds.username, creds.password);
  if (!ok) {
    return { errorCode: 'INVALID_CREDENTIALS' };
  }
  PropertiesService.getUserProperties()
    .setProperty('dscc.username', creds.username)
    .setProperty('dscc.password', creds.password);
  return { errorCode: 'NONE' };
}

function resetAuth() {
  PropertiesService.getUserProperties()
    .deleteProperty('dscc.username')
    .deleteProperty('dscc.password');
}

function _ping(email, apiKey) {
  try {
    var resp = UrlFetchApp.fetch(BACKEND_URL + '/api/v1/dashboards/_ping', {
      method: 'get',
      headers: _authHeaders(email, apiKey),
      muteHttpExceptions: true,
    });
    return resp.getResponseCode() === 200;
  } catch (e) {
    return false;
  }
}

function _authHeaders(email, apiKey) {
  // B.1: the user's "password" field in Looker Studio holds the Facil JWT.
  // We send it as a standard Bearer token so the existing backend auth
  // middleware (app.modules.auth.dependencies.get_current_user) accepts it
  // without forking a new auth path. X-Facil-Email is sent as a debug header
  // — the JWT subject is the authoritative identity, the email header is for
  // log readability when correlating with audit_logs.
  // B.2 will switch to OAUTH2: the connector exchanges a code for a fresh
  // access token, the backend issues + validates via its own /oauth2/* routes.
  return {
    'Authorization': 'Bearer ' + apiKey,
    'X-Facil-Email': email,
    'Accept': 'application/json',
  };
}

function _credentials() {
  var props = PropertiesService.getUserProperties();
  return {
    email: props.getProperty('dscc.username'),
    apiKey: props.getProperty('dscc.password'),
  };
}

// ----------------------------------------------------------------------------
// Configuration — user picks dashboard_id once per data source
// ----------------------------------------------------------------------------

function getConfig(request) {
  var cc = DataStudioApp.createCommunityConnector();
  var config = cc.getConfig();
  config
    .newSelectSingle()
    .setId('dashboard_id')
    .setName('Dashboard')
    .setHelpText('Pick the Facil dashboard whose data this source will expose.')
    .setIsDynamic(false);
  for (var i = 0; i < DASHBOARDS.length; i++) {
    config.getSelectSingle('dashboard_id')
      .addOption(cc.newOptionBuilder()
        .setLabel(DASHBOARDS[i].label)
        .setValue(DASHBOARDS[i].value));
  }
  config.setDateRangeRequired(true);
  return config.build();
}

// ----------------------------------------------------------------------------
// Schema — fetched from backend so we can update fields without redeploying
// ----------------------------------------------------------------------------

function getSchema(request) {
  var dashboardId = request.configParams.dashboard_id;
  var creds = _credentials();
  var resp = UrlFetchApp.fetch(
    BACKEND_URL + '/api/v1/dashboards/' + encodeURIComponent(dashboardId) + '/schema',
    {
      method: 'get',
      headers: _authHeaders(creds.email, creds.apiKey),
      muteHttpExceptions: true,
    }
  );
  if (resp.getResponseCode() !== 200) {
    cc().newUserError().setText('Cannot fetch schema (' + resp.getResponseCode() + '). Re-auth or contact ops.').throwException();
  }
  var body = JSON.parse(resp.getContentText());
  return { schema: body.schema };
}

// ----------------------------------------------------------------------------
// Data — fetched from backend, cached 5 min in connector
// ----------------------------------------------------------------------------

function getData(request) {
  var dashboardId = request.configParams.dashboard_id;
  var creds = _credentials();

  // Build params: requested fields + dateRange
  var fields = (request.fields || []).map(function (f) { return f.name; });
  var dr = request.dateRange || {};
  var params = [];
  if (fields.length) params.push('fields=' + encodeURIComponent(fields.join(',')));
  if (dr.startDate) params.push('start_date=' + encodeURIComponent(dr.startDate));
  if (dr.endDate) params.push('end_date=' + encodeURIComponent(dr.endDate));

  var url = BACKEND_URL + '/api/v1/dashboards/' + encodeURIComponent(dashboardId) + '/data'
            + (params.length ? '?' + params.join('&') : '');

  // Cache key includes auth user + dashboard_id + params (so two users in different
  // ministries do NOT share a cache entry)
  var cacheKey = 'facil:' + creds.email + ':' + dashboardId + ':' + (params.join('&') || 'no-params');
  var cache = CacheService.getUserCache();  // user-scoped, not script-scoped
  var cached = cache.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  var resp = UrlFetchApp.fetch(url, {
    method: 'get',
    headers: _authHeaders(creds.email, creds.apiKey),
    muteHttpExceptions: true,
  });
  if (resp.getResponseCode() === 401) {
    cc().newUserError().setText('Authentication expired. Click Reconnect.').throwException();
  }
  if (resp.getResponseCode() !== 200) {
    cc().newUserError().setText('Backend error ' + resp.getResponseCode() + '. Try again or contact ops.').throwException();
  }
  var body = JSON.parse(resp.getContentText());

  var result = {
    schema: body.schema,
    rows: body.rows,
    filtersApplied: body.filtersApplied || [],
  };

  // Cache result if small enough (Apps Script cache value max 100 KB / 12 hours)
  try {
    var serialized = JSON.stringify(result);
    if (serialized.length < 100000) {
      cache.put(cacheKey, serialized, CACHE_TTL_SECONDS);
    }
  } catch (e) {
    // cache failure is non-fatal
  }

  return result;
}

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

function cc() { return DataStudioApp.createCommunityConnector(); }

function isAdminUser() { return false; }   // controls "Debug" mode visibility
