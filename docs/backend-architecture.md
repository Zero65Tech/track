# Track Backend — Architecture Overview

> Generated from source analysis of `/workspaces/track/backend/src`

---

## Keeping This Document Updated

A `.git/hooks/post-commit` hook watches `backend/src/` and prints a reminder after any commit that touches it.
When you see the reminder, open **Copilot Chat** and paste the prompt below:

> *Review the backend source files that changed in the last git commit and update `docs/backend-architecture.md` to reflect any changes — new routes, models, services, trigger types, coin logic, or aggregation pipelines. Keep diagram syntax valid and preserve all existing sections that are still accurate.*

**Quick reference — which section to update for common changes:**

| Change | Section(s) to update |
|--------|----------------------|
| New route or middleware | §2 Request Lifecycle |
| New model or field | §5 Data Model, §9 ERD |
| New trigger type | §6 Trigger & Coin |
| New aggregation pipeline | §7 Aggregation Pipeline |
| New service or dependency | §8 Service Dependency Map |
| FCM / Firebase changes | §3 User & Device Management |
| Profile state or access change | §4 Profile Access Control |

---

## Sections Overview

| # | Section | Diagram type | What it shows |
|---|---------|-------------|---------------|
| 1 | **System Overview** | Flowchart | Frontend → Cloud Run → Firebase Auth/FCM → MongoDB |
| 2 | **Request Lifecycle & Middleware Chain** | Flowchart | Public vs auth-only vs profile-scoped routes; `authMiddleware` → `accessMiddleware` gate |
| 3 | **User & Device Management** | Sequence diagram | Device registration (anonymous), claim after login, FCM push dispatch + token deactivation on error |
| 4 | **Profile Access Control** | Flowchart | Profile state machine (`inactive → active → disabled/deleted`) and the access-check logic (owner/editor/viewer) |
| 5 | **Profile, Attributes, Entries & Audit Logs** | Flowchart + Sequence | Data model relationships (Books/Heads/Tags/Sources → Entries → Groups/Folders) and the atomic write pattern (transaction → audit log in same Mongoose session) |
| 6 | **Trigger & Coin System** | Flowchart + Sequence | Trigger state machine with OCC safety, coin ledger (pulse/nova), cron processing loop with FCM state broadcasts |
| 7 | **Aggregation Pipeline** | Flowchart | Idempotent trigger queuing → cron processing → named MongoDB pipelines → result stored for read |
| 8 | **Service Dependency Map** | Flowchart | Which services call which (controllers → services → Firebase/MongoDB/LRU cache) |
| 9 | **Data Model Entity Relationships** | Flowchart | All collections, their key fields, and mandatory vs optional FK relationships |

---

## 1. System Overview

High-level view of all major subsystems and how they relate to each other.

```mermaid
flowchart TD
    Client["🖥️ Frontend\n(Vue 3 / Firebase Hosting)"]

    subgraph GCP["Google Cloud Platform"]
        CR["☁️ Cloud Run\n(Express API)"]
        CB["Cloud Build\nCI/CD"]
    end

    subgraph Firebase["Firebase (Admin SDK)"]
        FA["🔐 Firebase Auth\n(Identity)"]
        FCM["📲 Cloud Messaging\n(Push Notifications)"]
    end

    MongoDB[("🍃 MongoDB Atlas\n(Primary Store)")]

    Client -- "HTTPS /api/**" --> CR
    CR -- "verifyIdToken" --> FA
    CR -- "send()" --> FCM
    CR -- "Mongoose ODM" --> MongoDB
    CB -- "Docker image" --> CR
```

---

## 2. Request Lifecycle & Middleware Chain

Every request passes through two gates before reaching a controller.

