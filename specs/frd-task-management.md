# FRD-TASK-MGMT: Task Management

## 1. Overview

This FRD specifies the task CRUD operations covering task creation (US-7), editing (US-10), and deletion (US-11). All operations require authentication and are scoped to the authenticated user. The system uses an Express.js TypeScript API with in-memory storage and JWT-based auth (from frd-auth). The Next.js App Router frontend provides task creation forms, inline editing, and delete confirmation dialogs — all operating without page reloads.

---

## 2. API Contracts

### 2.1 POST /api/tasks — Create Task

Creates a new task owned by the authenticated user.

**Request Body:**

```json
{
  "title": "Implement login page",
  "description": "Build the login form with validation"
}
```

| Field       | Type   | Required | Constraints                  |
|-------------|--------|----------|------------------------------|
| title       | string | yes      | 1–120 characters, non-empty |
| description | string | no       | Defaults to `""` if omitted  |

**Responses:**

| Status | Condition               | Body                                                      |
|--------|-------------------------|-----------------------------------------------------------|
| 201    | Task created            | `{ "id", "title", "description", "status", "createdAt" }` |
| 400    | Validation failure (§3) | `{ "error": "<validation message>" }`                     |
| 401    | Not authenticated       | `{ "error": "Not authenticated" }`                        |

**201 Example:**

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "title": "Implement login page",
  "description": "Build the login form with validation",
  "status": "todo",
  "createdAt": "2025-01-15T10:30:00.000Z"
}
```

> **Note:** `userId` is NOT returned to the client. The response includes only `id`, `title`, `description`, `status`, and `createdAt`.

**Behavior:**

- New tasks always start with `status: "todo"`.
- `id` is generated via `crypto.randomUUID()`.
- `createdAt` is set to `new Date().toISOString()`.
- `userId` is set from `req.user.sub` (JWT payload).
- Newly created tasks naturally sort last in `GET /api/tasks` results since they have the latest `createdAt`.

---

### 2.2 PATCH /api/tasks/:id — Update Task

Updates an existing task. Supports partial updates — only provided fields are changed.

**Request Body (all fields optional):**

```json
{
  "title": "Updated title",
  "description": "Updated description",
  "status": "in_progress"
}
```

| Field       | Type   | Required | Constraints                                  |
|-------------|--------|----------|----------------------------------------------|
| title       | string | no       | If provided: 1–120 characters, non-empty     |
| description | string | no       | If provided: replaces existing value          |
| status      | string | no       | If provided: `"todo"`, `"in_progress"`, or `"done"` |

**Responses:**

| Status | Condition                                        | Body                                                      |
|--------|--------------------------------------------------|-----------------------------------------------------------|
| 200    | Task updated                                     | `{ "id", "title", "description", "status", "createdAt" }` |
| 400    | Validation failure (§3)                          | `{ "error": "<validation message>" }`                     |
| 401    | Not authenticated                                | `{ "error": "Not authenticated" }`                        |
| 404    | Task not found or not owned by authenticated user | `{ "error": "Task not found" }`                           |

**200 Example:**

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "title": "Updated title",
  "description": "Updated description",
  "status": "in_progress",
  "createdAt": "2025-01-15T10:30:00.000Z"
}
```

> **Note:** PATCH with an empty body `{}` is valid — no fields change, the task is returned as-is with 200.

---

### 2.3 DELETE /api/tasks/:id — Delete Task

Deletes an existing task owned by the authenticated user.

**Request Body:** None.

**Responses:**

| Status | Condition                                        | Body                              |
|--------|--------------------------------------------------|-----------------------------------|
| 204    | Task deleted                                     | *(no response body)*              |
| 401    | Not authenticated                                | `{ "error": "Not authenticated" }`|
| 404    | Task not found or not owned by authenticated user | `{ "error": "Task not found" }`   |

---

## 3. Validation Rules

### 3.1 Title

| Rule       | Check                              | Error Message                              |
|------------|------------------------------------|--------------------------------------------|
| Required   | field present and non-empty        | `"Title is required"`                      |
| Whitespace-only          | `title.trim().length === 0`            | `"Title is required"` |
| Max length | `title.length <= 120`              | `"Title must be 120 characters or fewer"`  |

