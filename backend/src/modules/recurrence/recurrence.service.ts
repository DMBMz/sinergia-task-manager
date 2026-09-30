import { Task, RecurrenceInterval, User } from '../../database/types';
import { repository } from '../../database/repository';
import { notificationService } from '../notifications/fcm.service';

export class RecurrenceRoundRobinService {
  /**
   * Calcula a próxima data de entrega com base no intervalo configurado
   */
  static getNextDueDate(currentDueDate: Date | null | undefined, interval: RecurrenceInterval): Date {
    const base = currentDueDate ? new Date(currentDueDate) : new Date();
    const next = new Date(base);

    switch (interval) {
      case 'DAILY':
        next.setDate(next.getDate() + 1);
        break;
      case 'WEEKLY':
        next.setDate(next.getDate() + 7);
        break;
      case 'MONTHLY':
        next.setMonth(next.getMonth() + 1);
        break;
      default:
        next.setDate(next.getDate() + 7);
        break;
    }

    return next;
  }

  /**
   * Seleciona o próximo responsável pelo critério de Round-Robin cíclico,
   * pulando membros que estejam de férias ou ausentes na data da nova ocorrência (BE-13.2 / US13)
   */
  static selectNextAssignee(
    currentAssigneeId: string | null | undefined,
    teamMembers: User[],
    targetDate: Date
  ): User | null {
    if (!teamMembers || teamMembers.length === 0) return null;

    // Filtra membros elegíveis (que não estão em férias/ausência no prazo da tarefa)
    const availableMembers = teamMembers.filter(m => !repository.isUserAbsent(m.id, targetDate));
    if (availableMembers.length === 0) {
      // Se todos estiverem ausentes, recorre ao primeiro da equipe como fallback
      return teamMembers[0];
    }

    // Encontra a posição do responsável atual
    const currentIndex = availableMembers.findIndex(m => m.id === currentAssigneeId);

    // Próximo índice circular: (currentIndex + 1) % length
    const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % availableMembers.length : 0;
    return availableMembers[nextIndex];
  }

  /**
   * Processa a conclusão de uma tarefa recorrente com rotação Round-Robin (BE-13.2 / US13)
   */
  static async handleTaskCompletion(taskId: string): Promise<Task | null> {
    const task = repository.getTaskById(taskId);
    if (!task || !task.recurrenceInterval) {
      return null;
    }

    const nextDueDate = this.getNextDueDate(task.dueDate, task.recurrenceInterval);
    const teamMembers = repository.getAllUsers();
    const nextAssignee = this.selectNextAssignee(task.assigneeId, teamMembers, nextDueDate);

    // Cria a nova instância recorrente da tarefa
    const nextTask = repository.createTask({
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: 'PENDING',
      effortHours: task.effortHours,
      startDate: new Date(),
      dueDate: nextDueDate,
      projectId: task.projectId,
      team: task.team || undefined,
      assigneeId: nextAssignee?.id || null,
      parentTaskId: task.parentTaskId || null,
      recurrenceInterval: task.recurrenceInterval
    });

    // Copia os itens de checklist da tarefa original
    const checklists = repository.getTaskChecklist(taskId);
    for (const item of checklists) {
      repository.addChecklistItem(nextTask.id, item.title, nextAssignee?.id || null);
    }

    // Notifica o novo responsável designado pelo rodízio Round-Robin
    if (nextAssignee) {
      await notificationService.sendNotification(
        { id: nextAssignee.id },
        {
          title: '🔄 Nova Tarefa Recorrente Atribuída (Rodízio)',
          body: `Você foi designado(a) pelo rodízio automático da equipe para a tarefa "${nextTask.title}". Prazo: ${nextDueDate.toLocaleDateString('pt-BR')}.`,
          urgencyLevel: 'LOW',
          color: '#2563EB',
          data: { taskId: nextTask.id, type: 'TASK_ASSIGNED' }
        }
      );
    }

    return nextTask;
  }
}