```mermaid
flowchart LR
    Req(["HTTP Request"])

    subgraph Middleware["Middleware Pipeline"]
        direction TB
        M1["express.json()\nBody Parser"]
        M2["authMiddleware\n(Firebase token → req.user)"]
        M3["accessMiddleware\n(profile owner / editor / viewer check)"]
        M1 --> M2 --> M3
    end

    subgraph Public["Public Routes (no auth)"]
        P1["POST /devices"]
        P2["PATCH /devices/:id"]
        P3["GET /profiles/templates/system"]
        P4["GET /triggers/process  ← Cron"]
    end

    subgraph Auth["Auth-only Routes"]
        A1["GET /devices/:id/claim"]
        A2["GET /profiles"]
        A3["POST /profiles"]
    end

    subgraph ProfileAccess["Profile-scoped Routes\n(auth + access)"]
        PA["PATCH /profiles/:id\nBooks, Heads, Tags, Sources\nEntries, Groups, Folders\nAudit Logs, Triggers, Aggregations"]
    end

    ErrMW["⚠️ Error Handler\n500 JSON"]

    Req --> M1
    M1 --> Public
    M1 --> M2
    M2 --> Auth
    M2 --> M3
    M3 --> ProfileAccess
    Public --> ErrMW
    Auth --> ErrMW
    ProfileAccess --> ErrMW
```

---

## 3. User & Device Management

How a device gets registered and linked to a Firebase user, and how FCM push notifications are dispatched.

```mermaid
sequenceDiagram
    participant App as Mobile / Web App
    participant API as Express API
    participant DB as MongoDB (devices)
    participant FB as Firebase Auth
    participant FCM as Firebase FCM

    Note over App,FCM: Device Registration (anonymous – no auth required)
    App->>+API: POST /api/devices  { fcmToken }
    API->>+DB: DeviceModel.create({ fcmToken, active:true })
    DB-->>-API: deviceId
    API-->>-App: { id: deviceId }

    Note over App,FCM: Claim Device after user logs in
    App->>+API: GET /api/devices/:id/claim  [Bearer token]
    API->>+FB: verifyIdToken(token)
    FB-->>-API: { uid }
    API->>+DB: DeviceModel.updateOne({ _id:id }, { userId: uid })
    DB-->>-API: ok
    API-->>-App: 200 OK

    Note over App,FCM: Server Push – triggered on every trigger state change
    API->>+DB: DeviceModel.find({ userId:{$in:userIds}, active:true })
    DB-->>-API: [fcmTokens]
    loop each unique fcmToken
        API->>+FCM: messaging.send({ token, notification, data })
        alt token not registered
            FCM-->>API: messaging/registration-token-not-registered
            API->>DB: DeviceModel.updateMany({ fcmToken }, { active:false })
        else success
            FCM-->>-API: messageId
        end
    end
```

---

## 4. Profile Access Control

Profiles are the top-level container for all financial data. A user can be owner, editor, or viewer.

```mermaid
flowchart TD
    subgraph ProfileStates["Profile State Machine"]
        INACTIVE(["⏳ inactive\n(setup phase)"])
        ACTIVE(["✅ active"])
        TEMPLATE(["📋 template\n(system-owned)"])
        DISABLED(["🚫 disabled"])
        DELETED(["🗑️ deleted\n(soft, 30-day)"])

        INACTIVE -- "PROFILE_CREATED trigger\nprocessed" --> ACTIVE
        ACTIVE -- "owner disables" --> DISABLED
        ACTIVE -- "owner deletes" --> DELETED
        DISABLED -- "owner re-enables" --> ACTIVE
    end

    subgraph AccessRoles["Access Roles (ProfileAccess)"]
        direction TB
        OW["👑 owner\nFull control"]
        ED["✏️ editor\nRead + Write"]
        VW["👁️ viewer\nRead only"]
    end

    subgraph AccessCheck["accessMiddleware logic"]
        direction TB
        C1{"is owner?"}
        C2{"is editor?"}
        C3{"GET method?"}
        C4{"is viewer\nor public template?"}
        ALLOW(["✅ next()"])
        DENY(["❌ 403 Forbidden"])

        C1 -- yes --> ALLOW
        C1 -- no --> C2
        C2 -- yes --> ALLOW
        C2 -- no --> C3
        C3 -- no --> DENY
        C3 -- yes --> C4
        C4 -- yes --> ALLOW
        C4 -- no --> DENY
    end
```

