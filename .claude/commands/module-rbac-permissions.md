# RBAC Permissions Module Command

Implement or enhance the Role-Based Access Control (RBAC) system for fine-grained permissions.

## Context

**RBAC/Permissions Module** provides granular access control for TaxasGE:
- **Roles** (predefined: admin, supervisor, dgi_agent, etc.)
- **Permissions** (resource.action format: "assignment.create", "payments.confirm")
- **Role-Permission Mapping** (many-to-many)
- **User-Permission Overrides** (grant/revoke specific permissions)
- **Permission Decorators** (@require_permission, @require_any_permission, @require_all_permissions)
- **Critical Permissions** (special handling for sensitive operations)

## Existing Implementation

**Backend Module:** `packages/backend/app/modules/permissions/`

**Key Files:**
- `services/permission_service.py` - Permission checking logic
- `middleware/permission_middleware.py` - Route decorators
- `api/permission_routes.py` - Admin permission management
- `api/role_routes.py` - Role management
- `repositories/permission_repository.py` - Data access

**Database Schema:**
```sql
permissions:
  - id SERIAL PRIMARY KEY
  - name VARCHAR(100) UNIQUE -- "assignment.create"
  - resource VARCHAR(50) -- "assignment"
  - action VARCHAR(50) -- "create"
  - description TEXT
  - is_critical BOOLEAN -- Requires extra logging/approval

roles:
  - id SERIAL PRIMARY KEY
  - name VARCHAR(100) UNIQUE -- "dgi_agent"
  - description TEXT
  - is_system BOOLEAN -- Cannot be deleted

role_permissions:
  - role_id INTEGER FK → roles.id
  - permission_id INTEGER FK → permissions.id
  - PRIMARY KEY (role_id, permission_id)

user_permissions:
  - user_id UUID FK → users.id
  - permission_id INTEGER FK → permissions.id
  - granted BOOLEAN -- true=grant, false=revoke
  - granted_by UUID FK → users.id (admin who granted)
  - granted_at TIMESTAMP
  - expires_at TIMESTAMP (optional)
  - PRIMARY KEY (user_id, permission_id)
```

## Architecture

### Permission Naming Convention
Format: `{resource}.{action}`

**Examples:**
- `assignment.create` - Create manual assignment
- `assignment.reassign` - Reassign declaration
- `assignment.reassign_in_progress` - Reassign in-progress (critical)
- `payments.confirm` - Confirm bank payment (treasury only)
- `declarations.approve` - Approve declaration
- `declarations.reject` - Reject declaration
- `users.manage` - Manage user accounts
- `roles.assign` - Assign roles to users

### Permission Checking Flow
1. User makes request to protected endpoint
2. `@require_permission` decorator intercepts
3. Extract current_user from JWT
4. Call `permission_service.has_permission(user_id, permission_name)`
5. Check logic:
   a. Get user's role(s)
   b. Get all permissions for those roles
   c. Check user_permissions table for overrides (grants/revokes)
   d. Return True if permission found, False otherwise
6. If False: Raise 403 Forbidden
7. If True: Proceed with endpoint logic

### Role Hierarchy
```
admin (all permissions)
  └─ supervisor (manage team, escalations, reassign)
     ├─ dgi_agent (validate declarations)
     └─ ministry_agent (manage fiscal services)
  └─ treasury_agent (confirm payments only)
  └─ accountant (manage multiple companies)
  └─ business (manage own company)
  └─ citizen (submit declarations)
```

**Note:** This is a logical hierarchy, not enforced in database. Each role has specific permissions granted via role_permissions table.

## Instructions

### Step 1: Read Existing Implementation
```bash
Read packages/backend/app/modules/permissions/services/permission_service.py
Read packages/backend/app/modules/permissions/middleware/permission_middleware.py
Read packages/backend/app/modules/permissions/api/permission_routes.py
Read .github/docs-internal/database/DATABASE_SCHEMA_REFERENCE.md
```

### Step 2: Understand Permission System

**Current Usage Examples:**

**In routes (assignment_routes.py:149):**
```python
@router.post("/manual", response_model=Assignment)
@require_permission("assignment.create")
async def create_manual_assignment(
    request: ManualAssignmentRequest,
    current_user: UserResponse = Depends(get_current_user),
    permission_service: PermissionService = Depends(get_permission_service),
    service: AssignmentService = Depends(get_assignment_service_dep)
):
    # Only users with "assignment.create" permission can access
    ...
```

**Dynamic permission checking (assignment_routes.py:542):**
```python
# Check different permission based on assignment status
if assignment.status == "in_progress":
    has_critical_perm = await permission_service.has_permission(
        current_user.id,
        "assignment.reassign_in_progress"
    )
    if not has_critical_perm:
        raise HTTPException(status_code=403, detail="Critical permission required")
```

### Step 3: Use Subagents for Development

