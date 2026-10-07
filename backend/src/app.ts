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
import { planningController } from './modules/planning/planning.controller';
import { capacityController } from './modules/capacity/capacity.controller';

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

  // Sprint 2 Onda 2: Algoritmos de Grafos, DAG, CPM e Planning Poker (US11, US23, US14)
  app.get('/api/v1/planning/dag/:projectId?', (req, res) => planningController.getTopologicalSort(req, res));
  app.get('/api/v1/planning/cpm/:projectId?', (req, res) => planningController.getCriticalPath(req, res));
  app.get('/api/v1/planning/gantt/:projectId?', (req, res) => planningController.getGanttData(req, res));
  app.get('/api/v1/planning/external-dependencies/:projectId?', (req, res) => planningController.getExternalDependencies(req, res));
  app.post('/api/v1/planning/poker/:id/vote', (req, res) => planningController.votePoker(req, res));
  app.post('/api/v1/planning/poker/:id/reveal', (req, res) => planningController.revealPokerVotes(req, res));
  app.get('/api/v1/planning/poker/:id/results', (req, res) => planningController.getPokerSummary(req, res));
  app.post('/api/v1/planning/poker/:id/apply', (req, res) => planningController.applyPokerConsensus(req, res));

  // Sprint 2 Onda 2: Capacidade da Equipe, Ausências e Alocação Inteligente (US09, US22, US12)
  app.get('/api/v1/capacity/member/:userId', (req, res) => capacityController.getMemberWorkload(req, res));
  app.get('/api/v1/capacity/team', (req, res) => capacityController.getTeamWorkload(req, res));
  app.post('/api/v1/capacity/suggest', (req, res) => capacityController.suggestAssignee(req, res));
  app.post('/api/v1/capacity/absences', (req, res) => capacityController.addAbsence(req, res));
  app.get('/api/v1/capacity/absences/:userId', (req, res) => capacityController.getMemberAbsences(req, res));

  // US02: WatermelonDB Offline Delta Sync
  app.get('/api/v1/sync/pull', (req, res) => syncController.pull(req, res));
  app.post('/api/v1/sync/push', (req, res) => syncController.push(req, res));

  // US03: QR Code & Link Invites with ACL
  app.post('/api/v1/invites', (req, res) => invitesController.create(req, res));
  app.post('/api/v1/invites/accept', (req, res) => invitesController.accept(req, res));

  // US04: Comments & Mentions
  app.get('/api/v1/tasks/:id/comments', (req, res) => commentsController.list(req, res));
  app.post('/api/v1/tasks/:id/comments', (req, res) => commentsController.create(req, res));

  // US04: MinIO Attachments & Profile Avatars
  app.post('/api/v1/tasks/:id/attachments', upload.single('file'), (req, res) => storageController.uploadAttachment(req, res));
  app.get('/api/v1/attachments/file/:key(*)', (req, res) => storageController.getFile(req, res));
  app.get('/api/v1/storage/file/:key(*)', (req, res) => storageController.getFile(req, res));
  app.post('/api/v1/users/avatar', optionalAuthMiddleware, upload.single('avatar'), (req, res) => storageController.uploadAvatar(req, res));
  app.post('/api/v1/users/:id/avatar', optionalAuthMiddleware, upload.single('avatar'), (req, res) => storageController.uploadAvatar(req, res));
  app.post('/api/v1/profile/avatar', optionalAuthMiddleware, upload.single('avatar'), (req, res) => storageController.uploadAvatar(req, res));

  // US07: Firebase Progressive Deadlines
  app.get('/api/v1/notifications/deadlines', (req, res) => notificationsController.checkDeadlines(req, res));
  app.get('/api/v1/notifications/history', (req, res) => notificationsController.getHistory(req, res));

  // Users, Profiles & Auth endpoints com PostgreSQL
  app.get('/api/v1/users', async (req, res) => {
    try {
      const teamId = (req.query?.teamId || req.query?.projectId) as string;
      const teamName = req.query?.team as string;
      let users: any[] = [];

      if (teamId || teamName) {
        let projectId = teamId;
        if (!projectId && teamName) {
          const prj = await prisma.project.findFirst({
            where: { name: { equals: teamName, mode: 'insensitive' as any } }
          });
          if (prj) projectId = prj.id;
        }

        if (projectId) {
          const members = await prisma.projectMember.findMany({
            where: { projectId },
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

        // Se projectId não retornou membros mas temos teamName, tenta encontrar por nome no Prisma
        if (users.length === 0 && teamName) {
          const prj = await prisma.project.findFirst({
            where: { name: { equals: teamName, mode: 'insensitive' as any } }
          });
          if (prj) {
            const members = await prisma.projectMember.findMany({
              where: { projectId: prj.id },
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
        }

        // Fallback em memória (para testes e modo offline/dev)
        if (users.length === 0) {
          const isDefaultTeam = teamName === 'Meu Time' || teamName === 'Sinergia Mobile App' || teamId === 'proj-sinergia-001';
          const mems = Array.from(repository.projectMembers.values()).filter(pm =>
            (projectId && pm.projectId === projectId) ||
            (teamName && repository.projects.get(pm.projectId)?.name.toLowerCase() === teamName.toLowerCase()) ||
            (teamId && repository.projects.get(pm.projectId)?.name.toLowerCase() === teamId.toLowerCase()) ||
            (isDefaultTeam && pm.projectId === 'proj-sinergia-001')
          );
          if (mems.length > 0) {
            users = mems.map(m => {
              const u = repository.users.get(m.userId);
              return u ? { id: u.id, name: u.name, email: u.email, avatarUrl: u.avatarUrl, role: m.role } : null;
            }).filter(Boolean);
          }
        }

        // Retorna ESTRITAMENTE os membros pertencentes ao time solicitado
        return res.json({ success: true, data: users });
      }

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

  // US24: Gestão de Membros do Time (Alterar Função e Remover Membro)
  app.patch('/api/v1/teams/:projectId/members/:userId', async (req, res) => {
    try {
      const { projectId, userId } = req.params;
      const { role } = req.body;
      if (!role) {
        return res.status(400).json({ success: false, error: 'O papel (role) é obrigatório.' });
      }

      repository.updateProjectMemberRole(projectId, userId, role);

      try {
        await prisma.projectMember.updateMany({
          where: {
            OR: [
              { projectId, userId },
              { project: { name: projectId }, user: { name: userId } }
            ]
          },
          data: { role: role as any }
        });
      } catch (dbErr) {
        console.warn('[Prisma Update Member Role Warning]', dbErr);
      }

      return res.json({ success: true, message: `Papel do membro alterado para ${role} com sucesso.` });
    } catch (err: any) {
      console.error('[Update Member Role Error]', err);
      return res.status(500).json({ success: false, error: 'Erro ao atualizar papel do membro.' });
    }
  });

  app.delete('/api/v1/teams/:projectId/members/:userId', async (req, res) => {
    try {
      const { projectId, userId } = req.params;
      repository.removeProjectMember(projectId, userId);

      try {
        await prisma.projectMember.deleteMany({
          where: {
            OR: [
              { projectId, userId },
              { project: { name: projectId }, user: { name: userId } }
            ]
          }
        });
      } catch (dbErr) {
        console.warn('[Prisma Delete Member Warning]', dbErr);
      }

      return res.json({ success: true, message: 'Membro removido do time com sucesso.' });
    } catch (err: any) {
      console.error('[Delete Member Error]', err);
      return res.status(500).json({ success: false, error: 'Erro ao remover membro do time.' });
    }
  });

  app.post('/api/v1/teams/:projectId/members', async (req, res) => {
    try {
      const { projectId } = req.params;
      const { name, email, role } = req.body;
      if (!name || !email) {
        return res.status(400).json({ success: false, error: 'Nome e e-mail são obrigatórios.' });
      }
      const memberRole = (role || 'VIEW') as any;
      const result = repository.addProjectMemberDirect(projectId, { name, email }, memberRole);

      try {
        let dbUser = await prisma.user.findUnique({ where: { email } });
        if (!dbUser) {
          dbUser = await prisma.user.create({
            data: {
              name,
              email,
              avatarUrl: result.user.avatarUrl,
              passwordHash: 'sinergia_direct_member'
            }
          });
        }
        let dbProj = await prisma.project.findFirst({
          where: {
            OR: [
              { id: projectId },
              { name: { equals: projectId, mode: 'insensitive' as any } }
            ]
          }
        });
        if (dbProj && dbUser) {
          await prisma.projectMember.upsert({
            where: {
              projectId_userId: { projectId: dbProj.id, userId: dbUser.id }
            },
            create: {
              projectId: dbProj.id,
              userId: dbUser.id,
              role: memberRole
            },
            update: {
              role: memberRole
            }
          });
        }
      } catch (dbErr) {
        console.warn('[Prisma Add Direct Member Warning]', dbErr);
      }

      return res.json({
        success: true,
        message: `Membro ${name} adicionado ao time com sucesso!`,
        data: {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          avatarUrl: result.user.avatarUrl,
          role: result.member.role
        }
      });
    } catch (err: any) {
      console.error('[Add Direct Member Error]', err);
      return res.status(500).json({ success: false, error: 'Erro ao adicionar membro ao time.' });
    }
  });

  return app;
}