### 3.2 Description

- Optional field. Defaults to empty string `""` if not provided.
- No length validation for MVP.

### 3.3 Status (on PATCH only)

| Rule             | Check                                              | Error Message                    |
|------------------|----------------------------------------------------|----------------------------------|
| Valid value      | Must be `"todo"`, `"in_progress"`, or `"done"`     | `"Invalid status value"`         |
| Valid transition | See transition matrix in §3.4                      | `"Invalid status transition"`    |

### 3.4 Status Transition Matrix

| From → To     | todo | in_progress | done |
|---------------|------|-------------|------|
| todo          | —    | ✅           | ❌    |
| in_progress   | ✅    | —           | ✅    |
| done          | ❌    | ✅           | —    |

Only adjacent moves are allowed. No skipping columns (e.g., cannot go directly from `todo` to `done` or from `done` to `todo`).

### 3.5 Validation Order

**POST:** title presence → whitespace check → title length. Return the **first** failing error.

**PATCH:** title presence (if provided) → whitespace check (if provided) → title length (if provided) → status value (if provided) → status transition (if provided). Return the **first** failing error.

---

## 4. Data Model

```typescript
interface Task {
  id: string;           // UUID v4 — generated via crypto.randomUUID()
  userId: string;       // References User.id — owner of the task
  title: string;        // 1–120 characters
  description: string;  // Optional, defaults to ""
  status: 'todo' | 'in_progress' | 'done';
  createdAt: string;    // ISO 8601 timestamp
}
```

**Storage:** In-memory `Map<string, Task>` keyed by task ID.

---

## 5. Authorization & Scoping

| Requirement                           | Detail                                                                                          |
|---------------------------------------|-------------------------------------------------------------------------------------------------|
| Auth middleware                        | All task endpoints require the `authMiddleware` (from frd-auth) to run first                   |
| User scoping                          | Tasks are scoped to the authenticated user: `req.user.sub` (from JWT) must match `task.userId` |
| GET /api/tasks                         | Returns only tasks where `userId === req.user.sub`                                             |
| PATCH /api/tasks/:id ownership check  | Returns 404 if the task doesn't exist OR if it belongs to a different user (same response)     |
| DELETE /api/tasks/:id ownership check | Returns 404 if the task doesn't exist OR if it belongs to a different user (same response)     |
| Information leakage prevention         | Never reveal whether a task exists for a different user — always return `"Task not found"`     |

**Ordering:** `GET /api/tasks` returns tasks sorted by `createdAt` ascending (oldest first). This ordering is required by the PRD (US-8) and must be enforced server-side.

---

## 6. Frontend Behavior

### 6.1 Create Task Form

| Element           | Detail                                                                                      |
|-------------------|---------------------------------------------------------------------------------------------|
| Location          | Accessible from the board page (board layout is covered by US-8; this FRD covers the form)  |
| Form fields       | Title (text input, required, max 120 chars), Description (textarea, optional)               |
| Submit button     | Label: "Add Task" (or similar)                                                              |
| Client validation | Title: required, max 120 chars. Show inline error if empty title submitted                  |
| On 201            | Add the new task to the "To Do" column immediately. Form clears after successful submission |
| On 400            | Show server error message inline                                                            |
| On 401            | Redirect to `/login`                                                                        |
| Page reload       | None — use fetch API                                                                        |

### 6.2 Edit Task

| Element           | Detail                                                                                      |
|-------------------|---------------------------------------------------------------------------------------------|
| Trigger           | Clicking a task's title or an edit icon opens the task for editing (inline or modal — agent's choice during implementation) |
| Editable fields   | Title and description                                                                       |
| Save action       | Applies changes via `PATCH /api/tasks/:id`                                                  |
| Cancel action     | Discards changes                                                                            |
| Client validation | Saving empty title shows validation error                                                   |
| On 200            | Update the task card immediately                                                            |
| On 400 / 404      | Show error message                                                                          |
| Page reload       | None — use fetch API                                                                        |

### 6.3 Delete Task

