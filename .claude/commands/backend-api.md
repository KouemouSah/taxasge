# Backend API Development Command

Create a new FastAPI backend endpoint following TaxasGE patterns.

## Instructions

When developing a new backend API endpoint, follow these steps:

1. **Read the database schema** from `.github/docs-internal/database/DATABASE_SCHEMA_REFERENCE.md` to understand table structure
2. **Check existing patterns** in `packages/backend/app/api/v1/` for consistency
3. **Verify environment variables** in `packages/backend/.env` for required secrets
4. **Follow 3-tier architecture**:
   - API Layer: `packages/backend/app/api/v1/{module}.py`
   - Service Layer: `packages/backend/app/services/{module}_service.py`
   - Repository Layer: `packages/backend/app/database/repositories/{module}_repository.py`

## Requirements

- Use **async/await** for all database operations
- Add **type hints** to all functions
- Include **docstrings** (Google style)
- Add **error handling** (try/except with proper HTTP status codes)
- Add **logging** with loguru
- Follow **RBAC permissions** (check user role/permissions)
- Add **input validation** with Pydantic models
- Include **unit tests** in `tests/`

## Example Structure

```python
# API Layer (api/v1/example.py)
@router.post("/example", response_model=ExampleResponse)
async def create_example(
    data: ExampleCreate,
    current_user: User = Depends(get_current_user),
    db = Depends(get_db)
) -> ExampleResponse:
    """
    Create a new example.

    Args:
        data: Example creation data
        current_user: Authenticated user
        db: Database connection

    Returns:
        Created example

    Raises:
        HTTPException: 400, 401, 403, 500
    """
    # Validate permissions
    # Call service layer
    # Return response
```

## Checklist

- [ ] Database schema reviewed
- [ ] Existing patterns followed
- [ ] API route created
- [ ] Service layer created (if needed)
- [ ] Repository layer created (if needed)
- [ ] Pydantic models defined
- [ ] Error handling added
- [ ] Logging added
- [ ] RBAC permissions checked
- [ ] Unit tests written
- [ ] Manual testing completed
