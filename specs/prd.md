# Product Requirements Document — TaskBoard

## 1. Overview

A personal task management board with user authentication. Users register and log in to access a Kanban-style board where they can create, organize, and track tasks across three columns: To Do, In Progress, and Done. Each user sees only their own tasks. The app consists of a Next.js frontend and an Express.js backend API, with authentication as the gateway to the board experience.

## 2. Goals

- Provide a simple, secure user registration and login flow.
- Allow authenticated users to create, view, move, edit, and delete personal tasks on a Kanban board.
- Allow authenticated users to view their profile information.
- Establish a clean separation between frontend (Next.js) and backend (Express API).
- Demonstrate a spec-driven, full-stack app that can be deployed and tested on Azure Container Apps.

## 3. Non-Goals

- Multi-user collaboration (each user manages only their own tasks).
- Due dates, priorities, or labels on tasks.
- Persistence beyond the server process lifetime (in-memory store is acceptable for MVP).
- Drag-and-drop task movement (buttons are used instead for v1).
- Email verification or password reset.
- OAuth / social login.

## 4. User Stories

### US-1: User Registration
**As a** new user,
**I want to** register with a username and password,
**So that** I can create an account and access the application.

**Acceptance Criteria:**
- User provides a unique username (3–30 characters, alphanumeric and underscores only).
- User provides a password (minimum 8 characters).
- If the username is already taken, an error message is displayed.
- If registration succeeds, the user is redirected to the login page with a success message.
- Passwords are hashed before storage (never stored in plain text).

### US-2: User Login
**As a** registered user,
**I want to** log in with my username and password,
**So that** I can access my task board.

**Acceptance Criteria:**
- User provides their username and password on the login page.
- If credentials are valid, the user is authenticated and redirected to `/board`.
- If credentials are invalid, an error message is displayed ("Invalid username or password").
- Authentication uses a session token (JWT) stored in an HTTP-only cookie.
- The login page is accessible at `/login`.

### US-3: View Profile
**As an** authenticated user,
**I want to** view my profile page,
**So that** I can see my account information.

**Acceptance Criteria:**
- The profile page displays the user's username and the date their account was created.
- The profile page is accessible at `/profile`.
- If a non-authenticated user tries to access `/profile`, they are redirected to `/login`.

### US-4: Role-Based Access
**As an** administrator,
**I want to** have elevated privileges compared to regular users,
**So that** I can access an admin dashboard to view all registered users.

**Acceptance Criteria:**
- Two roles exist: `user` (default) and `admin`.
- New registrations are assigned the `user` role by default.
- The first registered user is automatically assigned the `admin` role.
- Admin users can access `/admin` to see a list of all registered users (username, role, createdAt).
- Regular users who try to access `/admin` see a 403 Forbidden page.
- The user's role is displayed on their profile page.

### US-5: User Logout
**As an** authenticated user,
**I want to** log out,
**So that** I can end my session securely.

**Acceptance Criteria:**
- A logout button is visible in the navigation bar.
- Clicking logout clears the session token and redirects the user to the login page.
- After logout, accessing `/board` or `/profile` redirects to `/login`.

### US-6: Navigation Awareness
**As an** authenticated user,
**I want to** see navigation links appropriate to my role,
**So that** I can easily access the pages available to me.

**Acceptance Criteria:**
- All authenticated users see links to Board, Profile, and Logout in the navigation.
- Admin users additionally see a link to the Admin dashboard.
- Non-authenticated users see links to Login and Register.

### US-7: Create a Task
**As an** authenticated user,
**I want to** create a new task with a title and optional description,
**So that** I can track work I need to do.

**Acceptance Criteria:**
- A form is available on the board page with a required title field (max 120 characters) and an optional description field.
- Submitting the form with an empty title displays a validation error.
- On successful creation, the task appears immediately in the "To Do" column without a page reload.
- The created task belongs to the authenticated user.

### US-8: View the Board
**As an** authenticated user,
**I want to** see my tasks organized in columns by status,
**So that** I can understand the state of my work at a glance.

**Acceptance Criteria:**
- The board page is accessible at `/board`.
- If a non-authenticated user tries to access `/board`, they are redirected to `/login`.
- The board displays three columns: To Do, In Progress, and Done.
- Each task card shows the task title and a truncated description.
- Each column header shows the count of tasks in that column.
- The board loads in under 2 seconds.
- Only the authenticated user's tasks are displayed.
- Tasks within each column are ordered by creation date, oldest first.

### US-9: Move a Task
**As an** authenticated user,
**I want to** move a task between columns,
**So that** I can update its progress.

**Acceptance Criteria:**
- Each task card has controls to move it forward or backward one status step.
- Status transitions follow the order: To Do ↔ In Progress ↔ Done.
- A task cannot skip a status (e.g., cannot move directly from To Do to Done).
- The task's position updates immediately without a page reload.

### US-10: Edit a Task
**As an** authenticated user,
**I want to** edit the title and description of an existing task,
**So that** I can correct or update task details.

**Acceptance Criteria:**
- Clicking on a task card allows the user to edit its title and description.
- An empty title is not allowed; a validation error is displayed.
- Changes persist immediately without a page reload.

### US-11: Delete a Task
**As an** authenticated user,
**I want to** delete a task,
**So that** I can remove tasks I no longer need.

