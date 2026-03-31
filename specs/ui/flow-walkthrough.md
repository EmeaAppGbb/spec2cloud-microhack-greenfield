# Flow Walkthrough — TaskBoard

> **Generated from:** prd.md, frd-auth.md, frd-profile.md, frd-rbac.md, frd-task-management.md, frd-task-board.md, screen-map.md, component-inventory.md
>
> **Purpose:** Step-by-step user journey documentation for downstream **e2e test generation** (Playwright specs + POMs) and **Gherkin scenario** authoring.

---

## Flow 1: New User Registration & First Login

**Covers:** US-1 (User Registration), US-2 (User Login), US-8 (View the Board)
**Actors:** New (unauthenticated) user
**Prototype refs:** `landing.html`, `register.html`, `login.html`, `board.html`

| # | User Action | Screen / Component | Expected Result | `data-testid` Selectors |
|---|-------------|-------------------|-----------------|------------------------|
| 1 | Opens the application root URL (`/`) | Landing Page | Sees heading "TaskBoard", description text, and two CTA buttons: "Login" and "Register". NavBar shows `nav-login` and `nav-register` links (unauthenticated state). | `nav-logo`, `nav-login`, `nav-register`, `hero-login-btn`, `hero-register-btn` |
| 2 | Clicks "Register" CTA button | Landing Page → Register Page | Navigates to `/register`. Sees a form card with "Register" heading, username input, password input, "Register" submit button, and footer link "Already have an account? Log in". | `username-input`, `password-input`, `register-button` |
| 3 | Submits the form with empty username | Register Page (FormCard) | Inline error appears: "Username is required". Form does not submit. | `username-input`, `error-message` |
| 4 | Enters a username ("testuser"), leaves password empty, clicks "Register" | Register Page (FormCard) | Inline error: "Password is required". | `username-input`, `password-input`, `register-button`, `error-message` |
| 5 | Enters password "short" (< 8 chars), clicks "Register" | Register Page (FormCard) | Inline error: "Password must be at least 8 characters". | `password-input`, `register-button`, `error-message` |
| 6 | Fills valid username "testuser" + valid password "secureP@ss1", clicks "Register" | Register Page (FormCard, Button) | Button disables, shows "Registering…" loading text. On 201 response, redirects to `/login?registered=true`. | `username-input`, `password-input`, `register-button` |
| 7 | Arrives at Login page after registration redirect | Login Page | Sees green success banner: "Registration successful. Please log in." Login form with username input, password input, "Log in" button. | `success-message`, `username-input`, `password-input`, `login-button` |
| 8 | Fills username "testuser" + password "secureP@ss1", clicks "Log in" | Login Page (FormCard, Button) | Button disables, shows "Logging in…". On 200 response (JWT cookie set), redirects to `/board`. | `username-input`, `password-input`, `login-button` |
| 9 | Arrives at Board page | Board Page | Sees NavBar with "Board", "Profile", "Logout" links (authenticated user state). Board shows three empty columns: "To Do (0)", "In Progress (0)", "Done (0)". Empty state message: "No tasks yet. Create your first task above!" Create task form visible above columns with title input, description input, and "Add Task" button. | `nav-board`, `nav-profile`, `nav-logout`, `column-todo`, `column-in-progress`, `column-done`, `column-count-todo`, `column-count-in-progress`, `column-count-done`, `create-task-form`, `task-title-input`, `task-description-input`, `create-task-btn` |

### Edge Cases

| Scenario | Expected Behavior | Selectors |
|----------|------------------|-----------|
| Register with an already-taken username | Inline error: "Username already exists" (409 response) | `error-message` |
| Register with special characters in username | Inline error: "Username must be between 3 and 30 characters and contain only letters, numbers, and underscores" | `error-message`, `username-error` |
| Login with wrong password | Inline error: "Invalid username or password" (401 response) | `error-message` |
| Login with empty fields | Inline error: "Username and password are required" (400 response) | `error-message` |

---

## Flow 2: Task Lifecycle on the Board

**Covers:** US-7 (Create a Task), US-8 (View the Board), US-9 (Move a Task)
**Actors:** Authenticated user
**Prototype ref:** `board.html`

