import React, { useState } from 'react';
import { Plus, QrCode, Share2, Bell, CheckCircle2, AlertTriangle, Layers } from 'lucide-react';
import { LocalTask, LocalTag } from '../database/schema';
import { TaskCard } from '../components/TaskCard';
import { FilterBar } from '../components/FilterBar';
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

  // Filtragem (com busca e filtros de status/prioridade)
  const filteredTasks = tasks.filter(task => {
    // Apenas tarefas raiz na lista principal (subtarefas ficam aninhadas dentro delas)
    if (task.parentTaskId) return false;

    if (selectedStatus && task.status !== selectedStatus) return false;
    if (selectedPriority && task.priority !== selectedPriority) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchDesc = task.description?.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc) return false;
    }

    return true;
  });

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
        <div style={styles.notifDrawer}>
          <h4 style={styles.notifTitle}>Alertas Progressivos de Prazos & Menções</h4>
          {notifications.length === 0 ? (
            <p style={{ fontSize: 12, color: '#94A3B8' }}>Nenhuma notificação no momento.</p>
          ) : (
            notifications.map(n => (
              <div key={n.id} style={{ ...styles.notifItem, borderLeftColor: n.color }}>
                <strong style={{ fontSize: 13, color: '#0F172A' }}>{n.title}</strong>
                <p style={{ fontSize: 12, color: '#475569', margin: '2px 0 0 0' }}>{n.body}</p>
              </div>
            ))
          )}
        </div>
      )}

      {/* Barra de Filtros, Modo Offline e Busca Semântica */}
      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedTag={selectedTag}
        onSelectTag={setSelectedTag}
        selectedStatus={selectedStatus}
        onSelectStatus={setSelectedStatus}
        selectedPriority={selectedPriority}
        onSelectPriority={setSelectedPriority}
        tags={tags}
        isOnline={isOnline}
        onToggleOnline={onToggleOnline}
        isSyncing={isSyncing}
        onTriggerSync={onTriggerSync}
      />

      {/* Lista de Tarefas */}
      <div style={styles.taskList}>
        <div style={styles.listHeader}>
          <span style={styles.counterText}>
            Exibindo {filteredTasks.length} de {tasks.filter(t => !t.parentTaskId).length} tarefas
          </span>
        </div>

        {filteredTasks.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyTitle}>Nenhuma tarefa encontrada.</p>
            <p style={styles.emptySub}>Crie uma nova tarefa ou ajuste os filtros de busca.</p>
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
    padding: '24px 16px'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  logoIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#2563EB',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.3)'
  },
  appTitle: {
    margin: 0,
    fontSize: 22,
    fontWeight: 800,
    color: '#0F172A',
    letterSpacing: '-0.02em'
  },
  appSubtitle: {
    margin: '2px 0 0 0',
    fontSize: 12,
    color: '#64748B'
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 8
  },
  headerBtn: {
    position: 'relative',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: 10,
    padding: 8,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  notifBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 700,
    width: 16,
    height: 16,
    borderRadius: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  createBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#2563EB',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: 10,
    padding: '8px 16px',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)'
  },
  notifDrawer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    border: '1px solid #CBD5E1',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    marginBottom: 20
  },
  notifTitle: {
    margin: '0 0 10px 0',
    fontSize: 13,
    fontWeight: 700,
    color: '#334155'
  },
  notifItem: {
    backgroundColor: '#F8FAFC',
    borderLeft: '4px solid',
    padding: '8px 12px',
    borderRadius: '0 8px 8px 0',
    marginBottom: 8
  },
  taskList: {
    display: 'flex',
    flexDirection: 'column'
  },
  listHeader: {
    marginBottom: 12
  },
  counterText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: 600
  },
  emptyState: {
    textAlign: 'center',
    padding: '48px 16px',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    border: '1px dashed #CBD5E1'
  },
  emptyTitle: {
    margin: 0,
    fontSize: 15,
    fontWeight: 600,
    color: '#334155'
  },
  emptySub: {
    margin: '4px 0 0 0',
    fontSize: 13,
    color: '#94A3B8'
  }
};
