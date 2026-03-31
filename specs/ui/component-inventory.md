# TaskBoard Component Inventory

> Extracted from HTML prototypes in `specs/ui/prototypes/`. Each component is documented with its canonical name, props, states, screens, HTML structure, and `data-testid` values for downstream Gherkin, E2E, and implementation phases.

---

## Navigation

### 1. NavBar

| Field | Details |
|-------|---------|
| **Description** | Persistent top navigation bar rendered on every screen with three authentication states: unauthenticated, authenticated (user), and authenticated (admin). |
| **Props** | `authState` (`"unauth"` \| `"user"` \| `"admin"`), `activePage` (current route for highlight) |
| **States** | **Unauthenticated** — shows Login + Register links. **User** — shows Board, Profile links + Logout button. **Admin** — shows Board, Profile, Admin links + Logout button. |
| **Screens** | ALL (landing, login, register, board, profile, admin) |
| **HTML structure** | `<nav class="nav">` containing logo `<a>` and a `<div class="flex gap-4">` with link/button children. |
| **CSS classes** | `.nav`, `.font-bold`, `.text-lg`, `.btn`, `.btn-secondary` (Logout button), `.nav-links` (unauth only) |
| **`data-testid` values** | `navbar`, `nav-logo`, `nav-login`, `nav-register`, `nav-board`, `nav-profile`, `nav-admin`, `nav-logout` |

**Auth-state link visibility:**

| Link / Button | Unauth | User | Admin |
|---------------|--------|------|-------|
| `nav-login` | ✓ | — | — |
| `nav-register` | ✓ | — | — |
| `nav-board` | — | ✓ | ✓ |
| `nav-profile` | — | ✓ | ✓ |
| `nav-admin` | — | — | ✓ |
| `nav-logout` | — | ✓ | ✓ |

---

## Forms

### 2. Button

| Field | Details |
|-------|---------|
| **Description** | General-purpose button with primary, secondary, and danger variants. |
| **Props** | `variant` (`"primary"` \| `"secondary"` \| `"danger"`), `label` (text), `type` (`"button"` \| `"submit"`), `disabled` (boolean) |
| **States** | **Default** — normal appearance per variant. **Hover** — primary darkens (`--color-primary-hover`), secondary gets alt bg, danger reduces opacity. **Loading** — disabled + text changes to "Loading…" / "Logging in…" / "Registering…". **Disabled** — `background: var(--color-secondary)`, `cursor: not-allowed`. |
| **Screens** | ALL |
| **HTML structure** | `<button class="btn btn-{variant}">` or `<a class="btn btn-{variant}">` |
| **CSS classes** | `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-danger`, `.form-submit` (full-width variant) |
| **`data-testid` values** | Context-specific: `login-button`, `register-button`, `create-task-btn`, `hero-login-btn`, `hero-register-btn`, `nav-logout`, `profile-logout-btn`, `task-edit-save-btn`, `task-edit-cancel-btn`, `toggle-403-btn` |

### 3. TextInput

| Field | Details |
|-------|---------|
| **Description** | Single-line text input with label and inline error display. |
| **Props** | `label` (string), `placeholder` (string), `required` (boolean), `maxLength` (number), `type` (`"text"` \| `"password"`), `autocomplete` (string) |
| **States** | **Default** — `border: 1px solid var(--color-border)`. **Focus** — `border-color: var(--color-primary)` + blue box-shadow ring. **Error** — `border-color: var(--color-error)` (`.input-error` class) + red box-shadow on focus. |
| **Screens** | login, register, board (create task form, edit task form) |
| **HTML structure** | `<div class="form-group"><label>…</label><input class="input" …><div class="field-error">…</div></div>` |
| **CSS classes** | `.input`, `.input-error`, `.form-group` |
| **`data-testid` values** | `username-input`, `password-input`, `task-title-input`, `task-description-input`, `task-edit-title-input` |

### 4. TextArea

| Field | Details |
|-------|---------|
| **Description** | Multi-line text input sharing the same `.input` styling as TextInput. |
| **Props** | `placeholder` (string), `rows` (number, default 2) |
| **States** | **Default**, **Focus** — same as TextInput. |
| **Screens** | board (task edit form) |
| **HTML structure** | `<textarea class="input" rows="2">…</textarea>` |
| **CSS classes** | `.input`, `.edit-form textarea.input` (resize: vertical, min-height: 60px) |
| **`data-testid` values** | `task-edit-description-input` |

