import { Request, Response } from 'express';
import { repository } from '../../database/repository';
import { NotificationService } from '../notifications/fcm.service';

const notificationService = new NotificationService();

export class CommentsController {
  async create(req: Request, res: Response) {
    const { id: taskId } = req.params;
    const { authorId, content } = req.body;

    if (!content || !authorId) {
      return res.status(400).json({ success: false, error: 'Conteúdo e authorId são obrigatórios.' });
    }

    const task = repository.getTask(taskId);
    if (!task) {
      return res.status(404).json({ success: false, error: 'Tarefa não encontrada.' });
    }

    const comment = repository.createComment({
      taskId,
      authorId,
      content
    });

    // Se houver menções com @, dispara notificações
    if (comment.mentions && comment.mentions.length > 0) {
      for (const mention of comment.mentions) {
        // Encontra usuário mencionado por nome ou email
        const user = Array.from(repository.users.values()).find(
          u => u.name.toLowerCase().includes(mention.toLowerCase()) || u.id === mention
        );
        if (user) {
          await notificationService.sendNotification(user, {
            title: `💬 Menção na tarefa "${task.title}"`,
            body: `Você foi marcado(a) por um colega: "${content.substring(0, 80)}..."`,
            urgencyLevel: 'HIGH',
            color: '#3B82F6',
            data: { taskId: task.id, type: 'MENTION' }
          });
        }
      }
    }

    return res.status(201).json({ success: true, data: comment });
  }

  async list(req: Request, res: Response) {
    const { id: taskId } = req.params;
    const comments = Array.from(repository.comments.values()).filter(c => c.taskId === taskId);
    return res.json({ success: true, total: comments.length, data: comments });
  }
}