| # | User Action | Screen / Component | Expected Result | `data-testid` Selectors |
|---|-------------|-------------------|-----------------|------------------------|
| 1 | User is on `/board` (authenticated, empty board) | Board Page | Three columns visible with (0) counts. Create task form at top. | `column-todo`, `column-in-progress`, `column-done`, `create-task-form` |
| 2 | Types "Write unit tests" in title input, "Cover auth module" in description, clicks "Add Task" | CreateTaskForm | Task card appears in "To Do" column. Column count updates to "To Do (1)". Form inputs clear. | `task-title-input`, `task-description-input`, `create-task-btn`, `column-count-todo`, `task-card-{id}`, `task-title-{id}`, `task-description-{id}` |
| 3 | Creates second task: "Design login page" (no description) | CreateTaskForm | Second task card appears in "To Do" below the first. Count updates to "To Do (2)". Description area is hidden on the card (empty description). | `create-task-btn`, `column-count-todo`, `column-cards-todo` |
| 4 | Creates third task: "Set up CI pipeline" | CreateTaskForm | Third task appears in "To Do". Count: "To Do (3)", "In Progress (0)", "Done (0)". | `column-count-todo` |
| 5 | Clicks [→] (move forward) on first task ("Write unit tests") | TaskCard (move button) | Task moves from "To Do" to "In Progress". Counts update: "To Do (2)", "In Progress (1)". Task card now shows [←] and [→] buttons. | `task-move-forward-{id}`, `column-count-todo`, `column-count-in-progress`, `task-move-back-{id}` |
| 6 | Clicks [→] on the task now in "In Progress" | TaskCard (move button) | Task moves to "Done". Counts: "To Do (2)", "In Progress (0)", "Done (1)". Task card now shows only [←] button (no forward from Done). | `task-move-forward-{id}`, `column-count-in-progress`, `column-count-done`, `task-move-back-{id}` |
| 7 | Clicks [←] on the task in "Done" | TaskCard (move button) | Task moves back to "In Progress". Counts: "To Do (2)", "In Progress (1)", "Done (0)". | `task-move-back-{id}`, `column-count-in-progress`, `column-count-done` |

### Edge Cases

| Scenario | Expected Behavior | Selectors |
|----------|------------------|-----------|
| Submit empty title in create form | Inline error: "Title is required". Task is not created. | `create-task-error` |
| Submit title > 120 chars | Inline error: "Title must be 120 characters or fewer". | `create-task-error` |
| Submit whitespace-only title | Inline error: "Title is required". | `create-task-error` |
| Rapid double-click on move button | Move button disables during PATCH request; only one move happens. | `task-move-forward-{id}`, `task-move-back-{id}` |
| Task in "To Do" column | Only [→] button shown (no [←]). | `task-move-forward-{id}` |
| Task in "Done" column | Only [←] button shown (no [→]). | `task-move-back-{id}` |

---

## Flow 3: Edit a Task

**Covers:** US-10 (Edit a Task)
**Actors:** Authenticated user with at least one task
**Prototype ref:** `board.html`

| # | User Action | Screen / Component | Expected Result | `data-testid` Selectors |
|---|-------------|-------------------|-----------------|------------------------|
| 1 | Clicks on a task's title (or edit button) on a task card | TaskCard → TaskEditForm | Card transforms to inline edit mode: title input pre-populated with current title, description textarea pre-populated with current description, "Save" and "Cancel" buttons visible. | `task-title-{id}` or `task-edit-{id}`, `task-edit-title-input`, `task-edit-description-input`, `task-edit-save-btn`, `task-edit-cancel-btn` |
| 2 | Changes the title to "Write integration tests", clicks "Save" | TaskEditForm | PATCH request sent. On 200: card returns to normal view with updated title "Write integration tests". | `task-edit-title-input`, `task-edit-save-btn`, `task-title-{id}` |
| 3 | Clicks edit on same task, clears description, clicks "Save" | TaskEditForm | Description saved as empty string. Card returns to normal view — description area hidden (empty). | `task-edit-description-input`, `task-edit-save-btn` |
| 4 | Clicks edit on a task, clicks "Cancel" | TaskEditForm → TaskCard | Edit form disappears. Card returns to normal view with original (unchanged) values. | `task-edit-cancel-btn`, `task-title-{id}` |

### Edge Cases

| Scenario | Expected Behavior | Selectors |
|----------|------------------|-----------|
| Clear title and click Save | Validation error: title input border turns red. Save is rejected. Empty title is not allowed. | `task-edit-title-input`, `task-edit-save-btn` |
| Edit title to > 120 chars and Save | Server returns 400: "Title must be 120 characters or fewer". Error displayed. | `task-edit-title-input` |
| Edit title to whitespace-only | Server returns 400: "Title is required". | `task-edit-title-input` |

---

## Flow 4: Delete a Task

**Covers:** US-11 (Delete a Task)
**Actors:** Authenticated user with at least one task
**Prototype ref:** `board.html`

