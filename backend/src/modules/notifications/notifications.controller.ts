import { Request, Response } from 'express';
import { repository } from '../../database/repository';
import { NotificationService, notificationService } from './fcm.service';
import { AutomationEngineService } from '../automations/automation.service';

// Using exported notificationService singleton from fcm.service

export class NotificationsController {
  async checkDeadlines(req: Request, res: Response) {
    const now = req.query.simulatedDate ? new Date(req.query.simulatedDate as string) : new Date();
    const tasks = repository.getAllTasks();
    const alertsTriggered: any[] = [];

    for (const task of tasks) {
      if (task.dueDate && task.status !== 'COMPLETED') {
        const dueDate = new Date(task.dueDate);
        const alert = notificationService.calculateDeadlineAlert(dueDate, now);
        if (dueDate.getTime() < now.getTime()) {
          await AutomationEngineService.evaluateEvent('OVERDUE', task.id);
        } else if (alert) {
          await AutomationEngineService.evaluateEvent('DEADLINE_APPROACHING', task.id);
        }

        if (alert && task.assignee) {
          const sent = await notificationService.sendNotification(task.assignee, {
            ...alert,
            data: { taskId: task.id, type: 'DEADLINE_ALERT' }
          });
          alertsTriggered.push({
            taskId: task.id,
            taskTitle: task.title,
            assignee: task.assignee.name,
            dueDate,
            alert,
            sent
          });
        }
      }
    }

    return res.json({
      success: true,
      simulatedTime: now,
      totalAlerts: alertsTriggered.length,
      alerts: alertsTriggered
    });
  }

  async getHistory(req: Request, res: Response) {
    return res.json({
      success: true,
      history: notificationService.getSentHistory()
    });
  }
}
