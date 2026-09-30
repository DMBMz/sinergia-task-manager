import { Task, TaskDependency } from '../../database/types';
import { DagService } from './dag.service';

export interface CpmTaskMetric {
  taskId: string;
  title: string;
  duration: number;        // Horas estimadas (ou dias)
  earlyStart: number;     // ES
  earlyFinish: number;    // EF
  lateStart: number;      // LS
  lateFinish: number;     // LF
  totalSlack: number;     // Float Total (LS - ES)
  isCritical: boolean;    // true se totalSlack === 0
}

export interface CpmCalculationResult {
  hasCycle: boolean;
  errorMessage?: string;
  projectDuration: number;
  criticalPath: string[]; // Lista ordenada de IDs das tarefas no caminho crítico
  taskMetrics: Map<string, CpmTaskMetric>;
}

export class CpmService {
  /**
   * Executa o Método do Caminho Crítico (CPM) calculando folgas e identificando tarefas críticas (BE-23.1)
   */
  static calculate(tasks: Task[], dependencies: TaskDependency[]): CpmCalculationResult {
    // 1. Valida se o grafo é acíclico via Ordenação Topológica (Kahn)
    const topoResult = DagService.topologicalSort(tasks, dependencies);
    if (topoResult.hasCycle) {
      return {
        hasCycle: true,
        errorMessage: topoResult.errorMessage || 'Ciclo detectado nas dependências. Não é possível calcular o CPM.',
        projectDuration: 0,
        criticalPath: [],
        taskMetrics: new Map()
      };
    }

    const taskMap = new Map<string, Task>(tasks.map(t => [t.id, t]));
    const graph = DagService.buildGraph(tasks, dependencies);
    const metrics = new Map<string, CpmTaskMetric>();

    // Inicializa métricas
    for (const task of tasks) {
      const duration = Math.max(1, task.effortHours || 8);
      metrics.set(task.id, {
        taskId: task.id,
        title: task.title,
        duration,
        earlyStart: 0,
        earlyFinish: duration,
        lateStart: 0,
        lateFinish: 0,
        totalSlack: 0,
        isCritical: false
      });
    }

    // 2. FORWARD PASS: calcula Early Start (ES) e Early Finish (EF) na ordem topológica
    for (const taskId of topoResult.orderedTaskIds) {
      const node = graph.get(taskId)!;
      const metric = metrics.get(taskId)!;

      let maxPredecessorEF = 0;
      for (const predId of node.inEdges) {
        const predMetric = metrics.get(predId);
        if (predMetric && predMetric.earlyFinish > maxPredecessorEF) {
          maxPredecessorEF = predMetric.earlyFinish;
        }
      }

      metric.earlyStart = maxPredecessorEF;
      metric.earlyFinish = metric.earlyStart + metric.duration;
    }

    // Duração total do projeto = maior EF entre todas as tarefas
    let projectDuration = 0;
    for (const metric of metrics.values()) {
      if (metric.earlyFinish > projectDuration) {
        projectDuration = metric.earlyFinish;
      }
    }

    // 3. BACKWARD PASS: calcula Late Finish (LF) e Late Start (LS) na ordem topológica reversa
    const reverseOrder = [...topoResult.orderedTaskIds].reverse();
    for (const taskId of reverseOrder) {
      const node = graph.get(taskId)!;
      const metric = metrics.get(taskId)!;

      if (node.outEdges.length === 0) {
        // Nó folha (sem sucessores): LF é a duração total do projeto
        metric.lateFinish = projectDuration;
      } else {
        // LF é o menor LS entre todos os sucessores
        let minSuccessorLS = Infinity;
        for (const succId of node.outEdges) {
          const succMetric = metrics.get(succId);
          if (succMetric && succMetric.lateStart < minSuccessorLS) {
            minSuccessorLS = succMetric.lateStart;
          }
        }
        metric.lateFinish = minSuccessorLS === Infinity ? projectDuration : minSuccessorLS;
      }

      metric.lateStart = metric.lateFinish - metric.duration;
      metric.totalSlack = Math.max(0, metric.lateStart - metric.earlyStart);
      metric.isCritical = metric.totalSlack === 0;
    }

    // 4. IDENTIFICAÇÃO DO CAMINHO CRÍTICO:
    // Filtra tarefas críticas ordenadas por Early Start
    const criticalPath = topoResult.orderedTaskIds
      .filter(id => metrics.get(id)?.isCritical)
      .sort((a, b) => {
        const ma = metrics.get(a)!;
        const mb = metrics.get(b)!;
        return ma.earlyStart - mb.earlyStart;
      });

    return {
      hasCycle: false,
      projectDuration,
      criticalPath,
      taskMetrics: metrics
    };
  }
}
