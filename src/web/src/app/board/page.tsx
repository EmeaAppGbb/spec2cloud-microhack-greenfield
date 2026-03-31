'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

interface TaskResponse {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'done';
  createdAt: string;
}

const statusForward: Record<string, string> = { todo: 'in_progress', in_progress: 'done' };
const statusBack: Record<string, string> = { in_progress: 'todo', done: 'in_progress' };

const forwardLabel: Record<string, string> = { todo: 'Start', in_progress: 'Complete' };
const backLabel: Record<string, string> = { in_progress: 'Back', done: 'Reopen' };

export default function BoardPage() {
  const [tasks, setTasks] = useState<TaskResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [movingTaskId, setMovingTaskId] = useState<string | null>(null);
  const router = useRouter();

  function fetchTasks() {
    setLoading(true);
    setError(null);
    fetch('/api/auth/me', { credentials: 'include' })
      .then((res) => {
        if (res.status === 401) {
          router.push('/login');
          return null;
        }
        if (!res.ok) throw new Error('Auth check failed');
        return fetch('/api/tasks', { credentials: 'include' });
      })
      .then((res) => {
        if (!res) return null;
        if (!res.ok) throw new Error('Failed to load tasks');
        return res.json();
      })
      .then((data) => {
        if (data) setTasks(data);
      })
      .catch(() => setError('Failed to load tasks. Please try again.'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setCreateError(null);
    const trimmed = newTitle.trim();
    if (!trimmed) {
      setCreateError('Title is required');
      return;
    }
    if (trimmed.length > 120) {
      setCreateError('Title must be 120 characters or less');
      return;
    }
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ title: trimmed, description: newDescription.trim() }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setCreateError(body?.error || 'Failed to create task');
        return;
      }
      const task: TaskResponse = await res.json();
      setTasks((prev) => [...prev, task]);
      setNewTitle('');
      setNewDescription('');
      setCreateError(null);
    } catch {
      setCreateError('Failed to create task');
    }
  }

  async function handleMove(taskId: string, newStatus: string) {
    setMovingTaskId(taskId);
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        alert(body?.error || 'Failed to move task');
        return;
      }
      const updated: TaskResponse = await res.json();
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
    } catch {
      alert('Failed to move task');
    } finally {
      setMovingTaskId(null);
    }
  }

  function enterEdit(task: TaskResponse) {
    setEditingTaskId(task.id);
    setEditTitle(task.title);
    setEditDescription(task.description);
  }

  async function handleEditSave(taskId: string) {
    const trimmed = editTitle.trim();
    if (!trimmed) return;
    if (trimmed.length > 120) return;
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ title: trimmed, description: editDescription.trim() }),
      });
      if (!res.ok) return;
      const updated: TaskResponse = await res.json();
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
      setEditingTaskId(null);
    } catch {
      // silently fail on network error
    }
  }

  async function handleDelete(taskId: string) {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        setTasks((prev) => prev.filter((t) => t.id !== taskId));
      }
    } catch {
      // silently fail on network error
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <p data-testid="board-loading" className="text-gray-600">Loading board…</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50">
        <p data-testid="board-error" className="text-red-600">{error}</p>
        <button
          onClick={fetchTasks}
          className="rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
        >
          Retry
        </button>
      </main>
    );
  }

  const sortByCreated = (a: TaskResponse, b: TaskResponse) => a.createdAt.localeCompare(b.createdAt);
  const todoTasks = tasks.filter((t) => t.status === 'todo').sort(sortByCreated);
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress').sort(sortByCreated);
  const doneTasks = tasks.filter((t) => t.status === 'done').sort(sortByCreated);

  function renderCard(task: TaskResponse) {
    const isEditing = editingTaskId === task.id;

    if (isEditing) {
      return (
        <div key={task.id} data-testid={`task-card-${task.id}`} className="mb-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
          <input
            data-testid="task-edit-title-input"
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            maxLength={120}
            className="mb-2 w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
          />
          <textarea
            data-testid="task-edit-description-input"
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            className="mb-2 w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
            rows={2}
          />
          <div className="flex gap-2">
            <button
              data-testid="task-edit-save-btn"
              onClick={() => handleEditSave(task.id)}
              className="rounded bg-blue-600 px-2 py-1 text-sm font-medium text-white hover:bg-blue-700"
            >
              Save
            </button>
            <button
              data-testid="task-edit-cancel-btn"
              onClick={() => setEditingTaskId(null)}
              className="rounded bg-gray-200 px-2 py-1 text-sm font-medium text-gray-700 hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      );
    }

    return (
      <div key={task.id} data-testid={`task-card-${task.id}`} className="mb-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
        <div className="mb-1 flex items-start justify-between">
          <span
            data-testid={`task-title-${task.id}`}
            onClick={() => enterEdit(task)}
            className="cursor-pointer font-medium text-gray-900 hover:text-blue-600"
          >
            {task.title}
          </span>
          <div className="ml-2 flex shrink-0 gap-1">
            <button
              data-testid={`task-edit-${task.id}`}
              onClick={() => enterEdit(task)}
              className="text-gray-400 hover:text-gray-600"
              title="Edit"
            >
              ✎
            </button>
            <button
              data-testid={`task-delete-${task.id}`}
              onClick={() => handleDelete(task.id)}
              className="text-red-600 hover:text-red-800"
              title="Delete"
            >
              ×
            </button>
          </div>
        </div>
        {task.description && (
          <p data-testid={`task-description-${task.id}`} className="mb-2 text-sm text-gray-500">
            {task.description.length > 100 ? `${task.description.slice(0, 100)}…` : task.description}
          </p>
        )}
        <div className="flex gap-2">
          {statusBack[task.status] && (
            <button
              data-testid={`task-move-back-${task.id}`}
              onClick={() => handleMove(task.id, statusBack[task.status])}
              disabled={movingTaskId !== null}
              className="rounded bg-gray-200 px-2 py-1 text-sm text-gray-700 hover:bg-gray-300 disabled:opacity-50"
            >
              ← {backLabel[task.status]}
            </button>
          )}
          {statusForward[task.status] && (
            <button
              data-testid={`task-move-forward-${task.id}`}
              onClick={() => handleMove(task.id, statusForward[task.status])}
              disabled={movingTaskId !== null}
              className="rounded bg-blue-100 px-2 py-1 text-sm text-blue-700 hover:bg-blue-200 disabled:opacity-50"
            >
              {forwardLabel[task.status]} →
            </button>
          )}
        </div>
      </div>
    );
  }

  function renderColumn(title: string, testId: string, columnTasks: TaskResponse[], bgColor: string) {
    return (
      <div data-testid={testId} className={`rounded-lg p-4 min-h-[200px] ${bgColor}`}>
        <h2 className="mb-3 text-lg font-semibold text-gray-800">
          {title} ({columnTasks.length})
        </h2>
        {columnTasks.map((task) => renderCard(task))}
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl p-4 md:p-6">
        <h1 className="mb-4 text-2xl font-bold text-gray-900">Task Board</h1>

        {/* Create Task Form */}
        <form onSubmit={handleCreate} className="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <input
                data-testid="task-title-input"
                type="text"
                placeholder="What needs to be done?"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                maxLength={120}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="flex-1">
              <textarea
                data-testid="task-description-input"
                placeholder="Add a description (optional)"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                rows={1}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <button
              data-testid="create-task-btn"
              type="submit"
              className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Add Task
            </button>
          </div>
          {createError && (
            <p data-testid="create-task-error" className="mt-2 text-sm text-red-600">{createError}</p>
          )}
        </form>

        {/* Empty State */}
        {tasks.length === 0 && (
          <p data-testid="empty-board-message" className="mb-6 text-center text-gray-500">
            No tasks yet. Create your first task above!
          </p>
        )}

        {/* Columns */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {renderColumn('To Do', 'column-todo', todoTasks, 'bg-blue-50')}
          {renderColumn('In Progress', 'column-in-progress', inProgressTasks, 'bg-amber-50')}
          {renderColumn('Done', 'column-done', doneTasks, 'bg-green-50')}
        </div>
      </div>
    </main>
  );
}
