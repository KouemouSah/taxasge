# Ministry Agent Dashboard Feature Command

Create features for the Ministry Agent Dashboard to manage fiscal services catalog.

## Context

**Ministry Agent Dashboard** is for ministry staff (MINISTRY_AGENT role) who:
- **MUST be attached to a ministry** (ministry_id required)
- **MUST have matricule** (employee number)
- Manage fiscal services catalog for their ministry
- Create/update/deactivate services
- Configure service templates and procedures
- Set prices and required documents
- Manage service categories and sectors
- Review service usage statistics

## User Profile Requirements

```sql
-- Ministry Agent account constraints
users:
  - role = 'ministry_agent'
  - matricule VARCHAR(50) UNIQUE NOT NULL  ✅ REQUIRED

ministry_agents:
  - user_id UUID (ministry_agent)
  - ministry_id INTEGER NOT NULL            ✅ REQUIRED
  - UNIQUE(user_id, ministry_id)
```

## Database Schema

### 850 Fiscal Services (846 active, 4 inactive)

```sql
fiscal_services:
  - id UUID
  - ministry_id INTEGER FK → ministries.id  ✅ Ministry-scoped
  - service_code VARCHAR(50) UNIQUE (e.g., "T-001")
  - name_es, name_fr, name_en (multilingual)
  - category_id INTEGER FK → categories.id
  - base_price DECIMAL(10,2)
  - is_active BOOLEAN
  - required_documents JSONB
  - procedure_steps_es/fr/en TEXT
  - processing_time_days INTEGER

ministries:
  - id SERIAL PRIMARY KEY
  - ministry_code VARCHAR(20) UNIQUE
  - name_es/fr/en
  - is_active BOOLEAN
```

**Ministry-Service Relationship:**
- Each service belongs to ONE ministry
- Agents can only edit services in their ministry
- Cross-ministry services require admin approval

## Existing Implementation

**Module:** `packages/backend/app/modules/fiscal_services/`

```bash
# Check existing routes
Read packages/backend/app/modules/fiscal_services/api/fiscal_service_routes.py
Read packages/backend/app/modules/fiscal_services/api/template_routes.py
```

## Instructions

### Step 1: Read Existing Code
```bash
Read packages/backend/app/modules/fiscal_services/
Read packages/backend/app/modules/homepage/  # Public catalog
Read .github/docs-internal/database/DATABASE_SCHEMA_REFERENCE.md
```

### Step 2: Use Subagents for Development

Launch 3 subagents for comprehensive implementation:

#### Subagent 1: Ministry-Scoped Service Management API
```markdown
Task: Create ministry-agent API for managing services in their ministry

Implement in packages/backend/app/modules/fiscal_services/api/:

1. GET /api/v1/ministry-agent/services
   - Filter: ministry_id = agent.ministry_id (automatic)
   - Include: inactive services (agents can see all)
   - Pagination + search
   - Stats: total, active, inactive, draft

2. POST /api/v1/ministry-agent/services
   - Create new service for agent's ministry
   - Validate: unique service_code within ministry
   - Set: ministry_id = agent.ministry_id (auto)
   - Multilingual support (ES/FR/EN)
   - Template selection (if applicable)
   - Return: created service

3. PUT /api/v1/ministry-agent/services/{id}
   - Validate: service belongs to agent's ministry
   - Update: name, description, price, documents, procedure
   - Version control: keep history in service_versions table
   - Audit: log changes
   - Return: updated service

4. DELETE /api/v1/ministry-agent/services/{id}
   - Soft delete: set is_active=false
   - Validate: no active payments/declarations using this service
   - Check: replacement service suggested (redirect_to_service_id)
   - Notify: users with saved favorites
   - Return: deletion confirmation

5. POST /api/v1/ministry-agent/services/{id}/activate
   - Reactivate inactive service
   - Validate: all required fields present
   - Check: no duplicate active service with same code
   - Return: activated service

**Ministry Filter (automatic):**
```python
async def get_current_ministry(
    current_user = Depends(get_current_user),
    db = Depends(get_database)
) -> int:
    # Get ministry_id from ministry_agents table
    query = "SELECT ministry_id FROM ministry_agents WHERE user_id = $1"
    ministry_id = await db.fetchval(query, current_user['sub'])
    if not ministry_id:
        raise HTTPException(403, "Agent not assigned to ministry")
    return ministry_id
```

Return: API endpoints with ministry filtering logic
```

