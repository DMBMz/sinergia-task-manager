import request from 'supertest';
import { createApp } from '../app';
import { repository } from '../database/repository';
import { aiEstimator } from '../../../mobile/src/services/aiEstimator';

const app = createApp();

describe('Sinergia Task Manager — Sprint 2 Onda 3 (#21 a #34): Interfaces Operacionais, Visualizações e Fluxos E2E', () => {
  beforeEach(() => {
    (repository as any).tasks.clear();
    (repository as any).taskDependencies.clear();
    (repository as any).taskChecklists.clear();
    (repository as any).userAbsences.clear();
    (repository as any).seedInitialData();
  });

  describe('#21 (FE-10.3 / US10): Interface de Dependências e Feedback de Bloqueio na Transição', () => {
    it('deve vincular dependência via API, bloquear conclusão enquanto pré-requisito estiver pendente e desbloquear após conclusão', async () => {
      const resA = await request(app).post('/api/v1/tasks').send({
        title: 'Configurar Cluster PostgreSQL',
        priority: 'HIGH',
        effortHours: 6
      });
      const resB = await request(app).post('/api/v1/tasks').send({
        title: 'Rodar Migrations de Produção',
        priority: 'URGENT',
        effortHours: 4
      });

      const taskA = resA.body.data;
      const taskB = resB.body.data;

      // 1. Vincula A como pré-requisito de B
      const depRes = await request(app)
        .post(`/api/v1/tasks/${taskB.id}/dependencies`)
        .send({ dependsOnTaskId: taskA.id, dependencyType: 'FINISH_TO_START' });

      expect(depRes.status).toBe(201);
      expect(depRes.body.success).toBe(true);

      // 2. Tenta concluir B antes de A -> deve retornar bloqueio 400 (blocked: true)
      const blockedUpdate = await request(app)
        .put(`/api/v1/tasks/${taskB.id}`)
        .send({ status: 'COMPLETED', version: taskB.version });

      expect(blockedUpdate.status).toBe(400);
      expect(blockedUpdate.body.blocked).toBe(true);

      // 3. Tenta criar ciclo B -> A -> B -> deve rejeitar com hasCycle: true
      const cycleRes = await request(app)
        .post(`/api/v1/tasks/${taskA.id}/dependencies`)
        .send({ dependsOnTaskId: taskB.id });

      expect(cycleRes.status).toBe(400);
      expect(cycleRes.body.hasCycle).toBe(true);

      // 4. Conclui A e verifica que B pode ser concluída em seguida
      await request(app)
        .put(`/api/v1/tasks/${taskA.id}`)
        .send({ status: 'COMPLETED', version: taskA.version });

      const unblockedUpdate = await request(app)
        .put(`/api/v1/tasks/${taskB.id}`)
        .send({ status: 'COMPLETED', version: taskB.version });

      expect(unblockedUpdate.status).toBe(200);
      expect(unblockedUpdate.body.data.status).toBe('COMPLETED');
    });
  });

  describe('#22 (FE-21.3 / US21): Checklist com Co-Responsáveis e Clonagem/Duplicação de Tarefa', () => {
    it('deve adicionar itens de checklist com co-responsável e clonar tarefa deslocando datas', async () => {
      const createRes = await request(app).post('/api/v1/tasks').send({
        title: 'Release Sprint 2 Mobile',
        priority: 'HIGH',
        effortHours: 8,
        dueDate: new Date('2026-11-01T18:00:00Z').toISOString()
      });
      const task = createRes.body.data;

      // Adiciona item de checklist com co-responsável distinto
      const checkRes = await request(app)
        .post(`/api/v1/tasks/${task.id}/checklist`)
        .send({ title: 'Validar assinatura APK Android', assigneeId: 'user-ana-002' });

      expect(checkRes.status).toBe(201);
      expect(checkRes.body.data.assigneeId).toBe('user-ana-002');

      // Clona a tarefa com offset de +7 dias
      const cloneRes = await request(app)
        .post(`/api/v1/tasks/${task.id}/clone`)
        .send({ dateOffsetDays: 7 });

      expect(cloneRes.status).toBe(201);
      expect(cloneRes.body.data.title).toContain('Release Sprint 2 Mobile');
      expect(cloneRes.body.data.id).not.toBe(task.id);
    });
  });

  describe('#23, #24 & #25 (FE-22.3, FE-09.2, FE-09.3 / US22 & US09): Férias, Aceite/Recusa e Auto-Alocação com Barra de Capacidade', () => {
    it('deve registrar férias, sugerir auto-alocação ignorando membros ausentes e permitir aceite/recusa de tarefa', async () => {
      const tomorrow = new Date(Date.now() + 86400000).toISOString();
      const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString();

      // 1. Registra férias para Ana (#23)
      const absRes = await request(app).post('/api/v1/capacity/absences').send({
        userId: 'user-ana-002',
        type: 'VACATION',
        startDate: tomorrow,
        endDate: nextWeek,
        reason: 'Férias Regulamentares'
      });
      expect(absRes.status).toBe(201);

      // 2. Solicita auto-alocação inteligente (#24) e ranking de capacidade (#25)
      const suggestRes = await request(app).post('/api/v1/capacity/suggest').send({
        effortHours: 6,
        dueDate: tomorrow,
        tags: ['Mobile']
      });
      expect(suggestRes.status).toBe(200);
      expect(suggestRes.body.recommended).toBeDefined();
      expect(suggestRes.body.recommended.userId).not.toBe('user-ana-002');

      // 3. Cria tarefa delegada e realiza fluxo de recusa com justificativa e posterior aceite (#23)
      const taskRes = await request(app).post('/api/v1/tasks').send({
        title: 'Implementar Gráfico Gantt',
        assigneeId: 'user-davi-001',
        priority: 'HIGH',
        effortHours: 8
      });
      const task = taskRes.body.data;

      const declineRes = await request(app)
        .post(`/api/v1/tasks/${task.id}/assignment`)
        .send({ status: 'DECLINED', declinedReason: 'Atuando no incidente de deploy' });

      expect(declineRes.status).toBe(200);
      expect(declineRes.body.data.assignmentStatus).toBe('DECLINED');
      expect(declineRes.body.data.declinedReason).toBe('Atuando no incidente de deploy');

      const acceptRes = await request(app)
        .post(`/api/v1/tasks/${task.id}/assignment`)
        .send({ status: 'ACCEPTED' });

      expect(acceptRes.status).toBe(200);
      expect(acceptRes.body.data.assignmentStatus).toBe('ACCEPTED');
    });
  });

  describe('#26 (FE-08.3 / US08): Sugestão Preditiva de Esforço IA (TFLite Runtime)', () => {
    it('deve estimar horas preditivamente com base em título, descrição, subtarefas, prioridade e tags', () => {
      const prediction = aiEstimator.estimate({
        title: 'Construir visualização interativa de Mapa Mental e Gráfico de Gantt',
        description: 'Implementar renderização horizontal com cálculo de folgas CPM e alertas de dependências críticas.',
        subtasksCount: 4,
        priority: 'URGENT',
        tagsCount: 3
      });

      expect(prediction.estimatedHours).toBeGreaterThan(2);
      expect(prediction.confidence).toBeGreaterThan(0.7);
    });
  });

  describe('#27, #28, #29, #30 & #31 (FE-11.2, FE-11.3, FE-23.3, FE-12.2, FE-12.3): Mapa Mental DAG, Lista Topológica, CPM, Gantt e Carga', () => {
    it('deve fornecer ordenação topológica DAG, métricas CPM (folgas e caminho crítico), dados de Gantt e matriz de carga da equipe', async () => {
      const t1 = (await request(app).post('/api/v1/tasks').send({ title: 'Etapa 1: API', effortHours: 6, priority: 'HIGH' })).body.data;
      const t2 = (await request(app).post('/api/v1/tasks').send({ title: 'Etapa 2: UI Gantt', effortHours: 18, priority: 'URGENT' })).body.data;
      await request(app).post(`/api/v1/tasks/${t2.id}/dependencies`).send({ dependsOnTaskId: t1.id });

      // #27 & #28: DAG Topological Sort
      const dagRes = await request(app).get('/api/v1/planning/dag');
      expect(dagRes.status).toBe(200);
      expect(dagRes.body.isValidDag).toBe(true);
      const ids = dagRes.body.data.map((t: any) => t.id);
      expect(ids.indexOf(t1.id)).toBeLessThan(ids.indexOf(t2.id));

      // #29: CPM Critical Path
      const cpmRes = await request(app).get('/api/v1/planning/cpm');
      expect(cpmRes.status).toBe(200);
      expect(cpmRes.body.projectDurationHours).toBeGreaterThanOrEqual(16);
      expect(cpmRes.body.criticalPathCount).toBeGreaterThan(0);

      // #30: Gantt Aggregator
      const ganttRes = await request(app).get('/api/v1/planning/gantt');
      expect(ganttRes.status).toBe(200);
      expect(Array.isArray(ganttRes.body.tasks)).toBe(true);
      const ganttT2 = ganttRes.body.tasks.find((x: any) => x.id === t2.id);
      expect(ganttT2.isCritical).toBe(true);

      // #31: Team Workload Matrix
      const workloadRes = await request(app).get('/api/v1/capacity/team');
      expect(workloadRes.status).toBe(200);
      expect(Array.isArray(workloadRes.body.data)).toBe(true);
    });
  });

  describe('#32, #33 & #34 (FE-13.3, FE-14.2, FE-14.3 / US13 & US14): Recorrência Round-Robin e Planning Poker PERT', () => {
    it('deve votar com cartões Planning Poker, revelar consenso PERT e aplicar esforço na tarefa', async () => {
      const taskRes = await request(app).post('/api/v1/tasks').send({
        title: 'Refatorar Motor de Sincronização Delta',
        priority: 'HIGH',
        effortHours: 4,
        isRecurring: true,
        recurrenceInterval: 'WEEKLY',
        maxOccurrences: 4,
        rotationUserIds: ['user-davi-001', 'user-ana-002']
      });
      const task = taskRes.body.data;

      // Votos Fibonacci (#33 FE-14.2)
      await request(app).post(`/api/v1/planning/poker/${task.id}/vote`).send({ userId: 'u1', userName: 'Davi', points: 5 });
      await request(app).post(`/api/v1/planning/poker/${task.id}/vote`).send({ userId: 'u2', userName: 'Ana', points: 8 });
      await request(app).post(`/api/v1/planning/poker/${task.id}/vote`).send({ userId: 'u3', userName: 'Gui', points: 13 });

      // Revelar votos
      const revealRes = await request(app).post(`/api/v1/planning/poker/${task.id}/reveal`);
      expect(revealRes.status).toBe(200);
      expect(revealRes.body.data.revealed).toBe(true);
      expect(revealRes.body.data.pertEstimate.expectedHours).toBe(8.33);

      // Aplicar consenso PERT na tarefa (#34 FE-14.3)
      const applyRes = await request(app)
        .post(`/api/v1/planning/poker/${task.id}/apply`)
        .send({ version: task.version });

      expect(applyRes.status).toBe(200);
      expect(applyRes.body.data.effortHours).toBe(8.33);
    });
  });
});
