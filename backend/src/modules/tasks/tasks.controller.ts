import { Request, Response } from 'express';
import { repository } from '../../database/repository';
import { Priority, TaskStatus } from '../../database/types';

export class TasksController {
  async list(req: Request, res: Response) {
    const { projectId, tag, status, priority, query } = req.query;
    const tasks = repository.getAllTasks({
      projectId: projectId as string,
      tag: tag as string,
      status: status as TaskStatus,
      priority: priority as Priority,
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
    const { title, description, priority, status, effortHours, startDate, dueDate, projectId, assigneeId, parentTaskId, tags } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, error: 'Título da tarefa é obrigatório.' });
    }

    const task = repository.createTask({
      title,
      description,
      priority,
      status,
      effortHours: effortHours ? parseFloat(effortHours) : 0,
      startDate,
      dueDate,
      projectId,
      assigneeId,
      parentTaskId
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

    const updatedTask = repository.getTaskWithDetails(id);
    return res.json({ success: true, data: updatedTask });
  }

  async lock(req: Request, res: Response) {
    const { id } = req.params;
    const { userId, userName, userAvatar } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, error: 'Identificação do usuário é obrigatória para adquirir o bloqueio.' });
    }

    const result = repository.lockTask(id, {
      id: userId,
      name: userName || 'Membro da equipe',
      avatarUrl: userAvatar
    });

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
}