#### Subagent 2: Service Template & Document Management
```markdown
Task: Create template and required documents management

Implement:

1. GET /api/v1/ministry-agent/templates
   - List all document templates for ministry services
   - Filter by service type
   - Include: usage count, last updated
   - Return: templates list

2. POST /api/v1/ministry-agent/services/{id}/documents/required
   - Add required document to service
   - Fields: document_type, is_mandatory, description, template_url
   - Validate: document_type from predefined list
   - Return: updated required_documents JSONB

3. DELETE /api/v1/ministry-agent/services/{id}/documents/{doc_id}
   - Remove required document
   - Validate: service belongs to agent's ministry
   - Return: updated service

4. PUT /api/v1/ministry-agent/services/{id}/procedure
   - Update procedure steps (multilingual)
   - Rich text editor support (HTML)
   - Step numbering and ordering
   - Validation: min 1 step
   - Return: updated procedure

5. POST /api/v1/ministry-agent/services/{id}/preview
   - Generate preview of service page
   - Return: rendered HTML/JSON for preview

Return: Template management system
```

#### Subagent 3: Ministry Agent Dashboard UI
```markdown
Task: Create ministry agent dashboard for service catalog management

Create in packages/web/src/modules/ministry-agent/:

1. Components:
   - ServiceCatalogManager.tsx (main dashboard)
   - ServiceEditor.tsx (create/edit service form)
   - ServicePreview.tsx (preview before publish)
   - DocumentRequirements.tsx (manage required docs)
   - ProcedureEditor.tsx (step-by-step editor)
   - ServiceStats.tsx (usage analytics)
   - CategoryManager.tsx (if allowed)

2. Hooks:
   - useMinistryServices() - fetch services with filtering
   - useCreateService() - create new service
   - useUpdateService() - update service with optimistic update
   - useToggleServiceStatus() - activate/deactivate
   - useServiceTemplates() - fetch templates

3. Features:
   - Multi-tab editor (Basic Info, Pricing, Documents, Procedure, Preview)
   - Rich text editor for procedures (Tiptap or similar)
   - Drag-and-drop for procedure steps ordering
   - Document uploader for templates
   - Price calculator (base price + modifiers)
   - Multilingual input (tabs for ES/FR/EN)
   - Preview mode (shows citizen view)
   - Bulk operations (activate/deactivate multiple)
   - Usage analytics (charts with service popularity)

4. Validation:
   - Zod schemas for all forms
   - Unique service code within ministry
   - Min 1 procedure step
   - Price > 0 and <= max_price config
   - All required translations present

Return: Components created, UX flow, multilingual handling
```

## Key Features

### 1. Ministry Isolation
- Agents ONLY see/edit services from their ministry
- Cross-ministry operations require admin role
- Automatic ministry_id injection in all queries

### 2. Multilingual Support
- 3 languages: Spanish (primary), French, English
- All text fields have _es, _fr, _en variants
- Translation status indicators
- Fallback to Spanish if translation missing

### 3. Version Control
- Keep history of service changes
- Rollback capability
- Audit trail with user + timestamp
- Compare versions diff view

### 4. Document Templates
- Upload template files (PDF, DOCX)
- Mark as required or optional
- Preview template inline
- Download statistics

### 5. Service Status Lifecycle
```
draft → review → active → inactive → archived

- draft: Being created/edited
- review: Pending approval (future feature)
- active: Available to citizens
- inactive: Hidden but not deleted
- archived: Soft deleted with history
```

### 6. Usage Analytics
- View count per service
- Declaration count
- Revenue generated
- Popular time periods
- User demographics

## Public vs Ministry View

### Public Catalog (packages/backend/app/modules/homepage/)
- Shows only active services (is_active=true)
- Read-only
- No ministry identification exposed
- Optimized for search and browsing

### Ministry Dashboard (this module)
- Shows all services (active + inactive)
- Full CRUD operations
- Ministry-scoped automatically
- Version history
- Analytics

## Checklist

- [ ] Read existing fiscal_services module
- [ ] Understand ministry_agents table relationship
- [ ] Create ministry-scoped service API
- [ ] Implement document requirements management
- [ ] Create procedure editor
- [ ] Build service catalog manager UI
- [ ] Add multilingual input fields
- [ ] Implement version control
- [ ] Add usage analytics
- [ ] Test ministry isolation (cross-ministry access blocked)
- [ ] Verify soft delete behavior
- [ ] Test multilingual fallbacks
