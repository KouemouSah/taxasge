## Summary

<!-- Brief description of what this PR does and why -->

## Type

- [ ] Feature (new functionality)
- [ ] Fix (bug fix)
- [ ] Refactor (code improvement, no behavior change)
- [ ] Documentation
- [ ] Chore (dependencies, CI/CD, config)
- [ ] Test (adding or updating tests)

## Module(s) Affected

<!-- Check all that apply -->
- [ ] Backend API (`packages/backend/`)
- [ ] Frontend Web (`packages/web/`)
- [ ] Mobile App (`packages/mobile/`)
- [ ] Inspector App (`packages/inspector/`)
- [ ] Database Migrations
- [ ] CI/CD Workflows
- [ ] Documentation

## Changes

<!-- Bullet list of key changes -->
-
-
-

## Checklist

### Code Quality
- [ ] Code follows project conventions (Black/isort for Python, ESLint/Prettier for TS)
- [ ] No hardcoded strings in UI (all using i18n keys)
- [ ] No hardcoded values in queries (parameterized with $1, $2)
- [ ] No secrets or API keys committed

### Testing
- [ ] Backend: pytest tests pass
- [ ] Frontend: TypeScript type-check passes
- [ ] Frontend: ESLint passes with max 100 warnings
- [ ] Frontend: Production build succeeds
- [ ] i18n: Keys exist in all 3 languages (ES/FR/EN)

### Database (if applicable)
- [ ] Migration file included
- [ ] Migration tested on staging
- [ ] Schema changes documented
- [ ] No breaking changes to existing data

### Documentation (if applicable)
- [ ] API documentation updated
- [ ] README updated if needed
- [ ] Inline comments for complex logic

## Screenshots

<!-- Add screenshots for UI changes -->

## Breaking Changes

<!-- List any breaking changes and migration steps -->

None

## Related Issues

<!-- Link related issues: Fixes #123, Relates to #456 -->
