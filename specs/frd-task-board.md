# FRD: Task Board View

**Covers:** US-8 (View the Board), US-9 (Move a Task)
**Depends on:** FRD-Auth (authentication, JWT cookie, auth guard pattern), FRD-Task-Management (task data model, PATCH /api/tasks/:id endpoint, create/edit/delete UI)

---

## 1. Overview

The Task Board is the primary authenticated experience in TaskBoard. It displays the user's tasks organized in three Kanban-style columns — To Do, In Progress, and Done — and provides button-based controls to move tasks between adjacent columns. This FRD covers the board page layout, column structure, task card rendering, task movement UI, the `GET /api/tasks` endpoint, data fetching behavior, and all board-related states (loading, empty, error).

---

## 2. API Contract

### 2.1 GET /api/tasks — List Tasks

Returns all tasks belonging to the authenticated user.

**Request:**
- No request body.
- Requires a valid JWT in the `token` HTTP-only cookie (set during login — see FRD-Auth §4.2).

**Success Response — 200 OK:**

```json
[
  {
    "id": "uuid",
    "title": "Task title",
    "description": "Task description",
    "status": "todo",
    "createdAt": "2025-01-15T08:30:00.000Z"
  }
]
```

| Field         | Type                                     | Description                            |
|---------------|------------------------------------------|----------------------------------------|
| `id`          | `string` (UUID)                          | Unique task identifier                 |
| `title`       | `string`                                 | Task title (1–120 characters)          |
| `description` | `string`                                 | Task description (may be empty string) |
| `status`      | `"todo"` \| `"in_progress"` \| `"done"` | Current task status                    |
| `createdAt`   | `string` (ISO 8601)                      | Timestamp when the task was created    |

**Behavior Notes:**
- Returns an empty array `[]` if the user has no tasks.
- Tasks are returned in `createdAt` ascending order (oldest first).
- The `userId` field is NOT included in the response (the user can only see their own tasks).

**Error Response — 401 Unauthorized:**

```json
{
  "error": "Not authenticated"
}
```

**Note:** The `PATCH /api/tasks/:id` endpoint (for moving tasks) and `POST /api/tasks` / `DELETE /api/tasks/:id` endpoints are defined in FRD-Task-Management. This FRD covers the frontend behavior of calling those endpoints from the board.

---

## 3. Board Page (`/board`)

### 3.1 Page Metadata

| Property       | Value                                                                 |
|----------------|-----------------------------------------------------------------------|
| Route          | `/board`                                                              |
| Auth Required  | Yes                                                                   |
| Page Title     | "TaskBoard" or "Board" (reflected in `<title>` or `<h1>`)            |
| Component Type | Client component (`'use client'`) — uses `useEffect` and `useState`  |

### 3.2 Auth Guard

Same pattern as `/profile` (see FRD-Profile §4):

1. On component mount, call `GET /api/auth/me` with `credentials: 'include'`.
2. If **401** → redirect to `/login` using `useRouter().push('/login')`.
3. If **200** → user is authenticated; proceed to fetch tasks and render the board.
4. If **network error** → show the bootstrap error state (see §3.2a).

#### 3.2a Bootstrap Error Handling

If the auth guard call (`GET /api/auth/me`) fails due to a network error (not a 401):
- Display a centered error message: **"Unable to load the board. Please check your connection and try again."**
- Show a **"Retry"** button that re-runs the full bootstrap sequence (auth check → task fetch).
- Do not render columns, task cards, or the create form in this state.

### 3.3 Board Layout