---

## 5. Profile, Attributes, Entries & Audit Logs

The core data model — everything that belongs to a profile.

```mermaid
flowchart TD
    subgraph Profile["Profile Document\n(profiles collection)"]
        PR["_id · owner · editors[] · viewers[]\nname · state · timestamps"]
    end

    subgraph Attributes["Entry Field Attributes\n(one collection each)"]
        BK["📒 Book\nbookId"]
        HD["🏷️ Head\nheadId"]
        TG["🔖 Tag\ntagId"]
        SC["💳 Source\nsourceId"]
    end

    subgraph Entries["Entry (transaction)\n(entries collection — discriminator on type)"]
        EN["_src · date · type · amount\nnote · breakdown[]\ngroupId · folderId · sortOrder · state"]
        EN_BK["+ bookId\n(Credit/Debit/Income/Expense/Refund/Tax)"]
        EN_TR["+ sourceIdFrom · sourceIdTo\n(Transfer)"]
        EN_PY["+ sourceId\n(Payment/Receipt)"]
        EN --> EN_BK
        EN --> EN_TR
        EN --> EN_PY
    end

    subgraph Organizers["Organizers"]
        GR["📂 Group"]
        FO["📁 Folder"]
    end

    subgraph AuditLog["Audit Log\n(audit_logs collection)"]
        AL["userId · profileId · event\ndocType · docId\ndataBefore · dataAfter · timestamp"]
    end

    Profile --> Attributes
    Profile --> Entries
    Profile --> Organizers
    BK --> EN_BK
    HD --> EN_BK
    TG --> EN_BK
    SC --> EN_TR
    SC --> EN_PY
    GR --> Entries
    FO --> Entries
    Profile -.->|"every CUD op\n(same Mongoose session)"| AuditLog
    Attributes -.->|"every CUD op"| AuditLog
    Entries -.->|"every CUD op"| AuditLog
```

### Write Pattern (Transaction + Audit)

```mermaid
sequenceDiagram
    participant C as Controller
    participant S as Service
    participant TXN as transaction.js
    participant DB as MongoDB
    participant AL as auditLogService

    C->>S: createEntry(userId, profileId, entryData)
    S->>TXN: transaction(async session => { ... })
    TXN->>DB: session.startTransaction()
    S->>DB: EntryModel.create([...], { session })
    DB-->>S: doc
    S->>AL: _logCreateAudit({ userId, docType, data }, session)
    AL->>DB: AuditLogModel.create([...], { session })
    TXN->>DB: session.commitTransaction()
    S-->>C: entry data
```

---

## 6. Trigger & Coin System

Triggers are async jobs queued in MongoDB and processed by a cron-invoked endpoint. Coin deductions happen atomically inside the same Mongoose session as the aggregation result write.

```mermaid
flowchart TD
    subgraph TriggerTypes["Trigger Types"]
        T1["PROFILE_CREATED\n→ initialise coin ledger"]
        T2["PROFILE_OPENED\n(TODO)"]
        T3["DATA_AGGREGATION\n→ run aggregation pipeline\n→ deduct coins"]
        T4["DATA_EXPORT\n(TODO)"]
    end

    subgraph TriggerStates["Trigger State Machine"]
        QUEUED(["📥 QUEUED"])
        RUNNING(["⚙️ RUNNING"])
        COMPLETED(["✅ COMPLETED"])
        FAILED(["❌ FAILED"])

        QUEUED -- "OCC claim\nupdateOne check" --> RUNNING
        RUNNING --> COMPLETED
        RUNNING -- "insufficient coins\nor assert fail" --> FAILED
    end

    subgraph CoinLedger["Coin Ledger (coins collection)"]
        CL["profileId · ref · type\npulse · nova\npulseTotal · novaTotal\nlatest: bool"]
    end

    subgraph CoinTypes["Coin Types"]
        CT1["nova — long-term\n(signup bonus, referral,\npurchase, promotion)"]
        CT2["pulse — subscription\n(expires, auto-deducted first)"]
    end

    subgraph Aggregation["Aggregation Result (aggregations collection)"]
        AG["profileId · name · params · result"]
    end

    T1 -- "PROFILE_CREATED\nprocessed" --> CoinLedger
    T3 -- "DATA_AGGREGATION\nprocessed" --> Aggregation
    T3 -- "deduct coins\n(pulse first, then nova)" --> CoinLedger
    CoinLedger --> CoinTypes
```