### 5. FormCard

| Field | Details |
|-------|---------|
| **Description** | Centered card container for authentication forms (login, register). Provides consistent width, padding, heading, and footer link layout. |
| **Props** | `heading` (string), `footerText` (string), `footerLinkText` (string), `footerLinkHref` (string) |
| **States** | **Default** — card with heading + form fields. **With success banner** — shows SuccessMessage above form (login page after registration). **With error banner** — shows ErrorMessage above form. |
| **Screens** | login, register |
| **HTML structure** | `<div class="form-card card"><h1>…</h1>[banners]<form>…</form><div class="form-footer">…</div></div>` wrapped in `<main class="page-center">` |
| **CSS classes** | `.card`, `.form-card`, `.page-center`, `.form-group`, `.form-submit`, `.form-footer` |
| **`data-testid` values** | None directly on the card; children have their own test IDs |

### 6. CreateTaskForm

| Field | Details |
|-------|---------|
| **Description** | Inline form at the top of the board page for creating new tasks with title and optional description. |
| **Props** | None (self-contained) |
| **States** | **Default** — empty inputs with placeholders. **Error** — shows "Title is required" or "Title must be 120 characters or fewer" error message below the form row. **Submitting** — clears inputs after successful creation. |
| **Screens** | board |
| **HTML structure** | `<form class="create-task-form"><div class="form-row"><div class="input-group">…</div><div class="input-group">…</div><button>…</button></div><div class="form-error">…</div></form>` |
| **CSS classes** | `.create-task-form`, `.form-row`, `.input-group`, `.input`, `.btn`, `.btn-primary`, `.form-error`, `.form-error.visible` |
| **`data-testid` values** | `create-task-form`, `task-title-input`, `task-description-input`, `create-task-btn`, `create-task-error` |

---

## Board

### 7. BoardColumn

| Field | Details |
|-------|---------|
| **Description** | A vertical column on the task board representing a workflow status (To Do, In Progress, Done). Contains a header with task count and a list of TaskCards. |
| **Props** | `title` (`"To Do"` \| `"In Progress"` \| `"Done"`), `status` (`"todo"` \| `"in-progress"` \| `"done"`), `backgroundColor` (per-status color token) |
| **States** | **Populated** — contains one or more TaskCards. **Empty** — shows italic "No tasks" message (`.empty-column-msg`). |
| **Screens** | board |
| **HTML structure** | `<div class="column column-{status}"><div class="column-header">Title <span class="column-count">(N)</span></div><div class="column-cards">…</div></div>` |
| **CSS classes** | `.column`, `.column-todo` (`--color-todo`), `.column-in-progress` (`--color-in-progress`), `.column-done` (`--color-done`), `.column-header`, `.column-count`, `.column-cards`, `.empty-column-msg` |
| **`data-testid` values** | `column-todo`, `column-in-progress`, `column-done`, `column-count-todo`, `column-count-in-progress`, `column-count-done`, `column-cards-todo`, `column-cards-in-progress`, `column-cards-done` |

### 8. TaskCard

| Field | Details |
|-------|---------|
| **Description** | Individual task card displayed within a BoardColumn. Shows title, optional description, and action buttons for moving, editing, and deleting. |
| **Props** | `id` (number), `title` (string), `description` (string, optional), `status` (column position determines available move actions) |
| **States** | **Default** — shows title, description, move/edit/delete buttons. **Hover** — card gets `box-shadow: var(--shadow-md)`, title text turns blue with underline on hover. **Editing** — replaced by TaskEditForm inline. **First column** — no "move back" button. **Last column** — no "move forward" button. |
| **Screens** | board |
| **HTML structure** | `<div class="task-card"><div class="task-card-header"><button class="task-title">…</button></div>[description div]<div class="task-actions"><div class="move-buttons">…</div><div class="card-meta-actions">…</div></div></div>` |
| **CSS classes** | `.task-card`, `.task-card-header`, `.task-title`, `.task-description`, `.task-actions`, `.move-buttons`, `.card-meta-actions`, `.btn-icon`, `.btn-icon-move`, `.btn-icon-danger` |
| **`data-testid` values** | `task-card-{id}`, `task-title-{id}`, `task-description-{id}`, `task-move-forward-{id}`, `task-move-back-{id}`, `task-edit-{id}`, `task-delete-{id}` |

