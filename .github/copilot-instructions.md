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
| `backend/src/app.js` | Route definitions, middleware order |
| `backend/src/services/profileService.js` | Profile CRUD, caching, transaction pattern |
| `backend/src/services/auditLogService.js` | Audit log pattern |
| `backend/src/utils/transaction.js` | MongoDB transaction wrapper |
| `shared/src/index.js` | All shared enums (ProfileState, TriggerType, etc.) |
| `frontend/src/stores/profile.store.js` | Pinia state example |
| `Dockerfile` | Backend deployment artifact |
| `firebase.json` | Hosting config, rewrites, service mappings |
| `README.md` | Architecture diagrams, checklist of incomplete features |

## Common Patterns

1. **Create with Audit**: Always wrap in transaction, call `_logCreate()` with newData
2. **Update with Audit**: Pass oldData + newData to transaction → `_logUpdate()`
3. **API Response**: Transform Mongoose `lean()` documents to DTOs (strip `_id`, add `id` string)
4. **Error Handling**: Express error middleware logs full stack, returns 500 + message
5. **Frontend API Calls**: Use service layer (not raw axios), handle errors with Toast
6. **State Persistence**: No Redux/Vuex, Pinia stores are runtime-only; reload on refresh
7. **Validation Rule**: Avoid adding validation rules at the service level—parameters are already validated at the controller level. For private methods (prefixed with `_`), assume code is well-tested and well-written; validation is not needed.

## Notes

- **Feature Checklist** in `README.md` documents incomplete work (delete after 30 days, disabled/deleted profile restrictions, etc.)
- **Coin Ledger** uses optimistic concurrency control; see `README.md` sequence diagrams for trigger flows
- **Profile State Machine**: inactive → active (one-way); can disable/delete but not auto-recover deleted profiles after 30 days
- **Template Sharing**: Only template profiles created by system users are shared. No plans yet to make other users' templates sharable.
- Avoid direct `_id` in API responses; always provide string `id` field instead
