import { Task, TaskDependency } from '../../database/types';

export interface DagNode {
  taskId: string;
  inDegree: number;
  outEdges: string[];     // IDs das tarefas que dependem desta (sucessores)
  inEdges: string[];      // IDs das tarefas pré-requisito (antecessores)
}

export interface DagValidationResult {
  isValidDag: boolean;
  hasCycle: boolean;
  cycleNodes?: string[];
  orderedTaskIds: string[];
  errorMessage?: string;
}

export class DagService {
  /**
   * Constrói o grafo de adjacências e graus de entrada a partir das tarefas e dependências
   */
  static buildGraph(tasks: Task[], dependencies: TaskDependency[]): Map<string, DagNode> {
    const graph = new Map<string, DagNode>();

    // Inicializa todos os nós
    for (const task of tasks) {
      graph.set(task.id, {
        taskId: task.id,
        inDegree: 0,
        outEdges: [],
        inEdges: []
      });
    }

    // Adiciona as arestas direcionadas: dependsOnTaskId -> taskId
    // (A tarefa pré-requisito precisa terminar antes da dependente iniciar)
    for (const dep of dependencies) {
      const u = dep.dependsOnTaskId;
      const v = dep.taskId;

      // Só processa dependências entre tarefas presentes na lista
      if (graph.has(u) && graph.has(v)) {
        const uNode = graph.get(u)!;
        const vNode = graph.get(v)!;

        uNode.outEdges.push(v);
        vNode.inEdges.push(u);
        vNode.inDegree += 1;
      }
    }

    return graph;
  }

  /**
   * Executa o Algoritmo de Kahn para ordenação topológica e detecção de ciclos direcionados (BE-11.1)
   */
  static topologicalSort(tasks: Task[], dependencies: TaskDependency[]): DagValidationResult {
    const graph = this.buildGraph(tasks, dependencies);
    const inDegreeMap = new Map<string, number>();
    const queue: string[] = [];
    const orderedTaskIds: string[] = [];

    // Fila inicial com nós que possuem inDegree == 0 (sem pré-requisitos)
    for (const [taskId, node] of graph.entries()) {
      inDegreeMap.set(taskId, node.inDegree);
      if (node.inDegree === 0) {
        queue.push(taskId);
      }
    }

    // Processa a fila retirando os nós e decrementando o grau dos sucessores
    while (queue.length > 0) {
      const currentId = queue.shift()!;
      orderedTaskIds.push(currentId);

      const node = graph.get(currentId);
      if (node) {
        for (const successorId of node.outEdges) {
          const currentDegree = inDegreeMap.get(successorId)! - 1;
          inDegreeMap.set(successorId, currentDegree);
          if (currentDegree === 0) {
            queue.push(successorId);
          }
        }
      }
    }

    // Se o número de nós ordenados for menor que o total, existe um ciclo (deadlock de dependência)
    if (orderedTaskIds.length < graph.size) {
      // Identifica nós que participam de ciclos (aqueles com inDegree restante > 0)
      const cycleNodes: string[] = [];
      for (const [taskId, deg] of inDegreeMap.entries()) {
        if (deg > 0) {
          cycleNodes.push(taskId);
        }
      }

      return {
        isValidDag: false,
        hasCycle: true,
        cycleNodes,
        orderedTaskIds: [],
        errorMessage: `Ciclo de dependência circular detectado envolvendo ${cycleNodes.length} tarefa(s). Verifique as dependências circulares.`
      };
    }

    return {
      isValidDag: true,
      hasCycle: false,
      orderedTaskIds
    };
  }

  /**
   * Valida se a adição de uma nova dependência criaria um ciclo
   */
  static wouldCreateCycle(
    tasks: Task[],
    existingDependencies: TaskDependency[],
    newTaskId: string,
    newDependsOnTaskId: string
  ): boolean {
    if (newTaskId === newDependsOnTaskId) return true;

    // Simula a adição da nova dependência
    const simulatedDependencies: TaskDependency[] = [
      ...existingDependencies,
      {
        id: 'simulated',
        taskId: newTaskId,
        dependsOnTaskId: newDependsOnTaskId,
        dependencyType: 'FINISH_TO_START',
        createdAt: new Date()
      }
    ];

    const result = this.topologicalSort(tasks, simulatedDependencies);
    return result.hasCycle;
  }
}
