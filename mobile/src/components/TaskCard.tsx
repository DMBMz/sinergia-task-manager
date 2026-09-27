import React from 'react';
import { Clock, Calendar, CheckSquare, Cloud, CloudOff, ChevronRight } from 'lucide-react';
import { LocalTask } from '../database/schema';

interface TaskCardProps {
  task: LocalTask;
  subtasksCount: number;
  completedSubtasksCount: number;
  onClick: () => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  subtasksCount,
  completedSubtasksCount,
  onClick
}) => {
  // Cores de prioridade
  const priorityColors: Record<string, { bg: string; text: string }> = {
    LOW: { bg: '#F1F5F9', text: '#475569' },
    MEDIUM: { bg: '#EFF6FF', text: '#2563EB' },
    HIGH: { bg: '#FEF3C7', text: '#D97706' },
    URGENT: { bg: '#FEE2E2', text: '#DC2626' }
  };

  // Cálculo de proximidade do prazo (US07 Alertas Progressivos)
  let dueDateColor = '#64748B';
  let dueDateBadgeBg = '#F8FAFC';
  if (task.dueDate) {
    const diffHours = (new Date(task.dueDate).getTime() - Date.now()) / (1000 * 3600);
    if (diffHours < 0) {
      dueDateColor = '#DC2626'; // Atrasada
      dueDateBadgeBg = '#FEF2F2';
    } else if (diffHours <= 1) {
      dueDateColor = '#EF4444'; // Crítica (< 1h)
      dueDateBadgeBg = '#FEF2F2';
    } else if (diffHours <= 24) {
      dueDateColor = '#F97316'; // Alta (< 24h)
      dueDateBadgeBg = '#FFF7ED';
    } else if (diffHours <= 72) {
      dueDateColor = '#F59E0B'; // Média (< 3 dias)
      dueDateBadgeBg = '#FEFCE8';
    } else if (diffHours <= 168) {
      dueDateColor = '#10B981'; // Informativo (7 dias)
      dueDateBadgeBg = '#ECFDF5';
    }
  }

  const pColor = priorityColors[task.priority] || priorityColors.MEDIUM;

  return (
    <div style={styles.card} onClick={onClick}>
      <div style={styles.cardHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ ...styles.priorityBadge, backgroundColor: pColor.bg, color: pColor.text }}>
            {task.priority}
          </span>
          <span style={styles.versionBadge}>v{task.version}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {task._status === 'synced' ? (
            <span style={styles.syncIconSynced} title="Sincronizado na nuvem">
              <Cloud size={14} color="#10B981" />
            </span>
          ) : (
            <span style={styles.syncIconPending} title="Alteração local pendente de envio">
              <CloudOff size={14} color="#F59E0B" />
            </span>
          )}
          <ChevronRight size={16} color="#CBD5E1" />
        </div>
      </div>

      <h3 style={styles.title}>{task.title}</h3>
      {task.description ? (
        <p style={styles.description}>{task.description}</p>
      ) : null}

      <div style={styles.cardFooter}>
        {/* Esforço */}
        {task.effortHours ? (
          <span style={styles.metaItem}>
            <Clock size={13} color="#64748B" />
            <span>{task.effortHours}h</span>
          </span>
        ) : null}

        {/* Prazo com Cor Progressiva */}
        {task.dueDate ? (
          <span style={{ ...styles.dueDateBadge, backgroundColor: dueDateBadgeBg, color: dueDateColor }}>
            <Calendar size={13} style={{ marginRight: 4 }} />
            <span>{new Date(task.dueDate).toLocaleDateString([], { day: '2-digit', month: 'short' })}</span>
          </span>
        ) : null}

        {/* Subtarefas */}
        {subtasksCount > 0 ? (
          <span style={styles.metaItem}>
            <CheckSquare size={13} color="#10B981" />
            <span>{completedSubtasksCount}/{subtasksCount}</span>
          </span>
        ) : null}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    border: '1px solid #E2E8F0',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.04)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    marginBottom: 12
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  priorityBadge: {
    fontSize: 10,
    fontWeight: 700,
    padding: '3px 8px',
    borderRadius: 6,
    letterSpacing: '0.04em'
  },
  versionBadge: {
    fontSize: 10,
    color: '#94A3B8',
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    padding: '2px 6px',
    borderRadius: 4
  },
  syncIconSynced: {
    display: 'flex',
    alignItems: 'center'
  },
  syncIconPending: {
    display: 'flex',
    alignItems: 'center'
  },
  title: {
    margin: '0 0 6px 0',
    fontSize: 15,
    fontWeight: 600,
    color: '#0F172A',
    lineHeight: 1.3
  },
  description: {
    margin: '0 0 12px 0',
    fontSize: 13,
    color: '#64748B',
    lineHeight: 1.4,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden'
  },
  cardFooter: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    fontSize: 12,
    color: '#64748B'
  },
  metaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 4
  },
  dueDateBadge: {
    display: 'flex',
    alignItems: 'center',
    padding: '3px 8px',
    borderRadius: 6,
    fontWeight: 600,
    fontSize: 11
  }
};
