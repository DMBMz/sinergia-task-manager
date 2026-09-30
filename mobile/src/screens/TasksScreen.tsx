import React, { useState, useMemo } from 'react';
import { Plus, QrCode, Share2, Bell, CheckCircle2, AlertTriangle, Layers, RotateCcw } from 'lucide-react';
import { LocalTask, LocalTag } from '../database/schema';
import { TaskCard } from '../components/TaskCard';
import { FilterBar } from '../components/FilterBar';
import { FilterDrawer, FilterState } from '../components/FilterDrawer';
import { LocalSearchIndex } from '../services/searchIndex';
import { PushNotification } from '../services/notificationHandler';

interface TasksScreenProps {
  tasks: LocalTask[];
  allSubtasks: LocalTask[];
  tags: LocalTag[];
  isOnline: boolean;
  isSyncing: boolean;
  notifications: PushNotification[];
  onToggleOnline: () => void;
  onTriggerSync: () => void;
  onSelectTask: (task: LocalTask) => void;
  onCreateTask: () => void;
  onOpenQRScanner: () => void;
  onOpenShareModal: () => void;
}

export const TasksScreen: React.FC<TasksScreenProps> = ({
  tasks,
  allSubtasks,
  tags,
  isOnline,
  isSyncing,
  notifications,
  onToggleOnline,
  onTriggerSync,
  onSelectTask,
  onCreateTask,
  onOpenQRScanner,
  onOpenShareModal
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedPriority, setSelectedPriority] = useState<string | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  // US05: Estado de filtros avançados compostos
  const [advancedFilters, setAdvancedFilters] = useState<FilterState>({
    scope: 'root_only',
    assigneeId: null,
    tagNames: [],
    statuses: [],
    priorities: [],
    overdueOnly: false,
    thisWeekOnly: false
  });

  // Contagem de filtros ativos
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (advancedFilters.scope !== 'root_only') count++;
    if (advancedFilters.assigneeId) count++;
    if (advancedFilters.tagNames.length > 0) count += advancedFilters.tagNames.length;
    if (advancedFilters.statuses.length > 0) count += advancedFilters.statuses.length;
    if (advancedFilters.priorities.length > 0) count += advancedFilters.priorities.length;
    if (advancedFilters.overdueOnly) count++;
    if (advancedFilters.thisWeekOnly) count++;
    if (selectedTag) count++;
    if (selectedStatus) count++;
    if (selectedPriority) count++;
    return count;
  }, [advancedFilters, selectedTag, selectedStatus, selectedPriority]);

  // US05: Membros reais derivados dinamicamente das tarefas do time ativo (sem nomes mockados)
  const teamMembers = useMemo(() => {
    const map = new Map<string, { id: string; name: string; avatarUrl?: string }>();
    tasks.forEach(t => {
      const name = (t.assigneeName || t.assigneeId || '').trim();
      if (name && !map.has(name)) {
        map.set(name, {
          id: t.assigneeId || name,
          name: name,
          avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`
        });
      }
    });
    return Array.from(map.values());
  }, [tasks]);

  // US05: Apenas as tags reais já adicionadas em tarefas deste time (remove todas não utilizadas)
  const actualTeamTags = useMemo(() => {
    const tagNamesSet = new Set<string>();
    tasks.forEach(t => {
      if (Array.isArray(t.tags)) {
        t.tags.forEach((tag: any) => {
          const name = typeof tag === 'string' ? tag : (tag?.name || tag?.title);
          if (name && typeof name === 'string' && name.trim()) {
            tagNamesSet.add(name.trim());
          }
        });
      }
    });

    return Array.from(tagNamesSet).map(name => {
      const existing = tags.find(tg => tg.name.toLowerCase() === name.toLowerCase());
      return existing || {
        id: `tag-${name}`,
        name: name,
        color: '#2563EB',
        projectId: ''
      };
    });
  }, [tasks, tags]);

  // Instância do mecanismo de busca fuzzy Levenshtein
  const searchEngine = useMemo(() => {
    const engine = new LocalSearchIndex();
    engine.indexTasks(tasks);
    return engine;
  }, [tasks]);

  // US05: Filtragem reativa composta cruzando Levenshtein com todos os critérios do Drawer
  const filteredTasks = useMemo(() => {
    let list = tasks;

    // 1. Escopo (Root vs Subtasks)
    if (advancedFilters.scope === 'root_only') {
      list = list.filter(t => !t.parentTaskId);
    } else if (advancedFilters.scope === 'subtasks_only') {
      list = list.filter(t => !!t.parentTaskId);
    }

    // 2. Responsável
    if (advancedFilters.assigneeId) {
      list = list.filter(t => t.assigneeId === advancedFilters.assigneeId);
    }

    // 3. Status
    if (advancedFilters.statuses.length > 0) {
      list = list.filter(t => advancedFilters.statuses.includes(t.status));
    } else if (selectedStatus) {
      list = list.filter(t => t.status === selectedStatus);
    }

    // 4. Prioridade
    if (advancedFilters.priorities.length > 0) {
      list = list.filter(t => advancedFilters.priorities.includes(t.priority));
    } else if (selectedPriority) {
      list = list.filter(t => t.priority === selectedPriority);
    }

    // 5. Múltiplas Tags
    if (advancedFilters.tagNames.length > 0) {
      list = list.filter(t => {
        return advancedFilters.tagNames.some(tn =>
          t.title.toLowerCase().includes(tn.toLowerCase()) ||
          (t.description && t.description.toLowerCase().includes(tn.toLowerCase()))
        );
      });
    } else if (selectedTag) {
      list = list.filter(t =>
        t.title.toLowerCase().includes(selectedTag.toLowerCase()) ||
        (t.description && t.description.toLowerCase().includes(selectedTag.toLowerCase()))
      );
    }

    // 6. Overdue (tarefas atrasadas não concluídas)
    if (advancedFilters.overdueOnly) {
      const now = new Date();
      list = list.filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== 'COMPLETED');
    }

    // 7. Vence esta semana
    if (advancedFilters.thisWeekOnly) {
      const now = new Date();
      const in7Days = new Date(now.getTime() + 7 * 86400000);
      list = list.filter(t => t.dueDate && new Date(t.dueDate) >= now && new Date(t.dueDate) <= in7Days);
    }

    // 8. Busca difusa Levenshtein (Fuzzy Matching tolerante a erros)
    if (searchQuery.trim()) {
      const results = searchEngine.search(searchQuery.trim(), list);
      const matchIds = new Set(results.map(r => r.task.id));
      list = list.filter(t => matchIds.has(t.id));
    }

    return list;
  }, [tasks, advancedFilters, selectedTag, selectedStatus, selectedPriority, searchQuery, searchEngine]);

  const resetAllFilters = () => {
    setAdvancedFilters({
      scope: 'root_only',
      assigneeId: null,
      tagNames: [],
      statuses: [],
      priorities: [],
      overdueOnly: false,
      thisWeekOnly: false
    });
    setSelectedTag(null);
    setSelectedStatus(null);
    setSelectedPriority(null);
  };

  return (
    <div style={styles.container}>
      {/* Top Header */}
      <div style={styles.header}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={styles.logoIcon}>
              <Layers size={22} color="#FFFFFF" />
            </div>
            <h1 style={styles.appTitle}>Sinergia</h1>
          </div>
          <p style={styles.appSubtitle}>Task Manager Inteligente & Colaborativo</p>
        </div>

        <div style={styles.headerActions}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            style={styles.headerBtn}
            title="Alertas & Notificações"
          >
            <Bell size={18} color="#475569" />
            {notifications.length > 0 && (
              <span style={styles.notifBadge}>{notifications.length}</span>
            )}
          </button>
          <button onClick={onOpenQRScanner} style={styles.headerBtn} title="Escanear QR Code">
            <QrCode size={18} color="#475569" />
          </button>
          <button onClick={onOpenShareModal} style={styles.headerBtn} title="Convidar Membros">
            <Share2 size={18} color="#475569" />
          </button>
          <button onClick={onCreateTask} style={styles.createBtn}>
            <Plus size={18} />
            <span>Nova Tarefa</span>
          </button>
        </div>
      </div>

      {/* Drawer de Notificações Recebidas (US07) */}
      {showNotifications && (
        <div style={styles.notifDropdown}>
          <div style={styles.notifHeader}>
            <span style={{ fontWeight: 700, fontSize: 13, color: '#0F172A' }}>Central de Alertas FCM</span>
            <button onClick={() => setShowNotifications(false)} style={styles.notifClose}>×</button>
          </div>
          {notifications.length === 0 ? (
            <p style={{ padding: 12, fontSize: 12, color: '#64748B', textAlign: 'center' }}>Nenhum alerta recente.</p>
          ) : (
            notifications.map(n => (
              <div key={n.id} style={{ ...styles.notifItem, borderLeftColor: n.color || '#3B82F6' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <AlertTriangle size={14} color={n.color || '#3B82F6'} />
                  <span style={{ fontWeight: 600, fontSize: 12 }}>{n.title}</span>
                </div>
                <p style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>{n.body}</p>
              </div>
            ))
          )}
        </div>
      )}

      {/* Barra de Filtros com Busca Difusa e Botão do Drawer (FE-05.2 / FE-05.3) */}
      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedTag={selectedTag}
        onSelectTag={setSelectedTag}
        selectedStatus={selectedStatus}
        onSelectStatus={setSelectedStatus}
        selectedPriority={selectedPriority}
        onSelectPriority={setSelectedPriority}
        tags={actualTeamTags}
        isOnline={isOnline}
        onToggleOnline={onToggleOnline}
        isSyncing={isSyncing}
        onTriggerSync={onTriggerSync}
        onOpenDrawer={() => setFilterDrawerOpen(true)}
        activeFiltersCount={activeFiltersCount}
      />

      {/* Drawer Lateral de Filtros Avançados (FE-05.2) */}
      <FilterDrawer
        isOpen={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        filters={advancedFilters}
        onFiltersChange={setAdvancedFilters}
        onResetFilters={resetAllFilters}
        tags={actualTeamTags}
        members={teamMembers}
        activeCount={activeFiltersCount}
      />

      {/* Lista de Tarefas */}
      <div style={styles.taskList}>
        <div style={styles.listHeader}>
          <span style={styles.counterText}>
            Exibindo <strong>{filteredTasks.length}</strong> de <strong>{tasks.length}</strong> tarefas
            {activeFiltersCount > 0 && (
              <span style={{ color: '#2563EB', marginLeft: 6 }}>({activeFiltersCount} filtro{activeFiltersCount > 1 ? 's' : ''} ativo{activeFiltersCount > 1 ? 's' : ''})</span>
            )}
          </span>

          {activeFiltersCount > 0 && (
            <button onClick={resetAllFilters} style={styles.resetFiltersBtn} title="Limpar todos os filtros">
              <RotateCcw size={12} />
              <span>Limpar filtros</span>
            </button>
          )}
        </div>

        {filteredTasks.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyTitle}>Nenhuma tarefa encontrada.</p>
            <p style={styles.emptySub}>Ajuste os filtros de busca ou crie uma nova tarefa.</p>
            {activeFiltersCount > 0 && (
              <button onClick={resetAllFilters} style={styles.emptyResetBtn}>
                Remover todos os filtros
              </button>
            )}
          </div>
        ) : (
          filteredTasks.map(task => {
            const taskSubs = allSubtasks.filter(s => s.parentTaskId === task.id);
            const completedSubs = taskSubs.filter(s => s.status === 'COMPLETED').length;

            return (
              <TaskCard
                key={task.id}
                task={task}
                subtasksCount={taskSubs.length}
                completedSubtasksCount={completedSubs}
                onClick={() => onSelectTask(task)}
              />
            );
          })
        )}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: 800,
    margin: '0 auto',
    padding: '16px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  logoIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#2563EB',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  appTitle: {
    fontSize: 22,
    fontWeight: 800,
    color: '#0F172A',
    margin: 0
  },
  appSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 8
  },
  headerBtn: {
    padding: 8,
    borderRadius: 8,
    border: '1px solid #CBD5E1',
    backgroundColor: '#FFFFFF',
    cursor: 'pointer',
    position: 'relative'
  },
  notifBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    color: '#FFFFFF',
    fontSize: 10,
    borderRadius: 9999,
    padding: '1px 5px',
    fontWeight: 700
  },
  createBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 14px',
    borderRadius: 8,
    border: 'none',
    backgroundColor: '#2563EB',
    color: '#FFFFFF',
    fontWeight: 600,
    fontSize: 13,
    cursor: 'pointer'
  },
  notifDropdown: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    border: '1px solid #E2E8F0',
    marginBottom: 16,
    overflow: 'hidden'
  },
  notifHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 12px',
    backgroundColor: '#F8FAFC',
    borderBottom: '1px solid #E2E8F0'
  },
  notifClose: {
    background: 'none',
    border: 'none',
    fontSize: 16,
    cursor: 'pointer',
    color: '#64748B'
  },
  notifItem: {
    padding: '8px 12px',
    borderLeft: '4px solid',
    borderBottom: '1px solid #F1F5F9'
  },
  taskList: {
    marginTop: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 12
  },
  listHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 4
  },
  counterText: {
    fontSize: 12,
    color: '#64748B'
  },
  resetFiltersBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    background: 'none',
    border: 'none',
    color: '#2563EB',
    fontSize: 11,
    fontWeight: 600,
    cursor: 'pointer'
  },
  emptyState: {
    textAlign: 'center',
    padding: '48px 16px',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    border: '1px dashed #CBD5E1'
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: 600,
    color: '#334155',
    margin: 0
  },
  emptySub: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4
  },
  emptyResetBtn: {
    marginTop: 12,
    padding: '6px 14px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #CBD5E1',
    borderRadius: 8,
    fontSize: 12,
    color: '#2563EB',
    fontWeight: 600,
    cursor: 'pointer'
  }
};
