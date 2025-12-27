# Audit Logs Module Command

Implement or enhance the audit logging system for security and compliance tracking.

## Context

**Audit Logs Module** tracks all critical actions and changes:
- **User Actions** (login, logout, password change, 2FA enable/disable)
- **Administrative Actions** (user creation, role assignment, permission grants)
- **Data Changes** (create, update, delete for sensitive entities)
- **Critical Operations** (payment confirmation, declaration approval, reassignment)
- **Security Events** (failed login attempts, permission denials, suspicious activity)
- **Compliance Tracking** (who did what, when, why)

## Existing Implementation

**Backend Module:** `packages/backend/app/modules/admin/`

**Key Files:**
- `services/audit_service.py` - Audit log creation and querying
- `api/audit_routes.py` - Audit log viewer API
- `repositories/audit_repository.py` - Data access

**Database Schema:**
```sql
audit_logs:
  - id UUID PRIMARY KEY
  - timestamp TIMESTAMP DEFAULT NOW()
  - user_id UUID FK → users.id -- Who performed action
  - action VARCHAR(100) -- "user.login", "declaration.approve", "payment.confirm"
  - resource_type VARCHAR(50) -- "user", "declaration", "payment", "company"
  - resource_id VARCHAR(100) -- ID of affected resource
  - details JSONB -- Additional context (before/after values, reason, etc.)
  - ip_address INET -- Client IP
  - user_agent TEXT -- Browser/client info
  - status VARCHAR(50) -- "success", "failure", "denied"
  - severity VARCHAR(20) -- "info", "warning", "critical"
  - session_id VARCHAR(100) -- Session identifier
```

**Audit Action Naming Convention:**
Format: `{resource}.{action}`

**Examples:**
- `user.login` - User logged in
- `user.logout` - User logged out
- `user.password_change` - Password changed
- `user.2fa_enable` - 2FA enabled
- `user.create` - User account created (by admin)
- `user.delete` - User account deleted
- `role.assign` - Role assigned to user
- `permission.grant` - Permission granted to user
- `declaration.submit` - Declaration submitted
- `declaration.approve` - Declaration approved by DGI agent
- `declaration.reject` - Declaration rejected
- `payment.confirm` - Payment confirmed by treasury agent
- `assignment.reassign` - Declaration reassigned
- `company.create` - Company created
- `company.update` - Company info updated

## Architecture

### Audit Log Levels (Severity)

**INFO** - Normal operations (non-sensitive)
- User login (successful)
- User logout
- Declaration viewed
- Document downloaded

**WARNING** - Important operations (needs tracking)
- Password changed
- 2FA disabled
- Company info updated
- Member role changed
- Assignment reassigned

**CRITICAL** - Sensitive operations (security/compliance)
- User account created/deleted
- Permission granted/revoked
- Payment confirmed (treasury agent)
- Declaration approved/rejected
- Critical permission used
- Failed login attempts (>3)
- Permission denied (403)

### Automatic Audit Logging

**Decorator-Based (for route handlers):**
```python
@router.post("/approve")
@audit_log(action="declaration.approve", severity="critical")
async def approve_declaration(
    declaration_id: UUID,
    current_user = Depends(get_current_user),
    request: Request
):
    # Decorator automatically logs:
    # - user_id (from current_user)
    # - action ("declaration.approve")
    # - resource_id (declaration_id)
    # - ip_address (from request)
    # - timestamp
    ...
```

**Manual Logging (for complex operations):**
```python
await audit_service.log(
    user_id=current_user.id,
    action="payment.confirm",
    resource_type="payment",
    resource_id=payment_id,
    details={
        "amount": payment.amount,
        "bank_transaction_id": payment.bank_transaction_id,
        "confirmation_notes": notes
    },
    severity="critical",
    ip_address=request.client.host
)
```

### Change Tracking (Before/After)