Launch 3 subagents in parallel for comprehensive RBAC features:

#### Subagent 1: Permission Registry & Initialization
```markdown
Task: Create permission registry and seeding system

Implement in packages/backend/app/modules/permissions/:

1. Permission Registry (services/permission_registry.py):
   - Centralized registry of all permissions
   - Auto-generate from code annotations
   - Validate permission names follow convention

   ```python
   PERMISSION_REGISTRY = {
       # Assignments
       "assignment.create": Permission(resource="assignment", action="create", ...),
       "assignment.reassign": Permission(resource="assignment", action="reassign", ...),
       "assignment.reassign_in_progress": Permission(
           resource="assignment",
           action="reassign_in_progress",
           is_critical=True,
           description="Reassign in-progress declaration (disrupts agent work)"
       ),

       # Payments
       "payments.confirm": Permission(
           resource="payments",
           action="confirm",
           is_critical=True,
           description="Confirm bank payment (treasury agent only)"
       ),

       # Declarations
       "declarations.approve": Permission(...),
       "declarations.reject": Permission(...),
       "declarations.close": Permission(...),

       # Users
       "users.create": Permission(...),
       "users.manage": Permission(...),
       "users.delete": Permission(is_critical=True, ...),

       # Roles
       "roles.assign": Permission(...),
       "roles.create": Permission(...),
   }
   ```

2. Seeding Script (scripts/seed_permissions.py):
   - Read PERMISSION_REGISTRY
   - Insert into permissions table (if not exists)
   - Update descriptions if changed
   - Report: new permissions added, updated, orphaned

3. Role-Permission Mapping (scripts/seed_role_permissions.py):
   - Define default permissions per role:
     - admin: ALL permissions
     - supervisor: assignment.*, escalation.*, reports.*
     - dgi_agent: declarations.*, assignment.view
     - ministry_agent: fiscal_services.*, assignment.view
     - treasury_agent: payments.confirm ONLY
     - accountant: companies.manage_multiple
     - business: companies.manage_own
     - citizen: declarations.submit
   - Insert into role_permissions table

4. Validation:
   - Check all @require_permission decorators reference valid permissions
   - Warn about unused permissions
   - Report missing permissions

Return: Permission registry, seeding scripts, validation tool
```

#### Subagent 2: Advanced Permission Features
```markdown
Task: Implement advanced permission features (conditions, time-based, resource-level)

Create in packages/backend/app/modules/permissions/:

1. Conditional Permissions:
   - Permission depends on context (e.g., "Can reassign if agent.ministry_id == declaration.ministry_id")
   - Add permission_conditions table:
     ```sql
     permission_conditions:
       - id SERIAL PRIMARY KEY
       - permission_id INTEGER FK → permissions.id
       - condition_type VARCHAR(50) -- "ministry_match", "role_match", "ownership"
       - condition_value JSONB -- {"field": "ministry_id", "operator": "equals"}
     ```
   - Implement condition evaluator
   - Example: Ministry-scoped permissions (supervisor can only manage agents in same ministry)

2. Time-Based Permissions:
   - Grant permission for limited time (e.g., temporary supervisor role)
   - Use user_permissions.expires_at field
   - Auto-revoke expired permissions (cron job)
   - Notification before expiration

3. Resource-Level Permissions:
   - Permission on specific resource instance (e.g., "Can edit declaration ID=123")
   - Add resource_permissions table:
     ```sql
     resource_permissions:
       - user_id UUID FK → users.id
       - resource_type VARCHAR(50) -- "declaration", "company", "assignment"
       - resource_id UUID
       - permission_name VARCHAR(100)
       - expires_at TIMESTAMP
     ```
   - Use case: Delegate specific declaration to external auditor

4. Permission Groups:
   - Logical grouping of permissions (e.g., "declarations_full" = approve + reject + close)
   - Add permission_groups table:
     ```sql
     permission_groups:
       - id SERIAL PRIMARY KEY
       - name VARCHAR(100) UNIQUE
       - description TEXT
     permission_group_members:
       - group_id INTEGER FK → permission_groups.id
       - permission_id INTEGER FK → permissions.id
     ```
   - Decorator: @require_permission_group("declarations_full")

Return: Conditional permissions, time-based, resource-level, permission groups
```

