import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { TasksController } from './modules/tasks/tasks.controller';
import { SyncController } from './modules/sync/sync.controller';
import { InvitesController } from './modules/invites/invites.controller';
import { CommentsController } from './modules/comments/comments.controller';
import { StorageController } from './modules/storage/storage.controller';
import { NotificationsController } from './modules/notifications/notifications.controller';
import { AuthController } from './modules/auth/auth.controller';
import { authMiddleware, optionalAuthMiddleware } from './modules/auth/auth.middleware';
import { repository } from './database/repository';
import { prisma } from './database/prisma';

export function createApp() {
  const app = express();
  const upload = multer({ limits: { fileSize: 25 * 1024 * 1024 } }); // 25MB max

  app.use(cors());
  app.use(express.json());

  const tasksController = new TasksController();
  const syncController = new SyncController();
  const invitesController = new InvitesController();
  const commentsController = new CommentsController();
  const storageController = new StorageController();
  const notificationsController = new NotificationsController();
  const authController = new AuthController();

  // Health Check
  app.get('/api/v1/health', (req, res) => {
    return res.json({ status: 'ok', timestamp: new Date(), project: 'Sinergia Task Manager' });
  });

  // US01, US05, US06: Tasks, Subtasks & Lock Otimista / Bloqueio Simultâneo
  app.get('/api/v1/tasks', (req, res) => tasksController.list(req, res));
  app.get('/api/v1/tasks/:id', (req, res) => tasksController.getById(req, res));
  app.post('/api/v1/tasks', (req, res) => tasksController.create(req, res));
  app.put('/api/v1/tasks/:id', (req, res) => tasksController.update(req, res));
  app.post('/api/v1/tasks/:id/lock', (req, res) => tasksController.lock(req, res));
  app.post('/api/v1/tasks/:id/unlock', (req, res) => tasksController.unlock(req, res));
  app.delete('/api/v1/tasks/:id', (req, res) => tasksController.remove(req, res));

  // US10: Dependencies (DB-10.1 / BE-10.2)
  app.post('/api/v1/tasks/:id/dependencies', (req, res) => tasksController.addDependency(req, res));
  app.delete('/api/v1/tasks/:id/dependencies/:depId', (req, res) => tasksController.removeDependency(req, res));

  // US21: Checklist & Clone (DB-21.1 / BE-21.2)
  app.post('/api/v1/tasks/:id/checklist', (req, res) => tasksController.addChecklistItem(req, res));
  app.patch('/api/v1/tasks/:id/checklist/:itemId', (req, res) => tasksController.updateChecklistItem(req, res));
  app.delete('/api/v1/tasks/:id/checklist/:itemId', (req, res) => tasksController.deleteChecklistItem(req, res));
  app.post('/api/v1/tasks/:id/clone', (req, res) => tasksController.clone(req, res));

  // US22: Aceite / Recusa de atribuição de tarefas (DB-22.1 / BE-22.2)
  app.post('/api/v1/tasks/:id/assignment', (req, res) => tasksController.respondAssignment(req, res));

  // US02: WatermelonDB Offline Delta Sync
  app.get('/api/v1/sync/pull', (req, res) => syncController.pull(req, res));
  app.post('/api/v1/sync/push', (req, res) => syncController.push(req, res));

  // US03: QR Code & Link Invites with ACL
  app.post('/api/v1/invites', (req, res) => invitesController.create(req, res));
  app.post('/api/v1/invites/accept', (req, res) => invitesController.accept(req, res));

  // US04: Comments & Mentions
  app.get('/api/v1/tasks/:id/comments', (req, res) => commentsController.list(req, res));
  app.post('/api/v1/tasks/:id/comments', (req, res) => commentsController.create(req, res));

  // US04: MinIO Attachments
  app.post('/api/v1/tasks/:id/attachments', upload.single('file'), (req, res) => storageController.uploadAttachment(req, res));
  app.get('/api/v1/attachments/file/:key(*)', (req, res) => storageController.getFile(req, res));

  // US07: Firebase Progressive Deadlines
  app.get('/api/v1/notifications/deadlines', (req, res) => notificationsController.checkDeadlines(req, res));
  app.get('/api/v1/notifications/history', (req, res) => notificationsController.getHistory(req, res));

  // Users, Profiles & Auth endpoints com PostgreSQL
  app.get('/api/v1/users', async (req, res) => {
    try {
      const teamId = req.query?.teamId as string;
      let users: any[] = [];
      if (teamId) {
        const members = await prisma.projectMember.findMany({
          where: { projectId: teamId },
          include: { user: true }
        });
        users = members.map((m: any) => ({
          id: m.user.id,
          name: m.user.name,
          email: m.user.email,
          avatarUrl: m.user.avatarUrl,
          role: m.role
        }));
      }
      if (!users || users.length === 0) {
        users = await prisma.user.findMany({
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            createdAt: true
          },
          orderBy: { name: 'asc' }
        });
      }
      return res.json({ success: true, data: users });
    } catch (err: any) {
      console.error('[Get Users Error]', err);
      return res.json({ success: true, data: Array.from(repository.users.values()) });
    }
  });

  app.post('/api/v1/auth/register', (req, res) => authController.register(req, res));
  app.post('/api/v1/auth/login', (req, res) => authController.login(req, res));
  app.get('/api/v1/users/me', (req: any, res: any, next: any) => authMiddleware(req, res, () => authController.me(req, res)));

  // Teams endpoints com isolamento no PostgreSQL
  app.get('/api/v1/teams', optionalAuthMiddleware, (req: any, res: any) => authController.listUserTeams(req, res));
  app.post('/api/v1/teams', optionalAuthMiddleware, (req: any, res: any) => authController.createTeam(req, res));
  app.post('/api/v1/teams/join', optionalAuthMiddleware, (req: any, res: any) => authController.joinTeam(req, res));

  return app;
}
