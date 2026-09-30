import request from 'supertest';
import { createApp } from '../app';
import { repository } from '../database/repository';

describe('Sinergia Task Manager — Sprint 2: Onda 1 Test Suite', () => {
  let app: any;

  beforeAll(() => {
    app = createApp();
  });

  describe('US05 / BE-05.1: Filtros Avançados Combinados na API', () => {
    it('deve filtrar tarefas por responsável (assigneeId)', async () => {
      const res = await request(app)
        .get('/api/v1/tasks?assigneeId=user-davi-001')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      res.body.data.forEach((task: any) => {
        expect(task.assigneeId).toBe('user-davi-001');
      });
    });

    it('deve filtrar tarefas por escopo "root_only" (ocultar subtarefas)', async () => {
      const res = await request(app)
        .get('/api/v1/tasks?scope=root_only')
        .expect(200);

      expect(res.body.success).toBe(true);
      res.body.data.forEach((task: any) => {
        expect(task.parentTaskId).toBeNull();
      });
    });

    it('deve filtrar tarefas por escopo "subtasks_only" (apenas subtarefas filhas)', async () => {
      const res = await request(app)
        .get('/api/v1/tasks?scope=subtasks_only')
        .expect(200);

      expect(res.body.success).toBe(true);
      res.body.data.forEach((task: any) => {
        expect(task.parentTaskId).not.toBeNull();
      });
    });

    it('deve filtrar tarefas por múltiplas tags (separadas por vírgula)', async () => {
      const res = await request(app)
        .get('/api/v1/tasks?tags=Sprint 1,Mobile')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      res.body.data.forEach((task: any) => {
        const tagNames = task.tags.map((t: any) => t.name.toLowerCase());
        const hasMatch = tagNames.includes('sprint 1') || tagNames.includes('mobile');
        expect(hasMatch).toBe(true);
      });
    });

    it('deve suportar filtro rápido de tarefas atrasadas (overdue=true)', async () => {
      // Cria uma tarefa vencida propositalmente
      const overdueTask = repository.createTask({
        title: 'Tarefa Atrasada de Teste',
        status: 'IN_PROGRESS',
        dueDate: new Date(Date.now() - 86400000 * 3) // 3 dias atrás
      });

      const res = await request(app)
        .get('/api/v1/tasks?overdue=true')
        .expect(200);

      expect(res.body.success).toBe(true);
      const ids = res.body.data.map((t: any) => t.id);
      expect(ids).toContain(overdueTask.id);
    });
  });

  describe('US10 / DB-10.1: Modelagem e Rotas de Dependências de Tarefas', () => {
    it('deve registrar dependência Finish-to-Start entre duas tarefas', async () => {
      const t1 = repository.createTask({ title: 'Tarefa Predecessora A' });
      const t2 = repository.createTask({ title: 'Tarefa Sucessora B' });

      const res = await request(app)
        .post(`/api/v1/tasks/${t2.id}/dependencies`)
        .send({
          dependsOnTaskId: t1.id,
          dependencyType: 'FINISH_TO_START'
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.taskId).toBe(t2.id);
      expect(res.body.data.dependsOnTaskId).toBe(t1.id);
      expect(res.body.data.dependencyType).toBe('FINISH_TO_START');

      // Verifica se a tarefa carrega a dependência detalhada
      const details = await request(app).get(`/api/v1/tasks/${t2.id}`).expect(200);
      expect(details.body.data.dependencies.some((d: any) => d.dependsOnTaskId === t1.id)).toBe(true);
    });

    it('deve impedir auto-dependência de uma tarefa consigo mesma', async () => {
      const t1 = repository.createTask({ title: 'Tarefa Isolada' });

      const res = await request(app)
        .post(`/api/v1/tasks/${t1.id}/dependencies`)
        .send({
          dependsOnTaskId: t1.id
        })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('si mesma');
    });
  });

  describe('US21 / DB-21.1: Checklist Interna e Duplicação / Clonagem', () => {
    it('deve adicionar item de checklist com co-responsável e alternar conclusão', async () => {
      const task = repository.createTask({ title: 'Tarefa com Checklist' });

      // Adiciona item
      const addRes = await request(app)
        .post(`/api/v1/tasks/${task.id}/checklist`)
        .send({
          title: 'Configurar ambiente de staging',
          assigneeId: 'user-davi-001'
        })
        .expect(201);

      expect(addRes.body.success).toBe(true);
      expect(addRes.body.data.title).toBe('Configurar ambiente de staging');
      expect(addRes.body.data.isCompleted).toBe(false);

      const itemId = addRes.body.data.id;

      // Conclui item
      const updateRes = await request(app)
        .patch(`/api/v1/tasks/${task.id}/checklist/${itemId}`)
        .send({ isCompleted: true })
        .expect(200);

      expect(updateRes.body.success).toBe(true);
      expect(updateRes.body.data.isCompleted).toBe(true);
      expect(updateRes.body.data.completedAt).toBeDefined();
    });

    it('deve clonar tarefa replicando checklists e ajustando linha do tempo (dateOffsetDays)', async () => {
      const task = repository.createTask({
        title: 'Sprint Planning Semanal',
        description: 'Planejamento e alinhamento do backlog',
        dueDate: new Date(Date.now() + 86400000 * 2)
      });
      repository.addChecklistItem(task.id, 'Preparar métricas da sprint anterior');
      repository.addChecklistItem(task.id, 'Revisar metas com a equipe');

      const cloneRes = await request(app)
        .post(`/api/v1/tasks/${task.id}/clone`)
        .send({ dateOffsetDays: 7 })
        .expect(201);

      expect(cloneRes.body.success).toBe(true);
      expect(cloneRes.body.data.title).toBe('Sprint Planning Semanal (Cópia)');
      expect(cloneRes.body.data.checklist.length).toBe(2);

      const origDue = new Date(task.dueDate!).getTime();
      const clonedDue = new Date(cloneRes.body.data.dueDate!).getTime();
      const diffDays = Math.round((clonedDue - origDue) / 86400000);
      expect(diffDays).toBe(7);
    });
  });

  describe('US22 / DB-22.1: Ausências / Férias e Fluxo de Aceite/Recusa', () => {
    it('deve registrar ausência e detectar indisponibilidade por período', () => {
      const absence = repository.addUserAbsence(
        'user-davi-001',
        'VACATION',
        new Date(Date.now() - 86400000 * 2),
        new Date(Date.now() + 86400000 * 5),
        'Férias de Julho'
      );

      expect(absence.id).toBeDefined();
      expect(repository.isUserAbsent('user-davi-001')).toBe(true);
      expect(repository.isUserAbsent('user-ana-002')).toBe(false);
    });

    it('deve suportar fluxo de aceitar ou recusar atribuição com justificativa', async () => {
      const task = repository.createTask({
        title: 'Tarefa Delegada para Aceite',
        assigneeId: 'user-ana-002',
        assignmentStatus: 'PENDING'
      });

      // Recusa com motivo
      const declineRes = await request(app)
        .post(`/api/v1/tasks/${task.id}/assignment`)
        .send({
          status: 'DECLINED',
          declinedReason: 'Estou em período de férias até segunda-feira.'
        })
        .expect(200);

      expect(declineRes.body.success).toBe(true);
      expect(declineRes.body.data.assignmentStatus).toBe('DECLINED');
      expect(declineRes.body.data.declinedReason).toContain('período de férias');

      // Aceite posterior
      const acceptRes = await request(app)
        .post(`/api/v1/tasks/${task.id}/assignment`)
        .send({ status: 'ACCEPTED' })
        .expect(200);

      expect(acceptRes.body.data.assignmentStatus).toBe('ACCEPTED');
    });
  });

  describe('US13 & US15: Recorrência e Automações JSON', () => {
    it('deve armazenar e consultar regras de recorrência e rodízio', () => {
      const task = repository.createTask({
        title: 'Daily Meeting Diária',
        isRecurring: true,
        recurrenceInterval: 'DAILY',
        rotationUserIds: ['user-davi-001', 'user-ana-002'],
        currentRotationIndex: 0
      });

      const details = repository.getTaskWithDetails(task.id);
      expect(details?.isRecurring).toBe(true);
      expect(details?.recurrenceInterval).toBe('DAILY');
      expect(details?.rotationUserIds).toEqual(['user-davi-001', 'user-ana-002']);
    });

    it('deve registrar regra de automação JSON "se/então" vinculada ao projeto', () => {
      const rule = repository.addAutomationRule({
        projectId: 'proj-sinergia-001',
        name: 'Se status mudar para BLOCKED, notificar time',
        trigger: 'STATUS_CHANGED',
        conditionsJson: JSON.stringify({ field: 'status', operator: 'EQUALS', value: 'BLOCKED' }),
        actionsJson: JSON.stringify([{ action: 'SEND_NOTIFICATION', channel: 'fcm' }]),
        createdById: 'user-davi-001'
      });

      expect(rule.id).toBeDefined();
      const projectRules = repository.getAutomationRules('proj-sinergia-001');
      expect(projectRules.some(r => r.name.includes('BLOCKED'))).toBe(true);
    });
  });
});
