import { Request, Response } from 'express';
import { repository } from '../../database/repository';

export class SyncController {
  async pull(req: Request, res: Response) {
    const lastPulledAtQuery = req.query.last_pulled_at as string;
    const lastPulledAt = lastPulledAtQuery ? new Date(parseInt(lastPulledAtQuery, 10)) : new Date(0);

    const changes = repository.getChangesSince(lastPulledAt);
    const timestamp = Date.now();

    return res.json({
      success: true,
      changes,
      timestamp
    });
  }

  async push(req: Request, res: Response) {
    const { changes } = req.body;

    if (!changes) {
      return res.status(400).json({ success: false, error: 'O payload de changes é obrigatório para sync.' });
    }

    const result = repository.applyClientPush(changes);
    return res.json({
      success: true,
      message: 'Sincronização bidirecional realizada com sucesso.',
      details: result
    });
  }
}
