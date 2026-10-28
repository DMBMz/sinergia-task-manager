import { repository } from '../../database/repository';
import { AutomationRule, AutomationTrigger, Priority, TaskStatus } from '../../database/types';
import { notificationService } from '../notifications/fcm.service';

export type ConditionOperator = 'EQUALS' | 'NOT_EQUALS' | 'CONTAINS' | 'GREATER_THAN' | 'LESS_THAN';

export interface AutomationCondition {
  field?: string;
  operator?: ConditionOperator;
  value?: any;
}

export type AutomationActionType =
  | 'SEND_NOTIFICATION'
  | 'CHANGE_STATUS'
  | 'CHANGE_PRIORITY'
  | 'ASSIGN_USER'
  | 'ADD_TAG'
  | 'ARCHIVE';

export interface AutomationAction {
  action: AutomationActionType;
  targetValue?: any;
  targetRole?: string;
  targetUserId?: string;
  message?: string;
  value?: any;
}

export interface AutomationExecutionLog {
  id: string;
  ruleId: string;
  ruleName: string;
  trigger: AutomationTrigger;
  taskId: string;
  taskTitle: string;
  actionsExecuted: string[];
  timestamp: Date;
}

export class AutomationEngineService {
  private static executionLogs: AutomationExecutionLog[] = [];

  /**
   * Avalia uma condição individual sobre um objeto de tarefa
   */
  static evaluateSingleCondition(task: any, cond: AutomationCondition): boolean {
    if (!cond || !cond.field) return true; // Sem restrição de campo = sempre verdadeiro

    const operator: ConditionOperator = cond.operator || 'EQUALS';
    const expected = cond.value;

    let actual: any = task[cond.field];
    if (cond.field === 'assignee' && typeof task.assignee === 'object' && task.assignee !== null) {
      actual = task.assignee.name || task.assignee.id;
    } else if (cond.field === 'tags' && Array.isArray(task.tags)) {
      actual = task.tags.map((t: any) => (typeof t === 'string' ? t : t.name)).join(',');
    }

    if (actual === undefined || actual === null) {
      return operator === 'NOT_EQUALS' && expected !== null && expected !== '';
    }

    const actualStr = String(actual).toLowerCase().trim();
    const expectedStr = String(expected ?? '').toLowerCase().trim();

    switch (operator) {
      case 'EQUALS':
        return actualStr === expectedStr;
      case 'NOT_EQUALS':
        return actualStr !== expectedStr;
      case 'CONTAINS':
        return actualStr.includes(expectedStr);
      case 'GREATER_THAN':
        return Number(actual) > Number(expected);
      case 'LESS_THAN':
        return Number(actual) < Number(expected);
      default:
        return actualStr === expectedStr;
    }
  }

  /**
   * Avalia o conditionsJson de uma regra sobre a tarefa
   */
  static evaluateConditions(task: any, conditionsJson: string): boolean {
    if (!conditionsJson || conditionsJson.trim() === '' || conditionsJson.trim() === '{}') {
      return true;
    }
    try {
      const parsed = JSON.parse(conditionsJson);
      if (Array.isArray(parsed)) {
        return parsed.every(c => this.evaluateSingleCondition(task, c));
      }
      return this.evaluateSingleCondition(task, parsed);
    } catch (err) {
      console.warn('[AutomationEngine] JSON de condições inválido:', err);
      return false;
    }
  }

