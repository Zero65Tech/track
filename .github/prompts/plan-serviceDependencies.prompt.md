# Prompt: Generate Track Backend Service Dependency Diagrams

## Task
Analyze the Track backend codebase and generate Mermaid service dependency diagrams organized around the following architectural perspective.

## Architectural Perspective

The Track backend follows a **layered architecture with two distinct flows**:

1. **HTTP Request Flow** - Synchronous CRUD operations initiated by HTTP controllers
2. **Offline Processing** - Asynchronous trigger processing initiated by cron jobs

### Breakdown by Diagram

Create 4 separate diagrams organized by functional layer:

1. **Part 1: Device & User Management** - Low-level hardware/device integration
2. **Part 2: Entry Attributes & Supporting CRUD** - Metadata and attribute management (secondary entities)
3. **Part 3: Core Entry CRUD & Trigger Management** - Primary data entities and trigger submission
4. **Part 4: Offline Trigger Processing** - Asynchronous background processing

## Analysis Instructions

### Step 1: Identify All Controllers
- Scan `backend/src/controllers/` for all controller files
- Map each controller to the services it imports and calls
- Extract the function names from each controller

### Step 2: Identify Service Dependencies
- Scan `backend/src/services/` for all service files
- Identify which services are imported by which other services
- Extract the function calls between services (especially those prefixed with `_` which are internal functions)

### Step 3: Find the Cron Entry Point
- Check `backend/src/cron.js` to identify the cron job's entry function
- Trace which service is called by the cron job
- Follow the service call chain from cron through all downstream services

### Step 4: Categorize Components

**Device Management (Part 1):**
- Controllers: Only `deviceController`
- Services: Only `deviceService`
- Note: `userService` exists but has no HTTP endpoints

**Supporting CRUD (Part 2):**
- Controllers: `folderController`, `groupController`, and the 4 entry field controllers (book, head, tag, source)
- Services: `folderService`, `groupService`, and the 4 entry field services
- Include: `auditLogService` as the hub these services call
- Exclude: Controllers/services not in this category

**Core Entity CRUD (Part 3):**
- Controllers: `profileController`, `entryController`, `triggerController`
- Services: `profileService`, `entryService`, `triggerService`, `auditLogService`
- Show: The relationship between profileService and triggerService
- Focus on: Primary entity operations and trigger submission

**Offline Processing (Part 4):**
- Entry Point: The cron job (label as "cron")
- Services: Follow the complete call chain from cron through all services it reaches
- Include: userService, deviceService, aggregationService, coinService
- Show: All function calls with their names

## Mermaid Diagram Format

For each diagram:
- Use `graph TD` (top-down direction)
- Node labels: `["nodeName"]` with descriptive names
- Edge labels: Show actual function/method names (not generic "calls")
- Use multiple lines in edge labels with `<br/>` for readability
- Color controllers: `fill:#fff9c4` (yellow)
- Color auditLogService: `fill:#e1f5ff` (light blue)
- Color triggerService: `fill:#fff3e0` (light orange)
- Color leaf/utility services: `fill:#f3e5f5` (light purple)

## Output Format

Provide 4 Mermaid code blocks with these titles:
- `## Part 1: Device & User Management Controllers`
- `## Part 2: Entry Attributes & Supporting CRUD`
- `## Part 3: Core Entry CRUD & Trigger Management`
- `## Part 4: Offline Trigger Processing`

## Key Rules

1. **Show actual function names** - Not generic labels like "calls" or "CRUD operations"
2. **Include intermediate services** - Don't skip services in the call chain
3. **Separate primary from secondary** - Keep core entities (profile, entry) separate from attributes (book, head, tag, source)
4. **Show relationships** - Include any service-to-service calls even if not directly called by controllers
5. **Circular dependencies are OK** - profileService ↔ triggerService is acceptable for event-driven design