| Element           | Detail                                                                                      |
|-------------------|---------------------------------------------------------------------------------------------|
| Trigger           | Each task card has a delete button/icon                                                     |
| Confirmation      | Clicking delete shows a confirmation dialog: "Are you sure you want to delete this task?" with Confirm/Cancel buttons |
| On confirm        | Call `DELETE /api/tasks/:id`                                                                |
| On 204            | Remove the task card from the board immediately                                             |
| On 404            | Show error and refresh the board                                                            |
| On 401            | Redirect to `/login`                                                                        |

---

## 7. Error Responses

All error responses use a consistent shape:

```json
{ "error": "<human-readable message>" }
```

### Complete Error Catalog

| Endpoint              | Status | Error Message                              |
|-----------------------|--------|--------------------------------------------|
| POST /api/tasks       | 400    | `"Title is required"`                      |
| POST /api/tasks       | 400    | `"Title must be 120 characters or fewer"`  |
| POST /api/tasks       | 401    | `"Not authenticated"`                      |
| PATCH /api/tasks/:id  | 400    | `"Title is required"`                      |
| PATCH /api/tasks/:id  | 400    | `"Title must be 120 characters or fewer"`  |
| PATCH /api/tasks/:id  | 400    | `"Invalid status value"`                   |
| PATCH /api/tasks/:id  | 400    | `"Invalid status transition"`              |
| PATCH /api/tasks/:id  | 401    | `"Not authenticated"`                      |
| PATCH /api/tasks/:id  | 404    | `"Task not found"`                         |
| DELETE /api/tasks/:id | 401    | `"Not authenticated"`                      |
| DELETE /api/tasks/:id | 404    | `"Task not found"`                         |

---

## 8. Edge Cases

| Scenario                                     | Expected Behavior                                                                                                     |
|----------------------------------------------|-----------------------------------------------------------------------------------------------------------------------|
| Empty title (`""`)                           | 400 — `"Title is required"`                                                                                          |
| Title with only spaces (`"   "`)             | Rejected — treated as empty after whitespace check. Returns 400 with `"Title is required"`. The server checks `title.trim().length === 0` and rejects. The original (untrimmed) value is NOT stored. |
| Title exactly 120 characters                 | Accepted                                                                                                              |
| Title 121 characters                         | 400 — `"Title must be 120 characters or fewer"`                                                                      |
| PATCH with empty body `{}`                   | 200 — no fields changed, return task as-is                                                                           |
| PATCH task owned by different user           | 404 — `"Task not found"` (don't reveal existence)                                                                    |
| DELETE task owned by different user          | 404 — `"Task not found"`                                                                                             |
| DELETE already-deleted task                  | 404 — `"Task not found"`                                                                                             |
| Create task when not logged in               | 401 — `"Not authenticated"`                                                                                          |
| Move task from "todo" directly to "done"     | 400 — `"Invalid status transition"`                                                                                  |
| Move task from "done" to "todo"              | 400 — `"Invalid status transition"`                                                                                  |
| Very long description                        | Accepted — no length limit for MVP                                                                                   |
| HTML/script in title or description          | Stored as-is; React auto-escapes JSX output — no XSS risk                                                           |
| Concurrent edits to same task                | Last write wins (in-memory Map, single-threaded Node.js)                                                             |
| Server restart                               | All tasks lost (in-memory store) — documented as accepted for MVP                                                    |

---

## 9. Traceability

| Requirement                                  | PRD Source | Covered In         |
|----------------------------------------------|-----------|---------------------|
| Create task with title and description       | US-7      | §2.1, §3, §6.1     |
| Title validation (required, max 120)         | US-7 AC   | §3.1                |
| Task appears in "To Do" column               | US-7 AC   | §6.1                |
| Edit task title and description              | US-10     | §2.2, §6.2         |
| Empty title rejected on edit                 | US-10 AC  | §3.1, §6.2         |
| Delete with confirmation                     | US-11     | §2.3, §6.3         |
| Task disappears on deletion                  | US-11 AC  | §6.3                |
| Status transitions (adjacent only)           | US-9 AC   | §3.4                |
| Auth required for all operations             | FR-5, FR-2 | §5                 |
| Tasks scoped to user                         | FR-2      | §5                  |