For UPDATE operations, store before/after values:
```python
# Get current state
before = await company_repo.get_by_id(company_id)

# Perform update
after = await company_repo.update(company_id, updated_data)

# Log with diff
await audit_service.log(
    action="company.update",
    resource_id=company_id,
    details={
        "before": {"name": before.name, "email": before.email},
        "after": {"name": after.name, "email": after.email},
        "changed_fields": ["name"]  # List of modified fields
    }
)
```

### Query & Analytics

**Common Queries:**
1. User activity: All actions by user_id
2. Resource history: All changes to specific resource
3. Action timeline: All instances of specific action
4. Failed attempts: status = "failure" or "denied"
5. Critical operations: severity = "critical"
6. Suspicious activity: Multiple failed logins, unusual patterns

## Instructions

### Step 1: Read Existing Implementation
```bash
Read packages/backend/app/modules/admin/services/audit_service.py
Read packages/backend/app/modules/admin/api/audit_routes.py
Read packages/backend/app/modules/admin/repositories/audit_repository.py
```

### Step 2: Understand Current Features

**Implemented:**
- [x] Basic audit log creation
- [x] Audit log repository (database access)
- [x] Audit log viewer API

**Needs Implementation:**
- [ ] Audit decorator for automatic logging
- [ ] Change tracking (before/after values)
- [ ] Retention policy (archive old logs)
- [ ] Audit log search and filtering
- [ ] Audit dashboard UI
- [ ] Anomaly detection (suspicious patterns)
- [ ] Compliance reports (export logs)
- [ ] Real-time alerts (critical actions)

### Step 3: Use Subagents for Development

Launch 3 subagents in parallel for comprehensive audit system:

#### Subagent 1: Enhanced Audit Service & Decorator
```markdown
Task: Create comprehensive audit logging service with automatic decorators

Implement in packages/backend/app/modules/admin/:

1. Audit Decorator (middleware/audit_middleware.py):
   ```python
   def audit_log(
       action: str,
       severity: str = "info",
       include_request_body: bool = False,
       include_response: bool = False
   ):
       """
       Decorator for automatic audit logging

       Usage:
           @router.post("/approve")
           @audit_log(action="declaration.approve", severity="critical")
           async def approve_declaration(...):
               ...
       """
       def decorator(func):
           @wraps(func)
           async def wrapper(*args, **kwargs):
               # Extract context
               current_user = kwargs.get('current_user')
               request = kwargs.get('request')

               # Execute function
               start_time = time.time()
               try:
                   result = await func(*args, **kwargs)
                   status = "success"
                   return result

               except HTTPException as e:
                   status = "failure" if e.status_code >= 500 else "denied"
                   raise

               finally:
                   # Log after execution
                   duration_ms = (time.time() - start_time) * 1000

                   await audit_service.log(
                       user_id=current_user.id if current_user else None,
                       action=action,
                       resource_type=action.split('.')[0],
                       resource_id=extract_resource_id(kwargs),
                       details={
                           "duration_ms": duration_ms,
                           "request_body": request.body() if include_request_body else None,
                           "response": result if include_response else None
                       },
                       ip_address=request.client.host,
                       user_agent=request.headers.get("user-agent"),
                       status=status,
                       severity=severity
                   )

           return wrapper
       return decorator
   ```

2. Change Tracking Service (services/change_tracker.py):
   ```python
   class ChangeTracker:
       async def track_change(
           self,
           entity_type: str,
           entity_id: str,
           before: dict,
           after: dict,
           user_id: UUID
       ):
           # Calculate diff
           changed_fields = []
           changes = {}

           for key in before.keys():
               if before[key] != after.get(key):
                   changed_fields.append(key)
                   changes[key] = {
                       "before": before[key],
                       "after": after[key]
                   }

           # Log change
           await audit_service.log(
               user_id=user_id,
               action=f"{entity_type}.update",
               resource_type=entity_type,
               resource_id=entity_id,
               details={
                   "changed_fields": changed_fields,
                   "changes": changes
               },
               severity="warning"
           )
   ```

3. Bulk Logging (for batch operations):
   ```python
   async def log_batch(
       self,
       logs: List[AuditLogEntry]
   ):
       # Insert multiple logs in single transaction
       # More efficient for bulk operations
       pass
   ```

4. Context Enrichment:
   - Add session_id (track user session)
   - Add request_id (correlate related actions)
   - Add ministry_id (for government agents)
   - Add company_id (for company actions)

5. Performance Optimization:
   - Async logging (don't block main request)
   - Batch inserts (queue logs, flush every 5 seconds)
   - Indexing (user_id, action, timestamp, resource_id)

Return: Audit decorator, change tracking, batch logging
```

