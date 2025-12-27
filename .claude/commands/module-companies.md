# Company Management Module Command

Implement or enhance the company management system with multi-user collaboration.

## Context

**Companies Module** manages business entities with role-based membership:
- **Company CRUD** (create, update, archive companies)
- **Multi-User Management** (owner, admin, accountant, member roles)
- **Role Hierarchy** (owner > admin > accountant > member)
- **Tax ID Validation** (NIF format for Equatorial Guinea)
- **Company Metrics** (declarations count, payments total, member count)
- **Accountant Multi-Company** (accountants can manage multiple companies)
- **Member Invitations** (email-based invitation system)

## Existing Implementation

**Backend Module:** `packages/backend/app/modules/companies/`

**Key Files:**
- `services/company_service.py` - Business logic (tax ID validation, metrics)
- `services/membership_service.py` - Member management
- `api/company_routes.py` - Company CRUD endpoints
- `repositories/company_repository.py` - Data access
- `models/company.py` - Company models and enums

**Database Schema:**
```sql
companies:
  - id UUID PRIMARY KEY
  - name VARCHAR(200) NOT NULL
  - tax_id VARCHAR(50) UNIQUE NOT NULL -- "NIF-1234567"
  - email VARCHAR(255)
  - phone VARCHAR(20) -- (222|555|551|333)XXXXXX
  - address TEXT
  - city VARCHAR(100)
  - country VARCHAR(100) DEFAULT 'Equatorial Guinea'
  - registration_date DATE
  - primary_sector_id INTEGER FK → sectors.id
  - secondary_sectors INTEGER[] -- Array of sector IDs
  - is_active BOOLEAN DEFAULT true
  - created_at TIMESTAMP
  - updated_at TIMESTAMP
  - archived_at TIMESTAMP
  - archive_reason TEXT

user_company_roles:
  - user_id UUID FK → users.id
  - company_id UUID FK → companies.id
  - role VARCHAR(50) -- "company_owner", "company_admin", "company_accountant", "company_member"
  - joined_at TIMESTAMP
  - invited_by UUID FK → users.id
  - PRIMARY KEY (user_id, company_id)

company_invitations:
  - id UUID PRIMARY KEY
  - company_id UUID FK → companies.id
  - email VARCHAR(255)
  - role VARCHAR(50) -- Invited role
  - invited_by UUID FK → users.id
  - invited_at TIMESTAMP
  - expires_at TIMESTAMP -- 7 days
  - status VARCHAR(50) -- "pending", "accepted", "expired", "cancelled"
  - token VARCHAR(64) UNIQUE -- Invitation token
```

**Company Role Hierarchy:**
```
company_owner (creator, full control)
  └─ company_admin (manage members, declarations)
     └─ company_accountant (manage declarations, view financials)
        └─ company_member (view only, submit declarations)
```

## Architecture

### Role Permissions Matrix

| Action | Owner | Admin | Accountant | Member |
|--------|-------|-------|------------|--------|
| Create company | ✓ | ✗ | ✗ | ✗ |
| Edit company info | ✓ | ✓ | ✗ | ✗ |
| Delete/archive company | ✓ | ✗ | ✗ | ✗ |
| Invite members | ✓ | ✓ | ✗ | ✗ |
| Remove members | ✓ | ✓ (not owner/admin) | ✗ | ✗ |
| Change member roles | ✓ | ✓ (not owner/admin) | ✗ | ✗ |
| Submit declarations | ✓ | ✓ | ✓ | ✓ |
| Approve declarations (internal) | ✓ | ✓ | ✓ | ✗ |
| View financials | ✓ | ✓ | ✓ | ✗ |
| Manage payments | ✓ | ✓ | ✓ | ✗ |
| View declarations | ✓ | ✓ | ✓ | ✓ |

### Company Creation Flow
1. User clicks "Register Company"
2. Fill form: name, tax_id, email, phone, address, sector
3. Validate tax_id (NIF format, uniqueness)
4. Create company record
5. Create user_company_roles entry (role = "company_owner")
6. User becomes owner, can invite members

### Member Invitation Flow
1. Owner/Admin enters email + role
2. System creates company_invitations record
3. Generate unique token (64 chars)
4. Send email with invitation link: `/companies/accept-invitation?token={token}`
5. Invitee clicks link (must be logged in or register)
6. System validates token (not expired, not already accepted)
7. Create user_company_roles entry
8. Mark invitation as "accepted"

