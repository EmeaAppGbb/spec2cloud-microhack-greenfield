import { type Express } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  createTask,
  getTasksByUser,
  getTaskById,
  updateTask,
  deleteTask,
} from '../models/task-store.js';

const VALID_STATUSES = ['todo', 'in_progress', 'done'] as const;

const VALID_TRANSITIONS: Record<string, string[]> = {
  todo: ['in_progress'],
  in_progress: ['todo', 'done'],
  done: ['in_progress'],
};

function toResponse(task: { id: string; title: string; description: string; status: string; createdAt: string }) {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    createdAt: task.createdAt,
  };
}

export function mapTaskEndpoints(app: Express): void {
  app.get('/api/tasks', authMiddleware, (req, res) => {
    const tasks = getTasksByUser(req.user!.sub);
    res.json(tasks.map(toResponse));
  });

  app.post('/api/tasks', authMiddleware, (req, res) => {
    const { title, description } = req.body as { title?: string; description?: string };

    if (!title || title.trim() === '') {
      res.status(400).json({ error: 'Title is required' });
      return;
    }
    if (title.length > 120) {
      res.status(400).json({ error: 'Title must be 120 characters or fewer' });
      return;
    }

    const task = createTask(req.user!.sub, title, description ?? '');
    res.status(201).json(toResponse(task));
  });

  app.patch('/api/tasks/:id', authMiddleware, (req, res) => {
    const task = getTaskById(req.params.id);
    if (!task || task.userId !== req.user!.sub) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    const { title, description, status } = req.body as { title?: string; description?: string; status?: string };

    if (title !== undefined) {
      if (!title || title.trim() === '') {
        res.status(400).json({ error: 'Title is required' });
        return;
      }
      if (title.length > 120) {
        res.status(400).json({ error: 'Title must be 120 characters or fewer' });
        return;
      }
    }

    if (status !== undefined) {
      if (!VALID_STATUSES.includes(status as typeof VALID_STATUSES[number])) {
        res.status(400).json({ error: 'Invalid status value' });
        return;
      }
      if (!VALID_TRANSITIONS[task.status].includes(status)) {
        res.status(400).json({ error: 'Invalid status transition' });
        return;
      }
    }

    const updates: Record<string, string> = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (status !== undefined) updates.status = status;

    const updated = updateTask(req.params.id, updates);
    res.json(toResponse(updated!));
  });

  app.delete('/api/tasks/:id', authMiddleware, (req, res) => {
    const task = getTaskById(req.params.id);
    if (!task || task.userId !== req.user!.sub) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    deleteTask(req.params.id);
    res.status(204).send();
  });
}
