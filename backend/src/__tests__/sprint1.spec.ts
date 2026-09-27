import request from 'supertest';
import { createApp } from '../app';
import { repository } from '../database/repository';

const app = createApp();

describe('Sinergia Task Manager — Sprint 1 Suite de Testes Automatizados', () => {

  beforeEach(() => {
    // Reseta repositório com estado inicial
    repository.tasks.clear();
    repository.comments.clear();
    repository.attachments.clear();
    repository.inviteTokens.clear();
    repository.seedInitialData();
  });

  // ==========================================
  // US01: Criação e Gestão de Tarefas e Subtarefas
  // ==========================================
  describe('US01: Gestão de Tarefas e Subtarefas Aninhadas', () => {
    it('deve listar tarefas com detalhes e subtarefas aninhadas', async () => {
      const res = await request(app).get('/api/v1/tasks');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);

      const rootTask = res.body.data.find((t: any) => t.id === 'task-root-001');
      expect(rootTask).toBeDefined();
      expect(rootTask.subTasks).toBeDefined();
      expect(rootTask.subTasks.length).toBe(1);
      expect(rootTask.subTasks[0].id).toBe('subtask-001');
    });

    it('deve criar uma nova tarefa com esforço, datas e prioridade', async () => {
      const payload = {
        title: 'Criar Módulo de Autenticação Biometria',
        description: 'Implementar biometria nativa para login rápido',
        priority: 'HIGH',
        status: 'PENDING',
        effortHours: 8,
        startDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 86400000 * 5).toISOString(),
        projectId: 'proj-sinergia-001',
        assigneeId: 'user-davi-001'
      };

      const res = await request(app).post('/api/v1/tasks').send(payload);
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe(payload.title);
      expect(res.body.data.effortHours).toBe(8);
      expect(res.body.data.version).toBe(1);
    });

    it('deve criar uma subtarefa aninhada associada a uma tarefa pai', async () => {
      const subtaskPayload = {
        title: 'Subtarefa de Validação de Fingerprint',
        effortHours: 3,
        parentTaskId: 'task-root-001',
        projectId: 'proj-sinergia-001'
      };

      const res = await request(app).post('/api/v1/tasks').send(subtaskPayload);
      expect(res.status).toBe(201);
      expect(res.body.data.parentTaskId).toBe('task-root-001');

      // Verifica se a tarefa pai agora lista 2 subtarefas
      const parentRes = await request(app).get('/api/v1/tasks/task-root-001');
      expect(parentRes.status).toBe(200);
      expect(parentRes.body.data.subTasks.length).toBe(2);
    });
  });

  // ==========================================
  // US02: Modo Offline e Sincronização Delta
  // ==========================================
  describe('US02: Sincronização Bidirecional Offline (WatermelonDB)', () => {
    it('deve retornar mudanças no pull a partir do timestamp last_pulled_at', async () => {
      const lastPulledAt = Date.now() - 3600000; // 1 hora atrás
      const res = await request(app).get(`/api/v1/sync/pull?last_pulled_at=${lastPulledAt}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.changes).toBeDefined();
      expect(res.body.changes.tasks.created.length).toBeGreaterThan(0);
      expect(res.body.timestamp).toBeDefined();
    });

    it('deve receber push de alterações geradas offline e persistir no servidor', async () => {
      const offlineChanges = {
        tasks: {
          created: [
            {
              id: 'offline-task-999',
              title: 'Tarefa criada offline no metrô',
              priority: 'LOW',
              status: 'PENDING',
              projectId: 'proj-sinergia-001'
            }
          ],
          updated: [],
          deleted: []
        }
      };

      const res = await request(app).post('/api/v1/sync/push').send({ changes: offlineChanges });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.details.appliedCount).toBe(1);

      // Valida persistência
      const checkRes = await request(app).get('/api/v1/tasks/offline-task-999');
      expect(checkRes.status).toBe(200);
      expect(checkRes.body.data.title).toBe('Tarefa criada offline no metrô');
    });
  });

  // ==========================================
  // US03: Convites QR Code / Link com Permissões
  // ==========================================
  describe('US03: Convites Temporários via QR Code e Links', () => {
    it('deve gerar token temporário com payload para QR Code e link', async () => {
      const payload = {
        projectId: 'proj-sinergia-001',
        role: 'EDIT',
        expiresInHours: 24,
        createdById: 'user-davi-001'
      };

      const res = await request(app).post('/api/v1/invites').send(payload);
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.invite.token).toBeDefined();
      expect(res.body.data.link).toContain('https://sinergia.app/invite/');
      
      const qrData = JSON.parse(res.body.data.qrPayload);
      expect(qrData.app).toBe('sinergia');
      expect(qrData.role).toBe('EDIT');
    });

    it('deve permitir que outro usuário escaneie/aceite o convite e receba permissão', async () => {
      // 1. Gera convite
      const inviteRes = await request(app).post('/api/v1/invites').send({
        projectId: 'proj-sinergia-001',
        role: 'ADMIN',
        expiresInHours: 48
      });
      const token = inviteRes.body.data.invite.token;

      // 2. Aceita convite
      const acceptRes = await request(app).post('/api/v1/invites/accept').send({
        token,
        userId: 'user-ana-002'
      });
      expect(acceptRes.status).toBe(200);
      expect(acceptRes.body.success).toBe(true);
      expect(acceptRes.body.role).toBe('ADMIN');
    });
  });

  // ==========================================
  // US04: Comentários com @ e Anexos
  // ==========================================
  describe('US04: Chat Contextual e Menções (@)', () => {
    it('deve criar comentário e extrair menções de usuários automaticamente', async () => {
      const commentPayload = {
        authorId: 'user-davi-001',
        content: 'Olá @Ana Silva, por favor valide o PR da arquitetura offline.'
      };

      const res = await request(app)
        .post('/api/v1/tasks/task-root-001/comments')
        .send(commentPayload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.content).toBe(commentPayload.content);
      expect(res.body.data.mentions).toContain('Ana');
    });

    it('deve anexar arquivo em uma tarefa com simulação de upload MinIO', async () => {
      const res = await request(app)
        .post('/api/v1/tasks/task-root-001/attachments')
        .attach('file', Buffer.from('mock file content Sinergia PDF'), 'documento_arquitetura.pdf');

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.fileName).toBe('documento_arquitetura.pdf');
      expect(res.body.data.storageKey).toBeDefined();
    });
  });

  // ==========================================
  // US05: Filtros por Tags e Busca
  // ==========================================
  describe('US05: Classificação por Tags e Busca', () => {
    it('deve filtrar tarefas por tag específica', async () => {
      const res = await request(app).get('/api/v1/tasks?tag=Sprint 1');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0].tags.some((t: any) => t.name === 'Sprint 1')).toBe(true);
    });

    it('deve buscar tarefas por termo no título ou descrição', async () => {
      const res = await request(app).get('/api/v1/tasks?query=Arquitetura');
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].id).toBe('task-root-001');
    });
  });

  // ==========================================
  // US06: Lock Otimista e Controle de Concorrência
  // ==========================================
  describe('US06: Lock Otimista (Versionamento de Tarefa)', () => {
    it('deve atualizar com sucesso quando a versão enviada bater com o banco', async () => {
      const res = await request(app)
        .put('/api/v1/tasks/task-root-001')
        .send({
          version: 1,
          title: 'Título Atualizado pelo Usuário A'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Título Atualizado pelo Usuário A');
      expect(res.body.data.version).toBe(2); // incrementado para 2
    });

    it('deve bloquear e retornar 409 Conflict se tentar atualizar com versão defasada', async () => {
      // 1. Usuário A atualiza a tarefa (passa para versão 2)
      await request(app)
        .put('/api/v1/tasks/task-root-001')
        .send({ version: 1, title: 'Alteração pelo Usuário A' });

      // 2. Usuário B tenta atualizar enviando version: 1 (que agora está defasada)
      const res = await request(app)
        .put('/api/v1/tasks/task-root-001')
        .send({
          version: 1,
          title: 'Tentativa de sobrescrita concorrente pelo Usuário B'
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Lock Otimista');
      expect(res.body.serverVersion).toBe(2);
      expect(res.body.currentTask).toBeDefined();
    });
  });

  // ==========================================
  // US07: Alertas Progressivos de Prazos (Firebase FCM)
  // ==========================================
  describe('US07: Alertas Contextuais e Progressivos de Prazos', () => {
    it('deve calcular alertas progressivos corretos para prazos de 7d, 3d, 1d e 1h', async () => {
      const res = await request(app).get('/api/v1/notifications/deadlines');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.alerts).toBeDefined();
    });
  });
});
