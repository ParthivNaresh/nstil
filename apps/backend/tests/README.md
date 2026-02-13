# NStil Backend Tests

## Philosophy

Tests exist to prove the system works under real conditions. They must be **extensible** and **scalable** to support a large, evolving application.

### Real services, not mocks

Tests should hit real services whenever possible. We want to see how the system behaves under stress, latency, and varying conditions — not how it behaves against a fake. Mocks hide bugs.

**When mocks are acceptable:**
- Unit tests for pure logic (e.g., JWT claim parsing, payload validation) where there is no external service involved
- The `mock_redis` in API conftest is a temporary placeholder until a real Redis test instance is available (e.g., via `docker compose` or Testcontainers)

**When mocks are NOT acceptable:**
- Integration tests that verify behavior across service boundaries (API → DB, API → Redis, API → Supabase)
- Stress or load tests
- Any test where the mock would mask a real failure mode (timeouts, connection drops, malformed responses)

### Test structure

```
tests/
├── conftest.py            # Root fixtures shared across ALL tests (settings, etc.)
├── factories.py           # Test data factories (JWT tokens, model builders)
├── README.md              # This file
├── api/                   # Integration tests — exercise endpoints via HTTP
│   ├── conftest.py        # API fixtures (TestClient, dependency overrides)
│   └── v1/               # Mirrors src/nstil/api/v1/ structure
│       ├── test_health.py
│       └── test_auth.py
├── core/                  # Unit tests for core logic (no HTTP, no DB)
│   └── test_security.py
├── models/                # Pydantic model validation tests (add as needed)
├── services/              # Service-layer tests (Redis, Supabase, add as needed)
└── workers/               # Background job tests (add as needed)
```

**Convention:** the test directory structure mirrors `src/nstil/`. A file at `src/nstil/core/security.py` has tests at `tests/core/test_security.py`.

### Fixtures

- **Root `conftest.py`** — only fixtures needed everywhere (e.g., `settings`). Keep this minimal.
- **Directory-level `conftest.py`** — fixtures scoped to a test category (e.g., `tests/api/conftest.py` owns `client` and `mock_redis`).
- **Prefer narrow scope.** A fixture used by one test file belongs in that file, not in conftest. Promote to conftest only when shared.
- **Use `yield` fixtures** for setup/teardown (e.g., DB transactions, TestClient lifecycle).
- **Fixture composition** — build complex fixtures from simpler ones. The `client` fixture depends on `settings` and `mock_redis`.

### Parametrization

Use `@pytest.mark.parametrize` to cover input variations without duplicating test bodies:

```python
@pytest.mark.parametrize("token_override,expected_error", [
    ({"exp": 0}, "expired"),
    ({"aud": "wrong"}, "invalid"),
])
def test_auth_rejects_bad_tokens(client, token_override, expected_error):
    ...
```

Good candidates for parametrization:
- Validation edge cases (missing fields, wrong types, boundary values)
- Error scenarios (different failure modes → different error messages)
- Permission checks (different roles → different access levels)

### Factories

`tests/factories.py` contains builders for test data. Use keyword overrides to customize:

```python
from tests.factories import make_token, build_jwt_claims

# Defaults produce a valid token
token = make_token()

# Override specific fields
expired_token = make_token(exp=0)
wrong_audience = make_token(aud="wrong")

# Get raw claims dict for manual manipulation
claims = build_jwt_claims()
del claims["sub"]  # test missing claim
```

As the app grows, add factories for database models, API request payloads, etc. Consider using `factory_boy` or `polyfactory` when model count justifies it.

### Naming conventions

- Test files: `test_<module>.py`
- Test classes: `Test<Feature>` (group related tests)
- Test functions: `test_<scenario>` — describe the scenario, not the implementation
- Fixtures: noun describing what they provide (`settings`, `client`, `mock_redis`)

### Running tests

```sh
# All tests
cd apps/backend && uv run pytest -v

# Specific directory
uv run pytest tests/core/ -v

# Specific test
uv run pytest tests/core/test_security.py::TestVerifyJwt::test_valid_token -v

# With coverage (when added)
uv run pytest --cov=nstil --cov-report=term-missing
```

### Adding new tests

1. Determine the category: `core/` (unit), `api/` (integration), `services/`, `workers/`
2. Mirror the source path: `src/nstil/foo/bar.py` → `tests/foo/test_bar.py`
3. Create `__init__.py` in any new test directories
4. Add fixtures to the narrowest applicable conftest
5. Use factories for test data — don't hardcode UUIDs, timestamps, etc.
6. Run `uv run ruff check tests && uv run pytest -v` before committing
