import { Request, Response } from 'express';
import { repository } from '../../database/repository';
import { CapacityService } from './capacity.service';
import { AbsenceType } from '../../database/types';

export class CapacityController {
  /**
   * Obtém a carga horária e capacidade de um membro na semana (BE-09.1 / US09)
   */
  async getMemberWorkload(req: Request, res: Response) {
    const { userId } = req.params;
    const { date } = req.query;

    const refDate = date ? new Date(String(date)) : new Date();
    const workload = CapacityService.getMemberWorkload(userId, refDate);
    return res.json({ success: true, data: workload });
  }

  /**
   * Obtém a matriz de capacidade e ocupação de toda a equipe (BE-12.1 / US12)
   */
  async getTeamWorkload(req: Request, res: Response) {
    const { team } = req.query;
    const { date } = req.query;

    const refDate = date ? new Date(String(date)) : new Date();
    const matrix = CapacityService.getTeamWorkloadMatrix(team ? String(team) : undefined, refDate);
    return res.json({ success: true, count: matrix.length, data: matrix });
  }

  /**
   * Sugestão inteligente de responsável com base na menor carga e ausências (BE-09.1 / US09)
   */
  async suggestAssignee(req: Request, res: Response) {
    const { effortHours, dueDate, tags } = req.body;

    const suggestions = CapacityService.suggestAssignee({
      effortHours: effortHours ? Number(effortHours) : 8,
      dueDate: dueDate ? new Date(dueDate) : new Date(),
      tags: Array.isArray(tags) ? tags : []
    });

    return res.json({
      success: true,
      recommended: suggestions.find(s => s.isRecommended) || suggestions[0] || null,
      ranking: suggestions
    });
  }

  /**
   * Registra férias / ausência de um membro (BE-22.2 / US22)
   */
  async addAbsence(req: Request, res: Response) {
    const { userId, type, startDate, endDate, reason } = req.body;

    if (!userId || !type || !startDate || !endDate) {
      return res.status(400).json({ success: false, error: 'userId, type, startDate e endDate são obrigatórios.' });
    }

    try {
      const absence = repository.addUserAbsence(
        userId,
        type as AbsenceType,
        new Date(startDate),
        new Date(endDate),
        reason
      );
      return res.status(201).json({ success: true, data: absence });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  /**
   * Lista ausências registradas de um membro (BE-22.2 / US22)
   */
  async getMemberAbsences(req: Request, res: Response) {
    const { userId } = req.params;
    const absences = repository.getUserAbsences(userId);
    return res.json({ success: true, data: absences });
  }
}

export const capacityController = new CapacityController();
