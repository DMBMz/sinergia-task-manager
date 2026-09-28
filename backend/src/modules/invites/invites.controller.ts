import { Request, Response } from 'express';
import { prisma } from '../../database/prisma';
import { repository } from '../../database/repository';
import { Role } from '../../database/types';
import { v4 as uuidv4 } from 'uuid';

export class InvitesController {
  async create(req: Request, res: Response) {
    try {
      const { projectId, taskId, role, expiresInHours, createdById } = req.body;

      // Identifica o projeto/time alvo
      let actualProjectId = projectId;
      let targetProject: any = null;
      if (actualProjectId) {
        targetProject = await prisma.project.findUnique({ where: { id: actualProjectId } }).catch(() => null);
      }
      if (!targetProject) {
        targetProject = await prisma.project.findFirst({ orderBy: { createdAt: 'desc' } }).catch(() => null);
      }
      actualProjectId = targetProject?.id || repository.projects.get(projectId)?.id || 'proj-sinergia-001';

      // Identifica o criador
      let actualCreatorId = createdById || (req as any).user?.id;
      let creatorUser: any = null;
      if (actualCreatorId) {
        creatorUser = await prisma.user.findUnique({ where: { id: actualCreatorId } }).catch(() => null);
      }
      if (!creatorUser) {
        creatorUser = await prisma.user.findFirst().catch(() => null);
      }
      actualCreatorId = creatorUser?.id || repository.users.get(createdById)?.id || 'user-davi-001';

      const cleanRole = (role && ['ADMIN', 'DELEGATE', 'EDIT', 'VIEW'].includes(role)) ? role : 'EDIT';
      const token = 'sinergia-inv-' + uuidv4().substring(0, 8);
      const hours = expiresInHours ? parseInt(expiresInHours, 10) : 48;
      const expiresAt = new Date(Date.now() + hours * 3600000);

      // Salva convite no PostgreSQL se possível
      let invite: any = null;
      if (targetProject && creatorUser) {
        try {
          invite = await prisma.inviteToken.create({
            data: {
              token,
              projectId: targetProject.id,
              taskId: taskId || null,
              role: cleanRole as any,
              expiresAt,
              maxUses: 50,
              usesCount: 0,
              createdById: creatorUser.id
            },
            include: {
              project: true
            }
          });
        } catch (dbErr) {
          console.warn('[Invites] PostgreSQL inviteToken creation failed, falling back to repository:', dbErr);
        }
      }

      // Sincroniza em memória
      const memInvite = {
        id: invite?.id || uuidv4(),
        token,
        projectId: actualProjectId,
        taskId: taskId || null,
        role: cleanRole as any,
        expiresAt,
        maxUses: 50,
        usesCount: 0,
        createdById: actualCreatorId,
        createdAt: new Date()
      };
      repository.inviteTokens.set(token, memInvite);

      const teamName = invite?.project?.name || targetProject?.name || repository.projects.get(actualProjectId)?.name || 'Sinergia Mobile App';
      const link = `https://dmbmz.github.io/sinergia-task-manager/?invite=${token}`;
      const qrPayload = JSON.stringify({
        app: 'sinergia',
        action: 'invite',
        token,
        teamName,
        role: cleanRole
      });

      return res.status(201).json({
        success: true,
        data: {
          invite: {
            id: memInvite.id,
            token,
            role: cleanRole,
            expiresAt
          },
          token,
          teamName,
          role: cleanRole,
          link,
          qrPayload,
          expiresAt
        }
      });
    } catch (error: any) {
      console.error('[Invites Create Error]', error);
      return res.status(500).json({ success: false, error: 'Erro ao gerar convite no banco de dados.' });
    }
  }

