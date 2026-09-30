import { Task, TaskStatus } from '../../database/types';
import { repository } from '../../database/repository';
import { notificationService } from '../notifications/fcm.service';

export interface GuardValidationResult {
  allowed: boolean;
  reason?: string;
  blockingTaskIds?: string[];
  blockingTasks?: Array<{ id: string; title: string; status: TaskStatus; assignee?: string }>;
}

export class TaskDependencyGuard {
  /**
   * Valida se uma tarefa pode ser iniciada ou concluída respeitando suas dependências (BE-10.2 / US10)
   */
  static validateTransition(taskId: string, targetStatus: TaskStatus): GuardValidationResult {
    // Apenas transições para IN_PROGRESS ou COMPLETED exigem conclusão dos pré-requisitos
    if (targetStatus !== 'IN_PROGRESS' && targetStatus !== 'COMPLETED') {
      return { allowed: true };
    }

    const dependencies = repository.getTaskDependencies(taskId);
    if (!dependencies || dependencies.length === 0) {
      return { allowed: true };
    }

    const blockingTasks: Array<{ id: string; title: string; status: TaskStatus; assignee?: string }> = [];

    for (const dep of dependencies) {
      // Regra FINISH_TO_START: a tarefa antecessora (dependsOnTaskId) DEVE estar concluída (COMPLETED)
      if (dep.dependencyType === 'FINISH_TO_START') {
        const prereq = repository.getTaskById(dep.dependsOnTaskId);
        if (prereq && prereq.status !== 'COMPLETED') {
          blockingTasks.push({
            id: prereq.id,
            title: prereq.title,
            status: prereq.status,
            assignee: (prereq as any).assignee || prereq.assigneeId || undefined
          });
        }
      }
    }

    if (blockingTasks.length > 0) {
      const titles = blockingTasks.map(t => `"${t.title}" (${t.status})`).join(', ');
      return {
        allowed: false,
        reason: `Ação bloqueada por dependência de tarefa: É necessário concluir os pré-requisitos primeiro: ${titles}.`,
        blockingTaskIds: blockingTasks.map(t => t.id),
        blockingTasks
      };
    }

    return { allowed: true };
  }

  /**
   * Dispara alertas e notificações automáticas ao concluir uma tarefa antecessora (BE-10.2 / US10)
   */
  static async onTaskCompleted(completedTaskId: string): Promise<string[]> {
    const completedTask = repository.getTaskById(completedTaskId);
    if (!completedTask) return [];

    // Busca todas as tarefas que dependiam desta que foi concluída
    const allDependencies = Array.from((repository as any).taskDependencies.values()) as any[];
    const dependents = allDependencies.filter(d => d.dependsOnTaskId === completedTaskId);
    const unblockedTaskIds: string[] = [];

    for (const dep of dependents) {
      const targetTask = repository.getTaskById(dep.taskId);
      if (!targetTask || targetTask.status === 'COMPLETED') continue;

      // Verifica se todas as dependências restantes desta tarefa alvo agora estão concluídas
      const validation = this.validateTransition(targetTask.id, 'IN_PROGRESS');
      if (validation.allowed) {
        unblockedTaskIds.push(targetTask.id);

        // Se o status da tarefa estava BLOCKED, move automaticamente para PENDING
        if (targetTask.status === 'BLOCKED') {
          repository.updateTask(targetTask.id, targetTask.version, { status: 'PENDING' });
        }

        // Notifica o responsável da tarefa desbloqueada
        if (targetTask.assigneeId) {
          await notificationService.sendNotification(
            { id: targetTask.assigneeId },
            {
              title: '🎉 Tarefa Desbloqueada!',
              body: `O pré-requisito "${completedTask.title}" foi concluído. A tarefa "${targetTask.title}" está pronta para ser iniciada.`,
              urgencyLevel: 'LOW',
              color: '#10B981',
              data: { taskId: targetTask.id, type: 'TASK_UNBLOCKED' }
            }
          );
        }
      }
    }

    return unblockedTaskIds;
  }

  /**
   * Monitora e gera alertas preditivos para dependências externas de terceiros (BE-23.2 / US23)
   */
  static checkExternalDependencies(projectId?: string): Array<{ taskId: string; title: string; warning: string }> {
    const allTasks = repository.getAllTasks(projectId ? { projectId } : undefined);
    const warnings: Array<{ taskId: string; title: string; warning: string }> = [];
    const now = Date.now();
    const threshold48h = now + (48 * 3600 * 1000);

    for (const task of allTasks) {
      if (task.status === 'COMPLETED') continue;

      const isExternal = (task.tags || []).some((t: any) => {
        const name = typeof t === 'string' ? t.toLowerCase() : (t?.name || '').toLowerCase();
        return name.includes('extern') || name.includes('terceiro') || name.includes('fornecedor') || name.includes('vendor');
      });

      if (isExternal && task.dueDate) {
        const dueTime = new Date(task.dueDate).getTime();
        if (dueTime <= threshold48h) {
          warnings.push({
            taskId: task.id,
            title: task.title,
            warning: `Dependência Externa com vencimento próximo (${Math.round((dueTime - now) / 3600000)}h restantes). Risco de atraso no caminho crítico.`
          });
        }
      }
    }

    return warnings;
  }
}