  /**
   * Executa a lista de ações JSON sobre a tarefa
   */
  static async executeActions(rule: AutomationRule, task: any): Promise<string[]> {
    const executed: string[] = [];
    let actions: AutomationAction[] = [];

    try {
      const parsed = JSON.parse(rule.actionsJson || '[]');
      actions = Array.isArray(parsed) ? parsed : [parsed];
    } catch (err) {
      console.warn('[AutomationEngine] JSON de ações inválido:', err);
      return executed;
    }

    const rawTask = repository.tasks.get(task.id);

    for (const act of actions) {
      if (!act || !act.action) continue;
      const val = act.targetValue !== undefined ? act.targetValue : act.value;

      switch (act.action) {
        case 'SEND_NOTIFICATION': {
          const targetRole = act.targetRole || 'ADMIN';
          const targetUserId = act.targetUserId || val;
          let targetUser = targetUserId ? repository.users.get(String(targetUserId)) : undefined;

          if (!targetUser && targetRole) {
            const member = Array.from(repository.projectMembers.values()).find(
              pm => pm.projectId === (task.projectId || rule.projectId) && pm.role === targetRole
            );
            if (member) {
              targetUser = repository.users.get(member.userId);
            }
          }
          if (!targetUser && task.assigneeId) {
            targetUser = repository.users.get(task.assigneeId);
          }
          if (!targetUser) {
            targetUser = Array.from(repository.users.values())[0];
          }

          if (targetUser) {
            await notificationService.sendNotification(targetUser, {
              title: `⚡ Automação: ${rule.name}`,
              body: act.message || `Regra disparada para a tarefa "${task.title}".`,
              urgencyLevel: task.priority === 'URGENT' ? 'CRITICAL' : 'HIGH',
              color: '#8B5CF6',
              data: {
                taskId: task.id,
                ruleId: rule.id,
                trigger: rule.trigger,
                type: 'AUTOMATION_RULE'
              }
            });
            executed.push(`SEND_NOTIFICATION -> ${targetUser.name}`);
          }
          break;
        }

        case 'CHANGE_STATUS': {
          if (rawTask && val) {
            rawTask.status = String(val).toUpperCase() as TaskStatus;
            rawTask.updatedAt = new Date();
            repository.tasks.set(rawTask.id, rawTask);
            executed.push(`CHANGE_STATUS -> ${rawTask.status}`);
          }
          break;
        }

        case 'CHANGE_PRIORITY': {
          if (rawTask && val) {
            rawTask.priority = String(val).toUpperCase() as Priority;
            rawTask.updatedAt = new Date();
            repository.tasks.set(rawTask.id, rawTask);
            executed.push(`CHANGE_PRIORITY -> ${rawTask.priority}`);
          }
          break;
        }

        case 'ASSIGN_USER': {
          const uid = act.targetUserId || val;
          if (rawTask && uid) {
            const user =
              repository.users.get(String(uid)) ||
              Array.from(repository.users.values()).find(
                u => u.name.toLowerCase() === String(uid).toLowerCase()
              );
            if (user) {
              rawTask.assigneeId = user.id;
              rawTask.assigneeName = user.name;
              rawTask.updatedAt = new Date();
              repository.tasks.set(rawTask.id, rawTask);
              executed.push(`ASSIGN_USER -> ${user.name}`);
            } else {
              rawTask.assigneeName = String(uid);
              rawTask.updatedAt = new Date();
              repository.tasks.set(rawTask.id, rawTask);
              executed.push(`ASSIGN_USER -> ${uid}`);
            }
          }
          break;
        }

        case 'ADD_TAG': {
          if (rawTask && val) {
            const existingDetails = repository.getTaskWithDetails(rawTask.id);
            const currentTags = (existingDetails?.tags || []).map((t: any) => t.name);
            if (!currentTags.includes(String(val))) {
              repository.setTaskTags(rawTask.id, rawTask.projectId, [...currentTags, String(val)]);
            }
            executed.push(`ADD_TAG -> ${val}`);
          }
          break;
        }

        case 'ARCHIVE': {
          if (rawTask) {
            rawTask.status = 'COMPLETED';
            rawTask.updatedAt = new Date();
            repository.tasks.set(rawTask.id, rawTask);
            executed.push(`ARCHIVE -> COMPLETED`);
          }
          break;
        }
      }
    }

    return executed;
  }

  /**
   * Dispara a avaliação de todas as regras ativas para o gatilho informado (BE-15.2)
   */
  static async evaluateEvent(
    trigger: AutomationTrigger,
    taskId: string
  ): Promise<{ matchedRules: number; executions: AutomationExecutionLog[] }> {
    const task = repository.getTaskWithDetails(taskId);
    if (!task) {
      return { matchedRules: 0, executions: [] };
    }

    const rules = repository
      .getAutomationRules()
      .filter(
        r =>
          r.isActive &&
          r.trigger === trigger &&
          (!r.projectId || r.projectId === task.projectId || r.projectId === 'proj-sinergia-001')
      );

    const executions: AutomationExecutionLog[] = [];

    for (const rule of rules) {
      const matched = this.evaluateConditions(task, rule.conditionsJson);
      if (matched) {
        const actionsExecuted = await this.executeActions(rule, task);
        const logEntry: AutomationExecutionLog = {
          id: `exec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          ruleId: rule.id,
          ruleName: rule.name,
          trigger,
          taskId: task.id,
          taskTitle: task.title,
          actionsExecuted,
          timestamp: new Date()
        };
        this.executionLogs.unshift(logEntry);
        if (this.executionLogs.length > 100) {
          this.executionLogs.pop();
        }
        executions.push(logEntry);
      }
    }

    return { matchedRules: executions.length, executions };
  }

  static getExecutionLogs(projectId?: string): AutomationExecutionLog[] {
    if (!projectId) return this.executionLogs;
    return this.executionLogs.filter(log => {
      const rule = repository.automationRules.get(log.ruleId);
      return !rule || rule.projectId === projectId;
    });
  }

  static clearExecutionLogs() {
    this.executionLogs = [];
  }
}

