import { Request, Response } from 'express';
import { MinioService } from './minio.service';
import { repository } from '../../database/repository';
import { v4 as uuidv4 } from 'uuid';

const minioService = new MinioService();

export class StorageController {
  async uploadAttachment(req: Request, res: Response) {
    const { id: taskId } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ success: false, error: 'Nenhum arquivo enviado.' });
    }

    const ext = file.originalname.split('.').pop() || 'dat';
    const storageKey = `tasks/${taskId}/${uuidv4()}.${ext}`;

    try {
      const uploadResult = await minioService.uploadFile(file, storageKey);

      const attachment = repository.createAttachment({
        taskId,
        commentId: req.body.commentId || null,
        fileName: file.originalname,
        fileType: file.mimetype,
        fileSize: file.size,
        storageKey: uploadResult.storageKey,
        url: uploadResult.url
      });

      return res.status(201).json({ success: true, data: attachment });
    } catch (error) {
      return res.status(500).json({ success: false, error: (error as Error).message });
    }
  }

  async getFile(req: Request, res: Response) {
    const { key } = req.params;
    try {
      const stream = await minioService.getFileStream(key);
      stream.pipe(res);
    } catch (error) {
      return res.status(404).json({ success: false, error: 'Arquivo não encontrado.' });
    }
  }
}
