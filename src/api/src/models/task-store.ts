import { randomUUID } from 'crypto';

export interface TaskRecord {
  id: string;
  userId: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'done';
  createdAt: string;
}

const tasks = new Map<string, TaskRecord>();

export function createTask(userId: string, title: string, description = ''): TaskRecord {
  const task: TaskRecord = {
    id: randomUUID(),
    userId,
    title,
    description,
    status: 'todo',
    createdAt: new Date().toISOString(),
  };
  tasks.set(task.id, task);
  return task;
}

export function getTasksByUser(userId: string): TaskRecord[] {
  return Array.from(tasks.values())
    .filter(t => t.userId === userId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function getTaskById(id: string): TaskRecord | undefined {
  return tasks.get(id);
}

export function updateTask(id: string, updates: Partial<Pick<TaskRecord, 'title' | 'description' | 'status'>>): TaskRecord | undefined {
  const task = tasks.get(id);
  if (!task) return undefined;

  if (updates.title !== undefined) task.title = updates.title;
  if (updates.description !== undefined) task.description = updates.description;
  if (updates.status !== undefined) task.status = updates.status;

  return task;
}

export function deleteTask(id: string): boolean {
  return tasks.delete(id);
}

export function clearTasks(): void {
  tasks.clear();
}