| # | User Action | Screen / Component | Expected Result | `data-testid` Selectors |
|---|-------------|-------------------|-----------------|------------------------|
| 1 | Clicks delete button (trash icon) on a task card | TaskCard (delete button) | Confirmation dialog appears: "Are you sure you want to delete this task?" with "Confirm" and "Cancel" buttons. | `task-delete-{id}` |
| 2 | Clicks "Confirm" in the dialog | Delete Confirmation Dialog | DELETE request sent. On 204: task card disappears from the column. Column count decrements. | `task-delete-{id}` |
| 3 | (Alternative) Clicks "Cancel" in the dialog | Delete Confirmation Dialog | Dialog closes. Task remains in its column unchanged. | `task-delete-{id}` |

### Edge Cases

| Scenario | Expected Behavior | Selectors |
|----------|------------------|-----------|
| Delete the last task in a column | Column shows (0) count. If all columns are empty, global empty message appears: "No tasks yet. Create your first task above!" | `column-count-todo`, `column-count-in-progress`, `column-count-done` |
| Task already deleted (404 from server) | Error shown; board refreshes to reflect current state. | `task-delete-{id}` |

---

## Flow 5: View Profile

**Covers:** US-3 (View Profile), US-5 (User Logout)
**Actors:** Authenticated user
**Prototype ref:** `profile.html`

| # | User Action | Screen / Component | Expected Result | `data-testid` Selectors |
|---|-------------|-------------------|-----------------|------------------------|
| 1 | Clicks "Profile" link in NavBar | NavBar → Profile Page | Navigates to `/profile`. Loading spinner with "Loading profile…" shown while `GET /api/auth/me` is in flight. | `nav-profile` |
| 2 | Profile data loads (200 OK) | ProfileCard | Centered profile card displays: username (e.g., "testuser"), role badge ("user" or "admin"), "Member since" date (e.g., "January 15, 2025"). "Logout" button below the card. | `profile-heading`, `profile-username`, `profile-role`, `profile-created-at`, `profile-logout-btn` |
| 3 | Clicks "Logout" button | ProfileCard (Button) | `POST /api/auth/logout` sent. JWT cookie cleared. Redirects to `/login`. NavBar transitions to unauthenticated state. | `profile-logout-btn` |
| 4 | Attempts to navigate to `/board` after logout | Login Page | Redirected to `/login` (auth guard triggers 401 → redirect). | `login-button` |

### Edge Cases

| Scenario | Expected Behavior | Selectors |
|----------|------------------|-----------|
| Profile page load fails (network error) | Error message: "Failed to load profile. Please try again." with "Retry" button. | — |
| Unauthenticated user visits `/profile` directly | Redirected to `/login`. | — |
| Admin user views profile | Role badge shows "admin" instead of "user". | `profile-role` |

---

## Flow 6: Admin Dashboard (Admin User)

**Covers:** US-4 (Role-Based Access)
**Actors:** Authenticated user with `admin` role; also tests non-admin denial
**Prototype ref:** `admin.html`

| # | User Action | Screen / Component | Expected Result | `data-testid` Selectors |
|---|-------------|-------------------|-----------------|------------------------|
| 1 | Admin user clicks "Admin" link in NavBar | NavBar → Admin Page | Navigates to `/admin`. "Loading users…" indicator while `GET /api/admin/users` is in flight. | `nav-admin` |
| 2 | Admin users data loads (200 OK) | DataTable | Page title "Admin Dashboard" (h1). Users table with columns: Username, Role, Member Since. Each row shows user data with role badge. At minimum, the admin's own row is present. | `admin-users-table`, `user-row-{username}-username`, `user-row-{username}-role`, `user-row-{username}-since` |
| 3 | (Non-admin scenario) Regular user navigates to `/admin` directly | ForbiddenPage | Auth guard checks role from `GET /api/auth/me`. Non-admin user sees: heading "403 Forbidden", message "You do not have permission to view this page." No users table rendered. User stays on `/admin` (no redirect). | `admin-forbidden`, `admin-forbidden-heading`, `admin-forbidden-message` |

### Edge Cases

| Scenario | Expected Behavior | Selectors |
|----------|------------------|-----------|
| Unauthenticated user visits `/admin` | Redirected to `/login` (auth guard 401). | — |
| Admin is the only user | Table shows exactly one row (the admin themselves). | `admin-users-table` |
| API returns error loading users | Error message: "Failed to load users." displayed. | — |

---

## Flow 7: Navigation Awareness

**Covers:** US-6 (Navigation Awareness)
**Actors:** Unauthenticated user, authenticated `user`, authenticated `admin`
**Prototype refs:** `landing.html`, `board.html`, `admin.html`

