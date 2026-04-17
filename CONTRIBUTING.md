# Contributing to Facil

Thank you for your interest in the Facil platform. This is a proprietary project developed for the Government of Equatorial Guinea. Contributions are managed internally.

## For Authorized Contributors

### Prerequisites

- Node.js >= 20.0.0
- Python 3.11+
- PostgreSQL 15+ (via Supabase)
- npm (not yarn)

### Development Setup

```bash
# Clone the repository
git clone https://github.com/KouemouSah/taxasge.git
cd taxasge

# Frontend
npm install --legacy-peer-deps
cd packages/web && npm run dev

# Backend
cd packages/backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Git Workflow

#### Branch Naming

| Prefix | Usage | Example |
|--------|-------|---------|
| `feature/` | New features | `feature/bundle-payment-v2` |
| `fix/` | Bug fixes | `fix/receipt-entity-name` |
| `docs/` | Documentation | `docs/api-reference-update` |
| `refactor/` | Code refactoring | `refactor/auth-middleware` |
| `test/` | Test additions | `test/e2e-payment-flow` |

#### Commit Convention

```
<type>(<scope>): <subject>

Types: feat, fix, docs, style, refactor, test, chore
Scope: module name (auth, payments, chatbot, etc.)

Examples:
  feat(auth): add two-factor TOTP authentication
  fix(payments): correct bundle receipt entity name
  docs(api): update Swagger endpoint descriptions
  refactor(chatbot): migrate from TensorFlow to Gemini 2.5 Flash
```

### Code Style

| Language | Formatter | Linter | Config |
|----------|-----------|--------|--------|
| Python | Black | flake8 (max-line=100) | `pyproject.toml` |
| TypeScript | Prettier | ESLint | `.eslintrc.json` |
| SQL | - | - | Parameterized queries only |

### Pre-commit Checks

All commits must pass:
- **Backend**: `black --check`, `isort --check`, `flake8`
- **Frontend**: `eslint`, `prettier --check`, `tsc --noEmit`
- **i18n**: Key parity across ES/FR/EN translations

### Pull Request Process

1. Create a feature branch from `develop`
2. Implement changes with tests
3. Ensure all CI checks pass
4. Fill in the PR template completely
5. Request review from `@KouemouSah`
6. Squash and merge after approval

### Testing Requirements

- Backend: `pytest` with real database (no mocks for integration tests)
- Frontend: TypeScript type-check + ESLint + build verification
- i18n: All new UI strings must exist in `es.json`, `fr.json`, and `en.json`
- API: Test endpoints with proper authentication headers

### Internationalization (i18n)

Facil supports three languages: Spanish (primary), French, and English.

- All user-facing strings must use i18n keys
- Never hardcode text in components
- Run `npm run i18n:check` to verify key parity
- Translation files: `packages/web/src/i18n/messages/{es,fr,en}.json`

## Reporting Issues

- **Bugs**: Use the bug report issue template
- **Features**: Use the feature request issue template
- **Security**: See [SECURITY.md](SECURITY.md)

## License

This project is proprietary software. See [LICENSE](LICENSE) for details.