**Acceptance Criteria:**
- Each task card has a delete button.
- Clicking the delete button shows a confirmation prompt before deletion.
- After confirmation, the task is removed and disappears immediately from the board.

## 5. Functional Requirements

### FR-1: Authentication API
| Endpoint | Method | Description |
|---|---|---|
| `/api/auth/register` | POST | Register a new user. Body: `{ username, password }`. Returns 201 on success, 409 if username taken, 400 on validation error. |
| `/api/auth/login` | POST | Authenticate a user. Body: `{ username, password }`. Returns 200 with JWT cookie on success, 401 on failure. |
| `/api/auth/logout` | POST | Clear the session cookie. Returns 200. |
| `/api/auth/me` | GET | Return the current authenticated user's profile. Returns 200 with `{ username, role, createdAt }`, or 401 if not authenticated. |
| `/api/admin/users` | GET | Return a list of all users (admin only). Returns 200 with `[{ username, role, createdAt }]`, or 401/403. |

### FR-2: Task API
| Endpoint | Method | Description |
|---|---|---|
| `/api/tasks` | GET | List all tasks for the authenticated user. Returns 200 with `[{ id, title, description, status, createdAt }]`. Returns 401 if not authenticated. |
| `/api/tasks` | POST | Create a task. Body: `{ title, description? }`. Returns 201 with the created task. Returns 401 if not authenticated, 400 on validation error. |
| `/api/tasks/:id` | PATCH | Update a task's title, description, or status. Returns 200 with the updated task. Returns 401 if not authenticated, 404 if not found or not owned by user. |
| `/api/tasks/:id` | DELETE | Delete a task. Returns 204. Returns 401 if not authenticated, 404 if not found or not owned by user. |

### FR-3: Data Model
- **User**: `{ id: string (UUID), username: string (unique), passwordHash: string, role: 'user' | 'admin', createdAt: Date }`
- **Task**: `{ id: string (UUID), userId: string, title: string, description: string, status: 'todo' | 'in_progress' | 'done', createdAt: Date }`
- Storage: In-memory store for both users and tasks (no external database required for this MVP).

### FR-4: Frontend Pages
| Route | Description | Auth Required |
|---|---|---|
| `/` | Landing page with links to Login and Register | No |
| `/login` | Login form (username + password) | No |
| `/register` | Registration form (username + password) | No |
| `/board` | Kanban task board with three columns (To Do, In Progress, Done) | Yes |
| `/profile` | Displays user profile info (including role) | Yes |
| `/admin` | Lists all registered users (username, role, createdAt) | Yes (admin only) |

### FR-5: Security
- Passwords hashed with bcrypt (cost factor ≥ 10).
- JWT tokens signed with a server-side secret (from environment variable `JWT_SECRET`).
- JWT stored in HTTP-only, Secure, SameSite=Strict cookie.
- JWT expiry: 24 hours.
- All API errors return consistent JSON shape: `{ error: string }`.
- Admin-only endpoints must verify the user's role from the JWT; return 403 if role is not `admin`.
- All task API endpoints require authentication; return 401 if not authenticated.
- Task operations are scoped to the authenticated user; users cannot access or modify other users' tasks.
- The API must allow CORS requests from the frontend origin with `Access-Control-Allow-Credentials: true`. In development, allow `http://localhost:3000` and `http://localhost:3001`. In production, allow the deployed frontend URL via environment variable.

## 6. Non-Functional Requirements

- **NFR-1:** API response time < 500ms for all endpoints.
- **NFR-2:** Frontend pages should render within 2 seconds on initial load.
- **NFR-3:** The app must work on the latest versions of Chrome, Firefox, and Safari.
- **NFR-4:** All form inputs must have associated labels for accessibility (WCAG 2.1 AA).

## 7. Out of Scope

- Email verification or password reset.
- OAuth / social login.
- Persistent database (in-memory store is sufficient for MVP).
- Profile editing (profile is read-only).
- Role management UI (no way to change roles after creation).
- Drag-and-drop task movement (buttons are used for v1).
- Task assignments to other users.
- Due dates, labels, or priorities on tasks.
- Multi-user collaboration or shared boards.
- Rate limiting on API endpoints.

## 8. Future Considerations

- **SSO via Microsoft Entra ID:** The auth architecture (JWT-based, role in token payload) is designed to be compatible with a future migration to Entra ID SSO. When added, the `/api/auth/login` flow would be replaced by an Entra redirect, and the JWT would be issued from Entra tokens. The role model (`user`/`admin`) can map to Entra groups/app roles.
- **Drag-and-drop:** Replace button-based task movement with drag-and-drop for a more intuitive UX.
- **Persistent database:** Migrate from in-memory store to a persistent database (e.g., PostgreSQL, Cosmos DB) for data durability.
- **Task assignments:** Allow tasks to be assigned to other users for team collaboration.
- **Real-time collaboration:** Use WebSockets or Server-Sent Events to sync board changes across multiple sessions.

## 9. Technical Stack

- **Frontend:** Next.js (App Router, TypeScript, Tailwind CSS)
- **Backend:** Express.js (TypeScript)
- **Auth:** JWT (jsonwebtoken), bcrypt
- **Storage:** In-memory JavaScript Map (for both users and tasks)
- **Deployment:** Azure Container Apps via AZD

## 10. Success Metric

A developer can follow this PRD through the spec2cloud pipeline — from specification to deployed, fully tested application running on Azure Container Apps — with both authentication and task board features working end-to-end.
