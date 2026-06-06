# Track Codebase Instructions for AI Agents

## Project Overview

**Track** is a full-stack financial data management application with four key workspaces:
- **Frontend**: Vue 3 + Vite SPA deployed to Firebase Hosting
- **Backend**: Express.js REST API deployed to Google Cloud Run
- **Shared**: Reusable constants and enums for frontend/backend
- **Infrastructure**: Terraform IaC for GCP resources (Cloud Run, Cloud Build, Artifact Registry)

The app manages user financial profiles with entries (transactions), entry fields (Books, Heads, Tags, Sources), folders, groups, and integrates coin-based incentives (nova/pulse).

## Architecture Patterns

### Backend Structure (Express + Mongoose + MongoDB)

**Service Layer Pattern**: Business logic lives in `backend/src/services/`, controllers only delegate.
- Example: `profileService.js` handles profile CRUD, caching (LRU), and transactions
- Services call other services: `profileService` → `auditLogService`, `coinLedger`, `triggerService`
- Internal functions prefixed with `_` (e.g., `_logCreate()`) are called only by services, never controllers

**Database Transactions**: Mongoose sessions for atomicity.
```javascript
// backend/src/utils/transaction.js wraps all multi-step operations
await transaction(async (session) => {
  // Create main document
  // Call audit logging within same session
  // Update coin ledger within same session
});
```

**Audit Logging**: Every create/update/delete auto-logs via `_logCreate()`, `_logUpdate()`, `_logDelete()`.

**Caching**: `profileService` uses LRU cache (3-hour TTL) to avoid repeated DB lookups.

### Data Model Nomenclature

- **MongoDB**: Database/Collection names in `snake_case`, fields in `camelCase`
- **Attributes** = **Entry Fields** = Books, Heads, Tags, Sources (referenced via `bookId`, `headId`, `tagId`)
- **Profiles** have states: `inactive` (setup phase), `active`, `template`, `disabled`, `deleted` (soft-delete, 30-day retention)
- **Entries** are transactions linked to a profile
- **ProfileAccess**: `owner`, `editor`, `viewer` (defined in `shared/src/index.js`)

### Coin System (nova & pulse)

Triggers fire when profiles/entries are created, opened, or data is aggregated/exported:
- **nova**: Long-term currency (signup bonus, referral, purchase, promotion)
- **pulse**: Subscription/daily-streak currency (expires, auto-deducted)
- Managed by `triggerService` → `coinLedger` service

### API Route Structure