| # | User Action / State | Screen / Component | Expected Result | `data-testid` Selectors |
|---|--------------------|--------------------|-----------------|------------------------|
| 1 | **Unauthenticated** — user visits any page | NavBar (State A) | NavBar shows: app name "TaskBoard" (links to `/`), "Login" link, "Register" link. No Board, Profile, Admin, or Logout links. | `navbar`, `nav-logo`, `nav-login`, `nav-register` |
| 2 | **Authenticated (user role)** — after login | NavBar (State B) | NavBar shows: app name "TaskBoard", "Board" link, "Profile" link, "Logout" button. No Login, Register, or Admin links. | `navbar`, `nav-logo`, `nav-board`, `nav-profile`, `nav-logout` |
| 3 | **Authenticated (admin role)** — admin after login | NavBar (State C) | NavBar shows: app name "TaskBoard", "Board" link, "Profile" link, "Admin" link, "Logout" button. No Login or Register links. | `navbar`, `nav-logo`, `nav-board`, `nav-profile`, `nav-admin`, `nav-logout` |
| 4 | **Auth check in-flight** — page loading | NavBar (Loading) | NavBar shows only the app name "TaskBoard". No navigation links or buttons are visible (prevents flash of incorrect state). | `navbar`, `nav-logo` |
| 5 | User clicks "Logout" from NavBar | NavBar (any authenticated state) | `POST /api/auth/logout` sent. Cookie cleared. Redirect to `/login`. NavBar transitions to unauthenticated state (State A). | `nav-logout` |

### Edge Cases

| Scenario | Expected Behavior | Selectors |
|----------|------------------|-----------|
| API unreachable during auth check | NavBar falls back to unauthenticated state (State A). No error shown in NavBar itself. | `nav-login`, `nav-register` |
| Session expires while on page | Next API call returns 401. Page redirects to `/login`. NavBar transitions to unauthenticated. | — |

---

## Flow Summary Matrix

| Flow | User Stories | Start Screen | End Screen | Key Transitions |
|------|-------------|-------------|------------|-----------------|
| 1: Registration & First Login | US-1, US-2, US-8 | Landing (`/`) | Board (`/board`) | `/` → `/register` → `/login` → `/board` |
| 2: Task Lifecycle | US-7, US-8, US-9 | Board (`/board`) | Board (`/board`) | Create → Move forward → Move forward → Move back |
| 3: Edit a Task | US-10 | Board (`/board`) | Board (`/board`) | View → Edit mode → Save/Cancel → View |
| 4: Delete a Task | US-11 | Board (`/board`) | Board (`/board`) | View → Delete confirm → Remove |
| 5: View Profile | US-3, US-5 | Board (`/board`) | Login (`/login`) | `/board` → `/profile` → Logout → `/login` |
| 6: Admin Dashboard | US-4 | Board (`/board`) | Admin (`/admin`) | `/board` → `/admin` (admin) or 403 (non-admin) |
| 7: Navigation Awareness | US-6 | Any page | Any page | NavBar state transitions based on auth |

---

## `data-testid` Master Reference

All selectors referenced in the flows above, grouped by component for POM generation:

### NavBar
`navbar`, `nav-logo`, `nav-login`, `nav-register`, `nav-board`, `nav-profile`, `nav-admin`, `nav-logout`

### Landing Page
`hero-login-btn`, `hero-register-btn`

### Register Page
`username-input`, `password-input`, `register-button`, `error-message`, `username-error`, `password-error`

### Login Page
`username-input`, `password-input`, `login-button`, `error-message`, `success-message`

### Board Page — Create Task Form
`create-task-form`, `task-title-input`, `task-description-input`, `create-task-btn`, `create-task-error`

### Board Page — Columns
`column-todo`, `column-in-progress`, `column-done`, `column-count-todo`, `column-count-in-progress`, `column-count-done`, `column-cards-todo`, `column-cards-in-progress`, `column-cards-done`

### Board Page — Task Cards (dynamic `{id}`)
`task-card-{id}`, `task-title-{id}`, `task-description-{id}`, `task-move-forward-{id}`, `task-move-back-{id}`, `task-edit-{id}`, `task-delete-{id}`

### Board Page — Task Edit Form
`task-edit-title-input`, `task-edit-description-input`, `task-edit-save-btn`, `task-edit-cancel-btn`

### Profile Page
`profile-heading`, `profile-username`, `profile-role`, `profile-created-at`, `profile-logout-btn`

### Admin Page
`admin-users-table`, `user-row-{username}-username`, `user-row-{username}-role`, `user-row-{username}-since`, `admin-forbidden`, `admin-forbidden-heading`, `admin-forbidden-message`