  async accept(req: Request, res: Response) {
    try {
      let { token, userId } = req.body;
      if (!token) {
        return res.status(400).json({ success: false, error: 'Token ou código de convite é obrigatório.' });
      }

      // Higieniza token caso o usuário tenha colado o link completo
      let cleanToken = token.trim();
      if (cleanToken.includes('invite=')) {
        cleanToken = cleanToken.split('invite=')[1].split('&')[0].trim();
      } else if (cleanToken.includes('/invite/')) {
        cleanToken = cleanToken.split('/invite/')[1].split('?')[0].trim();
      } else if (cleanToken.includes('?')) {
        cleanToken = cleanToken.split('?')[0].trim();
      }

      let project: any = null;
      let roleToAssign: any = 'EDIT';

      // 1. Busca por token na tabela InviteToken do PostgreSQL ou em memória
      let invite: any = null;
      try {
        invite = await prisma.inviteToken.findUnique({
          where: { token: cleanToken },
          include: { project: true }
        });
      } catch (err) {}

      if (!invite) {
        const memInvite = repository.inviteTokens.get(cleanToken);
        if (memInvite) {
          invite = {
            ...memInvite,
            project: (memInvite.projectId ? repository.projects.get(memInvite.projectId) : null) || { id: memInvite.projectId || 'proj-sinergia-001', name: 'Sinergia Mobile App' }
          };
        }
      }

      if (invite && invite.project) {
        if (new Date() > invite.expiresAt) {
          return res.status(400).json({ success: false, error: 'Este link de convite expirou.' });
        }
        if (invite.usesCount >= invite.maxUses) {
          return res.status(400).json({ success: false, error: 'Limite de usos deste convite foi atingido.' });
        }
        project = invite.project;
        roleToAssign = invite.role;

        try {
          await prisma.inviteToken.update({
            where: { id: invite.id },
            data: { usesCount: { increment: 1 } }
          });
        } catch (err) {}
      } else {
        // 2. Busca por ID do Projeto ou Nome do Time no PostgreSQL
        try {
          project = await prisma.project.findFirst({
            where: {
              OR: [
                { id: cleanToken },
                { name: { equals: cleanToken, mode: 'insensitive' } }
              ]
            }
          });
        } catch (err) {}

        if (!project) {
          project = repository.projects.get(cleanToken);
        }
      }

      // 3. Fallback especial para token demo 'sinergia-inv-edit-2026'
      if (!project && cleanToken === 'sinergia-inv-edit-2026') {
        try {
          project = await prisma.project.findFirst({ orderBy: { createdAt: 'desc' } });
        } catch (err) {}
        if (!project) {
          project = Array.from(repository.projects.values())[0];
        }
      }

      if (!project) {
        return res.status(404).json({ success: false, error: 'Convite ou time não encontrado no banco de dados.' });
      }

      // Associa usuário ao time no PostgreSQL se usuário existir
      if (userId) {
        try {
          const userExists = await prisma.user.findUnique({ where: { id: userId } });
          if (userExists) {
            const existingMember = await prisma.projectMember.findUnique({
              where: {
                projectId_userId: {
                  projectId: project.id,
                  userId
                }
              }
            });

            if (!existingMember) {
              await prisma.projectMember.create({
                data: {
                  projectId: project.id,
                  userId,
                  role: roleToAssign
                }
              });
            }
          }
        } catch (err) {}

        // Sincroniza em memória
        repository.projectMembers.set(`${project.id}-${userId}`, {
          id: `${project.id}-${userId}`,
          projectId: project.id,
          userId,
          role: roleToAssign,
          createdAt: new Date()
        });
      }

      return res.json({
        success: true,
        message: `Você entrou no time "${project.name}" com sucesso!`,
        team: {
          id: project.id,
          name: project.name,
          role: roleToAssign
        },
        projectId: project.id,
        role: roleToAssign
      });
    } catch (error: any) {
      console.error('[Invites Accept Error]', error);
      return res.status(500).json({ success: false, error: 'Erro ao validar convite no banco de dados.' });
    }
  }
}