### Multi-Company Management (Accountants)
- Accountants can be members of MULTIPLE companies
- Each company has separate role (usually company_accountant)
- Dashboard shows all companies accountant manages
- Switch between companies (context switcher)
- View aggregated metrics across all companies

## Instructions

### Step 1: Read Existing Implementation
```bash
Read packages/backend/app/modules/companies/services/company_service.py
Read packages/backend/app/modules/companies/services/membership_service.py
Read packages/backend/app/modules/companies/api/company_routes.py
Read packages/backend/app/modules/companies/models/company.py
```

### Step 2: Understand Current Features

**Implemented:**
- [x] Company CRUD operations
- [x] Tax ID validation (basic)
- [x] Role-based authorization checks
- [x] Company metrics calculation (declarations, payments, members)
- [x] Multi-company support (user_company_roles table)

**Needs Implementation:**
- [ ] Member invitation system
- [ ] Email notifications (invitation, role change)
- [ ] Company dashboard (members list, activity feed)
- [ ] Member role management UI
- [ ] Company switching UI (for accountants)
- [ ] Company archiving workflow
- [ ] Advanced tax ID validation (NIF checksum)

### Step 3: Use Subagents for Development

Launch 3 subagents in parallel for comprehensive features:

#### Subagent 1: Member Invitation & Management System
```markdown
Task: Implement member invitation and role management system

Implement in packages/backend/app/modules/companies/:

1. Invitation API (api/invitation_routes.py):
   - POST /api/v1/companies/{company_id}/invitations
     - Create invitation
     - Require: owner or admin role
     - Validate: email format, not already member
     - Generate: unique token (secrets.token_urlsafe(48))
     - Set expires_at: 7 days from now
     - Send email via communications module
     - Return: invitation_id

   - GET /api/v1/companies/{company_id}/invitations
     - List pending invitations
     - Require: owner or admin
     - Filter by status (pending, accepted, expired)

   - DELETE /api/v1/companies/{company_id}/invitations/{id}
     - Cancel invitation
     - Require: owner or admin or inviter
     - Set status = "cancelled"

   - POST /api/v1/invitations/accept
     - Accept invitation (public endpoint)
     - Body: {token: string}
     - Validate: token exists, not expired, status = "pending"
     - Create user_company_roles entry
     - Set status = "accepted"
     - Notify inviter and company owner

   - POST /api/v1/invitations/resend/{id}
     - Resend invitation email
     - Extend expires_at by 7 days

2. Invitation Service (services/invitation_service.py):
   ```python
   class InvitationService:
       async def create_invitation(
           self,
           company_id: UUID,
           email: str,
           role: CompanyMemberRole,
           invited_by: UUID
       ) -> Invitation:
           # Validate email not already member
           # Generate token
           # Create invitation record
           # Send email
           pass

       async def accept_invitation(
           self,
           token: str,
           user_id: UUID
       ) -> CompanyMembership:
           # Validate token
           # Create user_company_roles
           # Mark accepted
           # Send notifications
           pass

       async def cleanup_expired_invitations(self):
           # Cron job: Mark expired invitations
           # Run daily
           pass
   ```

3. Email Templates (templates/company_invitation.html):
   - Subject: "You've been invited to join {company_name} on TaxasGE"
   - Body:
     - Company name and logo
     - Invited by (name + email)
     - Role being offered
     - Invitation link (with token)
     - Expiration warning (7 days)
     - Call-to-action button: "Accept Invitation"

4. Member Management API:
   - GET /api/v1/companies/{company_id}/members
     - List all members with roles
     - Include: user info, role, joined_at

   - PATCH /api/v1/companies/{company_id}/members/{user_id}/role
     - Change member role
     - Require: owner (any role) or admin (accountant/member only)
     - Validate: cannot demote owner, cannot self-demote

   - DELETE /api/v1/companies/{company_id}/members/{user_id}
     - Remove member
     - Require: owner (anyone except self) or admin (accountant/member only)
     - Soft delete: Just remove user_company_roles entry
     - Cannot remove last owner

5. Notifications:
   - Invitation sent: Email to invitee
   - Invitation accepted: Notify inviter + owner
   - Role changed: Notify affected user
   - Member removed: Notify removed user

Return: Complete invitation system, member management API
```

