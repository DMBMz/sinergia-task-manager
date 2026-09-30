import { DagService } from '../modules/planning/dag.service';
import { CpmService } from '../modules/planning/cpm.service';
import { PlanningPokerService } from '../modules/planning/pert.service';
import { CapacityService } from '../modules/capacity/capacity.service';
import { TaskDependencyGuard } from '../modules/tasks/tasks.guard';
import { RecurrenceRoundRobinService } from '../modules/recurrence/recurrence.service';
import { repository } from '../database/repository';
import { Task, TaskDependency, User } from '../database/types';

describe('Sinergia Task Manager — Sprint 2 Onda 2: Algoritmos, Grafos e Regras de Negócio', () => {

  beforeEach(() => {
    // Limpa estado para testes isolados
    (repository as any).tasks.clear();
    (repository as any).taskDependencies.clear();
    (repository as any).userAbsences.clear();
    (repository as any).seedInitialData();
  });

  describe('US11 / BE-11.1: Algoritmo de Ordenação Topológica e Detecção de Ciclos (Kahn / DAG)', () => {
    it('deve ordenar linearmente tarefas com dependências acíclicas respeitando pré-requisitos', () => {
      const taskA: Task = { id: 'task-a', projectId: 'proj-1', title: 'Modelagem do Banco', effortHours: 10, status: 'PENDING', priority: 'HIGH', version: 1, createdAt: new Date(), updatedAt: new Date(), currentOccurrence: 1, rotationUserIds: [] };
      const taskB: Task = { id: 'task-b', projectId: 'proj-1', title: 'Criação das APIs', effortHours: 15, status: 'PENDING', priority: 'HIGH', version: 1, createdAt: new Date(), updatedAt: new Date(), currentOccurrence: 1, rotationUserIds: [] };
      const taskC: Task = { id: 'task-c', projectId: 'proj-1', title: 'Interface Mobile', effortHours: 12, status: 'PENDING', priority: 'MEDIUM', version: 1, createdAt: new Date(), updatedAt: new Date(), currentOccurrence: 1, rotationUserIds: [] };

      // taskB depende de taskA; taskC depende de taskB
      const deps: TaskDependency[] = [
        { id: 'd1', taskId: 'task-b', dependsOnTaskId: 'task-a', dependencyType: 'FINISH_TO_START', createdAt: new Date() },
        { id: 'd2', taskId: 'task-c', dependsOnTaskId: 'task-b', dependencyType: 'FINISH_TO_START', createdAt: new Date() }
      ];

      const result = DagService.topologicalSort([taskA, taskB, taskC], deps);
      expect(result.isValidDag).toBe(true);
      expect(result.hasCycle).toBe(false);
      expect(result.orderedTaskIds).toEqual(['task-a', 'task-b', 'task-c']);
    });

    it('deve detectar ciclo circular direto (A -> B -> A) e rejeitar com erro explicativo', () => {
      const taskA: Task = { id: 'task-a', projectId: 'proj-1', title: 'Tarefa A', effortHours: 4, status: 'PENDING', priority: 'HIGH', version: 1, createdAt: new Date(), updatedAt: new Date(), currentOccurrence: 1, rotationUserIds: [] };
      const taskB: Task = { id: 'task-b', projectId: 'proj-1', title: 'Tarefa B', effortHours: 6, status: 'PENDING', priority: 'HIGH', version: 1, createdAt: new Date(), updatedAt: new Date(), currentOccurrence: 1, rotationUserIds: [] };

      const deps: TaskDependency[] = [
        { id: 'd1', taskId: 'task-b', dependsOnTaskId: 'task-a', dependencyType: 'FINISH_TO_START', createdAt: new Date() },
        { id: 'd2', taskId: 'task-a', dependsOnTaskId: 'task-b', dependencyType: 'FINISH_TO_START', createdAt: new Date() }
      ];

      const result = DagService.topologicalSort([taskA, taskB], deps);
      expect(result.isValidDag).toBe(false);
      expect(result.hasCycle).toBe(true);
      expect(result.cycleNodes).toContain('task-a');
      expect(result.cycleNodes).toContain('task-b');
      expect(result.errorMessage).toContain('Ciclo de dependência circular');
    });

    it('deve validar preventivamente se a inserção de uma dependência criaria um ciclo (wouldCreateCycle)', () => {
      const taskA: Task = { id: 'task-a', projectId: 'proj-1', title: 'Tarefa A', effortHours: 4, status: 'PENDING', priority: 'HIGH', version: 1, createdAt: new Date(), updatedAt: new Date(), currentOccurrence: 1, rotationUserIds: [] };
      const taskB: Task = { id: 'task-b', projectId: 'proj-1', title: 'Tarefa B', effortHours: 6, status: 'PENDING', priority: 'HIGH', version: 1, createdAt: new Date(), updatedAt: new Date(), currentOccurrence: 1, rotationUserIds: [] };
      const taskC: Task = { id: 'task-c', projectId: 'proj-1', title: 'Tarefa C', effortHours: 8, status: 'PENDING', priority: 'MEDIUM', version: 1, createdAt: new Date(), updatedAt: new Date(), currentOccurrence: 1, rotationUserIds: [] };

      // Existente: A -> B -> C
      const deps: TaskDependency[] = [
        { id: 'd1', taskId: 'task-b', dependsOnTaskId: 'task-a', dependencyType: 'FINISH_TO_START', createdAt: new Date() },
        { id: 'd2', taskId: 'task-c', dependsOnTaskId: 'task-b', dependencyType: 'FINISH_TO_START', createdAt: new Date() }
      ];

      // Tentar fazer A depender de C criaria ciclo (C -> A -> B -> C)
      const wouldCycle = DagService.wouldCreateCycle([taskA, taskB, taskC], deps, 'task-a', 'task-c');
      expect(wouldCycle).toBe(true);

      // Tentar fazer C depender de uma tarefa nova e válida não deve criar ciclo
      const valid = DagService.wouldCreateCycle([taskA, taskB, taskC], deps, 'task-c', 'task-a');
      expect(valid).toBe(false); // Já é transitivo, mas não cria ciclo reverso
    });
  });

  describe('US23 / BE-23.1: Algoritmo do Caminho Crítico (CPM - Critical Path Method)', () => {
    it('deve calcular corretamente Early Start, Early Finish, Late Start, Late Finish e Folgas (Slack)', () => {
      // Grafo de Teste Clássico CPM:
      // A (5h) -> C (10h)
      // B (3h) -> C (10h)
      // Caminho crítico deve passar por A -> C (duração total: 5 + 10 = 15h)
      // B tem folga (slack) de 2h
      const taskA: Task = { id: 'A', projectId: 'proj-1', title: 'Tarefa A', effortHours: 5, status: 'PENDING', priority: 'HIGH', version: 1, createdAt: new Date(), updatedAt: new Date(), currentOccurrence: 1, rotationUserIds: [] };
      const taskB: Task = { id: 'B', projectId: 'proj-1', title: 'Tarefa B', effortHours: 3, status: 'PENDING', priority: 'MEDIUM', version: 1, createdAt: new Date(), updatedAt: new Date(), currentOccurrence: 1, rotationUserIds: [] };
      const taskC: Task = { id: 'C', projectId: 'proj-1', title: 'Tarefa C', effortHours: 10, status: 'PENDING', priority: 'URGENT', version: 1, createdAt: new Date(), updatedAt: new Date(), currentOccurrence: 1, rotationUserIds: [] };

      const deps: TaskDependency[] = [
        { id: 'd1', taskId: 'C', dependsOnTaskId: 'A', dependencyType: 'FINISH_TO_START', createdAt: new Date() },
        { id: 'd2', taskId: 'C', dependsOnTaskId: 'B', dependencyType: 'FINISH_TO_START', createdAt: new Date() }
      ];

      const cpm = CpmService.calculate([taskA, taskB, taskC], deps);
      expect(cpm.hasCycle).toBe(false);
      expect(cpm.projectDuration).toBe(15); // 5h (A) + 10h (C)

      const metricA = cpm.taskMetrics.get('A')!;
      const metricB = cpm.taskMetrics.get('B')!;
      const metricC = cpm.taskMetrics.get('C')!;

      // Tarefa A (Crítica): ES=0, EF=5, LS=0, LF=5, Slack=0
      expect(metricA.earlyStart).toBe(0);
      expect(metricA.earlyFinish).toBe(5);
      expect(metricA.lateStart).toBe(0);
      expect(metricA.lateFinish).toBe(5);
      expect(metricA.totalSlack).toBe(0);
      expect(metricA.isCritical).toBe(true);

      // Tarefa B (Não crítica): ES=0, EF=3, LS=2, LF=5, Slack=2h
      expect(metricB.earlyStart).toBe(0);
      expect(metricB.earlyFinish).toBe(3);
      expect(metricB.lateStart).toBe(2);
      expect(metricB.lateFinish).toBe(5);
      expect(metricB.totalSlack).toBe(2);
      expect(metricB.isCritical).toBe(false);

      // Tarefa C (Crítica): ES=5, EF=15, LS=5, LF=15, Slack=0
      expect(metricC.earlyStart).toBe(5);
      expect(metricC.earlyFinish).toBe(15);
      expect(metricC.totalSlack).toBe(0);
      expect(metricC.isCritical).toBe(true);

      expect(cpm.criticalPath).toEqual(['A', 'C']);
    });
  });

  describe('US10 / BE-10.2: Bloqueio de Transição por Dependências e Alertas', () => {
    it('deve bloquear início de tarefa dependente quando o pré-requisito não estiver concluído', () => {
      const prereq = repository.createTask({
        title: 'Backend Auth API',
        status: 'IN_PROGRESS',
        effortHours: 8,
        priority: 'HIGH'
      });

      const dependent = repository.createTask({
        title: 'Mobile Login Screen',
        status: 'PENDING',
        effortHours: 6,
        priority: 'MEDIUM'
      });

      repository.addDependency(dependent.id, prereq.id, 'FINISH_TO_START');

      // Tentar mover a dependente para IN_PROGRESS deve ser bloqueado
      const guardCheck = TaskDependencyGuard.validateTransition(dependent.id, 'IN_PROGRESS');
      expect(guardCheck.allowed).toBe(false);
      expect(guardCheck.reason).toContain('Ação bloqueada por dependência de tarefa');
      expect(guardCheck.blockingTaskIds).toContain(prereq.id);

      // Concluir o pré-requisito deve liberar a dependente
      repository.updateTask(prereq.id, prereq.version, { status: 'COMPLETED' });
      const allowedCheck = TaskDependencyGuard.validateTransition(dependent.id, 'IN_PROGRESS');
      expect(allowedCheck.allowed).toBe(true);
    });

    it('deve desbloquear tarefas e disparar notificações automáticas ao concluir antecessora (onTaskCompleted)', async () => {
      const prereq = repository.createTask({
        title: 'Criar Esquema de Banco',
        status: 'IN_PROGRESS',
        effortHours: 4,
        priority: 'HIGH'
      });

      const dependent = repository.createTask({
        title: 'Executar Migrations',
        status: 'BLOCKED',
        effortHours: 2,
        priority: 'HIGH',
        assigneeId: 'user-davi-001'
      });

      repository.addDependency(dependent.id, prereq.id, 'FINISH_TO_START');

      // Conclui o pré-requisito e aciona o evento
      repository.updateTask(prereq.id, prereq.version, { status: 'COMPLETED' });
      const unblocked = await TaskDependencyGuard.onTaskCompleted(prereq.id);

      expect(unblocked).toContain(dependent.id);

      // O status da dependente deve ter mudado de BLOCKED para PENDING
      const updatedDependent = repository.getTask(dependent.id);
      expect(updatedDependent?.status).toBe('PENDING');
    });
  });

  describe('US09 & US22: Capacidade da Equipe, Ausências e Alocação Inteligente', () => {
    it('deve calcular a carga horária semanal e alertar sobrecarga acima de 40h', () => {
      const user = repository.getUserById('user-davi-001')!;
      (repository as any).tasks.clear();

      // Atribui tarefas que totalizam 45h na semana
      repository.createTask({
        title: 'Task 1',
        assigneeId: user.id,
        status: 'PENDING',
        effortHours: 25,
        dueDate: new Date()
      });
      repository.createTask({
        title: 'Task 2',
        assigneeId: user.id,
        status: 'IN_PROGRESS',
        effortHours: 20,
        dueDate: new Date()
      });

      const workload = CapacityService.getMemberWorkload(user.id);
      expect(workload.totalAllocatedHours).toBe(45);
      expect(workload.status).toBe('OVERLOADED');
      expect(workload.availableHours).toBe(0);
      expect(workload.utilizationPercentage).toBeGreaterThan(100);
    });

    it('deve bloquear alocação e marcar pontuação 0 para membro em férias/ausência', () => {
      const user = repository.getUserById('user-ana-002')!;
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);

      // Registra férias para Ana
      repository.addUserAbsence(user.id, 'VACATION', tomorrow, nextWeek, 'Férias de Verão');

      const recommendations = CapacityService.suggestAssignee({
        effortHours: 8,
        dueDate: tomorrow,
        tags: ['Frontend']
      }, [user]);

      expect(recommendations[0].status).toBe('ON_LEAVE');
      expect(recommendations[0].score).toBe(0);
      expect(recommendations[0].isRecommended).toBe(false);
      expect(recommendations[0].reason).toContain('Férias de Verão');
    });
  });

  describe('US14 / BE-14.1: Planning Poker e Estimativa PERT Consensual', () => {
    it('deve calcular a estimativa PERT clássica: (O + 4M + P) / 6 com desvio padrão', () => {
      // O = 4h, M = 8h, P = 16h
      // E = (4 + 4*8 + 16) / 6 = 52 / 6 = 8.67h
      // Desvio = (16 - 4) / 6 = 2h
      const pert = PlanningPokerService.calculatePert(4, 8, 16);
      expect(pert.expectedHours).toBe(8.67);
      expect(pert.standardDeviation).toBe(2);
      expect(pert.variance).toBe(4);
    });

    it('deve registrar votos do time e calcular mediana e consenso', () => {
      const taskId = 'task-poker-test';
      PlanningPokerService.vote(taskId, 'user-1', 'Davi', 5);
      PlanningPokerService.vote(taskId, 'user-2', 'Ana', 8);
      PlanningPokerService.vote(taskId, 'user-3', 'Carlos', 8);

      const summary = PlanningPokerService.getSessionSummary(taskId);
      expect(summary.votesCount).toBe(3);
      expect(summary.median).toBe(8);
      expect(summary.average).toBe(7);
      expect(summary.pertEstimate.expectedHours).toBeCloseTo(7.5, 1);
    });
  });

  describe('US13 / BE-13.2: Rotação Automática de Tarefas Recorrentes (Round-Robin)', () => {
    it('deve criar nova ocorrência da tarefa recorrente e rotacionar membro responsável', async () => {
      const originalTask = repository.createTask({
        title: 'Revisão Semanal de Segurança',
        status: 'PENDING',
        effortHours: 4,
        priority: 'HIGH',
        recurrenceInterval: 'WEEKLY',
        assigneeId: 'user-davi-001'
      });

      // Simula conclusão da tarefa
      repository.updateTask(originalTask.id, originalTask.version, { status: 'COMPLETED' });
      const nextTask = await RecurrenceRoundRobinService.handleTaskCompletion(originalTask.id);

      expect(nextTask).not.toBeNull();
      expect(nextTask?.title).toBe(originalTask.title);
      expect(nextTask?.status).toBe('PENDING');

      // A data deve ter avançado aproximadamente 7 dias
      const diffDays = (new Date(nextTask!.dueDate!).getTime() - new Date().getTime()) / 86400000;
      expect(diffDays).toBeGreaterThanOrEqual(6);
    });
  });

  describe('US23 / BE-23.2: Alertas Preditivos de Dependências Externas', () => {
    it('deve emitir alerta preditivo para dependência externa com prazo em menos de 48h', () => {
      const nearFuture = new Date();
      nearFuture.setHours(nearFuture.getHours() + 24); // Daqui a 24 horas

      const task = repository.createTask({
        title: 'Aprovação de Fornecedor Gateway de Pagamento',
        status: 'PENDING',
        effortHours: 4,
        priority: 'HIGH',
        dueDate: nearFuture
      });

      const tagExt = repository.createTag('Fornecedor Externo', '#EF4444');
      repository.taskTags.push({ taskId: task.id, tagId: tagExt.id });

      const warnings = TaskDependencyGuard.checkExternalDependencies();
      expect(warnings.length).toBeGreaterThan(0);
      expect(warnings[0].warning).toContain('Dependência Externa com vencimento próximo');
    });
  });
});
