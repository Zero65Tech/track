# Track Backend Service Dependency Diagrams

## Part 1: Device & User Management Controllers

```mermaid
graph TD
    DC["deviceController"]:::controller
    DS["deviceService"]:::service
    US["userService"]:::service
    
    DC -->|createDevice<br/>updateDevice<br/>claimDevice| DS
    US -->|_sendFirebaseMessage| US
    DS -->|_getActiveDeviceFcmTokens<br/>_deactivateDevicesByFcmToken| US
    
    classDef controller fill:#fff9c4
    classDef service fill:#f3e5f5
```

## Part 2: Entry Attributes & Supporting CRUD

```mermaid
graph TD
    FC["folderController"]:::controller
    GC["groupController"]:::controller
    BC["bookController"]:::controller
    HC["headController"]:::controller
    TC["tagController"]:::controller
    SC["sourceController"]:::controller
    AC["auditLogController"]:::controller
    
    FS["folderService"]:::service
    GS["groupService"]:::service
    BS["bookService"]:::service
    HS["headService"]:::service
    TS["tagService"]:::service
    SS["sourceService"]:::service
    ALS["auditLogService"]:::auditLog
    
    FC -->|getFolders<br/>createFolder<br/>updateFolder<br/>deleteFolder| FS
    GC -->|getGroups<br/>createGroup<br/>updateGroup<br/>deleteGroup| GS
    BC -->|getAll<br/>create<br/>update<br/>remove| BS
    HC -->|getAll<br/>create<br/>update<br/>remove| HS
    TC -->|getAll<br/>create<br/>update<br/>remove| TS
    SC -->|getAll<br/>create<br/>update<br/>remove| SS
    AC -->|getAuditLogs| ALS
    
    FS -->|_logCreateAudit<br/>_logUpdateAudit<br/>_logDeleteAudit| ALS
    GS -->|_logCreateAudit<br/>_logUpdateAudit<br/>_logDeleteAudit| ALS
    BS -->|_logCreateAudit<br/>_logUpdateAudit<br/>_logDeleteAudit| ALS
    HS -->|_logCreateAudit<br/>_logUpdateAudit<br/>_logDeleteAudit| ALS
    TS -->|_logCreateAudit<br/>_logUpdateAudit<br/>_logDeleteAudit| ALS
    SS -->|_logCreateAudit<br/>_logUpdateAudit<br/>_logDeleteAudit| ALS
    
    classDef controller fill:#fff9c4
    classDef service fill:#f3e5f5
    classDef auditLog fill:#e1f5ff
```

## Part 3: Core Entry CRUD & Trigger Management

```mermaid
graph TD
    PC["profileController"]:::controller
    EC["entryController"]:::controller
    TC["triggerController"]:::controller
    AgC["aggregationController"]:::controller
    
    PS["profileService"]:::service
    ES["entryService"]:::service
    TrS["triggerService"]:::trigger
    AgS["aggregationService"]:::service
    ALS["auditLogService"]:::auditLog
    
    PC -->|getAccessibleProfiles<br/>getTemplateProfiles<br/>createProfile<br/>updateProfile| PS
    EC -->|getEntries<br/>getBookEntries<br/>getHeadEntries<br/>getTagEntries<br/>getSourceEntries<br/>createEntry<br/>updateEntry<br/>deleteEntry| ES
    TC -->|createDataAggregationTrigger| TrS
    AgC -->|getNamedAggregationResult<br/>getCustomAggregationResult<br/>createCustomAggregation| AgS
    
    PS -->|_logCreateAudit<br/>_logUpdateAudit| ALS
    PS -->|_createProfileCreatedTrigger| TrS
    ES -->|_logCreateAudit<br/>_logUpdateAudit<br/>_logDeleteAudit| ALS
    TrS -->|_getCachedProfile| PS
    TrS -->|_aggregateEntries| ES
    TrS -->|_setNamedAggregationResult| AgS
    
    classDef controller fill:#fff9c4
    classDef service fill:#f3e5f5
    classDef trigger fill:#fff3e0
    classDef auditLog fill:#e1f5ff
```

## Part 4: Offline Trigger Processing

```mermaid
graph TD
    CRON["cron.start(instanceId)"]:::service
    TrS1["triggerService<br/>_processTriggers(instanceId)"]:::trigger
    TrS2["triggerService<br/>_processTrigger(triggerData)"]:::trigger
    TrS3A["triggerService<br/>_processProfileCreatedTrigger(triggerData)"]:::trigger
    TrS3B["triggerService<br/>_processNamedDataAggregationTrigger(triggerData, profile)"]:::trigger
    
    CoS1["coinService<br/>_initialiseCoinLedger()"]:::service
    ES["entryService<br/>_aggregateEntries(profileId, aggregationName, params)"]:::service
    AgS["aggregationService<br/>_setNamedAggregationResult()"]:::service
    CoS2["coinService<br/>_deductCoinsFromLedger()"]:::service
    US["userService<br/>_sendFirebaseMessage()"]:::service
    DS["deviceService<br/>_getActiveDeviceFcmTokens()"]:::service
    DS2["deviceService<br/>_deactivateDevicesByFcmToken()"]:::service
    
    CRON -->|start trigger| TrS1
    TrS1 -->|for each trigger| TrS2
    TrS2 -->|if PROFILE_CREATED| TrS3A
    TrS2 -->|if DATA_AGGREGATION| TrS3B
    
    TrS3A -->|initialize coins| CoS1
    TrS3B -->|aggregate data| ES
    ES -->|save result| AgS
    AgS -->|deduct coins| CoS2
    CoS2 -->|send notification| US
    US -->|get FCM tokens| DS
    DS -->|deactivate token| DS2
    
    classDef service fill:#f3e5f5
    classDef trigger fill:#fff3e0
```
