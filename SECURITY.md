# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| develop (current) | Yes |
| main | Yes |

## Reporting a Vulnerability

The Facil platform handles sensitive government fiscal data. We take security seriously.

### How to Report

**DO NOT** create a public GitHub issue for security vulnerabilities.

Instead, please report security issues via email:

- **Email**: kouemou.sah@gmail.com
- **Subject**: `[SECURITY] Facil - Brief Description`

### What to Include

1. **Description** of the vulnerability
2. **Steps to reproduce** the issue
3. **Affected component** (backend API, frontend, mobile app, inspector app, database)
4. **Potential impact** assessment
5. **Suggested fix** (if any)

### Response Timeline

| Action | Timeline |
|--------|----------|
| Acknowledgment | 48 hours |
| Initial assessment | 5 business days |
| Fix development | Depends on severity |
| Security advisory | After fix deployment |

### Severity Classification

| Level | Description | Response |
|-------|-------------|----------|
| Critical | Data breach, auth bypass, SQL injection | Immediate hotfix |
| High | Privilege escalation, XSS, CSRF | Fix within 7 days |
| Medium | Information disclosure, DoS | Fix within 30 days |
| Low | Minor issues, hardening | Next release cycle |

## Scope

### In Scope
- Backend API (`packages/backend/`)
- Frontend web application (`packages/web/`)
- Mobile citizen application (`packages/mobile/`)
- Inspector field agent application (`packages/inspector/`)
- Database schemas and migrations
- Authentication and authorization flows
- Payment processing logic
- OCR document extraction pipeline

### Out of Scope
- Third-party services (Supabase, Firebase, Google Cloud Platform)
- Upstream dependencies (report to respective maintainers)
- Social engineering attacks
- Physical security

## Security Measures in Place

- JWT authentication with 2FA (TOTP)
- RBAC with 335 granular permissions across 47 roles
- Parameterized SQL queries (asyncpg) preventing SQL injection
- OWASP-compliant input validation
- Rate limiting on sensitive endpoints
- Audit logging on all critical operations
- Firebase signed URLs with 15-minute expiration
- bcrypt password hashing (12 rounds)
- CSP headers and XSS protection
