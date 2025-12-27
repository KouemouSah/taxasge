# Citizen Dashboard Feature Command

Create a new feature for the Citizen Dashboard following TaxasGE patterns.

## Context

**Citizen Dashboard** is for citizens to:
- Search and browse 850+ fiscal services
- Create and submit tax declarations
- Upload required documents
- Make payments via BANGE Mobile Money
- Track declaration status
- Download official receipts
- Chat with AI assistant for help
- View payment history

## Instructions

1. **Read DATABASE_SCHEMA_REFERENCE.md** for data structure
2. **Check existing modules** in `packages/web/src/modules/`
3. **Prioritize user experience** - simple, intuitive, multilingual
4. **Follow mobile-first design** - most citizens use smartphones

## Requirements

### Backend
- Create/enhance endpoints in respective API modules:
  - `fiscal_services.py` - Catalog search
  - `declarations.py` - Submit declarations
  - `documents.py` - Upload files
  - `payments.py` - BANGE integration
  - `chatbot.py` - AI assistant

### Frontend
- Create page in `packages/web/src/app/(dashboard)/{feature}/page.tsx`
- Implement **progressive disclosure** (show what's needed when needed)
- Add **step-by-step wizards** for complex processes
- Use **plain language** (avoid technical jargon)
- Support **3 languages**: Spanish (primary), French, English

### Key Features
```typescript
// Citizen-specific features
1. Service Catalog
   - Search by name, category, keywords
   - Filter by entity type, tax type
   - Show calculation examples
   - Display required documents
   - Multilingual service descriptions

2. Declaration Workflow
   - Select service type
   - Fill form (with inline help)
   - Upload documents
   - Review summary
   - Submit for processing
   - Track status

3. Payment
   - View amount due
   - Select payment method (BANGE)
   - Enter phone number
   - Confirm payment
   - Download receipt

4. Document Management
   - Upload PDFs, images
   - OCR extraction preview
   - Edit extracted data
   - Organize by declaration

5. AI Chatbot
   - Ask questions in natural language
   - Get service recommendations
   - Understand procedures
   - Multilingual support
```

## UI/UX Guidelines

- Use **large touch targets** (min 44x44px) for mobile
- Show **progress indicators** in multi-step flows
- Add **inline help text** and tooltips
- Display **examples and templates**
- Use **icons and visuals** to aid understanding
- Implement **smart defaults** in forms
- Show **real-time validation** feedback
- Add **success animations** on completion
- Use **plain language** error messages

## Accessibility Requirements

- WCAG 2.1 AA compliance
- Keyboard navigation support
- Screen reader friendly
- High contrast mode
- Text resizable to 200%
- ARIA labels on all interactive elements

## Multilingual Support

```typescript
// Use next-intl for translations
import { useTranslations } from 'next-intl';

function Component() {
  const t = useTranslations('Dashboard');

  return (
    <h1>{t('title')}</h1>
  );
}
```

## Mobile Optimization

- Responsive breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Touch-friendly spacing
- Bottom navigation for mobile
- Swipe gestures for lists
- Pull-to-refresh on data views
- Offline support (PWA)

## Checklist

- [ ] Backend API endpoints ready
- [ ] Frontend page/component created
- [ ] Multi-step wizard implemented (if applicable)
- [ ] Form validation with Zod
- [ ] Inline help and tooltips added
- [ ] Mobile responsive design verified
- [ ] 3 languages supported (ES/FR/EN)
- [ ] Accessibility tested (keyboard, screen reader)
- [ ] Loading states and error handling
- [ ] Success/error notifications
- [ ] Tests written (unit + E2E)
- [ ] PWA offline support (if applicable)
- [ ] Performance optimized (Lighthouse >85)
