import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import { logger } from './logger.js';
import { mapHealthEndpoints } from './routes/health.js';
import { mapChatEndpoints } from './routes/chat.js';
import { mapAuthEndpoints } from './routes/auth.js';
import { mapAdminEndpoints } from './routes/admin.js';
import { mapTaskEndpoints } from './routes/tasks.js';
import { clearUsers, addUser, getUserByUsername, deleteUser } from './models/user-store.js';
import { clearTasks } from './models/task-store.js';

export function createApp(): express.Express {
  const app = express();

  // Middleware
  app.use(helmet());

  const allowedOrigins = process.env.CORS_ORIGIN
    ? [process.env.CORS_ORIGIN]
    : ['http://localhost:3000', 'http://localhost:3001'];
  app.use(cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
  }));

  app.use(express.json());
  // Custom error handler for malformed JSON bodies
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    if (err.type === 'entity.parse.failed' || (err instanceof SyntaxError && 'body' in err)) {
      res.status(400).json({ error: 'Invalid request body' });
      return;
    }
    next(err);
  });

  app.use(cookieParser());
  app.use(pinoHttp({ logger }));

  // Routes
  mapHealthEndpoints(app);
  mapChatEndpoints(app);
  mapAuthEndpoints(app);
  mapAdminEndpoints(app);
  mapTaskEndpoints(app);

  // Test-only: reset endpoint for e2e test isolation
  if (process.env.NODE_ENV !== 'production') {
    app.post('/api/test/reset', (_req, res) => {
      clearUsers();
      clearTasks();
      res.json({ message: 'Store cleared' });
    });

    app.post('/api/test/create-user', async (req, res) => {
      const { username, password, role, createdAt } = req.body;
      const bcrypt = await import('bcryptjs');
      const crypto = await import('node:crypto');
      const passwordHash = await bcrypt.default.hash(password, 10);
      addUser({
        id: crypto.randomUUID(),
        username,
        passwordHash,
        role: role || 'user',
        createdAt: createdAt ? new Date(createdAt) : new Date(),
      });
      res.json({ message: 'User created' });
    });

    app.get('/api/test/user-hash/:username', (req, res) => {
      const user = getUserByUsername(req.params.username);
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      res.json({ passwordHash: user.passwordHash });
    });

    app.delete('/api/test/users/:username', (req, res) => {
      const user = getUserByUsername(req.params.username);
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      deleteUser(user.id);
      res.json({ message: 'User deleted' });
    });
  }

  return app;
}
