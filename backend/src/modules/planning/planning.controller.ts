import { Request, Response } from 'express';
import { repository } from '../../database/repository';
import { DagService } from './dag.service';
import { CpmService } from './cpm.service';
import { PlanningPokerService } from './pert.service';
import { TaskDependencyGuard } from '../tasks/tasks.guard';

export class PlanningController {
  /**
   * Ordenação Topológica e Validação de Ciclos (BE-11.1 / US11)
   */
  async getTopologicalSort(req: Request, res: Response) {
    const { projectId } = req.params;
    const tasks = repository.getAllTasks(projectId ? { projectId } : undefined);
    const dependencies = Array.from((repository as any).taskDependencies.values()) as any[];

    const result = DagService.topologicalSort(tasks, dependencies);
    const orderedTasks = result.orderedTaskIds
      .map(id => repository.getTaskWithDetails(id))
      .filter(Boolean);

    return res.json({
      success: true,
      hasCycle: result.hasCycle,
      isValidDag: result.isValidDag,
      cycleNodes: result.cycleNodes,
      errorMessage: result.errorMessage,
      data: orderedTasks
    });
  }

  /**
   * Cálculo do Caminho Crítico (CPM) com folgas e duração total (BE-23.1 / US23)
   */
  async getCriticalPath(req: Request, res: Response) {
    const { projectId } = req.params;
    const tasks = repository.getAllTasks(projectId ? { projectId } : undefined);
    const dependencies = Array.from((repository as any).taskDependencies.values()) as any[];

    const result = CpmService.calculate(tasks, dependencies);
    if (result.hasCycle) {
      return res.status(400).json({
        success: false,
        hasCycle: true,
        error: result.errorMessage
      });
    }

    const metricsArray = Array.from(result.taskMetrics.values());
    const criticalTasks = result.criticalPath
      .map(id => repository.getTaskWithDetails(id))
      .filter(Boolean);

    return res.json({
      success: true,
      projectDurationHours: result.projectDuration,
      criticalPathCount: result.criticalPath.length,
      criticalTasks,
      metrics: metricsArray
    });
  }

  /**
   * Agregador de Dados para Gráfico de Gantt (BE-12.1 / US12)
   */
  async getGanttData(req: Request, res: Response) {
    const { projectId } = req.params;
    const tasks = repository.getAllTasks(projectId ? { projectId } : undefined);
    const dependencies = Array.from((repository as any).taskDependencies.values()) as any[];

    const cpmResult = CpmService.calculate(tasks, dependencies);
    const now = new Date();

    const ganttTasks = tasks.map(task => {
      const metric = cpmResult.taskMetrics.get(task.id);
      const taskDeps = repository.getTaskDependencies(task.id);

      const startDate = task.startDate ? new Date(task.startDate) : now;
      let dueDate = task.dueDate ? new Date(task.dueDate) : null;
      if (!dueDate) {
        const hours = task.effortHours || 8;
        dueDate = new Date(startDate.getTime() + hours * 3600 * 1000);
      }

      return {
        id: task.id,
        title: task.title,
        assignee: task.assignee || 'Não atribuído',
        status: task.status,
        priority: task.priority,
        startDate: startDate.toISOString(),
        dueDate: dueDate.toISOString(),
        durationHours: task.effortHours || 8,
        earlyStart: metric?.earlyStart || 0,
        earlyFinish: metric?.earlyFinish || 0,
        lateStart: metric?.lateStart || 0,
        lateFinish: metric?.lateFinish || 0,
        slackHours: metric?.totalSlack || 0,
        isCritical: metric?.isCritical || false,
        dependencies: taskDeps.map(d => ({
          dependsOnTaskId: d.dependsOnTaskId,
          dependencyType: d.dependencyType
        }))
      };
    });

    return res.json({
      success: true,
      projectDurationHours: cpmResult.projectDuration,
      criticalPath: cpmResult.criticalPath,
      tasks: ganttTasks
    });
  }

  /**
   * Alertas Preditivos de Dependências Externas (BE-23.2 / US23)
   */
  async getExternalDependencies(req: Request, res: Response) {
    const { projectId } = req.params;
    const warnings = TaskDependencyGuard.checkExternalDependencies(projectId);
    return res.json({ success: true, count: warnings.length, data: warnings });
  }

  // ==========================================
  // SPRINT 2: PLANNING POKER & PERT (US14 / BE-14.1)
  // ==========================================
  async votePoker(req: Request, res: Response) {
    const { id } = req.params;
    const { userId, userName, points } = req.body;

    if (!userId || points === undefined) {
      return res.status(400).json({ success: false, error: 'userId e points são obrigatórios.' });
    }

    const vote = PlanningPokerService.vote(id, userId, userName || 'Membro', Number(points));
    const summary = PlanningPokerService.getSessionSummary(id);

    return res.json({
      success: true,
      message: 'Voto registrado com sucesso.',
      data: summary
    });
  }

  async revealPokerVotes(req: Request, res: Response) {
    const { id } = req.params;
    PlanningPokerService.revealVotes(id);
    const summary = PlanningPokerService.getSessionSummary(id);
    return res.json({ success: true, data: summary });
  }

  async getPokerSummary(req: Request, res: Response) {
    const { id } = req.params;
    const summary = PlanningPokerService.getSessionSummary(id);
    return res.json({ success: true, data: summary });
  }

  async applyPokerConsensus(req: Request, res: Response) {
    const { id } = req.params;
    const { version } = req.body;

    const summary = PlanningPokerService.getSessionSummary(id);
    if (!summary || summary.votesCount === 0) {
      return res.status(400).json({ success: false, error: 'Nenhum voto registrado para consolidar.' });
    }

    const consensusHours = summary.pertEstimate.expectedHours;
    const currentTask = repository.getTask(id);
    if (!currentTask) {
      return res.status(404).json({ success: false, error: 'Tarefa não encontrada.' });
    }

    const targetVer = version !== undefined ? Number(version) : currentTask.version;
    const updated = repository.updateTask(id, targetVer, { effortHours: consensusHours });

    return res.json({
      success: true,
      message: `Estimativa PERT consensual de ${consensusHours}h aplicada com sucesso.`,
      data: repository.getTaskWithDetails(id)
    });
  }
}

export const planningController = new PlanningController();