#### Subagent 2: Company Dashboard & Analytics
```markdown
Task: Create company dashboard with metrics and activity tracking

Implement in packages/backend/app/modules/companies/:

1. Dashboard API (api/company_routes.py):
   - GET /api/v1/companies/{company_id}/dashboard
     - Summary metrics:
       - Total declarations (by status)
       - Total payments (amount, by month)
       - Member count (by role)
       - Recent activity (last 30 days)
       - Pending tasks (declarations awaiting action)
     - Charts data:
       - Declarations over time (monthly)
       - Payment breakdown (by declaration type)
       - Compliance score (% declarations on time)

2. Metrics Service (services/metrics_service.py):
   ```python
   class CompanyMetricsService:
       async def get_declaration_metrics(
           self,
           company_id: UUID,
           period: str = "all"  # "month", "quarter", "year", "all"
       ) -> dict:
           # Count declarations by status
           # Total amount declared
           # Avg processing time
           # Success rate (approved / total)
           pass

       async def get_payment_metrics(
           self,
           company_id: UUID
       ) -> dict:
           # Total paid
           # Payment breakdown by type
           # Pending payments
           # Payment history (monthly)
           pass

       async def get_compliance_score(
           self,
           company_id: UUID
       ) -> dict:
           # % declarations submitted on time
           # % payments made on time
           # Penalties/fines count
           # Overall score (0-100)
           pass
   ```

3. Activity Feed (api/activity_routes.py):
   - GET /api/v1/companies/{company_id}/activity
     - Recent events (last 50):
       - Declaration submitted by {user}
       - Declaration approved by DGI
       - Payment made for declaration {id}
       - Member {user} joined
       - Company info updated by {user}
     - Pagination + filtering
     - Real-time updates (WebSocket)

4. Team Analytics:
   - GET /api/v1/companies/{company_id}/team/activity
     - Member activity breakdown:
       - Declarations submitted per member
       - Last activity date per member
       - Most active members (leaderboard)

5. Document Management:
   - GET /api/v1/companies/{company_id}/documents
     - List all company documents
     - Filter by: type, date range, declaration_id
     - Download bulk documents (ZIP)

Return: Dashboard API, metrics service, activity feed
```

#### Subagent 3: Company Management UI
```markdown
Task: Create company management frontend interface

Create in packages/web/src/modules/companies/:

1. Components:
   - CompanyDashboard.tsx (main dashboard page)
   - CompanySettings.tsx (edit company info)
   - MemberList.tsx (list members with roles)
   - InviteMember.tsx (invitation form + modal)
   - PendingInvitations.tsx (list pending invitations)
   - CompanyMetrics.tsx (KPI cards + charts)
   - ActivityFeed.tsx (timeline of events)
   - CompanySwitcher.tsx (dropdown for accountants with multiple companies)

2. Company Dashboard (CompanyDashboard.tsx):
   - Hero section: Company name, tax_id, sector
   - Quick stats: Total declarations, total paid, members, compliance score
   - Recent activity feed (last 10 events)
   - Action buttons:
     - "New Declaration"
     - "Invite Member"
     - "View All Declarations"
     - "Company Settings"

3. Member Management (MemberList.tsx):
   - Table: Name | Email | Role | Joined Date | Actions
   - Role badge (color-coded: owner=gold, admin=blue, accountant=green, member=gray)
   - Actions dropdown:
     - Change role (select new role)
     - Remove member (with confirmation)
   - Invite button (opens modal)

4. Invitation System (InviteMember.tsx):
   - Form fields:
     - Email (with validation)
     - Role (select: admin, accountant, member)
     - Personal message (optional)
   - Submit → Show success: "Invitation sent to {email}"
   - List pending invitations below form
   - Resend/Cancel buttons per invitation

5. Company Switcher (CompanySwitcher.tsx):
   - Dropdown in header (for accountants)
   - List all companies user belongs to
   - Show role badge per company
   - Click company → Switch context
   - Store selected company_id in localStorage
   - All API calls include current company_id

6. Company Settings (CompanySettings.tsx):
   - Tabs:
     - General (name, email, phone, address)
     - Tax Info (tax_id, sector, registration_date)
     - Members (MemberList component)
     - Billing (future)
     - Danger Zone (archive company)
   - Save button with optimistic update
   - Archive confirmation dialog:
     - "Are you sure? This will hide the company but preserve data."
     - Require reason (select: closed business, duplicate, other)

7. Metrics & Charts (CompanyMetrics.tsx):
   - KPI Cards:
     - Total Declarations (with trend)
     - Total Paid (with monthly change)
     - Active Members
     - Compliance Score (circular progress)
   - Charts:
     - Line chart: Declarations over time (6 months)
     - Pie chart: Payment breakdown by type
     - Bar chart: Declarations by status

8. Hooks:
   - useCompany(companyId) - Fetch company details
   - useCompanyMembers(companyId) - Fetch members
   - useInviteMember() - Send invitation
   - useAcceptInvitation(token) - Accept invitation
   - useUpdateMemberRole() - Change role
   - useRemoveMember() - Remove member
   - useCompanyMetrics(companyId) - Fetch metrics
   - useActivityFeed(companyId) - Fetch activity

Return: Complete company management UI, member management, metrics dashboard
```