Routes in `backend/src/app.js`:
- Public: `GET /api/profiles/templates/system`, `GET /api/cron`
- Auth required: `GET/POST/PATCH /api/profiles` (user's profiles)
- Profile access required: `GET/POST/PATCH/DELETE /api/profiles/:profileId/{books,heads,tags,sources,folders,groups,entries}`
- Profile owner required: `POST /api/profiles/:profileId/triggers` (coin transactions)

**ID Mapping**: `profileId` parameter supports `$variable` syntax for test templates (auto-resolved via `backend/src/config/idMappings.js`).

## Frontend Structure (Vue 3 + Pinia + Firebase)

**State Management**: Pinia stores in `frontend/src/stores/`:
- `auth.store.js`: Firebase auth state
- `profile.store.js`: Current profile context
- `entry.store.js`: Entry/transaction data
- `attributes.store.js`: Books, Heads, Tags, Sources (entry fields)
- `ui.store.js`: UI state (modals, panels)

**Service Layer**: Axios-based services in `frontend/src/services/`:
- `apiClient.js`: Centralized HTTP client (proxies `/api/**` to backend)
- `profileService.js`, `entryService.js`, `attributeService.js`: API wrappers

**Components**: Organized by feature in `frontend/src/components/{attribute,entry,folder,group,...}/`
- Use PrimeVue + Vuetify components
- Toast notifications via `primevue/toastservice`

## Development Workflows

### Local Development

```bash
# Backend (Node 22, port 3000)
cd backend
npm install
npm run dev  # Reads .env, connects to GCP Firebase + MongoDB Atlas

# Frontend (Vite, port 1080)
cd frontend
npm install
npm run dev  # Proxy /api to https://track-439804487820.asia-south1.run.app

# Run ESLint across workspace
npm run lint
```

### Build & Deploy

**Backend**: Dockerfile (2-stage build, distroless runtime) → GCP Cloud Build → Cloud Run (`asia-south1` region)

**Frontend**: Vite build → Firebase Hosting (rewrites `/api/**` → Cloud Run, `**` → `index.html` for SPA routing)

**Infrastructure**: Terraform modules in `infrastructure/module/` for GCP resources; separate configs for `zero65-test` (dev/test) and `zero65-track` (staging/prod).

### Testing

```bash
cd backend
npm test  # Jest, covers test/ folder
```

## Environment & Configuration

**Environments**: alpha (dev), beta (test), gamma (staging), prod
- All use GCP Firebase for auth
- alpha/beta: MongoDB Atlas "Zero65 Test" project
- gamma/prod: MongoDB Atlas "Zero65 Prod" project
- Shared enum constants in `shared/src/index.js`: `ProfileState`, `EntryType`, `TriggerType`, etc.

**Node.js Version**: 22 (enforced in devcontainer, workflows, Dockerfile)

**Linting**: ESLint flat config (`eslint.config.js`) covers JS, Vue, JSON, Markdown

## Key Files to Reference

| File | Purpose |
|------|---------|
| `backend/src/app.js` | Route definitions, middleware order, error handler |
| `backend/src/services/profileService.js` | Profile CRUD, caching, transaction pattern example |
| `backend/src/services/auditLogService.js` | Audit log pattern (create, update, delete events) |
| `backend/src/utils/transaction.js` | Mongoose transaction wrapper for atomicity |
| `backend/src/utils/response.js` | Response helpers (`sendData`, `sendBadRequestError`, etc.) |
| `shared/schemas/src/` | Zod validation schemas (profile, entry, device, etc.) |
| `shared/enums/src/index.js` | All shared enums (ProfileState, TriggerType, etc.) |
| `frontend/src/stores/auth.store.js` | Pinia store with AbortController pattern |
| `frontend/src/stores/profile.store.js` | Profile store state management example |
| `frontend/src/service/apiClient.js` | Axios HTTP client with auth interceptors |
| `Dockerfile` | Backend deployment artifact (2-stage build) |
| `firebase.json` | Hosting config, rewrites, service mappings |
| `README.md` | Architecture diagrams, feature checklist |

## Validation & Error Handling

### Input Validation (Backend)
- **Location**: Controllers only, never in services
- **Tool**: Zod schemas (shared in `shared/schemas/src/`)
- **Pattern**: Use `safeParse()` or `parse()`, return `sendBadRequestError()` immediately on failure
- **Schema Features**: `.strict()` rejects extra fields, `.refine()` for cross-field validation
- **Services**: Assume parameters pre-validated; throw generic errors if resource not found

### Error Handling (Backend)
- **Controllers**: Catch validation errors, return 400; call services in try-catch
- **Services**: Throw errors (no HTTP handling); error middleware will catch
- **Middleware**: Express error handler at [app.js](backend/src/app.js#L107) catches all throws
- **Auth**: Auth middleware specifically catches `auth/id-token-expired` for 401 handling
- **Frontend**: Service layer catches errors; stores handle in try-catch and show Toast

## Frontend State Management

### Pinia Store Structure
- **Syntax**: Setup function with `ref()` for state, `computed()` for getters, async functions for actions
- **State Organization**: Group related fields (e.g., `{ isLoading, data, error }` per domain)
- **Cleanup**: Use `AbortController` in actions for in-flight request cancellation on context switch
- **Error Handling**: try-catch in actions; store error in `ref`; use `useToast()` for user feedback
- **Example**: [auth.store.js](frontend/src/stores/auth.store.js), [profile.store.js](frontend/src/stores/profile.store.js)

### Service Layer
- Never call `apiClient` directly from components; use service functions
- Services may throw; let stores handle in try-catch
- [apiClient.js](frontend/src/service/apiClient.js): request interceptor adds auth token, response interceptor handles 401

## API Response Transform

- **MongoDB `_id`**: Always convert to string `id` field in API responses
- **Method**: Use helper like `{ id: String(doc._id), ...doc }` or DTO pattern
- **Never expose**: `_id`, `profileId` (internal reference), or other internal fields
- **Example**: Profile responses use `id`, not `_id`

## Common Patterns

1. **Create with Audit**: Always wrap in transaction, call `_logCreate()` with newData
2. **Update with Audit**: Pass oldData + newData to transaction → `_logUpdate()`
3. **Database Transaction**: Use [transaction.js](backend/src/utils/transaction.js) wrapper, pass `session` to all nested service calls
4. **Private Methods**: Prefix with `_` (e.g., `_logCreate()`, `_getCachedProfile()`); assume pre-validated inputs
5. **Caching**: Profile service uses LRU cache (3-hour TTL); check cache before DB lookup
6. **State Persistence**: Pinia stores are runtime-only (no localStorage auto-sync); reload on page refresh
7. **Monorepo Workspace**: All npm commands use `--workspace=<name>` flag (e.g., `npm run lint --workspace=backend`)

## Notes

- **Feature Checklist** in `README.md` documents incomplete work (delete after 30 days, disabled/deleted profile restrictions, etc.)
- **Coin Ledger** uses optimistic concurrency control; see `README.md` sequence diagrams for trigger flows
- **Profile State Machine**: inactive → active (one-way); can disable/delete but not auto-recover deleted profiles after 30 days
- **Template Sharing**: Only template profiles created by system users are shared. No plans yet to make other users' templates sharable.

## Anti-patterns to Avoid

1. **Don't validate in services**—always validate in controllers using Zod; services assume pre-validated input
2. **Don't expose `_id` in API responses**—always convert to string `id` field
3. **Don't throw validation errors from middleware**—catch specific errors only (e.g., expired token)
4. **Don't skip session parameter for transactional operations**—always pass `session` to all nested service calls
5. **Don't call services directly from frontend components**—use service layer as intermediary (e.g., `profileService.getProfile()`)
6. **Don't modify frozen enums after definition**—freeze at creation time in `shared/enums/src/index.js`
7. **Don't skip `AbortController` in frontend stores**—cancellation prevents memory leaks on context switch
