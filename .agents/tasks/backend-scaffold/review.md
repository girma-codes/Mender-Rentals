# Mender Rentals — Node.js/Express/PostgreSQL backend scaffold

This PR adds the full server-side foundation: three-table PostgreSQL schema, JWT/bcrypt auth endpoints, equipment CRUD, rental request lifecycle, Zod validation middleware, and a React `AuthContext` that calls the real API with a development-only mock fallback. The approach is structurally sound — parameterized queries throughout, a field allowlist on the update path, and a state-machine guard on rental status transitions. **Watch for:** the `errorHandler` lets raw `Error.message` strings leak to clients (MEDIUM); the `PUT /api/equipment/:id` dynamic SQL construction is safe today but fragile under maintenance (LOW); the auth routes have no try/catch, so any database error will fall through to the global handler without a meaningful status code (MEDIUM); the mock fallback in `AuthContext` accepts *any* password for registered emails, which is a development footgun if the backend is temporarily unreachable in a staging environment (LOW).

**Verdict**: NEEDS_CHANGES

---

## High-level view

The schema covers all three required tables with correct foreign-key constraints, check constraints on enumerations, and six indexes (four on `equipment`, two on `rental_requests`, plus one on `rental_requests.status`). The `users` email uniqueness index is implicit in the `UNIQUE NOT NULL` column constraint. The `rental_requests` table adds a `CONSTRAINT valid_dates` and a `message` column beyond the original spec — reasonable extensions.

Auth middleware extracts the Bearer token, verifies it against `JWT_SECRET` drawn from the environment, and attaches `req.user`; it never touches a hardcoded secret. The signup/login routes use parameterized queries and strip `password_hash` from every response object. However, neither auth route wraps its database work in a try/catch, meaning a transient PostgreSQL error surfaces as an unhandled rejection that Express catches only because of Node's uncaughtException behavior — the global `errorHandler` fires, but the client gets a generic 500 with whatever `err.message` contains, potentially exposing internal detail.

The `errorHandler` always forwards `err.message` verbatim to the client. For errors originating inside the application this is intentional, but for unexpected `pg` errors, this leaks connection strings, table names, and constraint names to the API consumer.

The `PUT /api/equipment/:id` handler filters incoming keys against an explicit `ALLOWED_UPDATE_FIELDS` set before constructing the SET clause, which is the right approach. The column names are passed in as identifier fragments (not parameterized), but since they are gated by the allowlist they cannot be externally influenced. The design is correct today but will silently accept any future field added to the allowlist without a corresponding schema audit.

`AuthContext` tries the real API first and catches network errors, falling back to an in-memory/localStorage mock only in `import.meta.env.DEV`. The mock path accepts *any* password for a locally-registered email — this is acceptable for pure offline development but becomes a security gap if a staging build inadvertently has `DEV` mode enabled. The JWT token is stored in `localStorage` under `mender_auth_token` and cleared on logout.

---

<details>
<summary>Issues (6)</summary>

1. **Auth routes missing try/catch** — `POST /api/auth/signup` and `POST /api/auth/login` perform multiple `await query(...)` calls with no try/catch. A database error causes an unhandled promise rejection that falls through to the global error handler, which returns a 500 with the raw `pg` error message (potentially including table names or connection details). Wrap both route bodies in try/catch and return a sanitized 500.

2. **errorHandler leaks internal error messages** — `errorHandler` returns `err.message` for any `Error` instance. `pg` errors include the full query context, constraint names, and sometimes the connection URL fragment in their messages. Replace this with a class-based or code-based check: known `AppError` types surface their message; all others return a generic "Internal server error." string.

3. **Equipment routes missing try/catch** — `GET /api/equipment`, `GET /api/equipment/:id`, `POST /api/equipment`, `PUT /api/equipment/:id`, and `DELETE /api/equipment/:id` have no try/catch. Same unhandled-rejection risk as the auth routes.

4. **Rentals routes missing try/catch** — All four handlers in `rentals.ts` have no try/catch. The `PATCH /:id/status` handler in particular makes two sequential queries; a failure on the second leaves the client hanging.

5. **Mock auth accepts any password in DEV** — The `login` mock fallback in `AuthContext` checks only that the email was previously registered; it never validates the password. If a staging deployment runs with `MODE=development`, any user who knows a registered email can authenticate without the correct password. Gate it on `window.location.hostname === 'localhost'` rather than `import.meta.env.DEV`, or store and verify the password in the mock path.

6. **Seed script has no production guard** — The seed writes a known-credential lender account (`demo@mender.et` / `demo1234`). The README marks it as "optional" but does not warn against running it against production. Add an explicit warning, or add a `NODE_ENV !== 'production'` guard in `seed.ts` that aborts with a non-zero exit code.

</details>

---

<details>
<summary>Details</summary>

### Unguarded async routes across all three route files

