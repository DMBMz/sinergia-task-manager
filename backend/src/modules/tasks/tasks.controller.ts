import { Request, Response } from 'express';
import { repository } from '../../database/repository';
import { Priority, TaskStatus, DependencyType, AssignmentStatus } from '../../database/types';
import { TaskDependencyGuard } from './tasks.guard';
import { DagService } from '../planning/dag.service';
import { RecurrenceRoundRobinService } from '../recurrence/recurrence.service';

export class TasksController {
  async list(req: Request, res: Response) {
    const {
      projectId,
      team,
      tag,
      tags,
      status,
      statuses,
      priority,
      priorities,
      assigneeId,
      scope,
      dueDateStart,
      dueDateEnd,
      overdue,
      query
    } = req.query;

    const parsedStatuses = typeof statuses === 'string'
      ? (statuses.split(',').map(s => s.trim()) as TaskStatus[])
      : (Array.isArray(statuses) ? statuses as TaskStatus[] : undefined);

    const parsedPriorities = typeof priorities === 'string'
      ? (priorities.split(',').map(s => s.trim()) as Priority[])
      : (Array.isArray(priorities) ? priorities as Priority[] : undefined);

    const tasks = repository.getAllTasks({
      projectId: projectId as string,
      team: team as string,
      tag: tag as string,
      tags: tags as string | string[],
      status: status as TaskStatus,
      statuses: parsedStatuses,
      priority: priority as Priority,
      priorities: parsedPriorities,
      assigneeId: assigneeId as string,
      scope: scope as 'all' | 'root_only' | 'subtasks_only',
      dueDateStart: dueDateStart as string,
      dueDateEnd: dueDateEnd as string,
      overdue: overdue as string,
      query: query as string
    });
    return res.json({ success: true, total: tasks.length, data: tasks });
  }

  async getById(req: Request, res: Response) {
    const { id } = req.params;
    const task = repository.getTaskWithDetails(id);
    if (!task) {
      return res.status(404).json({ success: false, error: 'Tarefa não encontrada.' });
    }
    return res.json({ success: true, data: task });
  }