#### Subagent 2: Audit Analytics & Anomaly Detection
```markdown
Task: Create audit analytics and anomaly detection system

Implement in packages/backend/app/modules/admin/:

1. Analytics Service (services/audit_analytics.py):
   ```python
   class AuditAnalyticsService:
       async def get_user_activity_summary(
           self,
           user_id: UUID,
           days: int = 30
       ) -> dict:
           # Total actions
           # Actions breakdown by type
           # Most common actions
           # Activity heatmap (by hour of day)
           pass

       async def get_system_activity_trends(
           self,
           days: int = 90
       ) -> dict:
           # Total actions per day
           # Critical actions count
           # Failed attempts count
           # Top 10 most active users
           pass

       async def get_resource_history(
           self,
           resource_type: str,
           resource_id: str
       ) -> List[AuditLog]:
           # All changes to specific resource
           # Ordered by timestamp DESC
           # Include user info
           pass
   ```

2. Anomaly Detection (services/anomaly_detector.py):
   ```python
   class AnomalyDetector:
       async def detect_suspicious_activity(self):
           # Rule-based detection:
           anomalies = []

           # 1. Multiple failed logins (>5 in 10 minutes)
           failed_logins = await self.check_failed_login_attempts()
           anomalies.extend(failed_logins)

           # 2. After-hours critical actions (payments/approvals outside business hours)
           after_hours = await self.check_after_hours_critical_actions()
           anomalies.extend(after_hours)

           # 3. Unusual action volume (user performs 10x normal actions)
           high_volume = await self.check_unusual_volume()
           anomalies.extend(high_volume)

           # 4. Permission escalation (user suddenly has admin permissions)
           escalation = await self.check_permission_changes()
           anomalies.extend(escalation)

           # 5. Repeated permission denials (user trying to access forbidden resources)
           denied_access = await self.check_repeated_denials()
           anomalies.extend(denied_access)

           # 6. Geographic anomaly (login from unusual location)
           geo_anomaly = await self.check_location_anomaly()
           anomalies.extend(geo_anomaly)

           return anomalies

       async def create_alert(
           self,
           anomaly_type: str,
           user_id: UUID,
           details: dict,
           severity: str = "high"
       ):
           # Create security alert
           # Notify admins via email/SMS
           # Log in security_alerts table
           pass
   ```

3. Compliance Reports (services/compliance_reports.py):
   - Generate audit reports for compliance:
     - All critical actions (last 90 days)
     - User access report (who accessed what)
     - Permission changes report
     - Failed access attempts
     - Data modifications (GDPR compliance)
   - Export to PDF, CSV, JSON
   - Scheduled reports (weekly, monthly)

4. Retention Policy (background job):
   ```python
   async def archive_old_logs():
       # Move logs older than 1 year to archive table
       # Keep critical logs for 7 years (compliance)
       # Delete info-level logs after 1 year
       pass
   ```

5. API Endpoints (api/audit_routes.py):
   - GET /api/v1/admin/audit/logs (with filters, pagination)
   - GET /api/v1/admin/audit/user/{user_id}/activity
   - GET /api/v1/admin/audit/resource/{type}/{id}/history
   - GET /api/v1/admin/audit/analytics/trends
   - GET /api/v1/admin/audit/anomalies
   - POST /api/v1/admin/audit/reports/generate

Return: Audit analytics, anomaly detection, compliance reports
```