`auth.ts`, `equipment.ts`, and `rentals.ts` contain a combined nine route handlers that perform `await query(...)` without a try/catch. Express 4 does not automatically catch rejected promises from async route handlers — it relies on the handler explicitly passing errors to `next(err)`. In practice, Node.js will emit an `unhandledRejection` event, which Express catches at the process level in newer minor versions, but this behavior is version-dependent and should not be relied upon. The global `errorHandler` is mounted correctly but it only receives the error if Express internally routes unhandled rejections to it, which is not guaranteed across all Express 4.x patch versions.

The fix is consistent: wrap each handler body in `try { ... } catch (err) { next(err); }`. The alternative — an `asyncHandler` wrapper — is also idiomatic and reduces boilerplate.

### errorHandler information disclosure

```typescript
// current
const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
res.status(500).json({ error: message });
```

A `pg` error thrown when the database is unreachable contains strings like `connect ECONNREFUSED 127.0.0.1:5432` or `relation "equipment" does not exist`. These are useful for developers and destructive in production. The handler should distinguish between operational errors (intentionally thrown `AppError` instances with safe messages) and unexpected errors (everything else gets a fixed "Internal server error." string with the detail logged server-side only).

### PUT /api/equipment/:id dynamic SQL column construction

The handler concatenates column names from `Object.entries(d)` filtered against `ALLOWED_UPDATE_FIELDS` into the SET clause:

```typescript
const fields = entries.map(([k], idx) => `${k} = $${idx + 2}`).join(', ');
```

Column names come from the application's own Zod-validated body, which is then filtered by the allowlist, so there is no injection path from external input. The concern is maintainability: any future contributor adding a column to `ALLOWED_UPDATE_FIELDS` without understanding the construction pattern could introduce a column name that causes unexpected behavior. A comment flagging this as an explicit allowlist (not a dynamic passthrough) would help.

### Mock fallback password bypass in AuthContext

```typescript
// mock login path
const registeredEmails = getRegisteredEmails();
if (!registeredEmails.includes(email)) {
  reject(new Error('No account found for this email. Please sign up first.'));
  return;
}
// password is never checked
```

The mock signup path stores the email in `localStorage` but not the password. The mock login path verifies only email presence. This is a deliberate simplification for offline development, but `import.meta.env.DEV` is set by Vite's build mode, not the runtime environment — a `vite build --mode development` (which can happen accidentally in CI) would ship this to production. Gating on `window.location.hostname === 'localhost'` is safer, or storing and checking a hashed form of the password in the mock path.

### Seed demo password

The seed writes `demo1234` as the demo lender password and the README marks the seed step as "optional" without warning against production use. Running it against a production database creates a known-credential lender account. Add an explicit production warning.

</details>

---

<details>
<summary>File map</summary>

| File | What changed |
|------|-------------|
| `server/package.json` | New package — all dependencies pinned to exact versions; `bcryptjs`, not native `bcrypt` |
| `server/tsconfig.json` | New — strict mode on, CommonJS, ES2022 target |
| `server/.env.example` | New — all six required/optional env vars documented |
| `server/src/db/schema.sql` | New — three tables, seven indexes, check constraints, pgcrypto extension guard |
| `server/src/db/connection.ts` | New — `pg` Pool from `DATABASE_URL`, thin `query<T>` wrapper with timing log |
| `server/src/db/migrate.ts` | New — reads `schema.sql`, executes against pool, exits |
| `server/src/db/seed.ts` | New — upserts demo lender, inserts 5 items with `ON CONFLICT DO NOTHING` |
| `server/src/middleware/auth.ts` | New — Bearer token extraction, JWT verify, attaches `req.user` |
| `server/src/middleware/errorHandler.ts` | New — four-argument signature, logs and returns `err.message` |
| `server/src/middleware/validate.ts` | New — Zod `safeParse`, 400 with field-level issues on failure |
| `server/src/routes/auth.ts` | New — signup (409 on duplicate, bcrypt, JWT, 201) and login (401 variants, bcrypt compare, 200) |
| `server/src/routes/equipment.ts` | New — 5 endpoints with allowlist-guarded dynamic UPDATE, owner-only guards on PUT/DELETE |
| `server/src/routes/rentals.ts` | New — 4 endpoints with state-machine status transitions, self-rental guard |
| `server/src/types/express.d.ts` | New — augments `Express.Request` with `user?: { userId, email, role }` |
| `server/src/index.ts` | New — fail-fast env check, cors, json, urlencoded, routes, error handler |
| `server/README.md` | New — setup, endpoints table, env vars table, demo credentials |
| `.env.example` (root) | Added `VITE_API_URL` for frontend consumption |
| `src/context/AuthContext.tsx` | Updated — real API calls with DEV-only mock fallback, token stored in `localStorage` |

Full diff: `git diff main -- server/ src/context/AuthContext.tsx`

</details>
