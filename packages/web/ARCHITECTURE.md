# TaxasGE Frontend Architecture

## Structure Finale (Next.js 14 App Router)

```
packages/web/
├── public/                          # Static assets
│   ├── logo.png
│   └── favicon.ico
├── src/
│   ├── app/                         # Next.js 14 App Router pages
│   │   ├── layout.tsx              # Main layout
│   │   ├── page.tsx                # Homepage
│   │   ├── auth/
│   │   │   └── page.tsx            # Unified auth page (login/register)
│   │   └── dashboard/
│   │       └── page.tsx            # Dashboard
│   ├── components/                 # React components
│   │   ├── ui/                     # shadcn/ui primitives
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   └── Footer.tsx
│   │   └── shared/
│   │       └── FloatingChatbot.tsx
│   ├── lib/                        # Core utilities
│   │   ├── api/
│   │   │   ├── client.ts           # Axios instance with interceptors
│   │   │   ├── auth.ts             # Auth endpoints
│   │   │   ├── profile.ts          # Profile endpoints
│   │   │   └── sessions.ts         # Session endpoints
│   │   ├── auth/
│   │   │   ├── storage.ts          # Token storage (localStorage)
│   │   │   └── utils.ts
│   │   ├── validations/
│   │   │   └── auth.ts             # Zod schemas
│   │   └── utils.ts                # General helpers (cn, etc.)
│   ├── types/                      # TypeScript definitions
│   │   ├── auth.ts                 # Auth types (aligned with backend)
│   │   └── tax.ts                  # Tax service types
│   ├── hooks/                      # Custom React hooks
│   │   └── use-toast.ts
│   └── styles/
│       └── globals.css
├── _delete/                        # Obsolete files (to be removed)
│   └── authApi-old.ts
├── .env.local
├── next.config.js
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

## Backend Integration

### API Client (Axios)
**File**: `src/lib/api/client.ts`

- Base URL: `https://taxasge-backend-staging-xrlbgdr5eq-uc.a.run.app/api/v1`
- Automatic token injection in headers
- Automatic token refresh on 401
- Error handling with queue system

### Endpoint Mapping

| Backend Endpoint | Frontend Function | Type Safety |
|-----------------|-------------------|-------------|
| POST /auth/login | authApi.login() | TokenResponse \| TwoFactorLoginResponse |
| POST /auth/login/2fa-verify | authApi.verify2FA() | TokenResponse |
| POST /auth/register | authApi.register() | TokenResponse |
| POST /auth/logout | authApi.logout() | LogoutResponse |
| POST /auth/password/reset/request | authApi.requestPasswordReset() | PasswordResetResponse |
| POST /auth/password/reset/confirm | authApi.confirmPasswordReset() | PasswordResetConfirmResponse |
| POST /auth/email/verify | authApi.verifyEmail() | EmailVerifyResponse |
| POST /auth/email/resend | authApi.resendEmailVerification() | EmailResendResponse |
| GET /auth/profile | profileApi.getProfile() | User |
| PUT /auth/profile | profileApi.updateProfile() | User |
| GET /auth/sessions | sessionsApi.getSessions() | Session[] |

## Type Safety

### Zero `any` Types
All types are strictly defined and aligned with backend Pydantic models:

- **User types**: `User`, `UserRole`, `UserStatus`, `UserProfile`
- **Auth types**: `LoginRequest`, `RegisterRequest`, `TokenResponse`, `TwoFactorLoginResponse`
- **Session types**: `Session`
- **Error handling**: `error: unknown` → `error instanceof Error` checks

### Backend Alignment
Frontend types in `src/types/auth.ts` are 100% aligned with:
- `packages/backend/app/models/user.py`
- `packages/backend/app/models/auth_models.py`
- `packages/backend/app/api/v1/auth.py`

## Key Features

### 1. Automatic Token Refresh
- Interceptor detects 401 responses
- Automatically calls `/auth/refresh`
- Queues failed requests and retries after refresh
- Redirects to login if refresh fails

### 2. Type-Safe API Calls
```typescript
// Login with full type safety
const result = await authApi.login({ email, password });

if ('requires_2fa' in result) {
  // TypeScript knows result is TwoFactorLoginResponse
  const { temp_token } = result;
} else {
  // TypeScript knows result is TokenResponse
  const { access_token, user } = result;
}
```

### 3. Error Handling
```typescript
try {
  await authApi.login(data);
} catch (error: unknown) {
  if (error instanceof Error) {
    toast({ description: error.message });
  }
}
```

## Standards Followed

- ✅ Next.js 14 App Router structure
- ✅ TypeScript strict mode
- ✅ Zero `any` types
- ✅ Axios for API calls (better than fetch)
- ✅ Automatic token management
- ✅ shadcn/ui components
- ✅ Tailwind CSS
- ✅ Zod validation
- ✅ 100% backend alignment

## Migration from Template

### Kept from Template
- UI components (shadcn/ui)
- Design system (colors, layouts)
- Component structure (Header, Footer, etc.)

### Adapted for TaxasGE
- API client (Axios with interceptors)
- All types (aligned with backend)
- Auth flow (added 2FA support)
- Error handling (proper TypeScript)

### Removed
- Template example files
- Mock APIs
- Incompatible types

## Testing

```bash
# Development
npm run dev

# Production build
npm run build

# Type check
npm run type-check

# Lint
npm run lint
```

## Environment Variables

```env
NEXT_PUBLIC_API_URL=https://taxasge-backend-staging-xrlbgdr5eq-uc.a.run.app
```

## Next Steps

1. Add more pages (profile, sessions, taxes)
2. Implement 2FA flow UI
3. Add email verification pages
4. Add password reset pages
5. Connect tax services endpoints