### Trigger Processing Flow (Cron)

```mermaid
sequenceDiagram
    participant CRON as Cloud Scheduler\nGET /triggers/process
    participant TC as triggerController
    participant TS as triggerService
    participant DB as MongoDB
    participant FCM as FCM (via userService)

    CRON->>TC: GET /api/triggers/process?limit=60
    TC->>TS: processTriggers(onStateChanged, instanceId, 60)
    TS->>DB: find({ state: QUEUED|RUNNING }).sort(createdAt).limit(60)
    DB-->>TS: triggerDataArr

    loop for each trigger (OCC safety)
        TS->>DB: updateOne({ _id, state:QUEUED }, { state:RUNNING })
        alt modifiedCount === 0 (another instance claimed it)
            TS-->>TS: add to skippedProfileIds, continue
        else claimed
            TS->>TS: _processTrigger(profileId, triggerData)
            alt PROFILE_CREATED
                TS->>DB: CoinModel.create (signup bonus, same session)
                TS->>DB: TriggerModel.updateOne → COMPLETED (same session)
            else DATA_AGGREGATION
                TS->>DB: check coin balance
                alt insufficient coins
                    TS->>DB: updateOne → FAILED
                else
                    TS->>DB: _aggregateEntries (MongoDB pipeline)
                    TS->>DB: AggregationModel.upsert (result)
                    TS->>DB: CoinModel deduct (same session)
                    TS->>DB: TriggerModel.updateOne → COMPLETED (same session)
                end
            end
            TS->>FCM: _sendFirebaseMessage (state update push)
        end
    end
    TC-->>CRON: 200 "Triggers processed (n)"
```

---

## 7. Aggregation Pipeline

Named aggregation pipelines that compute financial summaries over entries.

```mermaid
flowchart LR
    subgraph Request["Client Request"]
        R1["POST /profiles/:id/triggers/data-aggregation\n{ aggregationName, entryType,\nbookId, headId, tagId, sourceId }"]
    end

    subgraph TriggerCreate["1. Queue Trigger"]
        TC["triggerService\n.createDataAggregationTrigger()\n\nIdempotent: returns existing\nQUEUED/RUNNING trigger\nif one already exists"]
    end

    subgraph TriggerProcess["2. Cron Processes Trigger"]
        TP["triggerService\n._processDataAggregationTrigger()\n\n1. entryService._aggregateEntries()\n2. aggregationService._setAggregationResult()\n3. coinService._deductCoinsFromLedger()\n(atomic transaction)"]
    end

    subgraph AggregationPipelines["Named Aggregation Pipelines\n(config/aggregations/)"]
        AP1["amounts_by_book"]
        AP2["amounts_by_type"]
        AP3["amounts_by_type_book_month"]
        AP4["amounts_by_type_head_tag_month"]
        AP5["balances_by_book"]
        AP6["balances_by_source"]
        AP7["counts_by_head_tag"]
        AP8["amounts_for_a_book/head/tag/source"]
        AP9["... etc."]
    end

    subgraph Read["3. Read Result"]
        RR["GET /profiles/:id/aggregations/:name/result\naggregationService.getAggregation()"]
    end

    Request --> TriggerCreate
    TriggerCreate --> TriggerProcess
    TriggerProcess --> AggregationPipelines
    AggregationPipelines -->|"result stored\nin aggregations collection"| Read
```

---

## 8. Service Dependency Map

Which services call which other services (internal `_` functions shown).

