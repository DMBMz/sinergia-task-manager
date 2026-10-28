import { Request, Response } from 'express';
import { repository } from '../../database/repository';
import { AutomationTrigger } from '../../database/types';
import { AutomationEngineService } from './automation.service';

const VALID_TRIGGERS: AutomationTrigger[] = [
  'TASK_CREATED',
  'STATUS_CHANGED',
  'DEADLINE_APPROACHING',
  'OVERDUE',
  'ASSIGNED_TO_ME'
];

export class AutomationsController {
  /**
   * Lista regras de automação do projeto e histórico de execuções recentes
   */
  async list(req: Request, res: Response) {
    const projectId = (req.query.projectId as string) || undefined;
    const rules = repository.getAutomationRules(projectId);
    const logs = AutomationEngineService.getExecutionLogs(projectId);

    return res.json({
      success: true,
      total: rules.length,
      data: rules,
      executionLogs: logs
    });
  }

  /**
   * Cria uma nova regra de automação 'Se / Então' (JSON)
   */
  async create(req: Request, res: Response) {
    const {
      projectId = 'proj-sinergia-001',
      name,
      trigger,
      conditionsJson,
      conditions,
      actionsJson,
      actions,
      createdById = 'user-davi-001',
      isActive = true
    } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({
        success: false,
        error: 'O nome da regra de automação é obrigatório.'
      });
    }

    if (!trigger || !VALID_TRIGGERS.includes(trigger as AutomationTrigger)) {
      return res.status(400).json({
        success: false,
        error: `Gatilho inválido. Valores aceitos: ${VALID_TRIGGERS.join(', ')}`
      });
    }

    let finalConditionsJson = '{}';
    if (typeof conditionsJson === 'string' && conditionsJson.trim()) {
      try {
        JSON.parse(conditionsJson);
        finalConditionsJson = conditionsJson;
      } catch {
        return res.status(400).json({
          success: false,
          error: 'conditionsJson deve ser uma string JSON válida.'
        });
      }
    } else if (conditions && typeof conditions === 'object') {
      finalConditionsJson = JSON.stringify(conditions);
    }

    let finalActionsJson = '[]';
    if (typeof actionsJson === 'string' && actionsJson.trim()) {
      try {
        JSON.parse(actionsJson);
        finalActionsJson = actionsJson;
      } catch {
        return res.status(400).json({
          success: false,
          error: 'actionsJson deve ser uma string JSON válida.'
        });
      }
    } else if (actions && (Array.isArray(actions) || typeof actions === 'object')) {
      finalActionsJson = JSON.stringify(Array.isArray(actions) ? actions : [actions]);
    }

    const rule = repository.addAutomationRule({
      projectId,
      name: String(name).trim(),
      trigger: trigger as AutomationTrigger,
      conditionsJson: finalConditionsJson,
      actionsJson: finalActionsJson,
      createdById,
      isActive: Boolean(isActive)
    });

    return res.status(201).json({
      success: true,
      data: rule
    });
  }

  /**
   * Ativa ou desativa uma regra de automação
   */
  async toggle(req: Request, res: Response) {
    const { id } = req.params;
    const { isActive } = req.body || {};

    const updated = repository.toggleAutomationRule(id, isActive);
    if (!updated) {
      return res.status(404).json({
        success: false,
        error: 'Regra de automação não encontrada.'
      });
    }

    return res.json({
      success: true,
      data: updated
    });
  }

  /**
   * Remove uma regra de automação
   */
  async remove(req: Request, res: Response) {
    const { id } = req.params;
    const deleted = repository.deleteAutomationRule(id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Regra de automação não encontrada.'
      });
    }

    return res.json({
      success: true,
      message: 'Regra de automação removida com sucesso.'
    });
  }

  /**
   * Dispara manualmente a avaliação de um evento do ciclo de vida sobre uma tarefa
   */
  async evaluate(req: Request, res: Response) {
    const { trigger, taskId } = req.body;
    if (!trigger || !taskId) {
      return res.status(400).json({
        success: false,
        error: 'Os campos "trigger" e "taskId" são obrigatórios para avaliação.'
      });
    }

    const result = await AutomationEngineService.evaluateEvent(
      trigger as AutomationTrigger,
      String(taskId)
    );

    return res.json({
      success: true,
      data: result,
      task: repository.getTaskWithDetails(String(taskId))
    });
  }
}

export const automationsController = new AutomationsController();

