# Admin Dashboard Feature Command

Create a new feature for the Admin Dashboard following TaxasGE patterns.

## Context

**Admin Dashboard** is for system administrators to:
- Manage users (CRUD operations)
- View analytics and statistics
- Generate reports
- Manage permissions and roles
- Monitor system health
- Review audit logs
- Manage fiscal services catalog

## Instructions

1. **Read DATABASE_SCHEMA_REFERENCE.md** for data structure
2. **Check existing admin components** in `packages/web/src/modules/admin/`
3. **Follow Next.js App Router** patterns
4. **Use shadcn/ui components** for consistency
5. **Implement RBAC** - verify admin permissions

## Requirements

### Backend
- Create API endpoint in `packages/backend/app/api/v1/admin.py`
- Add `@require_role("admin")` or `@require_permission("admin.{action}")` decorator
- Return paginated results for list endpoints
- Add filtering and sorting capabilities

### Frontend
- Create page in `packages/web/src/app/(dashboard)/admin/{feature}/page.tsx`
- Use **React Query** for data fetching
- Implement **loading states** and **error boundaries**
- Add **pagination** for lists
- Use **forms with react-hook-form + Zod validation**
- Add **confirmation dialogs** for destructive actions
- Implement **optimistic updates** where appropriate

### Components
```typescript
// Example structure
packages/web/src/modules/admin/
├── components/
│   ├── {feature}/
│   │   ├── {Feature}List.tsx      // List view with table
│   │   ├── {Feature}Form.tsx      // Create/Edit form
│   │   ├── {Feature}Details.tsx   // Detail view
│   │   └── {Feature}Actions.tsx   // Action buttons
│   └── shared/
│       ├── AdminHeader.tsx
│       ├── StatsCard.tsx
│       └── DataTable.tsx
├── hooks/
│   └── use{Feature}.ts            // React Query hooks
└── schemas/
    └── {feature}.schema.ts        // Zod validation schemas
```

## UI/UX Guidelines

- Use **DataTable** component for lists
- Show **loading skeletons** while data loads
- Display **toast notifications** for success/error
- Add **confirmation dialogs** for delete/disable actions
- Implement **search and filters** for large datasets
- Use **badge components** for status indicators
- Show **empty states** with helpful messages

## Checklist

- [ ] Backend API endpoint created
- [ ] Admin permission check added
- [ ] Frontend page created in app router
- [ ] React Query hooks implemented
- [ ] Form with Zod validation created
- [ ] Loading and error states handled
- [ ] Toast notifications added
- [ ] Confirmation dialogs for destructive actions
- [ ] Pagination implemented
- [ ] Search/filter functionality added
- [ ] Tests written (unit + E2E)
- [ ] Responsive design verified
- [ ] Accessibility checked (ARIA labels, keyboard nav)