#### Subagent 3: Audit Dashboard UI
```markdown
Task: Create comprehensive audit log viewer and analytics dashboard

Create in packages/web/src/modules/admin/audit/:

1. Components:
   - AuditLogViewer.tsx (main log viewer)
   - AuditLogFilters.tsx (advanced filtering)
   - AuditLogDetail.tsx (single log entry details)
   - UserActivityTimeline.tsx (user action timeline)
   - ResourceHistory.tsx (resource change history)
   - AnomalyAlerts.tsx (suspicious activity alerts)
   - AuditAnalytics.tsx (charts and metrics)

2. Audit Log Viewer (AuditLogViewer.tsx):
   - Table columns:
     - Timestamp (sortable)
     - User (name + avatar)
     - Action (badge with icon)
     - Resource (type + id, clickable link)
     - Status (success/failure/denied with color)
     - Severity (info/warning/critical badge)
     - Actions (view details, view resource)
   - Infinite scroll pagination
   - Real-time updates (new logs appear at top)
   - Click row → Expand details panel

3. Advanced Filters (AuditLogFilters.tsx):
   - Filter by:
     - Date range (date picker)
     - User (search/select)
     - Action (multi-select dropdown)
     - Resource type (select)
     - Status (success/failure/denied checkboxes)
     - Severity (info/warning/critical checkboxes)
     - IP address (text input)
   - Saved filter presets:
     - "Failed Logins"
     - "Critical Actions (Last 24h)"
     - "My Activity"
     - "Payment Confirmations"
   - Export filtered logs (CSV, JSON)

4. Log Detail Panel (AuditLogDetail.tsx):
   - Full log entry display:
     - Timestamp (with timezone)
     - User info (name, email, role)
     - Action description (human-readable)
     - Resource link (navigate to resource)
     - Details (JSON viewer with syntax highlighting)
     - IP address + location (geocoding)
     - User agent (browser + OS)
     - Session info
   - Related logs (same resource or session)
   - "View User Activity" button

5. User Activity Timeline (UserActivityTimeline.tsx):
   - Vertical timeline of user actions
   - Group by date
   - Icons for different action types
   - Color-coded by severity
   - Filter by action type
   - Show session boundaries
   - Export user activity report (PDF)

6. Resource History (ResourceHistory.tsx):
   - Show all changes to specific resource
   - Diff viewer (before vs. after)
   - Highlight changed fields
   - Show who made each change
   - Timeline visualization
   - Restore previous version (if supported)

7. Anomaly Alerts (AnomalyAlerts.tsx):
   - List of detected anomalies
   - Priority badges (high/medium/low)
   - Anomaly types:
     - 🔴 Multiple failed logins
     - 🟠 After-hours critical action
     - 🟡 Unusual action volume
     - 🔵 Repeated permission denials
   - Actions:
     - Investigate (view related logs)
     - Dismiss
     - Block user (if security threat)
   - Auto-refresh (check for new anomalies every 60 seconds)

8. Audit Analytics (AuditAnalytics.tsx):
   - KPI Cards:
     - Total actions (today)
     - Critical actions (last 24h)
     - Failed attempts (last 24h)
     - Active users (today)
   - Charts:
     - Line chart: Actions over time (last 30 days)
     - Bar chart: Top 10 most active users
     - Pie chart: Action breakdown by type
     - Heatmap: Activity by hour of day + day of week
     - Donut chart: Status distribution (success/failure/denied)

9. Hooks:
   - useAuditLogs(filters) - Fetch logs with filters
   - useUserActivity(userId) - User activity timeline
   - useResourceHistory(resourceType, resourceId) - Resource changes
   - useAnomalies() - Fetch anomaly alerts
   - useAuditAnalytics() - Fetch analytics data
   - useExportLogs(filters) - Export logs to CSV/JSON

Return: Complete audit log viewer UI, analytics dashboard, anomaly alerts
```

