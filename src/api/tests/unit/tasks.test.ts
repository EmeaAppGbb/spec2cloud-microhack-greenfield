import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';

const app = createApp();

async function registerAndLogin(username: string, password = 'securepass123') {
  await request(app)
    .post('/api/auth/register')
    .send({ username, password });

  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ username, password });

  return loginRes.headers['set-cookie'] as string[];
}

describe('Task API', () => {
  beforeEach(async () => {
    await request(app).post('/api/test/reset');
  });

  describe('POST /api/tasks', () => {
    it('should return 201 with valid title only', async () => {
      const cookies = await registerAndLogin('taskuser1');
      const res = await request(app)
        .post('/api/tasks')
        .set('Cookie', cookies)
        .send({ title: 'My first task' });

      expect(res.status).toBe(201);
      expect(res.body.title).toBe('My first task');
      expect(res.body.description).toBe('');
      expect(res.body.status).toBe('todo');
      expect(res.body.id).toBeDefined();
      expect(res.body.createdAt).toBeDefined();
      expect(res.body.userId).toBeUndefined();
    });

    it('should return 201 with title and description', async () => {
      const cookies = await registerAndLogin('taskuser2');
      const res = await request(app)
        .post('/api/tasks')
        .set('Cookie', cookies)
        .send({ title: 'Task with desc', description: 'Some details' });

      expect(res.status).toBe(201);
      expect(res.body.title).toBe('Task with desc');
      expect(res.body.description).toBe('Some details');
    });

    it('should return 400 for empty title', async () => {
      const cookies = await registerAndLogin('taskuser3');
      const res = await request(app)
        .post('/api/tasks')
        .set('Cookie', cookies)
        .send({ title: '' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Title is required');
    });

    it('should return 400 for whitespace-only title', async () => {
      const cookies = await registerAndLogin('taskuser4');
      const res = await request(app)
        .post('/api/tasks')
        .set('Cookie', cookies)
        .send({ title: '   ' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Title is required');
    });

    it('should return 400 for title exceeding 120 characters', async () => {
      const cookies = await registerAndLogin('taskuser5');
      const res = await request(app)
        .post('/api/tasks')
        .set('Cookie', cookies)
        .send({ title: 'a'.repeat(121) });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Title must be 120 characters or fewer');
    });

    it('should return 401 without authentication', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .send({ title: 'Unauthenticated task' });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Not authenticated');
    });

    it('should create task with status todo', async () => {
      const cookies = await registerAndLogin('taskuser6');
      const res = await request(app)
        .post('/api/tasks')
        .set('Cookie', cookies)
        .send({ title: 'Check status' });

      expect(res.body.status).toBe('todo');
    });
  });

  describe('GET /api/tasks', () => {
    it('should return 200 with tasks sorted by createdAt ASC', async () => {
      const cookies = await registerAndLogin('listuser1');

      await request(app)
        .post('/api/tasks')
        .set('Cookie', cookies)
        .send({ title: 'First task' });

      await request(app)
        .post('/api/tasks')
        .set('Cookie', cookies)
        .send({ title: 'Second task' });

      const res = await request(app)
        .get('/api/tasks')
        .set('Cookie', cookies);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body[0].title).toBe('First task');
      expect(res.body[1].title).toBe('Second task');
      expect(res.body[0].userId).toBeUndefined();
    });

    it('should return 200 with empty array when user has no tasks', async () => {
      const cookies = await registerAndLogin('listuser2');
      const res = await request(app)
        .get('/api/tasks')
        .set('Cookie', cookies);

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('should return 401 without authentication', async () => {
      const res = await request(app).get('/api/tasks');

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Not authenticated');
    });

    it('should not return other user tasks', async () => {
      const cookies1 = await registerAndLogin('listuser3');
      const cookies2 = await registerAndLogin('listuser4');

      await request(app)
        .post('/api/tasks')
        .set('Cookie', cookies1)
        .send({ title: 'User1 task' });

      await request(app)
        .post('/api/tasks')
        .set('Cookie', cookies2)
        .send({ title: 'User2 task' });

      const res = await request(app)
        .get('/api/tasks')
        .set('Cookie', cookies1);

      expect(res.body).toHaveLength(1);
      expect(res.body[0].title).toBe('User1 task');
    });
  });

  describe('PATCH /api/tasks/:id', () => {
    it('should return 200 when updating title', async () => {
      const cookies = await registerAndLogin('patchuser1');
      const createRes = await request(app)
        .post('/api/tasks')
        .set('Cookie', cookies)
        .send({ title: 'Original title' });

      const res = await request(app)
        .patch(`/api/tasks/${createRes.body.id}`)
        .set('Cookie', cookies)
        .send({ title: 'Updated title' });

      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Updated title');
    });

    it('should return 200 when updating description', async () => {
      const cookies = await registerAndLogin('patchuser2');
      const createRes = await request(app)
        .post('/api/tasks')
        .set('Cookie', cookies)
        .send({ title: 'Task', description: 'Old desc' });

      const res = await request(app)
        .patch(`/api/tasks/${createRes.body.id}`)
        .set('Cookie', cookies)
        .send({ description: 'New desc' });

      expect(res.status).toBe(200);
      expect(res.body.description).toBe('New desc');
    });

    it('should return 200 when moving todo to in_progress', async () => {
      const cookies = await registerAndLogin('patchuser3');
      const createRes = await request(app)
        .post('/api/tasks')
        .set('Cookie', cookies)
        .send({ title: 'Move me' });

      const res = await request(app)
        .patch(`/api/tasks/${createRes.body.id}`)
        .set('Cookie', cookies)
        .send({ status: 'in_progress' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('in_progress');
    });

    it('should return 200 when moving in_progress back to todo', async () => {
      const cookies = await registerAndLogin('patchuser4');
      const createRes = await request(app)
        .post('/api/tasks')
        .set('Cookie', cookies)
        .send({ title: 'Move back' });

      await request(app)
        .patch(`/api/tasks/${createRes.body.id}`)
        .set('Cookie', cookies)
        .send({ status: 'in_progress' });

      const res = await request(app)
        .patch(`/api/tasks/${createRes.body.id}`)
        .set('Cookie', cookies)
        .send({ status: 'todo' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('todo');
    });

    it('should return 400 for invalid status transition (todo to done)', async () => {
      const cookies = await registerAndLogin('patchuser5');
      const createRes = await request(app)
        .post('/api/tasks')
        .set('Cookie', cookies)
        .send({ title: 'Skip ahead' });

      const res = await request(app)
        .patch(`/api/tasks/${createRes.body.id}`)
        .set('Cookie', cookies)
        .send({ status: 'done' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid status transition');
    });

    it('should return 400 for empty title', async () => {
      const cookies = await registerAndLogin('patchuser6');
      const createRes = await request(app)
        .post('/api/tasks')
        .set('Cookie', cookies)
        .send({ title: 'Has title' });

      const res = await request(app)
        .patch(`/api/tasks/${createRes.body.id}`)
        .set('Cookie', cookies)
        .send({ title: '' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Title is required');
    });

    it('should return 400 for whitespace-only title', async () => {
      const cookies = await registerAndLogin('patchuser6ws');
      const createRes = await request(app)
        .post('/api/tasks')
        .set('Cookie', cookies)
        .send({ title: 'Has title' });

      const res = await request(app)
        .patch(`/api/tasks/${createRes.body.id}`)
        .set('Cookie', cookies)
        .send({ title: '   ' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Title is required');
    });

    it('should return 404 for non-existent task', async () => {
      const cookies = await registerAndLogin('patchuser7');
      const res = await request(app)
        .patch('/api/tasks/00000000-0000-0000-0000-000000000000')
        .set('Cookie', cookies)
        .send({ title: 'Nope' });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Task not found');
    });

    it('should return 404 for other user task', async () => {
      const cookies1 = await registerAndLogin('patchuser8');
      const cookies2 = await registerAndLogin('patchuser9');

      const createRes = await request(app)
        .post('/api/tasks')
        .set('Cookie', cookies1)
        .send({ title: 'Not yours' });

      const res = await request(app)
        .patch(`/api/tasks/${createRes.body.id}`)
        .set('Cookie', cookies2)
        .send({ title: 'Steal it' });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Task not found');
    });

    it('should return 401 without authentication', async () => {
      const res = await request(app)
        .patch('/api/tasks/some-id')
        .send({ title: 'No auth' });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Not authenticated');
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    it('should return 204 when deleting own task', async () => {
      const cookies = await registerAndLogin('deluser1');
      const createRes = await request(app)
        .post('/api/tasks')
        .set('Cookie', cookies)
        .send({ title: 'Delete me' });

      const res = await request(app)
        .delete(`/api/tasks/${createRes.body.id}`)
        .set('Cookie', cookies);

      expect(res.status).toBe(204);

      const listRes = await request(app)
        .get('/api/tasks')
        .set('Cookie', cookies);
      expect(listRes.body).toHaveLength(0);
    });

    it('should return 404 for non-existent task', async () => {
      const cookies = await registerAndLogin('deluser2');
      const res = await request(app)
        .delete('/api/tasks/00000000-0000-0000-0000-000000000000')
        .set('Cookie', cookies);

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Task not found');
    });

    it('should return 404 for other user task', async () => {
      const cookies1 = await registerAndLogin('deluser3');
      const cookies2 = await registerAndLogin('deluser4');

      const createRes = await request(app)
        .post('/api/tasks')
        .set('Cookie', cookies1)
        .send({ title: 'Not yours to delete' });

      const res = await request(app)
        .delete(`/api/tasks/${createRes.body.id}`)
        .set('Cookie', cookies2);

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Task not found');
    });

    it('should return 401 without authentication', async () => {
      const res = await request(app)
        .delete('/api/tasks/some-id');

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Not authenticated');
    });
  });
});