#### Subagent 3: RBAC Admin UI
```markdown
Task: Create admin UI for role and permission management

Create in packages/web/src/modules/admin/rbac/:

1. Components:
   - RoleList.tsx (list all roles with permission counts)
   - RoleEditor.tsx (create/edit role, assign permissions)
   - PermissionMatrix.tsx (visual grid: roles × permissions)
   - UserPermissions.tsx (view/override user permissions)
   - PermissionAuditLog.tsx (track permission changes)

2. Role Management (RoleList.tsx, RoleEditor.tsx):
   - List all roles (system + custom)
   - Create custom role
   - Assign permissions to role (multi-select)
   - Search permissions by resource or action
   - Show permission count per role
   - Delete custom roles (system roles protected)

3. Permission Matrix (PermissionMatrix.tsx):
   - Table: Rows = Permissions, Columns = Roles
   - Checkboxes for role-permission assignments
   - Color-coded:
     - Green: Permission granted
     - Red: Permission revoked (user override)
     - Gray: No permission
   - Filter by resource (show only "assignment.*")
   - Bulk assign (select multiple permissions + roles)

4. User Permission Overrides (UserPermissions.tsx):
   - Search user by email/name
   - Show user's role(s)
   - Show inherited permissions (from roles)
   - Grant additional permissions (green +)
   - Revoke specific permissions (red -)
   - Set expiration date for grants
   - Show audit trail (who granted, when)

5. Permission Audit Log (PermissionAuditLog.tsx):
   - List all permission changes:
     - Role-permission assignments
     - User-permission grants/revokes
     - Critical permission usage
   - Filter by: user, permission, date range
   - Export to CSV

6. Hooks:
   - useRoles() - Fetch all roles
   - usePermissions() - Fetch all permissions
   - useRolePermissions(roleId) - Get permissions for role
   - useUserPermissions(userId) - Get user overrides
   - useGrantPermission() - Grant to user
   - useRevokePermission() - Revoke from user

Return: Complete RBAC admin UI, permission matrix, audit log
```

## Key Features

### 1. Decorator-Based Authorization
- `@require_permission("resource.action")` - Single permission
- `@require_any_permission("perm1", "perm2")` - At least one
- `@require_all_permissions("perm1", "perm2")` - All required

### 2. Critical Permissions
- Marked with is_critical=True
- Require extra logging
- Show warning in UI
- May require approval workflow (future)

### 3. User Overrides
- Grant extra permission to user (beyond role)
- Revoke specific permission from user (despite role)
- Time-based grants (expires_at)

### 4. Audit Trail
- Track all permission changes
- Log critical permission usage
- Admin who granted/revoked
- Timestamp and reason

### 5. Dynamic Permission Checking
- Check inside route handler (not just decorator)
- Conditional logic based on business rules
- Example: Different permission for in-progress vs. pending

## Permission Categories

### Declarations
- `declarations.submit` - Submit new declaration
- `declarations.view` - View declaration details
- `declarations.approve` - Approve declaration (DGI agent)
- `declarations.reject` - Reject declaration
- `declarations.close` - Close declaration after payment

### Assignments
- `assignment.create` - Manual assignment (supervisor)
- `assignment.auto_assign` - Trigger auto-assignment
- `assignment.reassign` - Reassign pending declaration
- `assignment.reassign_in_progress` - Reassign in-progress (critical)
- `assignment.cancel` - Cancel assignment

### Payments
- `payments.confirm` - Confirm bank payment (treasury agent ONLY)
- `payments.view` - View payment details
- `payments.initiate` - Initiate payment (citizen)

### Fiscal Services
- `fiscal_services.create` - Create new service (ministry agent)
- `fiscal_services.edit` - Edit service
- `fiscal_services.deactivate` - Deactivate service

### Users
- `users.create` - Create new user (admin)
- `users.manage` - Edit user details
- `users.delete` - Delete user (critical)
- `users.assign_role` - Assign role to user

### Roles
- `roles.create` - Create custom role
- `roles.assign` - Assign permissions to role
- `roles.delete` - Delete custom role

## Testing Scenarios

### Permission Checking
1. DGI agent tries to access `/api/v1/assignments/manual` (create manual assignment)
2. Decorator checks: @require_permission("assignment.create")
3. DGI agent does NOT have "assignment.create" (only supervisors do)
4. Result: 403 Forbidden

### User Override Grant
1. Admin grants "assignment.reassign_in_progress" to supervisor Alice
2. Alice can now reassign in-progress declarations
3. Other supervisors cannot (do not have this critical permission)

### Time-Based Grant
1. Admin grants "declarations.approve" to external auditor Bob
2. Set expires_at = 7 days from now
3. Bob can approve declarations for 7 days
4. After expiration: Bob loses permission automatically

### Audit Trail
1. Admin views permission audit log
2. Sees: "Alice granted 'assignment.reassign_in_progress' by Admin John on 2025-01-15"
3. Sees: "Bob's 'declarations.approve' expired on 2025-01-22"

## Checklist

- [ ] Read existing RBAC implementation
- [ ] Understand permission decorator usage
- [ ] Create permission registry with all permissions
- [ ] Seed permissions table from registry
- [ ] Define default role-permission mappings
- [ ] Implement user permission overrides
- [ ] Add time-based permissions
- [ ] Create permission matrix UI
- [ ] Create user permission management UI
- [ ] Add audit logging for permission changes
- [ ] Test permission checking with different roles
- [ ] Verify critical permissions require extra logging
- [ ] Document permission naming convention