## Key Features

### 1. Automatic Logging
- Decorator-based (route-level)
- No manual logging code needed
- Consistent log structure
- Async/background processing

### 2. Change Tracking
- Before/after values
- Field-level diff
- User attribution
- Timestamp precision

### 3. Severity Levels
- INFO: Normal operations
- WARNING: Important changes
- CRITICAL: Sensitive operations
- Auto-escalation based on action

### 4. Anomaly Detection
- Failed login attempts
- After-hours critical actions
- Unusual action volume
- Permission escalation
- Repeated access denials
- Geographic anomalies

### 5. Compliance Reports
- Audit trail for regulators
- User access reports
- Permission change history
- Export to PDF/CSV
- Scheduled generation

### 6. Retention Policy
- Archive old logs (>1 year)
- Keep critical logs longer (7 years)
- Delete low-priority logs
- Comply with GDPR/data regulations

## Use Cases

### User Login Tracking
1. User logs in successfully
2. Audit log created:
   - action: "user.login"
   - user_id: {user_id}
   - ip_address: 192.168.1.100
   - status: "success"
3. Failed login attempt:
   - action: "user.login"
   - status: "failure"
   - details: {"reason": "invalid_password"}

### Critical Action: Payment Confirmation
1. Treasury agent confirms payment
2. Audit log created (via decorator):
   - action: "payment.confirm"
   - resource_id: {payment_id}
   - severity: "critical"
   - details: {"amount": 500000, "bank_transaction_id": "TXN123"}
3. Appears in critical actions dashboard

### Company Info Update (Change Tracking)
1. Owner changes company name
2. System captures before/after:
   - before: {"name": "ABC Corp"}
   - after: {"name": "ABC Corporation Ltd"}
3. Audit log:
   - action: "company.update"
   - details: {"changed_fields": ["name"], "changes": {...}}

### Anomaly Detection: Failed Logins
1. Attacker tries to brute-force user account
2. 10 failed login attempts in 5 minutes
3. Anomaly detector triggers alert
4. Admin notified: "Suspicious activity: Multiple failed logins for user alice@example.com from IP 203.0.113.5"
5. Admin blocks IP or disables account

### Compliance Report
1. Auditor requests "All payment confirmations (last quarter)"
2. Admin generates report via UI
3. System exports CSV:
   - Date | User | Action | Payment ID | Amount | Bank Txn ID
4. Report delivered to auditor

## Testing Scenarios

### Happy Path
1. User performs normal actions (login, submit declaration)
2. All actions logged automatically
3. Admin views audit logs
4. Sees complete timeline of user activity

### Failed Action
1. User tries to approve declaration without permission
2. System returns 403 Forbidden
3. Audit log created:
   - status: "denied"
   - action: "declaration.approve"
   - details: {"reason": "permission_denied"}

### Anomaly Detection
1. Attacker attempts brute-force
2. 15 failed logins in 10 minutes
3. Anomaly detector flags suspicious activity
4. Admin receives email alert
5. Admin blocks attacker IP

### Change History
1. Admin views company record
2. Clicks "View History"
3. Sees all changes with before/after values:
   - 2025-01-10: Name changed by Owner Alice
   - 2025-01-05: Email changed by Admin Bob
   - 2025-01-01: Company created by Owner Alice

## Checklist

- [ ] Read existing audit service
- [ ] Understand audit log schema
- [ ] Create audit decorator for automatic logging
- [ ] Implement change tracking (before/after)
- [ ] Add anomaly detection rules
- [ ] Create compliance report generator
- [ ] Build audit log viewer UI
- [ ] Add advanced filtering
- [ ] Create user activity timeline
- [ ] Add resource history viewer
- [ ] Implement anomaly alerts UI
- [ ] Create audit analytics dashboard
- [ ] Test automatic logging with decorators
- [ ] Verify anomaly detection triggers correctly
- [ ] Test compliance report generation
- [ ] Add retention policy (archive old logs)