  async create(req: Request, res: Response) {
    const {
      id,
      title,
      description,
      priority,
      status,
      effortHours,
      startDate,
      dueDate,
      projectId,
      team,
      assigneeId,
      assignee,
      parentTaskId,
      subtasks,
      tags,
      assignmentStatus,
      declinedReason,
      isRecurring,
      recurrenceInterval,
      recurrenceEnd,
      maxOccurrences,
      currentOccurrence,
      rotationUserIds,
      currentRotationIndex
    } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, error: 'Título da tarefa é obrigatório.' });
    }

    const task = repository.createTask({
      id,
      title,
      description,
      priority,
      status,
      effortHours: effortHours ? parseFloat(effortHours) : 0,
      startDate,
      dueDate,
      projectId,
      team,
      assigneeId,
      assignee,
      subtasks,
      parentTaskId,
      assignmentStatus: assignmentStatus || 'ACCEPTED',
      declinedReason: declinedReason || null,
      isRecurring: Boolean(isRecurring),
      recurrenceInterval: recurrenceInterval || null,
      recurrenceEnd: recurrenceEnd ? new Date(recurrenceEnd) : null,
      maxOccurrences: maxOccurrences !== undefined ? maxOccurrences : null,
      currentOccurrence: currentOccurrence || 1,
      rotationUserIds: Array.isArray(rotationUserIds) ? rotationUserIds : [],
      currentRotationIndex: currentRotationIndex || 0
    });

    // Se tags foram fornecidas, associa
    if (Array.isArray(tags)) {
      for (const tagId of tags) {
        repository.taskTags.push({ taskId: task.id, tagId });
      }
    }

    const created = repository.getTaskWithDetails(task.id);
    return res.status(201).json({ success: true, data: created });
  }

  async update(req: Request, res: Response) {
    const { id } = req.params;
    const { version, ...updateData } = req.body;

    if (version === undefined) {
      return res.status(400).json({
        success: false,
        error: 'É necessário informar o campo "version" da tarefa para controle de concorrência (Lock Otimista).'
      });
    }

    // Sprint 2 Onda 2: Validação de dependências antes de transição para IN_PROGRESS ou COMPLETED (BE-10.2 / US10)
    if (updateData.status) {
      const guardResult = TaskDependencyGuard.validateTransition(id, updateData.status as TaskStatus);
      if (!guardResult.allowed) {
        return res.status(400).json({
          success: false,
          blocked: true,
          error: guardResult.reason,
          blockingTasks: guardResult.blockingTasks
        });
      }
    }

    // US06: Lock Otimista & Bloqueio Simultâneo
    const result = repository.updateTask(id, Number(version), updateData);

    if (result.locked) {
      return res.status(423).json({
        success: false,
        locked: true,
        error: `Bloqueio de Edição Simultânea: ${result.lockedBy?.name || 'Outro usuário'} está editando esta tarefa no momento.`,
        lockedBy: result.lockedBy,
        currentTask: repository.getTaskWithDetails(id)
      });
    }

    if (result.conflict) {
      return res.status(409).json({
        success: false,
        error: 'Conflito de Concorrência (Lock Otimista): Esta tarefa foi alterada por outro membro enquanto você a editava.',
        serverVersion: result.currentVersion,
        currentTask: repository.getTaskWithDetails(id)
      });
    }

    if (!result.task) {
      return res.status(404).json({ success: false, error: 'Tarefa não encontrada.' });
    }

    // Sprint 2 Onda 2: Ao concluir tarefa, desbloqueia dependentes e processa recorrência Round-Robin
    if (result.task && updateData.status === 'COMPLETED') {
      TaskDependencyGuard.onTaskCompleted(id).catch(err => console.error('[Guard Error]', err));
      RecurrenceRoundRobinService.handleTaskCompletion(id).catch(err => console.error('[Recurrence Error]', err));
    }

    const updatedTask = repository.getTaskWithDetails(id);
    return res.json({ success: true, data: updatedTask });
  }

  async lock(req: Request, res: Response) {
    const { id } = req.params;
    const { userId, userName, avatarUrl } = req.body;

    if (!userId || !userName) {
      return res.status(400).json({ success: false, error: 'Dados do usuário são obrigatórios para bloquear a tarefa.' });
    }

    const result = repository.lockTask(id, { id: userId, name: userName, avatarUrl });
    if (!result.success) {
      return res.status(423).json({
        success: false,
        locked: true,
        error: `A tarefa já está sendo editada por ${result.lockedBy?.name || 'outro membro'}.`,
        lockedBy: result.lockedBy,
        task: result.task
      });
    }

    return res.json({
      success: true,
      message: 'Bloqueio de edição exclusiva adquirido com sucesso.',
      task: result.task
    });
  }

  async unlock(req: Request, res: Response) {
    const { id } = req.params;
    const { userId } = req.body;

    const result = repository.unlockTask(id, userId);
    return res.json({
      success: true,
      message: 'Bloqueio de edição liberado.',
      task: result.task
    });
  }

  async remove(req: Request, res: Response) {
    const { id } = req.params;
    const deleted = repository.deleteTask(id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Tarefa não encontrada.' });
    }
    return res.json({ success: true, message: 'Tarefa excluída com sucesso.' });
  }

  // ==========================================
  // SPRINT 2: DEPENDENCIES (US10 / BE-10.2)
  // ==========================================
  async addDependency(req: Request, res: Response) {
    const { id } = req.params;
    const { dependsOnTaskId, dependencyType } = req.body;

    if (!dependsOnTaskId) {
      return res.status(400).json({ success: false, error: 'dependsOnTaskId é obrigatório.' });
    }

    if (id === dependsOnTaskId) {
      return res.status(400).json({ success: false, error: 'Uma tarefa não pode depender de si mesma.' });
    }

    // Sprint 2 Onda 2: Validação de Ciclos em Grafo (Kahn / DAG) antes de inserir dependência (BE-11.1 / US11)
    const allTasks = repository.getAllTasks();
    const existingDeps = Array.from((repository as any).taskDependencies.values()) as any[];
    if (DagService.wouldCreateCycle(allTasks, existingDeps, id, dependsOnTaskId)) {
      return res.status(400).json({
        success: false,
        hasCycle: true,
        error: 'Não é possível adicionar esta dependência: criaria um ciclo circular no grafo de tarefas (Deadlock).'
      });
    }

    try {
      const dep = repository.addDependency(id, dependsOnTaskId, dependencyType as DependencyType);
      return res.status(201).json({ success: true, data: dep, task: repository.getTaskWithDetails(id) });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  async removeDependency(req: Request, res: Response) {
    const { depId } = req.params;
    const removed = repository.removeDependency(depId);
    if (!removed) {
      return res.status(404).json({ success: false, error: 'Dependência não encontrada.' });
    }
    return res.json({ success: true, message: 'Dependência removida com sucesso.' });
  }

  // ==========================================
  // SPRINT 2: CHECKLIST (US21 / BE-21.2)
  // ==========================================
  async addChecklistItem(req: Request, res: Response) {
    const { id } = req.params;
    const { title, assigneeId } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, error: 'Título do item é obrigatório.' });
    }

    const item = repository.addChecklistItem(id, title, assigneeId);
    return res.status(201).json({ success: true, data: item, task: repository.getTaskWithDetails(id) });
  }

  async updateChecklistItem(req: Request, res: Response) {
    const { itemId } = req.params;
    const updated = repository.updateChecklistItem(itemId, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Item de checklist não encontrado.' });
    }
    return res.json({ success: true, data: updated, task: repository.getTaskWithDetails(updated.taskId) });
  }

  async deleteChecklistItem(req: Request, res: Response) {
    const { itemId } = req.params;
    const item = repository.taskChecklists.get(itemId);
    const taskId = item?.taskId;
    const deleted = repository.deleteChecklistItem(itemId);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Item de checklist não encontrado.' });
    }
    return res.json({ success: true, message: 'Item removido.', task: taskId ? repository.getTaskWithDetails(taskId) : null });
  }

  // ==========================================
  // SPRINT 2: DUPLICAÇÃO / CLONAGEM (US21 / BE-21.2)
  // ==========================================
  async clone(req: Request, res: Response) {
    const { id } = req.params;
    const { dateOffsetDays } = req.body;

    try {
      const cloned = repository.cloneTask(id, Number(dateOffsetDays) || 0);
      return res.status(201).json({ success: true, data: cloned, message: 'Tarefa duplicada com sucesso.' });
    } catch (err: any) {
      return res.status(404).json({ success: false, error: err.message });
    }
  }

  // ==========================================
  // SPRINT 2: ACEITE / RECUSA DE TAREFA (US22 / BE-22.2)
  // ==========================================
  async respondAssignment(req: Request, res: Response) {
    const { id } = req.params;
    const { status, declinedReason } = req.body;

    if (!status || !['ACCEPTED', 'DECLINED'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Status deve ser ACCEPTED ou DECLINED.' });
    }

    const task = repository.getTask(id);
    if (!task) {
      return res.status(404).json({ success: false, error: 'Tarefa não encontrada.' });
    }

    const updated = repository.updateTask(id, task.version, {
      assignmentStatus: status as AssignmentStatus,
      declinedReason: status === 'DECLINED' ? (declinedReason || 'Sem justificativa') : null
    });

    return res.json({ success: true, data: repository.getTaskWithDetails(id) });
  }
}
