import { SyncService } from '../../../mobile/src/services/syncService';
import { LocalSearchIndex } from '../../../mobile/src/services/searchIndex';
import { MobileNotificationService } from '../../../mobile/src/services/notificationHandler';
import { LocalTask } from '../../../mobile/src/database/schema';
import { aiEstimator } from '../../../mobile/src/services/aiEstimator';

describe('Sinergia Mobile — Testes Unitários de Serviços Mobile', () => {

  describe('US02: SyncService (WatermelonDB Offline-First)', () => {
    let service: SyncService;

    beforeEach(() => {
      service = new SyncService('http://mock-api.local');
      service.setOnlineStatus(false);
    });

    it('deve criar tarefa localmente com status "created" quando offline', () => {
      const task = service.createTask({
        title: 'Nova Tarefa Criada Offline',
        effortHours: 4,
        priority: 'HIGH'
      });

      expect(task.id).toBeDefined();
      expect(task._status).toBe('created');

      const all = service.getAllTasks();
      expect(all.some(t => t.id === task.id)).toBe(true);
    });

    it('deve atualizar tarefa localmente e marcar como "updated" quando offline', () => {
      const task = service.getAllTasks()[0];
      const updated = service.updateTaskLocally(task.id, {
        title: 'Título Modificado Offline'
      });

      expect(updated).toBeDefined();
      expect(updated?.title).toBe('Título Modificado Offline');
      expect(updated?._status).toBe('updated');
    });

    it('deve suportar criação de subtarefas aninhadas (US01)', () => {
      const parent = service.getAllTasks()[0];
      const subtask = service.createTask({
        title: 'Subtarefa Aninhada',
        parentTaskId: parent.id,
        effortHours: 2
      });

      const subtasks = service.getSubtasks(parent.id);
      expect(subtasks.some(s => s.id === subtask.id)).toBe(true);
    });
  });

  describe('US05: LocalSearchIndex (Índice Invertido e Tolerância a Erros)', () => {
    let searchEngine: LocalSearchIndex;
    const mockTasks: LocalTask[] = [
      {
        id: '1',
        title: 'Estruturação da Arquitetura Mobile',
        description: 'Configuração do banco WatermelonDB',
        priority: 'HIGH',
        status: 'IN_PROGRESS',
        effortHours: 8,
        projectId: 'p1',
        version: 1,
        _status: 'synced',
        createdAt: '',
        updatedAt: ''
      },
      {
        id: '2',
        title: 'Reunião de Planejamento de Sprint',
        description: 'Definir backlog com cliente',
        priority: 'MEDIUM',
        status: 'COMPLETED',
        effortHours: 2,
        projectId: 'p1',
        version: 1,
        _status: 'synced',
        createdAt: '',
        updatedAt: ''
      }
    ];

    beforeEach(() => {
      searchEngine = new LocalSearchIndex();
      searchEngine.indexTasks(mockTasks);
    });

    it('deve encontrar tarefas por correspondência exata', () => {
      const results = searchEngine.search('arquitetura', mockTasks);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].task.id).toBe('1');
    });

    it('deve encontrar tarefas mesmo com erros ortográficos (Fuzzy Matching)', () => {
      const results1 = searchEngine.search('architetura', mockTasks);
      expect(results1.length).toBeGreaterThan(0);
      expect(results1[0].task.id).toBe('1');

      const results2 = searchEngine.search('planejamnto', mockTasks);
      expect(results2.length).toBeGreaterThan(0);
      expect(results2[0].task.id).toBe('2');
    });
  });

  describe('US07: MobileNotificationService (Handlers de Background e Cores)', () => {
    let notifService: MobileNotificationService;

    beforeEach(() => {
      notifService = new MobileNotificationService();
    });

    it('deve disparar listener ao receber notificação com cor contextual', done => {
      notifService.addListener(n => {
        expect(n.title).toBe('🚨 Vencimento em menos de 1 hora!');
        expect(n.urgencyLevel).toBe('CRITICAL');
        expect(n.color).toBe('#EF4444');
        done();
      });

      notifService.receiveNotification({
        title: '🚨 Vencimento em menos de 1 hora!',
        body: 'O prazo da tarefa expira em 45 minutos.',
        urgencyLevel: 'CRITICAL',
        color: '#EF4444',
        taskId: '1'
      });
    });
  });

  describe('US08: AiEstimatorService (Previsão de Duração TFLite / Fallback)', () => {
    it('deve extrair vetor numérico de features da tarefa', () => {
      const features = aiEstimator.extractFeatures({
        title: 'Criar tela de login com autenticação biométrica',
        description: 'Implementar tela em React Native com validação local e tokens JWT.',
        subtasksCount: 2,
        priority: 'HIGH',
        tagsCount: 2
      });

      expect(features.length).toBe(6);
      expect(features[0]).toBe(1.0); // Bias
      expect(features[1]).toBe(7);   // Words in title
      expect(features[3]).toBe(2);   // Subtasks
      expect(features[4]).toBe(3);   // HIGH priority = 3
    });

    it('deve prever duração estimada realista e fornecer justificativa contextual', () => {
      const result = aiEstimator.estimate({
        title: 'Desenvolver módulo de exportação PDF',
        description: 'Geração de relatórios com gráficos e tabelas para exportação.',
        subtasksCount: 3,
        priority: 'HIGH',
        tagsCount: 1
      });

      expect(result.estimatedHours).toBeGreaterThan(5);
      expect(result.confidence).toBeGreaterThanOrEqual(75);
      expect(result.explanation).toContain('subtarefa');
      expect(result.breakdown.subtasksEffort).toBeGreaterThan(0);
      expect(result.breakdown.priorityImpact).toBeGreaterThan(0);
    });

    it('deve atribuir mais horas para tarefas de maior prioridade e com mais subtarefas', () => {
      const simple = aiEstimator.estimate({
        title: 'Revisão simples de texto',
        priority: 'LOW',
        subtasksCount: 0
      });

      const complex = aiEstimator.estimate({
        title: 'Revisão simples de texto',
        priority: 'URGENT',
        subtasksCount: 4
      });

      expect(complex.estimatedHours).toBeGreaterThan(simple.estimatedHours);
    });
  });
});