```
┌──────────────────────────────────────────────────────────┐
│  [NavBar — see FRD-Profile §5]                           │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  [Create Task Form — see FRD-Task-Management §6.1]       │
│                                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │
│  │ To Do (3)   │  │In Progress(1)│  │ Done (2)    │      │
│  ├─────────────┤  ├─────────────┤  ├─────────────┤      │
│  │ ┌─────────┐ │  │ ┌─────────┐ │  │ ┌─────────┐ │      │
│  │ │ Task A  │ │  │ │ Task D  │ │  │ │ Task E  │ │      │
│  │ │ desc... │ │  │ │ desc... │ │  │ │ desc... │ │      │
│  │ │ [→]     │ │  │ │ [←] [→] │ │  │ │ [←]     │ │      │
│  │ └─────────┘ │  │ └─────────┘ │  │ └─────────┘ │      │
│  │ ┌─────────┐ │  │             │  │ ┌─────────┐ │      │
│  │ │ Task B  │ │  │             │  │ │ Task F  │ │      │
│  │ │         │ │  │             │  │ │ desc... │ │      │
│  │ │ [→]     │ │  │             │  │ │ [←]     │ │      │
│  │ └─────────┘ │  │             │  │ └─────────┘ │      │
│  └─────────────┘  └─────────────┘  └─────────────┘      │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### 3.4 Column Structure

Three columns, always visible even when empty:

| Column | Status Value   | Header Text    | Position |
|--------|----------------|----------------|----------|
| 1      | `todo`         | "To Do"        | Left     |
| 2      | `in_progress`  | "In Progress"  | Center   |
| 3      | `done`         | "Done"         | Right    |

Each column header displays: **Column Name (count)** — e.g., "To Do (3)".

Tasks within each column are displayed in `createdAt` ascending order (oldest first), as required by PRD US-8.

**Responsive layout:**
- **Desktop:** Three columns side by side using CSS grid or flexbox.
- **Mobile:** Stacked vertically in a single column; all three sections visible with scroll.

### 3.5 Task Card

Each task card displays the following elements:

| Element        | Content               | Details                                                                                         |
|----------------|-----------------------|-------------------------------------------------------------------------------------------------|
| Title          | `task.title`          | Displayed in full (no truncation). Card expands vertically for long titles. Clickable to enter edit mode (see FRD-Task-Management §6.2). |
| Description    | `task.description`    | Truncated to ~100 characters with "..." if longer. Hidden entirely if empty string.             |
| Move controls  | Direction buttons     | See §4.                                                                                         |
| Delete button  | Delete icon/button    | See FRD-Task-Management §6.3.                                                                   |

**Card styling:** Tailwind CSS — card with border, padding, and slight shadow. Visually distinct from the column background.

---

## 4. Task Movement Controls

### 4.1 Movement Buttons

Each task card shows directional movement buttons based on its current status:

| Current Status | Available Moves          | Buttons Shown                              |
|----------------|--------------------------|--------------------------------------------|
| `todo`         | → `in_progress`          | [→] (right arrow or "Start" label)         |
| `in_progress`  | ← `todo`, → `done`      | [←] [→] (or "Back" / "Complete" labels)    |
| `done`         | ← `in_progress`          | [←] (left arrow or "Reopen" label)         |

- Buttons are positioned at the bottom of each task card.
- Arrow buttons or labeled buttons — agent's choice during implementation.
- A task **cannot** skip a status (e.g., cannot move directly from `todo` to `done`). The transition matrix is enforced by the API (see FRD-Task-Management §3.4).

### 4.2 Movement Behavior

1. User clicks a move button on a task card.
2. UI disables the button to prevent double-clicks.
3. Frontend sends `PATCH /api/tasks/:id` with `{ "status": "<new_status>" }` (see FRD-Task-Management §2.2 for full PATCH contract).
4. **On 200:** Move the task card to the destination column, maintaining `createdAt` sort order.
5. **On 400** (validation error): Show error toast — task stays in current column.
6. **On 404:** Remove the task from the board (it was deleted elsewhere).
7. **On 401:** Redirect to `/login`.
8. **On network error:** Show an error notification. Local state remains unchanged.
9. Re-enable the move button after the response is received.

### 4.3 No Drag-and-Drop

Drag-and-drop is explicitly **out of scope** for v1 (see PRD §3 Non-Goals). All task movement is button-based only.

---

## 5. Data Fetching

### 5.1 Initial Load

1. After the auth guard succeeds (§3.2), call `GET /api/tasks` with `credentials: 'include'`.
2. While loading, show a loading indicator (see §7).
3. **On 200:** Partition tasks by `status` into three column arrays, render the board.
4. **On 401:** Redirect to `/login` (defensive — shouldn't happen if auth guard passed).
5. **On network error or 5xx:** Show the error state (see §8).

### 5.2 State Management

- Board state is managed in the board page component via `useState`.
- After mutations (create, edit, delete, move), update local state directly from the API response rather than re-fetching all tasks.
- **Ordering invariant:** After any local state mutation (create, move, delete), each column's task array must remain sorted by `createdAt` ascending (oldest first). Newly created tasks are appended to the end of the "To Do" column. Moved tasks maintain their `createdAt` position in the destination column.
- If a mutation fails, local state must reflect the server state — no stale optimistic updates left behind.

### 5.3 Performance

- Board must load in under 2 seconds (PRD US-8 AC).
- For MVP with in-memory store, this is trivially achievable.
- No pagination needed for MVP (in-memory store won't have thousands of tasks).

---

## 6. Empty States

### 6.1 No Tasks At All

When the user has zero tasks:
- All three columns render with their headers and "(0)" count.
- A message displayed in the center or in the "To Do" column: **"No tasks yet. Create your first task above!"**

### 6.2 Empty Individual Column

When a specific column has no tasks but other columns have tasks:
- The column header still shows with "(0)" count.
- The column area remains visible (maintains the three-column layout).
- No placeholder text needed for individual empty columns — the global empty state in §6.1 handles the all-empty case.

---

## 7. Loading State

While the board data is being fetched:
- Display a loading indicator: either a spinner with **"Loading board…"** text, or skeleton column placeholders.
- Do **not** show the create task form until loading completes (to prevent submitting before auth is confirmed and tasks are loaded).

---

## 8. Error State

If `GET /api/tasks` fails (network error or 5xx):
- Display: **"Failed to load tasks. Please try again."**
- Show a **"Retry"** button that re-triggers the `GET /api/tasks` call.
- Columns are **not** rendered in error state.

---

## 9. Edge Cases

| Scenario                                     | Expected Behavior                                                                                                                        |
|----------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------|
| Board with 0 tasks                           | Three empty columns with header counts at (0). Friendly "No tasks yet. Create your first task above!" message.                           |
| Board with 100+ tasks in one column          | Scrollable column (CSS overflow). No pagination.                                                                                         |
| Move task then immediately move again         | Each move sends a PATCH. UI disables the button during the PATCH to prevent double-moves. Last write wins on the server.                 |
| Task moved by concurrent request             | N/A — single-user app with in-memory store. No concurrent modification possible.                                                         |
| API returns tasks in unexpected order         | Frontend partitions by status regardless of order. Order within columns is by `createdAt` ascending (oldest first).                      |
| Very long task title                          | Displayed in full on the card (no truncation for titles). Card expands vertically.                                                       |
| Very long description                         | Truncated to ~100 characters with "..." on the card. Full description visible in edit mode (FRD-Task-Management §6.2).                   |
| Empty description                             | Description area is hidden entirely on the card. Only title and controls are visible.                                                    |
| Browser back/forward to /board                | Auth guard re-runs, tasks re-fetch. Standard SPA behavior.                                                                               |
| Server restart while viewing board            | Next API call fails. Error state shown with retry. All tasks are lost (in-memory store — see PRD §3 Non-Goals).                          |
| Rapid status changes (click → click → click) | Each click is guarded by the disabled state during PATCH. Sequential moves are allowed after each PATCH completes.                        |

---

## 10. Traceability

| Requirement                                   | PRD Source  | Section(s)         |
|-----------------------------------------------|-------------|--------------------|
| Three columns: To Do, In Progress, Done       | US-8 AC     | §3.4               |
| Task card shows title + truncated description | US-8 AC     | §3.5               |
| Columns show task count                       | US-8 AC     | §3.4               |
| Board loads in under 2 seconds                | US-8 AC     | §5.3               |
| Move controls (forward/backward one step)     | US-9 AC     | §4.1               |
| Immediate update on move                      | US-9 AC     | §4.2               |
| No skip from To Do to Done                    | US-9 AC     | §4.1               |
| Done can move back to In Progress             | US-9 AC     | §4.1               |
| Auth required for board                       | FR-4        | §3.2               |
| Only authenticated user's tasks shown         | FR-2        | §2.1               |
| Board accessible at /board                    | FR-4        | §3.1               |
| Non-authenticated redirect to /login          | US-8 AC     | §3.2               |
