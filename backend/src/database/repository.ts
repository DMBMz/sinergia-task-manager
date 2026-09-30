import {
  User, Project, ProjectMember, Task, Tag, Comment, Attachment, InviteToken,
  Role, Priority, TaskStatus,
  TaskDependency, TaskChecklistItem, UserAbsence, AutomationRule,
  DependencyType, AbsenceType, AssignmentStatus, RecurrenceInterval, AutomationTrigger
} from './types';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from './prisma';

export class AppRepository {
  users: Map<string, User> = new Map();
  projects: Map<string, Project> = new Map();
  projectMembers: Map<string, ProjectMember> = new Map();
  tasks: Map<string, Task> = new Map();
  tags: Map<string, Tag> = new Map();
  taskTags: Array<{ taskId: string; tagId: string }> = [];
  comments: Map<string, Comment> = new Map();
  attachments: Map<string, Attachment> = new Map();
  inviteTokens: Map<string, InviteToken> = new Map();
  taskDependencies: Map<string, TaskDependency> = new Map();
  taskChecklists: Map<string, TaskChecklistItem> = new Map();
  userAbsences: Map<string, UserAbsence> = new Map();
  automationRules: Map<string, AutomationRule> = new Map();

  // Change log for delta sync
  changeLogs: Array<{
    table: string;
    recordId: string;
    action: 'created' | 'updated' | 'deleted';
    timestamp: Date;
  }> = [];

  constructor() {
    this.seedInitialData();
    this.syncFromPrisma();
  }

  async syncFromPrisma() {
    try {
      const dbProjects = await prisma.project.findMany();
      for (const p of dbProjects) {
        if (!this.projects.has(p.id)) {
          this.projects.set(p.id, {
            id: p.id,
            name: p.name,
            description: p.description,
            color: p.color,
            createdAt: p.createdAt,
            updatedAt: p.updatedAt,
            deletedAt: p.deletedAt
          });
        }
      }
      const dbTasks = await prisma.task.findMany({ where: { deletedAt: null } });
      for (const t of dbTasks) {
        if (!this.tasks.has(t.id)) {
          const proj = this.projects.get(t.projectId);
          this.tasks.set(t.id, {
            id: t.id,
            title: t.title,
            description: t.description,
            priority: t.priority as any,
            status: t.status as any,
            effortHours: t.effortHours,
            startDate: t.startDate,
            dueDate: t.dueDate,
            projectId: t.projectId,
            team: proj?.name || 'Meu Time',
            assigneeId: t.assigneeId,
            parentTaskId: t.parentTaskId,
            version: t.version,
            createdAt: t.createdAt,
            updatedAt: t.updatedAt,
            deletedAt: t.deletedAt
          });
        }
      }
    } catch (err) {
      console.warn('[Repository syncFromPrisma warning]', err);
    }
  }

