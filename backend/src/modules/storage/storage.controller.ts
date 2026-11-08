import { Request, Response } from 'express';
import { MinioService } from './minio.service';
import { repository } from '../../database/repository';
import { prisma } from '../../database/prisma';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

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

  async uploadAvatar(req: Request, res: Response) {
    try {
      let buffer: Buffer | null = null;
      let mimetype = 'image/png';
      let ext = 'png';

      const file = req.file;
      const targetUser = (req.params.id || (req as any).user?.id || req.body?.userId || req.body?.name || req.body?.email || 'user-profile').trim();

      if (file) {
        buffer = file.buffer;
        mimetype = file.mimetype || 'image/png';
        ext = file.originalname.split('.').pop() || 'png';
      } else if (req.body?.dataUrl || req.body?.image || req.body?.avatar) {
        const raw = (req.body.dataUrl || req.body.image || req.body.avatar) as string;
        const matches = raw.match(/^data:([A-Za-z0-9+/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          mimetype = matches[1];
          buffer = Buffer.from(matches[2], 'base64');
          if (mimetype.includes('jpeg') || mimetype.includes('jpg')) ext = 'jpg';
          else if (mimetype.includes('webp')) ext = 'webp';
          else if (mimetype.includes('gif')) ext = 'gif';
          else if (mimetype.includes('svg')) ext = 'svg';
          else ext = 'png';
        } else {
          return res.status(400).json({ success: false, error: 'Formato de imagem inválido. Envie um arquivo ou dataURL base64.' });
        }
      } else {
        return res.status(400).json({ success: false, error: 'Nenhuma foto de perfil enviada.' });
      }

      if (!buffer) {
        return res.status(400).json({ success: false, error: 'Buffer de imagem vazio.' });
      }

      const storageKey = `avatars/${targetUser.replace(/[^a-zA-Z0-9_-]/g, '_')}/${uuidv4()}.${ext}`;
      const uploadResult = await minioService.uploadBuffer(buffer, storageKey, mimetype);
      const base64DataUrl = `data:${mimetype};base64,${buffer.toString('base64')}`;
      const persistentAvatarUrl = buffer.length <= 150000 ? base64DataUrl : uploadResult.url;

      // Atualiza no repositório em memória com URL persistente
      const repoUser = repository.updateUserAvatar(targetUser, persistentAvatarUrl);

      // Atualiza no banco de dados PostgreSQL via Prisma (armazena DataURL compacto para não quebrar em disco efêmero)
      try {
        await prisma.user.updateMany({
          where: {
            OR: [
              { id: targetUser },
              { email: targetUser },
              { name: { equals: targetUser, mode: 'insensitive' as any } }
            ]
          },
          data: {
            avatarUrl: persistentAvatarUrl
          }
        });
      } catch (dbErr) {
        console.warn('[Prisma Avatar Update Warning]', dbErr);
      }

      return res.status(200).json({
        success: true,
        message: 'Foto de perfil salva com sucesso.',
        avatarUrl: persistentAvatarUrl,
        fileUrl: uploadResult.url,
        storageKey: uploadResult.storageKey,
        user: repoUser || { id: targetUser, avatarUrl: persistentAvatarUrl }
      });
    } catch (error) {
      console.error('[Upload Avatar Error]', error);
      return res.status(500).json({ success: false, error: (error as Error).message });
    }
  }

  async getFile(req: Request, res: Response) {
    const { key } = req.params;
    try {
      const stream = await minioService.getFileStream(key);
      const ext = path.extname(key).toLowerCase();
      const mimeMap: Record<string, string> = {
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.svg': 'image/svg+xml',
        '.pdf': 'application/pdf',
        '.txt': 'text/plain'
      };
      if (mimeMap[ext]) {
        res.setHeader('Content-Type', mimeMap[ext]);
      }
      res.setHeader('Cache-Control', 'public, max-age=86400');
      stream.pipe(res);
    } catch (error) {
      if (key && key.startsWith('avatars/')) {
        const placeholderSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><rect width="128" height="128" rx="64" fill="#E2E8F0"/><path d="M64 64a22 22 0 1 0 0-44 22 22 0 0 0 0 44Zm0 12c-24.2 0-44 16.5-44 38v4h88v-4c0-21.5-19.8-38-44-38Z" fill="#94A3B8"/></svg>`;
        res.setHeader('Content-Type', 'image/svg+xml');
        return res.status(200).send(placeholderSvg);
      }
      return res.status(404).json({ success: false, error: 'Arquivo não encontrado.' });
    }
  }
}