### 9. TaskEditForm

| Field | Details |
|-------|---------|
| **Description** | Inline edit form that replaces a TaskCard when the user clicks edit or the task title. Contains pre-populated title input, description textarea, and Save/Cancel buttons. |
| **Props** | `taskId` (number), `currentTitle` (string), `currentDescription` (string) |
| **States** | **Default** — inputs pre-filled with current values. **Validation error** — title input border turns red if submitted empty. |
| **Screens** | board |
| **HTML structure** | `<div class="task-card"><form class="edit-form"><input class="input" …><textarea class="input" …></textarea><div class="edit-actions"><button class="btn btn-primary">Save</button><button class="btn btn-secondary">Cancel</button></div></form></div>` |
| **CSS classes** | `.task-card`, `.edit-form`, `.input`, `.edit-actions`, `.btn`, `.btn-primary`, `.btn-secondary` |
| **`data-testid` values** | `task-edit-title-input`, `task-edit-description-input`, `task-edit-save-btn`, `task-edit-cancel-btn` |

---

## Data Display

### 10. Badge

| Field | Details |
|-------|---------|
| **Description** | Small colored pill label used for status indicators and role labels. |
| **Props** | `variant` (`"todo"` \| `"in-progress"` \| `"done"` \| `"admin"` \| `"user"`), `text` (string) |
| **States** | Static — no interactive states. Variant determines background/text color. |
| **Screens** | admin (role badges in users table), profile (role badge) |
| **HTML structure** | `<span class="badge badge-{variant}">text</span>` |
| **CSS classes** | `.badge`, `.badge-todo` (`bg: --color-todo`, `color: --color-primary`), `.badge-in-progress` (`bg: --color-in-progress`, `color: --color-warning`), `.badge-done` (`bg: --color-done`, `color: --color-accent`), `.badge-admin` (`bg: --color-todo`, `color: --color-primary`), `.badge-user` (`bg: --color-bg-alt`, `color: --color-secondary`) |
| **`data-testid` values** | `profile-role`, `user-row-{username}-role` |

### 11. DataTable

| Field | Details |
|-------|---------|
| **Description** | Full-width table with alternating row backgrounds, used on the admin page to display user data. |
| **Props** | `columns` (array of header labels), `rows` (array of row data) |
| **States** | **Populated** — shows header row + data rows with alternating stripes. **Empty** — not currently shown in prototypes. |
| **Screens** | admin |
| **HTML structure** | `<table><thead><tr><th>…</th></tr></thead><tbody><tr><td>…</td></tr></tbody></table>` wrapped in `.card` |
| **CSS classes** | `table`, `th`, `td`, `tr:nth-child(even)` (`.color-bg-alt`), `.card` (wrapper) |
| **`data-testid` values** | `admin-users-table`, `user-row-{username}-username`, `user-row-{username}-role`, `user-row-{username}-since` |

### 12. ProfileCard

| Field | Details |
|-------|---------|
| **Description** | Centered card displaying the authenticated user's profile information: username, role badge, and membership date, with a logout button. |
| **Props** | `username` (string), `role` (string), `createdAt` (string) |
| **States** | Static — displays read-only user information. |
| **Screens** | profile |
| **HTML structure** | `<div class="card profile-card"><h1>…</h1><div class="profile-field"><div class="profile-field-label">…</div><div class="profile-field-value">…</div></div>…<div class="profile-logout"><button class="btn btn-primary">Logout</button></div></div>` wrapped in `<main class="profile-container">` |
| **CSS classes** | `.card`, `.profile-card`, `.profile-container`, `.profile-field`, `.profile-field-label`, `.profile-field-value`, `.badge`, `.badge-user`, `.profile-logout` |
| **`data-testid` values** | `profile-heading`, `profile-username`, `profile-role`, `profile-created-at`, `profile-logout-btn` |