## Key Features

### 1. Role-Based Access Control
- 4 roles with hierarchical permissions
- Owner has full control
- Admin can manage members (except owner/admin)
- Accountant manages declarations/financials
- Member view-only + submit declarations

### 2. Member Invitation System
- Email-based invitations
- 7-day expiration
- Secure token generation
- Resend/cancel functionality
- Email notifications

### 3. Multi-Company Support
- Users can belong to multiple companies
- Different role per company
- Company switcher UI (accountants)
- Aggregated view (all companies dashboard)

### 4. Company Metrics
- Declarations count/status
- Total payments (amount + breakdown)
- Member activity tracking
- Compliance score (on-time submissions)

### 5. Tax ID Validation
- NIF format for Equatorial Guinea: "NIF-XXXXXXX"
- Uniqueness check
- Checksum validation (future)

### 6. Company Archiving
- Soft delete (preserve data)
- Reason tracking
- Restoration capability
- Archived companies hidden from normal views

## Use Cases

### Company Registration
1. Business user creates account (role = "business")
2. Clicks "Register Your Company"
3. Fills form: ABC Corp, NIF-1234567, abc@example.com, etc.
4. System validates NIF (unique, correct format)
5. Creates company + assigns user as owner
6. User redirected to company dashboard

### Member Invitation
1. Owner clicks "Invite Member"
2. Enters email: alice@example.com, role: accountant
3. System sends email to Alice
4. Alice clicks invitation link
5. Alice logs in (or registers)
6. Accepts invitation
7. Alice now has access to ABC Corp as accountant

### Role Change
1. Owner views members list
2. Clicks "Change Role" next to Bob (currently member)
3. Selects "company_admin"
4. Confirms
5. Bob notified: "Your role in ABC Corp changed to Admin"
6. Bob now has admin permissions

### Member Removal
1. Admin clicks "Remove" next to Carol (company_member)
2. Confirmation dialog: "Remove Carol from ABC Corp?"
3. Confirms
4. Carol removed from user_company_roles
5. Carol notified: "You've been removed from ABC Corp"
6. Carol loses access to company

### Multi-Company (Accountant)
1. Accountant Alice manages 5 companies
2. Dashboard shows all 5 companies
3. Alice clicks company switcher dropdown
4. Selects "ABC Corp"
5. Context switches to ABC Corp
6. All views now show ABC Corp data
7. Alice submits declaration for ABC Corp
8. Alice switches to "XYZ Ltd"
9. Now working on XYZ Ltd

## Testing Scenarios

### Happy Path
1. Create company with valid NIF
2. Invite accountant (Alice)
3. Alice accepts invitation
4. Alice submits declaration for company
5. Owner reviews and approves internally
6. Declaration sent to DGI

### Duplicate Tax ID
1. User tries to create company with NIF-1234567
2. System checks: NIF-1234567 already exists
3. Error: "This tax ID is already registered"
4. User must correct NIF

### Expired Invitation
1. Owner invites Bob (token expires in 7 days)
2. Bob receives email but doesn't act
3. 8 days later, Bob clicks link
4. System: "This invitation has expired. Ask your administrator to resend."
5. Owner clicks "Resend"
6. New email sent with fresh token

### Role Hierarchy
1. Admin Alice tries to remove Owner Bob
2. System blocks: "Admins cannot remove owners"
3. Admin Alice tries to change Owner Bob's role
4. System blocks: "Admins cannot change owner roles"

## Checklist

- [ ] Read existing companies module
- [ ] Understand role hierarchy and permissions
- [ ] Verify tax ID validation logic
- [ ] Implement invitation system (backend)
- [ ] Create invitation email template
- [ ] Add invitation acceptance endpoint
- [ ] Build member management API
- [ ] Create company dashboard UI
- [ ] Implement member list with role management
- [ ] Add invitation UI with pending list
- [ ] Create company switcher for multi-company
- [ ] Add company metrics and analytics
- [ ] Test invitation flow (send, accept, resend)
- [ ] Test role changes and authorization
- [ ] Verify multi-company context switching
- [ ] Add company archiving workflow
