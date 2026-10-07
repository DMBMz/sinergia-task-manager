import { LocalTask, LocalComment, LocalTag } from '../database/schema';

function normalizePriority(p?: any): 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' {
  if (!p) return 'MEDIUM';
  const s = String(p).trim().toUpperCase();
  if (s === 'LOW' || s.startsWith('BAIX')) return 'LOW';
  if (s === 'HIGH' || s.startsWith('ALT')) return 'HIGH';
  if (s === 'URGENT' || s.startsWith('URG')) return 'URGENT';
  if (s === 'MEDIUM' || s.startsWith('MED')) return 'MEDIUM';
  return 'MEDIUM';
}

export class SyncService {
  private apiUrl: string;
  private lastPulledAt: number = 0;
  private isOnline: boolean = true;
  private isSyncing: boolean = false;

  // Repositório local em memória e persistência offline
  private tasks: Map<string, LocalTask> = new Map();
  private comments: Map<string, LocalComment> = new Map();
  private tags: Map<string, LocalTag> = new Map();

  constructor(apiUrl: string = 'https://sinergia-task-manager.onrender.com/api/v1') {
    this.apiUrl = apiUrl;
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    const defaultTag1: LocalTag = { id: 'tag-1', name: 'Sprint 1', color: '#10B981', projectId: 'proj-sinergia-001' };
    const defaultTag2: LocalTag = { id: 'tag-2', name: 'Mobile', color: '#6366F1', projectId: 'proj-sinergia-001' };
    this.tags.set(defaultTag1.id, defaultTag1);
    this.tags.set(defaultTag2.id, defaultTag2);

    const defaultTask: LocalTask = {
      id: 'task-root-001',
      title: 'Estruturação da Arquitetura Mobile e Backend',
      description: 'Definição dos schemas Prisma, WatermelonDB e rotas da Sprint 1.',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      effortHours: 12,
      startDate: new Date().toISOString(),
      dueDate: new Date(Date.now() + 86400000 * 2).toISOString(),
      projectId: 'proj-sinergia-001',
      assigneeId: 'user-davi-001',
      parentTaskId: null,
      version: 1,
      _status: 'synced',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.tasks.set(defaultTask.id, defaultTask);

    const subtask: LocalTask = {
      id: 'subtask-001',
      title: 'Configurar Sync Bidirecional e Modo Offline',
      description: 'Testar protocolo WatermelonDB com pull/push.',
      priority: 'HIGH',
      status: 'PENDING',
      effortHours: 6,
      startDate: new Date().toISOString(),
      dueDate: new Date(Date.now() + 86400000 * 1).toISOString(),
      projectId: 'proj-sinergia-001',
      assigneeId: 'user-ana-002',
      parentTaskId: 'task-root-001',
      version: 1,
      _status: 'synced',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.tasks.set(subtask.id, subtask);
  }

  setOnlineStatus(online: boolean) {
    this.isOnline = online;
    if (online) {
      this.sync();
    }
  }

  getOnlineStatus() {
    return this.isOnline;
  }

  getSyncingStatus() {
    return this.isSyncing;
  }

  // --- Operações Locais (Offline-First) ---
  getAllTasks(): LocalTask[] {
    return Array.from(this.tasks.values()).filter(t => t._status !== 'deleted');
  }

  getTask(id: string): LocalTask | undefined {
    const task = this.tasks.get(id);
    return task && task._status !== 'deleted' ? task : undefined;
  }

  getSubtasks(parentId: string): LocalTask[] {
    return this.getAllTasks().filter(t => t.parentTaskId === parentId);
  }

  createTask(data: Partial<LocalTask>): LocalTask {
    const id = data.id || 'local-task-' + Date.now();
    const task: LocalTask = {
      id,
      title: data.title || '',
      description: data.description || '',
      priority: normalizePriority(data.priority),
      status: data.status || 'PENDING',
      effortHours: data.effortHours || 0,
      startDate: data.startDate || null,
      dueDate: data.dueDate || null,
      projectId: data.projectId || 'proj-sinergia-001',
      assigneeId: data.assigneeId || null,
      parentTaskId: data.parentTaskId || null,
      version: 1,
      _status: 'created', // marcado para envio no próximo sync
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.tasks.set(id, task);

    // Se estiver online, sincroniza imediatamente em background
    if (this.isOnline) {
      this.sync();
    }
    return task;
  }

  updateTaskLocally(id: string, data: Partial<LocalTask>): LocalTask | undefined {
    const existing = this.tasks.get(id);
    if (!existing) return undefined;

    const updated: LocalTask = {
      ...existing,
      ...data,
      priority: data.priority !== undefined ? normalizePriority(data.priority) : existing.priority,
      _status: existing._status === 'created' ? 'created' : 'updated',
      updatedAt: new Date().toISOString()
    };
    this.tasks.set(id, updated);

    if (this.isOnline) {
      this.sync();
    }
    return updated;
  }

  deleteTaskLocally(id: string): boolean {
    const existing = this.tasks.get(id);
    if (!existing) return false;

    if (existing._status === 'created') {
      this.tasks.delete(id);
    } else {
      existing._status = 'deleted';
      existing.updatedAt = new Date().toISOString();
      this.tasks.set(id, existing);
    }

    if (this.isOnline) {
      this.sync();
    }
    return true;
  }

  // --- Sincronização Bidirecional (Delta Sync) ---
  async sync(): Promise<{ success: boolean; pulled: number; pushed: number; message: string }> {
    if (!this.isOnline || this.isSyncing) {
      return { success: false, pulled: 0, pushed: 0, message: 'Dispositivo offline ou sincronização já em andamento.' };
    }

    this.isSyncing = true;
    let pulledCount = 0;
    let pushedCount = 0;

    try {
      // 1. PULL: Baixa mudanças do servidor
      try {
        const pullRes = await fetch(`${this.apiUrl}/sync/pull?last_pulled_at=${this.lastPulledAt}`);
        if (pullRes.ok) {
          const pullData = await pullRes.json() as any;
          if (pullData.success && pullData.changes) {
            // Mescla tarefas criadas e atualizadas no servidor
            for (const t of pullData.changes.tasks.created || []) {
              if (!this.tasks.has(t.id) || this.tasks.get(t.id)?._status === 'synced') {
                this.tasks.set(t.id, { ...t, priority: normalizePriority(t.priority), _status: 'synced' });
                pulledCount++;
              }
            }
            for (const t of pullData.changes.tasks.updated || []) {
              const current = this.tasks.get(t.id);
              if (!current || current._status === 'synced') {
                this.tasks.set(t.id, { ...t, priority: normalizePriority(t.priority), _status: 'synced' });
                pulledCount++;
              }
            }
            for (const deletedId of pullData.changes.tasks.deleted || []) {
              this.tasks.delete(deletedId);
            }
            this.lastPulledAt = pullData.timestamp || Date.now();
          }
        }
      } catch (pullError) {
        console.warn('[SyncService] Falha no pull (modo fallback):', pullError);
      }

      // 2. PUSH: Envia alterações locais acumuladas
      const createdTasks = Array.from(this.tasks.values()).filter(t => t._status === 'created').map(t => ({ ...t, priority: normalizePriority(t.priority) }));
      const updatedTasks = Array.from(this.tasks.values()).filter(t => t._status === 'updated').map(t => ({ ...t, priority: normalizePriority(t.priority) }));
      const deletedTasks = Array.from(this.tasks.values()).filter(t => t._status === 'deleted').map(t => t.id);

      if (createdTasks.length > 0 || updatedTasks.length > 0 || deletedTasks.length > 0) {
        try {
          const pushPayload = {
            changes: {
              tasks: {
                created: createdTasks,
                updated: updatedTasks,
                deleted: deletedTasks
              }
            }
          };

          const pushRes = await fetch(`${this.apiUrl}/sync/push`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(pushPayload)
          });

          if (pushRes.ok) {
            // Marca como sincronizado localmente
            for (const t of createdTasks) {
              t._status = 'synced';
              this.tasks.set(t.id, t);
              pushedCount++;
            }
            for (const t of updatedTasks) {
              t._status = 'synced';
              this.tasks.set(t.id, t);
              pushedCount++;
            }
            for (const id of deletedTasks) {
              this.tasks.delete(id);
              pushedCount++;
            }
          }
        } catch (pushError) {
          console.warn('[SyncService] Falha no push (armazenado para envio posterior):', pushError);
        }
      }

      this.isSyncing = false;
      return {
        success: true,
        pulled: pulledCount,
        pushed: pushedCount,
        message: `Sincronização concluída (${pulledCount} recebidos, ${pushedCount} enviados).`
      };
    } catch (error) {
      this.isSyncing = false;
      return { success: false, pulled: 0, pushed: 0, message: (error as Error).message };
    }
  }
}

export const syncService = new SyncService();