---

## Feedback

### 13. ErrorMessage

| Field | Details |
|-------|---------|
| **Description** | Inline error display used in two forms: (a) form-level error banner above all fields, and (b) field-level error text below an individual input. |
| **Props** | `message` (string), `level` (`"banner"` \| `"field"`) |
| **States** | **Hidden** — `display: none` (default). **Visible** — shown when validation fails. |
| **Screens** | login (banner), register (banner + field-level), board (field-level for create task) |
| **HTML structure** | **Banner:** `<div class="error-banner">message</div>`. **Field:** `<div class="field-error">message</div>`. **Board:** `<div class="form-error">message</div>` (with `.visible` class toggle). |
| **CSS classes** | `.error-banner` (`bg: #fef2f2`, `color: --color-error`), `.field-error` (`color: --color-error`, `font-size: --text-xs`), `.form-error` + `.form-error.visible` |
| **`data-testid` values** | `error-message` (banner), `username-error`, `password-error` (field-level on register), `create-task-error` (board form) |

### 14. SuccessMessage

| Field | Details |
|-------|---------|
| **Description** | Success banner displayed at the top of a form to confirm a completed action (e.g., "Registration successful. Please log in."). |
| **Props** | `message` (string) |
| **States** | **Hidden** — `display: none` (default, unless `?registered=true` query param is present). **Visible** — green banner with success text. |
| **Screens** | login (shown after redirect from registration) |
| **HTML structure** | `<div class="success-banner">message</div>` |
| **CSS classes** | `.success-banner` (`bg: --color-done`, `color: --color-accent`, `border-radius: --radius-md`) |
| **`data-testid` values** | `success-message` |

### 15. ForbiddenPage

| Field | Details |
|-------|---------|
| **Description** | Full-page 403 Forbidden display shown when a non-admin user attempts to access the admin page. |
| **Props** | None |
| **States** | Static — centered heading and message. Toggled via JS in prototype (hidden by default). |
| **Screens** | admin (when user role is not admin) |
| **HTML structure** | `<div class="forbidden-container"><div><h1>403 Forbidden</h1><p>You do not have permission to view this page.</p></div></div>` |
| **CSS classes** | `.forbidden-container` (centered flex layout, `min-height: calc(100vh - 57px)`), `h1` (`color: --color-error`) |
| **`data-testid` values** | `admin-forbidden`, `admin-forbidden-heading`, `admin-forbidden-message` |

---

## Cross-Reference: Component × Screen Matrix

| Component | Landing | Login | Register | Board | Profile | Admin |
|-----------|:-------:|:-----:|:--------:|:-----:|:-------:|:-----:|
| NavBar | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Button | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| TextInput | — | ✓ | ✓ | ✓ | — | — |
| TextArea | — | — | — | ✓ | — | — |
| FormCard | — | ✓ | ✓ | — | — | — |
| CreateTaskForm | — | — | — | ✓ | — | — |
| BoardColumn | — | — | — | ✓ | — | — |
| TaskCard | — | — | — | ✓ | — | — |
| TaskEditForm | — | — | — | ✓ | — | — |
| Badge | — | — | — | — | ✓ | ✓ |
| DataTable | — | — | — | — | — | ✓ |
| ProfileCard | — | — | — | — | ✓ | — |
| ErrorMessage | — | ✓ | ✓ | ✓ | — | — |
| SuccessMessage | — | ✓ | — | — | — | — |
| ForbiddenPage | — | — | — | — | — | ✓ |

---

## Design System Reference

All components use CSS custom properties from `specs/ui/design-system.md`. Key tokens:

- **Colors:** `--color-primary`, `--color-primary-hover`, `--color-error`, `--color-accent`, `--color-warning`, `--color-border`, `--color-bg-alt`
- **Typography:** `--text-xs` through `--text-3xl`, `--font-medium` / `--font-semibold` / `--font-bold`
- **Spacing:** 4px grid (`--space-1` through `--space-16`)
- **Borders:** `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-full`
- **Shadows:** `--shadow-sm`, `--shadow-md`, `--shadow-lg`
- **Status colors:** `--color-todo` (blue), `--color-in-progress` (yellow), `--color-done` (green)