```mermaid
flowchart TD
    subgraph Controllers
        CC["Controllers\n(validation, HTTP I/O)"]
    end

    subgraph Services
        PS["profileService"]
        ES["entryService"]
        BS["bookService\nheadService\ntagService\nsourceService"]
        GRS["groupService\nfolderService"]
        TS["triggerService"]
        AS["aggregationService"]
        CS["coinService"]
        ALS["auditLogService"]
        US["userService"]
        DS["deviceService"]
    end

    subgraph External
        FB_AUTH["Firebase Auth\n(getUser)"]
        FB_FCM["Firebase FCM\n(send)"]
        DB_MONGO["MongoDB Atlas\n(Mongoose models)"]
        LRU["LRU Cache\n(profile, user, coin balance)"]
    end

    CC --> PS
    CC --> ES
    CC --> BS
    CC --> GRS
    CC --> TS
    CC --> AS
    CC --> ALS

    PS --> ALS
    PS --> TS
    PS --> LRU

    ES --> ALS
    BS --> ALS
    GRS --> ALS

    TS --> CS
    TS --> AS
    TS --> ES
    TS --> US

    US --> DS
    US --> FB_AUTH
    US --> FB_FCM
    US --> LRU

    CS --> LRU

    PS --> DB_MONGO
    ES --> DB_MONGO
    BS --> DB_MONGO
    GRS --> DB_MONGO
    TS --> DB_MONGO
    AS --> DB_MONGO
    CS --> DB_MONGO
    ALS --> DB_MONGO
    DS --> DB_MONGO
```

---

## 9. Data Model Entity Relationships

```mermaid
flowchart TD
    subgraph legend["Legend"]
        direction LR
        L1["─── required FK"]
        L2["-·-· optional FK"]
    end

    USER["User\n(Firebase Auth)"]
    DEVICE["Device\nuserId · fcmToken · active"]
    PROFILE["Profile\nowner · editors[] · viewers[]\nname · state"]
    BOOK["Book\nprofileId · name · color · icon · state"]
    HEAD["Head\nprofileId · name · color · icon · state"]
    TAG["Tag\nprofileId · name · color · icon · state"]
    SOURCE["Source\nprofileId · name · color · icon · state"]
    GROUP["Group\nprofileId · name"]
    FOLDER["Folder\nprofileId · name · folderId(parent)"]
    ENTRY["Entry\nprofileId · date · type · amount\nbookId · headId · tagId · sourceId\ngroupId · folderId · state"]
    TRIGGER["Trigger\nprofileId · userId · type · state\naggregationName · aggregationResult"]
    AGGREGATION["Aggregation\nprofileId · name · params · result"]
    COIN["Coin Ledger Entry\nprofileId · ref · type\npulse · nova · pulseTotal · novaTotal · latest"]
    AUDITLOG["Audit Log\nprofileId · userId · event\ndocType · docId\ndataBefore · dataAfter"]

    USER -->|"owns / edits / views"| PROFILE
    USER -->|"registers"| DEVICE

    PROFILE -->|"has many"| BOOK
    PROFILE -->|"has many"| HEAD
    PROFILE -->|"has many"| TAG
    PROFILE -->|"has many"| SOURCE
    PROFILE -->|"has many"| GROUP
    PROFILE -->|"has many"| FOLDER
    PROFILE -->|"has many"| ENTRY
    PROFILE -->|"has many"| TRIGGER
    PROFILE -->|"has many"| AGGREGATION
    PROFILE -->|"has many"| COIN
    PROFILE -->|"has many"| AUDITLOG

    ENTRY -.->|"optional"| BOOK
    ENTRY -.->|"optional"| HEAD
    ENTRY -.->|"optional"| TAG
    ENTRY -.->|"optional"| SOURCE
    ENTRY -.->|"optional"| GROUP
    ENTRY -.->|"optional"| FOLDER
    FOLDER -.->|"parent folder"| FOLDER
    TRIGGER -->|"refs"| COIN
```