  seedInitialData() {
    const user1: User = {
      id: 'user-davi-001',
      name: 'Davi Marinho',
      email: 'davi@sinergia.com',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Davi',
      fcmToken: 'fcm-token-davi',
      quietUntil: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const user2: User = {
      id: 'user-ana-002',
      name: 'Ana Silva',
      email: 'ana@sinergia.com',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ana',
      fcmToken: 'fcm-token-ana',
      quietUntil: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.set(user1.id, user1);
    this.users.set(user2.id, user2);

    const project1: Project = {
      id: 'proj-sinergia-001',
      name: 'Sinergia Mobile App',
      description: 'Gestão Inteligente de Tarefas e Equipes',
      color: '#3B82F6',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null
    };
    this.projects.set(project1.id, project1);

    this.projectMembers.set('pm-1', {
      id: 'pm-1',
      projectId: project1.id,
      userId: user1.id,
      role: 'ADMIN',
      createdAt: new Date()
    });
    this.projectMembers.set('pm-2', {
      id: 'pm-2',
      projectId: project1.id,
      userId: user2.id,
      role: 'EDIT',
      createdAt: new Date()
    });

    const tag1: Tag = { id: 'tag-1', name: 'Sprint 1', color: '#10B981', projectId: project1.id };
    const tag2: Tag = { id: 'tag-2', name: 'Mobile', color: '#6366F1', projectId: project1.id };
    this.tags.set(tag1.id, tag1);
    this.tags.set(tag2.id, tag2);

    const task1: Task = {
      id: 'task-root-001',
      title: 'Estruturação da Arquitetura Mobile e Backend',
      description: 'Definição dos schemas Prisma, WatermelonDB e rotas da Sprint 1.',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      effortHours: 12,
      startDate: new Date(),
      dueDate: new Date(Date.now() + 86400000 * 2), // 2 dias
      projectId: project1.id,
      assigneeId: user1.id,
      parentTaskId: null,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null
    };
    this.tasks.set(task1.id, task1);
    this.taskTags.push({ taskId: task1.id, tagId: tag1.id });
    this.taskTags.push({ taskId: task1.id, tagId: tag2.id });

    // Subtarefa aninhada
    const subtask1: Task = {
      id: 'subtask-001',
      title: 'Configurar Sync Bidirecional e Modo Offline',
      description: 'Testar protocolo WatermelonDB com pull/push.',
      priority: 'HIGH',
      status: 'PENDING',
      effortHours: 6,
      startDate: new Date(),
      dueDate: new Date(Date.now() + 86400000 * 1), // 1 dia
      projectId: project1.id,
      assigneeId: user2.id,
      parentTaskId: task1.id,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null
    };
    this.tasks.set(subtask1.id, subtask1);

    // Initial Sprint 2 seeds: Checklist, Dependency, Absence, Automation
    const clItem1: TaskChecklistItem = {
      id: 'chk-001',
      taskId: task1.id,
      title: 'Validar migrações do Prisma com banco Neon',
      isCompleted: true,
      completedAt: new Date(),
      assigneeId: user1.id,
      assigneeName: user1.name,
      orderIndex: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const clItem2: TaskChecklistItem = {
      id: 'chk-002',
      taskId: task1.id,
      title: 'Integrar Drawer de filtros avançados no mobile',
      isCompleted: false,
      completedAt: null,
      assigneeId: user2.id,
      assigneeName: user2.name,
      orderIndex: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.taskChecklists.set(clItem1.id, clItem1);
    this.taskChecklists.set(clItem2.id, clItem2);

    const dep1: TaskDependency = {
      id: 'dep-001',
      taskId: subtask1.id,
      dependsOnTaskId: task1.id,
      dependencyType: 'FINISH_TO_START',
      createdAt: new Date()
    };
    this.taskDependencies.set(dep1.id, dep1);

    const abs1: UserAbsence = {
      id: 'abs-001',
      userId: user2.id,
      type: 'VACATION',
      startDate: new Date(Date.now() + 86400000 * 20),
      endDate: new Date(Date.now() + 86400000 * 30),
      reason: 'Férias programadas de final de ano',
      createdAt: new Date()
    };
    this.userAbsences.set(abs1.id, abs1);

    const auto1: AutomationRule = {
      id: 'auto-001',
      projectId: project1.id,
      name: 'Se Prioridade URGENTE, Notificar Gestor Imediatamente',
      trigger: 'TASK_CREATED',
      conditionsJson: JSON.stringify({ field: 'priority', operator: 'EQUALS', value: 'URGENT' }),
      actionsJson: JSON.stringify([{ action: 'SEND_NOTIFICATION', targetRole: 'ADMIN' }]),
      isActive: true,
      createdById: user1.id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.automationRules.set(auto1.id, auto1);
  }

  logChange(table: string, recordId: string, action: 'created' | 'updated' | 'deleted') {
    this.changeLogs.push({
      table,
      recordId,
      action,
      timestamp: new Date()
    });
  }

  // --- Task Operations ---
  createTask(data: Partial<Task> & { team?: string; subtasks?: any[]; assignee?: any }): Task {
    const id = data.id || uuidv4();
    let projectId = data.projectId;
    if (!projectId && data.team) {
      const proj = Array.from(this.projects.values()).find(p => p.name.toLowerCase() === data.team!.toLowerCase());
      if (proj) projectId = proj.id;
    }
    if (!projectId) {
      projectId = 'proj-sinergia-001';
    }

    let parsedDue: Date | null = null;
    const rawDue = (data as any).dueDateIso || data.dueDate;
    if (rawDue) {
      if (rawDue instanceof Date) {
        parsedDue = isNaN(rawDue.getTime()) ? null : rawDue;
      } else if (typeof rawDue === 'string') {
        const d = new Date(rawDue);
        if (!isNaN(d.getTime())) {
          parsedDue = d;
        } else {
          const monthsMap: Record<string, number> = {
            jan: 0, fev: 1, mar: 2, abr: 3, mai: 4, jun: 5,
            jul: 6, ago: 7, set: 8, out: 9, nov: 10, dez: 11
          };
          const match = rawDue.match(/(\d{1,2})\s+de\s+([a-zA-Z]{3})(?:\s+às\s+(\d{1,2}):(\d{2}))?/i);
          if (match) {
            const day = parseInt(match[1], 10);
            const mStr = match[2].toLowerCase();
            const month = monthsMap[mStr] !== undefined ? monthsMap[mStr] : new Date().getMonth();
            const hour = match[3] ? parseInt(match[3], 10) : 18;
            const min = match[4] ? parseInt(match[4], 10) : 0;
            const year = new Date().getFullYear();
            const parsed = new Date(year, month, day, hour, min, 0);
            if (!isNaN(parsed.getTime())) parsedDue = parsed;
          }
        }
      }
    }

    const task: Task = {
      id,
      title: data.title || 'Nova Tarefa',
      description: data.description || '',
      priority: data.priority || 'MEDIUM',
      status: data.status || 'PENDING',
      effortHours: data.effortHours || 0,
      startDate: data.startDate ? new Date(data.startDate) : null,
      dueDate: parsedDue,
      projectId,
      team: data.team || this.projects.get(projectId)?.name || 'Meu Time',
      assigneeId: data.assigneeId || null,
      assigneeName: data.assigneeName || (typeof (data as any).assignee === 'string' ? (data as any).assignee : null),
      parentTaskId: data.parentTaskId || null,
      subtasks: Array.isArray(data.subtasks) ? data.subtasks : [],
      assignmentStatus: data.assignmentStatus || 'ACCEPTED',
      declinedReason: data.declinedReason || null,
      isRecurring: Boolean(data.isRecurring),
      recurrenceInterval: data.recurrenceInterval || null,
      recurrenceEnd: data.recurrenceEnd ? new Date(data.recurrenceEnd) : null,
      maxOccurrences: data.maxOccurrences !== undefined ? data.maxOccurrences : null,
      currentOccurrence: data.currentOccurrence || 1,
      rotationUserIds: Array.isArray(data.rotationUserIds) ? data.rotationUserIds : [],
      currentRotationIndex: data.currentRotationIndex || 0,
      version: data.version || 1,
      lockedBy: data.lockedBy || null,
      lockedAt: data.lockedAt ? new Date(data.lockedAt) : null,
      createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
      updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
      deletedAt: null
    };
    if (Array.isArray((data as any).comments)) {
      (task as any).comments = (data as any).comments;
    }
    if (Array.isArray((data as any).attachments)) {
      (task as any).attachments = (data as any).attachments;
    }
    this.tasks.set(task.id, task);
    this.logChange('tasks', task.id, 'created');

    // Sincroniza em segundo plano no PostgreSQL via Prisma
    prisma.project.findFirst({ where: { OR: [{ id: task.projectId }, { name: task.team || '' }] } })
      .then(async (proj) => {
        let actualProjectId = proj ? proj.id : null;
        if (!actualProjectId) {
          const newProj = await prisma.project.create({
            data: {
              name: task.team || 'Equipe Sinergia',
              description: 'Time sincronizado via mobile',
              color: '#2563EB'
            }
          });
          actualProjectId = newProj.id;
          this.projects.set(newProj.id, newProj);
        }
        await prisma.task.upsert({
          where: { id: task.id },
          update: {
            title: task.title,
            description: task.description,
            priority: task.priority as any,
            status: task.status as any,
            effortHours: task.effortHours,
            dueDate: task.dueDate,
            version: task.version,
            updatedAt: task.updatedAt
          },
          create: {
            id: task.id,
            title: task.title,
            description: task.description,
            priority: task.priority as any,
            status: task.status as any,
            effortHours: task.effortHours,
            dueDate: task.dueDate,
            projectId: actualProjectId,
            version: task.version,
            createdAt: task.createdAt,
            updatedAt: task.updatedAt
          }
        });
      }).catch(err => console.warn('[Prisma Task Sync Warning]', err.message));

    return task;
  }

  getTask(id: string): Task | undefined {
    const task = this.tasks.get(id);
    return task && !task.deletedAt ? task : undefined;
  }

  getTaskById(id: string): Task | undefined {
    return this.getTask(id);
  }

  getUserById(id: string): User | undefined {
    return this.users.get(id);
  }

  getAllUsers(): User[] {
    return Array.from(this.users.values());
  }

  createTag(name: string, color: string = '#2563EB', projectId: string = 'proj-1'): Tag {
    const id = 'tag-' + uuidv4().slice(0, 8);
    const tag: Tag = { id, name, color, projectId };
    this.tags.set(id, tag);
    return tag;
  }

  getTaskWithDetails(id: string) {
    const task = this.getTask(id);
    if (!task) return null;

    const subTasks = Array.from(this.tasks.values()).filter(t => t.parentTaskId === id && !t.deletedAt);
    const tagIds = this.taskTags.filter(tt => tt.taskId === id).map(tt => tt.tagId);
    const tags = tagIds.map(tid => this.tags.get(tid)).filter(Boolean) as Tag[];
    const repoComments = Array.from(this.comments.values()).filter(c => c.taskId === id);
    const taskComments = (task as any).comments || [];
    const combinedComments = [...taskComments];
    for (const rc of repoComments) {
      if (!combinedComments.some(tc => tc.id === rc.id || (tc.text === rc.content && tc.timestamp))) {
        combinedComments.push({
          id: rc.id,
          author: rc.authorId,
          text: rc.content,
          attachment: null,
          time: new Date(rc.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          timestamp: new Date(rc.createdAt).getTime(),
          mentions: rc.mentions
        });
      }
    }

    const repoAttachments = Array.from(this.attachments.values()).filter(a => a.taskId === id);
    const taskAttachments = (task as any).attachments || [];
    const combinedAttachments = [...taskAttachments, ...repoAttachments];

    const assignee = task.assigneeId ? this.users.get(task.assigneeId) : null;
    const project = this.projects.get(task.projectId);
    const team = task.team || project?.name || 'Meu Time';

    const isoDue = task.dueDate ? (task.dueDate instanceof Date ? (isNaN(task.dueDate.getTime()) ? null : task.dueDate.toISOString()) : String(task.dueDate)) : null;

    return {
      ...task,
      dueDate: isoDue || (task as any).dueDate || null,
      dueDateIso: isoDue || (task as any).dueDateIso || null,
      team,
      assignee: assignee || (task.assigneeName ? { id: task.assigneeId || 'assigned', name: task.assigneeName } : null),
      subTasks: (task.subtasks && task.subtasks.length > 0) ? task.subtasks : subTasks,
      subtasks: (task.subtasks && task.subtasks.length > 0) ? task.subtasks : subTasks,
      tags,
      comments: combinedComments,
      attachments: combinedAttachments,
      dependencies: Array.from(this.taskDependencies.values()).filter(d => d.taskId === id),
      prerequisites: Array.from(this.taskDependencies.values()).filter(d => d.dependsOnTaskId === id),
      checklist: Array.from(this.taskChecklists.values())
        .filter(c => c.taskId === id)
        .sort((a, b) => a.orderIndex - b.orderIndex),
      assignmentStatus: task.assignmentStatus || 'ACCEPTED',
      declinedReason: task.declinedReason || null,
      isRecurring: task.isRecurring || false,
      recurrenceInterval: task.recurrenceInterval || null,
      recurrenceEnd: task.recurrenceEnd || null,
      maxOccurrences: task.maxOccurrences || null,
      currentOccurrence: task.currentOccurrence || 1,
      rotationUserIds: task.rotationUserIds || [],
      currentRotationIndex: task.currentRotationIndex || 0
    };
  }

  getAllTasks(filter?: {
    projectId?: string;
    team?: string;
    tag?: string;
    tags?: string | string[];
    status?: TaskStatus;
    statuses?: TaskStatus[];
    priority?: Priority;
    priorities?: Priority[];
    assigneeId?: string;
    scope?: 'all' | 'root_only' | 'subtasks_only';
    dueDateStart?: string | Date;
    dueDateEnd?: string | Date;
    overdue?: boolean | string;
    query?: string;
  }): any[] {
    let result = Array.from(this.tasks.values()).filter(t => !t.deletedAt);

    if (filter?.projectId) {
      result = result.filter(t => t.projectId === filter.projectId || t.team === filter.projectId);
    }
    if (filter?.team) {
      result = result.filter(t => t.team?.toLowerCase() === filter.team?.toLowerCase());
    }
    if (filter?.status) {
      result = result.filter(t => t.status === filter.status);
    }
    if (filter?.statuses && filter.statuses.length > 0) {
      result = result.filter(t => filter.statuses!.includes(t.status));
    }
    if (filter?.priority) {
      result = result.filter(t => t.priority === filter.priority);
    }
    if (filter?.priorities && filter.priorities.length > 0) {
      result = result.filter(t => filter.priorities!.includes(t.priority));
    }

    // 1. Escopo (Root vs Subtasks) - BE-05.1
    if (filter?.scope === 'root_only') {
      result = result.filter(t => !t.parentTaskId);
    } else if (filter?.scope === 'subtasks_only') {
      result = result.filter(t => !!t.parentTaskId);
    }

    // 2. Responsável - BE-05.1
    if (filter?.assigneeId) {
      result = result.filter(t => t.assigneeId === filter.assigneeId);
    }

    // 3. Múltiplas Tags ou Tag única - BE-05.1
    const rawTags = filter?.tags !== undefined ? filter.tags : filter?.tag;
    if (rawTags) {
      const requestedTags = (Array.isArray(rawTags) ? rawTags : rawTags.split(',')).map(s => s.trim().toLowerCase()).filter(Boolean);
      if (requestedTags.length > 0) {
        result = result.filter(t => {
          const taskTagIds = this.taskTags.filter(tt => tt.taskId === t.id).map(tt => tt.tagId);
          return taskTagIds.some(tid => {
            const tagObj = this.tags.get(tid);
            return tagObj && (requestedTags.includes(tagObj.id.toLowerCase()) || requestedTags.includes(tagObj.name.toLowerCase()));
          });
        });
      }
    }

    // 4. Overdue (tarefas atrasadas não concluídas) - BE-05.1
    if (filter?.overdue === true || filter?.overdue === 'true') {
      const now = new Date();
      result = result.filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== 'COMPLETED');
    }

    // 5. Intervalo de Vencimento - BE-05.1
    if (filter?.dueDateStart) {
      const start = new Date(filter.dueDateStart);
      result = result.filter(t => t.dueDate && new Date(t.dueDate) >= start);
    }
    if (filter?.dueDateEnd) {
      const end = new Date(filter.dueDateEnd);
      result = result.filter(t => t.dueDate && new Date(t.dueDate) <= end);
    }

    // 6. Busca por texto
    if (filter?.query) {
      const q = filter.query.toLowerCase();
      result = result.filter(t => 
        t.title.toLowerCase().includes(q) || 
        (t.description && t.description.toLowerCase().includes(q))
      );
    }

    return result.map(t => this.getTaskWithDetails(t.id));
  }

  // US06: Bloqueio de Edição Simultânea
  lockTask(id: string, user: { id: string; name: string; avatarUrl?: string }): { success: boolean; task?: any; lockedBy?: any; isSelf?: boolean } {
    const task = this.tasks.get(id);
    if (!task || task.deletedAt) return { success: false };

    const now = new Date();
    if (task.lockedBy && task.lockedBy.id !== user.id && task.lockedAt) {
      const diffMs = now.getTime() - new Date(task.lockedAt).getTime();
      if (diffMs < 5 * 60 * 1000) {
        return { success: false, lockedBy: task.lockedBy, task: this.getTaskWithDetails(id) };
      }
    }

    task.lockedBy = user;
    task.lockedAt = now;
    task.updatedAt = now;
    this.tasks.set(id, task);
    this.logChange('tasks', id, 'updated');
    return { success: true, task: this.getTaskWithDetails(id), isSelf: true };
  }

  unlockTask(id: string, userId?: string): { success: boolean; task?: any } {
    const task = this.tasks.get(id);
    if (!task) return { success: false };

    if (userId && task.lockedBy && task.lockedBy.id !== userId) {
      const diffMs = new Date().getTime() - new Date(task.lockedAt || 0).getTime();
      if (diffMs < 5 * 60 * 1000) {
        return { success: false, task: this.getTaskWithDetails(id) };
      }
    }

    task.lockedBy = null;
    task.lockedAt = null;
    task.updatedAt = new Date();
    this.tasks.set(id, task);
    this.logChange('tasks', id, 'updated');
    return { success: true, task: this.getTaskWithDetails(id) };
  }

  updateTask(id: string, expectedVersion: number, data: Partial<Task> & { userId?: string }): { task?: Task; conflict?: boolean; locked?: boolean; lockedBy?: any; currentVersion?: number } {
    const existing = this.tasks.get(id);
    if (!existing || existing.deletedAt) {
      return { conflict: false };
    }

    // US06: Bloqueio de Edição Simultânea por outro usuário
    if (data.userId && existing.lockedBy && existing.lockedBy.id !== data.userId) {
      const diffMs = new Date().getTime() - new Date(existing.lockedAt || 0).getTime();
      if (diffMs < 5 * 60 * 1000) {
        return {
          conflict: true,
          locked: true,
          lockedBy: existing.lockedBy,
          currentVersion: existing.version,
          task: existing
        };
      }
    }

    // US06: Lock Otimista - verifica se versão informada pelo cliente bate com a versão no banco
    if (expectedVersion !== undefined && existing.version !== expectedVersion) {
      return {
        conflict: true,
        currentVersion: existing.version,
        task: existing
      };
    }

    const { userId, tags, ...cleanData } = data as any;

    if (Array.isArray(tags)) {
      this.taskTags = this.taskTags.filter(tt => tt.taskId !== id);
      for (const tNameOrId of tags) {
        if (!tNameOrId) continue;
        let foundTag = this.tags.get(tNameOrId);
        if (!foundTag) {
          foundTag = Array.from(this.tags.values()).find(t => t.name.toLowerCase() === String(tNameOrId).toLowerCase());
        }
        if (!foundTag) {
          const newTagId = 'tag-' + uuidv4().slice(0, 8);
          foundTag = {
            id: newTagId,
            name: String(tNameOrId),
            color: '#3B82F6',
            projectId: existing.projectId
          };
          this.tags.set(newTagId, foundTag);
        }
        this.taskTags.push({ taskId: id, tagId: foundTag.id });
      }
    }

    let parsedDue: Date | null | undefined = undefined;
    if ((data as any).dueDateIso !== undefined || (data as any).dueDate !== undefined) {
      const rawDue = (data as any).dueDateIso !== undefined ? (data as any).dueDateIso : (data as any).dueDate;
      if (!rawDue) {
        parsedDue = null;
      } else if (rawDue instanceof Date) {
        parsedDue = isNaN(rawDue.getTime()) ? null : rawDue;
      } else if (typeof rawDue === 'string') {
        const d = new Date(rawDue);
        if (!isNaN(d.getTime())) {
          parsedDue = d;
        } else {
          const monthsMap: Record<string, number> = {
            jan: 0, fev: 1, mar: 2, abr: 3, mai: 4, jun: 5,
            jul: 6, ago: 7, set: 8, out: 9, nov: 10, dez: 11
          };
          const match = rawDue.match(/(\d{1,2})\s+de\s+([a-zA-Z]{3})(?:\s+às\s+(\d{1,2}):(\d{2}))?/i);
          if (match) {
            const day = parseInt(match[1], 10);
            const mStr = match[2].toLowerCase();
            const month = monthsMap[mStr] !== undefined ? monthsMap[mStr] : new Date().getMonth();
            const hour = match[3] ? parseInt(match[3], 10) : 18;
            const min = match[4] ? parseInt(match[4], 10) : 0;
            const year = new Date().getFullYear();
            const parsed = new Date(year, month, day, hour, min, 0);
            if (!isNaN(parsed.getTime())) parsedDue = parsed;
          }
        }
      }
    }

    const updated: Task = {
      ...existing,
      ...cleanData,
      dueDate: parsedDue !== undefined ? parsedDue : existing.dueDate,
      team: (data as any).team || existing.team,
      subtasks: (data as any).subtasks !== undefined ? (data as any).subtasks : existing.subtasks,
      lockedBy: (data as any).lockedBy !== undefined ? (data as any).lockedBy : null, // Libera o lock após conclusão da edição se não informado
      lockedAt: (data as any).lockedAt !== undefined ? (data as any).lockedAt : null,
      version: (data as any).version !== undefined ? Number((data as any).version) : existing.version + 1,
      updatedAt: new Date()
    };
    if (Array.isArray(tags)) {
      (updated as any).tags = tags;
    }
    if (Array.isArray((data as any).comments)) {
      (updated as any).comments = (data as any).comments;
    } else if ((existing as any).comments) {
      (updated as any).comments = (existing as any).comments;
    }
    if (Array.isArray((data as any).attachments)) {
      (updated as any).attachments = (data as any).attachments;
    } else if ((existing as any).attachments) {
      (updated as any).attachments = (existing as any).attachments;
    }
    this.tasks.set(id, updated);
    this.logChange('tasks', id, 'updated');

    prisma.task.update({
      where: { id },
      data: {
        title: updated.title,
        description: updated.description,
        priority: updated.priority as any,
        status: updated.status as any,
        effortHours: updated.effortHours,
        dueDate: updated.dueDate,
        version: updated.version,
        updatedAt: updated.updatedAt
      }
    }).catch(e => console.warn('[Prisma updateTask warning]', e.message));

    return { task: updated, conflict: false };
  }

  deleteTask(id: string): boolean {
    const task = this.tasks.get(id);
    if (!task) return false;
    task.deletedAt = new Date();
    task.updatedAt = new Date();
    this.tasks.set(id, task);
    this.logChange('tasks', id, 'deleted');

    prisma.task.update({
      where: { id },
      data: { deletedAt: new Date() }
    }).catch(e => console.warn('[Prisma deleteTask warning]', e.message));

    return true;
  }

  // --- Subtask Hierarchy ---
  getSubtasks(parentTaskId: string): Task[] {
    return Array.from(this.tasks.values()).filter(t => t.parentTaskId === parentTaskId && !t.deletedAt);
  }

  // --- Invites & ACL (US03) ---
  createInvite(data: { projectId?: string; taskId?: string; role: Role; expiresInHours?: number; createdById: string }): InviteToken {
    const token = 'sinergia-inv-' + uuidv4().substring(0, 8);
    const expiresAt = new Date(Date.now() + (data.expiresInHours || 48) * 3600000);
    const invite: InviteToken = {
      id: uuidv4(),
      token,
      projectId: data.projectId || null,
      taskId: data.taskId || null,
      role: data.role,
      expiresAt,
      maxUses: 10,
      usesCount: 0,
      createdById: data.createdById,
      createdAt: new Date()
    };
    this.inviteTokens.set(token, invite);
    return invite;
  }

  acceptInvite(token: string, userId: string): { success: boolean; message: string; role?: Role; projectId?: string } {
    const invite = this.inviteTokens.get(token);
    if (!invite) {
      return { success: false, message: 'Convite inválido ou não encontrado.' };
    }
    if (new Date() > invite.expiresAt) {
      return { success: false, message: 'Este convite expirou.' };
    }
    if (invite.usesCount >= invite.maxUses) {
      return { success: false, message: 'Limite de utilizações deste convite atingido.' };
    }

    invite.usesCount += 1;
    this.inviteTokens.set(token, invite);

    if (invite.projectId) {
      const pmId = `pm-${uuidv4().substring(0, 6)}`;
      this.projectMembers.set(pmId, {
        id: pmId,
        projectId: invite.projectId,
        userId,
        role: invite.role,
        createdAt: new Date()
      });
      return {
        success: true,
        message: `Acesso concedido ao projeto com papel ${invite.role}.`,
        role: invite.role,
        projectId: invite.projectId
      };
    }

    return { success: true, message: 'Convite aceito com sucesso.', role: invite.role };
  }

  // --- Comments & Mentions (US04) ---
  createComment(data: { taskId: string; authorId: string; content: string }): Comment {
    // Extrai menções com @
    const mentionRegex = /@([a-zA-Z0-9_.-]+)/g;
    const matches = data.content.match(mentionRegex) || [];
    const mentions = matches.map(m => m.substring(1));

    const comment: Comment = {
      id: uuidv4(),
      taskId: data.taskId,
      authorId: data.authorId,
      content: data.content,
      mentions,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.comments.set(comment.id, comment);
    this.logChange('comments', comment.id, 'created');
    return comment;
  }

  // --- Attachments (US04) ---
  createAttachment(data: { taskId: string; commentId?: string; fileName: string; fileType: string; fileSize: number; storageKey: string; url: string }): Attachment {
    const attachment: Attachment = {
      id: uuidv4(),
      taskId: data.taskId,
      commentId: data.commentId || null,
      fileName: data.fileName,
      fileType: data.fileType,
      fileSize: data.fileSize,
      storageKey: data.storageKey,
      url: data.url,
      createdAt: new Date()
    };
    this.attachments.set(attachment.id, attachment);
    this.logChange('attachments', attachment.id, 'created');
    return attachment;
  }

  // --- Delta Sync Protocol (US02) ---
  getChangesSince(lastPulledAt: Date, filterProjectId?: string) {
    const changes: Record<string, { created: any[]; updated: any[]; deleted: string[] }> = {
      tasks: { created: [], updated: [], deleted: [] },
      comments: { created: [], updated: [], deleted: [] },
      attachments: { created: [], updated: [], deleted: [] }
    };

    const isInitialPull = lastPulledAt.getTime() === 0;

    for (const task of this.tasks.values()) {
      if (filterProjectId) {
        const f = filterProjectId.trim().toLowerCase();
        const matchesProject = task.projectId && task.projectId.toLowerCase() === f;
        const matchesTeam = task.team && task.team.trim().toLowerCase() === f;
        if (!matchesProject && !matchesTeam) {
          continue;
        }
      }

      if (task.deletedAt) {
        changes.tasks.deleted.push(task.id);
      } else {
        const details = this.getTaskWithDetails(task.id);
        if (isInitialPull) {
          changes.tasks.created.push(details);
        } else if (task.createdAt > lastPulledAt) {
          changes.tasks.created.push(details);
        } else if (task.updatedAt > lastPulledAt || (task.lockedAt && task.lockedAt > lastPulledAt)) {
          changes.tasks.updated.push(details);
        }
      }
    }

    for (const comment of this.comments.values()) {
      if (comment.createdAt > lastPulledAt) {
        changes.comments.created.push(comment);
      } else if (comment.updatedAt > lastPulledAt) {
        changes.comments.updated.push(comment);
      }
    }

    for (const attachment of this.attachments.values()) {
      if (attachment.createdAt > lastPulledAt) {
        changes.attachments.created.push(attachment);
      }
    }

    return changes;
  }

  applyClientPush(changes: Record<string, { created: any[]; updated: any[]; deleted: string[] }>) {
    let appliedCount = 0;

    if (changes.tasks) {
      for (const t of changes.tasks.created || []) {
        this.createTask(t);
        appliedCount++;
      }
      for (const t of changes.tasks.updated || []) {
        const existing = this.tasks.get(t.id);
        const ver = existing ? existing.version : (t.version || 1);
        this.updateTask(t.id, ver, t);
        appliedCount++;
      }
      for (const id of changes.tasks.deleted || []) {
        this.deleteTask(id);
        appliedCount++;
      }
    }

    if (changes.comments) {
      for (const c of changes.comments.created || []) {
        this.createComment(c);
        appliedCount++;
      }
    }

    return { success: true, appliedCount };
  }

  // ==========================================
  // SPRINT 2: DEPENDENCY MANAGEMENT (US10 / DB-10.1 / BE-10.2)
  // ==========================================
  addDependency(taskId: string, dependsOnTaskId: string, dependencyType: DependencyType = 'FINISH_TO_START'): TaskDependency {
    if (taskId === dependsOnTaskId) {
      throw new Error('Uma tarefa não pode depender de si mesma.');
    }
    const existing = Array.from(this.taskDependencies.values()).find(
      d => d.taskId === taskId && d.dependsOnTaskId === dependsOnTaskId
    );
    if (existing) return existing;

    const id = 'dep-' + uuidv4().slice(0, 8);
    const dep: TaskDependency = {
      id,
      taskId,
      dependsOnTaskId,
      dependencyType,
      createdAt: new Date()
    };
    this.taskDependencies.set(id, dep);
    this.logChange('taskDependencies', id, 'created');
    return dep;
  }

  removeDependency(id: string): boolean {
    const exists = this.taskDependencies.has(id);
    if (exists) {
      this.taskDependencies.delete(id);
      this.logChange('taskDependencies', id, 'deleted');
    }
    return exists;
  }

  getTaskDependencies(taskId: string): TaskDependency[] {
    return Array.from(this.taskDependencies.values()).filter(d => d.taskId === taskId);
  }

  getTaskPrerequisites(taskId: string): TaskDependency[] {
    return Array.from(this.taskDependencies.values()).filter(d => d.dependsOnTaskId === taskId);
  }

  // ==========================================
  // SPRINT 2: CHECKLIST & CLONAGEM (US21 / DB-21.1 / BE-21.2)
  // ==========================================
  addChecklistItem(taskId: string, title: string, assigneeId?: string | null): TaskChecklistItem {
    const id = 'chk-' + uuidv4().slice(0, 8);
    const existingItems = Array.from(this.taskChecklists.values()).filter(c => c.taskId === taskId);
    const assignee = assigneeId ? this.users.get(assigneeId) : null;
    const item: TaskChecklistItem = {
      id,
      taskId,
      title,
      isCompleted: false,
      completedAt: null,
      assigneeId: assigneeId || null,
      assigneeName: assignee?.name || null,
      orderIndex: existingItems.length,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.taskChecklists.set(id, item);
    this.logChange('taskChecklists', id, 'created');
    return item;
  }

  updateChecklistItem(itemId: string, data: Partial<TaskChecklistItem>): TaskChecklistItem | undefined {
    const item = this.taskChecklists.get(itemId);
    if (!item) return undefined;
    if (data.title !== undefined) item.title = data.title;
    if (data.isCompleted !== undefined) {
      item.isCompleted = data.isCompleted;
      item.completedAt = data.isCompleted ? new Date() : null;
    }
    if (data.assigneeId !== undefined) {
      item.assigneeId = data.assigneeId;
      const assignee = data.assigneeId ? this.users.get(data.assigneeId) : null;
      item.assigneeName = assignee?.name || null;
    }
    if (data.orderIndex !== undefined) item.orderIndex = data.orderIndex;
    item.updatedAt = new Date();
    this.taskChecklists.set(itemId, item);
    this.logChange('taskChecklists', itemId, 'updated');
    return item;
  }

  deleteChecklistItem(itemId: string): boolean {
    const exists = this.taskChecklists.has(itemId);
    if (exists) {
      this.taskChecklists.delete(itemId);
      this.logChange('taskChecklists', itemId, 'deleted');
    }
    return exists;
  }

  getTaskChecklist(taskId: string): TaskChecklistItem[] {
    return Array.from(this.taskChecklists.values())
      .filter(c => c.taskId === taskId)
      .sort((a, b) => a.orderIndex - b.orderIndex);
  }

  cloneTask(taskId: string, dateOffsetDays: number = 0): any {
    const original = this.getTaskWithDetails(taskId);
    if (!original) throw new Error('Tarefa original não encontrada para duplicação.');

    const offsetMs = dateOffsetDays * 86400000;
    const now = new Date();
    const newDueDate = original.dueDate ? new Date(new Date(original.dueDate).getTime() + offsetMs) : null;
    const newStartDate = original.startDate ? new Date(new Date(original.startDate).getTime() + offsetMs) : now;

    const cloned = this.createTask({
      title: `${original.title} (Cópia)`,
      description: original.description,
      priority: original.priority,
      status: 'PENDING',
      effortHours: original.effortHours,
      startDate: newStartDate,
      dueDate: newDueDate,
      projectId: original.projectId,
      team: original.team,
      assigneeId: original.assigneeId,
      parentTaskId: null
    });

    const checklists = this.getTaskChecklist(taskId);
    for (const item of checklists) {
      this.addChecklistItem(cloned.id, item.title, item.assigneeId);
    }

    return this.getTaskWithDetails(cloned.id);
  }

  // ==========================================
  // SPRINT 2: AUSÊNCIAS & ACEITE DE TAREFAS (US22 / DB-22.1 / BE-22.2)
  // ==========================================
  addUserAbsence(userId: string, type: AbsenceType, startDate: Date, endDate: Date, reason?: string | null): UserAbsence {
    const id = 'abs-' + uuidv4().slice(0, 8);
    const absence: UserAbsence = {
      id,
      userId,
      type,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      reason: reason || null,
      createdAt: new Date()
    };
    this.userAbsences.set(id, absence);
    this.logChange('userAbsences', id, 'created');
    return absence;
  }

  getUserAbsences(userId: string): UserAbsence[] {
    return Array.from(this.userAbsences.values()).filter(a => a.userId === userId);
  }

  isUserAbsent(userId: string, targetDate: Date = new Date()): boolean {
    const target = targetDate.getTime();
    return Array.from(this.userAbsences.values()).some(a => {
      return a.userId === userId && target >= new Date(a.startDate).getTime() && target <= new Date(a.endDate).getTime();
    });
  }

  // ==========================================
  // SPRINT 2: REGRAS DE AUTOMAÇÃO JSON (US15 / DB-15.1 / BE-15.2)
  // ==========================================
  addAutomationRule(data: {
    projectId: string;
    name: string;
    trigger: AutomationTrigger;
    conditionsJson: string;
    actionsJson: string;
    createdById: string;
    isActive?: boolean;
  }): AutomationRule {
    const id = 'auto-' + uuidv4().slice(0, 8);
    const rule: AutomationRule = {
      id,
      projectId: data.projectId,
      name: data.name,
      trigger: data.trigger,
      conditionsJson: data.conditionsJson,
      actionsJson: data.actionsJson,
      isActive: data.isActive !== undefined ? data.isActive : true,
      createdById: data.createdById,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.automationRules.set(id, rule);
    this.logChange('automationRules', id, 'created');
    return rule;
  }

  getAutomationRules(projectId: string): AutomationRule[] {
    return Array.from(this.automationRules.values()).filter(r => r.projectId === projectId);
  }

  deleteAutomationRule(id: string): boolean {
    const exists = this.automationRules.has(id);
    if (exists) {
      this.automationRules.delete(id);
      this.logChange('automationRules', id, 'deleted');
    }
    return exists;
  }
}

export const repository = new AppRepository();

