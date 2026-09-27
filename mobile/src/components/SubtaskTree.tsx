import React, { useState } from 'react';
import { CheckSquare, Square, Plus, CornerDownRight, Clock } from 'lucide-react';
import { LocalTask } from '../database/schema';

interface SubtaskTreeProps {
  parentTaskId: string;
  subtasks: LocalTask[];
  onToggleStatus: (subtaskId: string, currentStatus: string) => void;
  onAddSubtask: (parentTaskId: string, title: string, effortHours: number) => void;
}

export const SubtaskTree: React.FC<SubtaskTreeProps> = ({
  parentTaskId,
  subtasks,
  onToggleStatus,
  onAddSubtask
}) => {
  const [newTitle, setNewTitle] = useState('');
  const [newEffort, setNewEffort] = useState(2);
  const [isAdding, setIsAdding] = useState(false);

  const completedCount = subtasks.filter(s => s.status === 'COMPLETED').length;
  const progressPercent = subtasks.length > 0 ? Math.round((completedCount / subtasks.length) * 100) : 0;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onAddSubtask(parentTaskId, newTitle.trim(), newEffort);
    setNewTitle('');
    setIsAdding(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <h4 style={styles.title}>Subtarefas Aninhadas ({completedCount}/{subtasks.length})</h4>
          <span style={styles.percentBadge}>{progressPercent}%</span>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          style={styles.addBtn}
        >
          <Plus size={14} style={{ marginRight: 4 }} />
          Adicionar Subtarefa
        </button>
      </div>

      {/* Barra de Progresso */}
      <div style={styles.progressBarBg}>
        <div style={{ ...styles.progressBarFill, width: `${progressPercent}%` }} />
      </div>

      {/* Formulário Inline */}
      {isAdding && (
        <form onSubmit={handleCreate} style={styles.inlineForm}>
          <input
            type="text"
            placeholder="Título da subtarefa..."
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            style={styles.textInput}
            autoFocus
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Clock size={14} color="#64748B" />
            <input
              type="number"
              min="0.5"
              step="0.5"
              value={newEffort}
              onChange={e => setNewEffort(parseFloat(e.target.value) || 1)}
              style={styles.effortInput}
              title="Esforço estimado (horas)"
            />
            <span style={{ fontSize: 12, color: '#64748B' }}>h</span>
          </div>
          <button type="submit" style={styles.saveBtn}>Salvar</button>
          <button type="button" onClick={() => setIsAdding(false)} style={styles.cancelBtn}>Cancelar</button>
        </form>
      )}

      {/* Lista de Subtarefas */}
      <div style={styles.list}>
        {subtasks.length === 0 && !isAdding ? (
          <p style={styles.emptyText}>Nenhuma subtarefa adicionada ainda.</p>
        ) : (
          subtasks.map(sub => {
            const isCompleted = sub.status === 'COMPLETED';
            return (
              <div key={sub.id} style={styles.subtaskItem}>
                <CornerDownRight size={16} color="#94A3B8" style={{ marginTop: 2 }} />
                <button
                  onClick={() => onToggleStatus(sub.id, sub.status)}
                  style={styles.checkBtn}
                >
                  {isCompleted ? (
                    <CheckSquare size={18} color="#10B981" />
                  ) : (
                    <Square size={18} color="#94A3B8" />
                  )}
                </button>
                <div style={{ flex: 1 }}>
                  <span style={{
                    fontSize: 14,
                    color: isCompleted ? '#94A3B8' : '#1E293B',
                    textDecoration: isCompleted ? 'line-through' : 'none'
                  }}>
                    {sub.title}
                  </span>
                </div>
                {sub.effortHours ? (
                  <span style={styles.effortBadge}>
                    <Clock size={12} style={{ marginRight: 3 }} />
                    {sub.effortHours}h
                  </span>
                ) : null}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    border: '1px solid #E2E8F0',
    marginTop: 16
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  title: {
    margin: 0,
    fontSize: 14,
    fontWeight: 600,
    color: '#334155'
  },
  percentBadge: {
    backgroundColor: '#E0E7FF',
    color: '#4338CA',
    fontSize: 11,
    fontWeight: 700,
    padding: '2px 8px',
    borderRadius: 9999
  },
  addBtn: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#2563EB',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center'
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 9999,
    overflow: 'hidden',
    marginBottom: 12
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10B981',
    transition: 'width 0.3s ease'
  },
  inlineForm: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 8,
    border: '1px solid #CBD5E1',
    marginBottom: 12
  },
  textInput: {
    flex: 1,
    padding: '6px 10px',
    borderRadius: 6,
    border: '1px solid #E2E8F0',
    fontSize: 13
  },
  effortInput: {
    width: 50,
    padding: '6px 8px',
    borderRadius: 6,
    border: '1px solid #E2E8F0',
    fontSize: 13
  },
  saveBtn: {
    backgroundColor: '#2563EB',
    color: '#FFFFFF',
    border: 'none',
    padding: '6px 12px',
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer'
  },
  cancelBtn: {
    backgroundColor: '#F1F5F9',
    color: '#64748B',
    border: 'none',
    padding: '6px 10px',
    borderRadius: 6,
    fontSize: 12,
    cursor: 'pointer'
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8
  },
  emptyText: {
    fontSize: 13,
    color: '#94A3B8',
    margin: '4px 0'
  },
  subtaskItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    padding: '8px 12px',
    borderRadius: 8,
    border: '1px solid #E2E8F0'
  },
  checkBtn: {
    background: 'none',
    border: 'none',
    padding: 0,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center'
  },
  effortBadge: {
    display: 'flex',
    alignItems: 'center',
    fontSize: 11,
    color: '#64748B',
    backgroundColor: '#F1F5F9',
    padding: '2px 6px',
    borderRadius: 4
  }
};
