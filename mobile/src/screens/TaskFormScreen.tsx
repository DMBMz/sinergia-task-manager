import React, { useState } from 'react';
import { ArrowLeft, Save, Clock, Calendar, AlertCircle } from 'lucide-react';
import { LocalTask, LocalTag } from '../database/schema';
import { ConflictModal } from '../components/ConflictModal';

interface TaskFormScreenProps {
  initialTask?: LocalTask;
  tags: LocalTag[];
  onSave: (taskData: Partial<LocalTask>, expectedVersion?: number) => Promise<{ success: boolean; conflict?: boolean; serverTask?: LocalTask }>;
  onBack: () => void;
}

export const TaskFormScreen: React.FC<TaskFormScreenProps> = ({
  initialTask,
  tags,
  onSave,
  onBack
}) => {
  const [title, setTitle] = useState(initialTask?.title || '');
  const [description, setDescription] = useState(initialTask?.description || '');
  const [priority, setPriority] = useState<LocalTask['priority']>(initialTask?.priority || 'MEDIUM');
  const [status, setStatus] = useState<LocalTask['status']>(initialTask?.status || 'PENDING');
  const [effortHours, setEffortHours] = useState(initialTask?.effortHours || 4);
  const [dueDate, setDueDate] = useState(initialTask?.dueDate ? initialTask.dueDate.substring(0, 10) : '');

  // Conflito de Lock Otimista (US06)
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [conflictedServerTask, setConflictedServerTask] = useState<LocalTask | null>(null);

  const handleSubmit = async (e: React.FormEvent, forceVersion?: number) => {
    e.preventDefault();
    if (!title.trim()) return;

    const payload: Partial<LocalTask> = {
      title,
      description,
      priority,
      status,
      effortHours: Number(effortHours),
      dueDate: dueDate ? new Date(dueDate).toISOString() : null
    };

    const targetVersion = forceVersion !== undefined ? forceVersion : initialTask?.version;
    const res = await onSave(payload, targetVersion);

    if (res.conflict && res.serverTask) {
      setConflictedServerTask(res.serverTask);
      setShowConflictModal(true);
    }
  };

  const handleSimulateConflict = () => {
    // Permite testar interativamente a detecção de Lock Otimista
    if (initialTask) {
      const simulatedServerVersion = initialTask.version + 1;
      const simulatedServerTask: LocalTask = {
        ...initialTask,
        title: initialTask.title + ' (Alterado no Servidor por Outro Membro)',
        version: simulatedServerVersion,
        status: 'IN_PROGRESS'
      };
      setConflictedServerTask(simulatedServerTask);
      setShowConflictModal(true);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={onBack} style={styles.backBtn}>
          <ArrowLeft size={20} />
        </button>
        <h2 style={styles.headerTitle}>{initialTask ? 'Editar Tarefa' : 'Nova Tarefa'}</h2>
        {initialTask && (
          <button
            type="button"
            onClick={handleSimulateConflict}
            style={styles.testConflictBtn}
            title="Simular concorrência e conflito de Lock Otimista"
          >
            Simular Lock Otimista
          </button>
        )}
      </div>

      <form onSubmit={e => handleSubmit(e)} style={styles.form}>
        <div style={styles.formGroup}>
          <label style={styles.label}>Título da Tarefa *</label>
          <input
            type="text"
            required
            placeholder="Ex: Desenvolver tela de visualização de tarefas"
            value={title}
            onChange={e => setTitle(e.target.value)}
            style={styles.input}
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Descrição Detalhada</label>
          <textarea
            rows={4}
            placeholder="Descreva os requisitos, critérios de aceite e escopo..."
            value={description}
            onChange={e => setDescription(e.target.value)}
            style={{ ...styles.input, resize: 'vertical' }}
          />
        </div>

        <div style={styles.row}>
          <div style={styles.formGroupFlex}>
            <label style={styles.label}>Prioridade</label>
            <select
              value={priority}
              onChange={e => setPriority(e.target.value as any)}
              style={styles.select}
            >
              <option value="LOW">Baixa</option>
              <option value="MEDIUM">Média</option>
              <option value="HIGH">Alta</option>
              <option value="URGENT">Urgente</option>
            </select>
          </div>

          <div style={styles.formGroupFlex}>
            <label style={styles.label}>Status</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as any)}
              style={styles.select}
            >
              <option value="PENDING">Pendente</option>
              <option value="IN_PROGRESS">Em Andamento</option>
              <option value="IN_REVIEW">Em Revisão</option>
              <option value="BLOCKED">Bloqueada</option>
              <option value="COMPLETED">Concluída</option>
            </select>
          </div>
        </div>

        <div style={styles.row}>
          <div style={styles.formGroupFlex}>
            <label style={styles.label}>
              <Clock size={14} style={{ marginRight: 4 }} />
              Esforço Estimado (horas)
            </label>
            <input
              type="number"
              min="0.5"
              step="0.5"
              value={effortHours}
              onChange={e => setEffortHours(parseFloat(e.target.value) || 0)}
              style={styles.input}
            />
          </div>

          <div style={styles.formGroupFlex}>
            <label style={styles.label}>
              <Calendar size={14} style={{ marginRight: 4 }} />
              Data de Vencimento
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              style={styles.input}
            />
          </div>
        </div>

        <div style={styles.footer}>
          <button type="button" onClick={onBack} style={styles.cancelBtn}>
            Cancelar
          </button>
          <button type="submit" style={styles.saveBtn}>
            <Save size={16} style={{ marginRight: 6 }} />
            Salvar Tarefa
          </button>
        </div>
      </form>

      {/* Modal de Conflito de Lock Otimista (US06) */}
      {conflictedServerTask && (
        <ConflictModal
          isOpen={showConflictModal}
          localTask={{ title, description, priority, status }}
          serverTask={conflictedServerTask}
          onAcceptServer={() => {
            setTitle(conflictedServerTask.title);
            setDescription(conflictedServerTask.description || '');
            setPriority(conflictedServerTask.priority);
            setStatus(conflictedServerTask.status);
            setShowConflictModal(false);
          }}
          onOverwriteWithNewVersion={async () => {
            setShowConflictModal(false);
            await handleSubmit({ preventDefault: () => {} } as any, conflictedServerTask.version);
          }}
          onClose={() => setShowConflictModal(false)}
        />
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    border: '1px solid #E2E8F0',
    overflow: 'hidden',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
  },
  header: {
    padding: '16px 20px',
    backgroundColor: '#F8FAFC',
    borderBottom: '1px solid #E2E8F0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  backBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#475569',
    display: 'flex',
    alignItems: 'center'
  },
  headerTitle: {
    margin: 0,
    fontSize: 16,
    fontWeight: 700,
    color: '#0F172A'
  },
  testConflictBtn: {
    backgroundColor: '#FEF2F2',
    color: '#DC2626',
    border: '1px solid #FECACA',
    borderRadius: 6,
    padding: '4px 10px',
    fontSize: 11,
    fontWeight: 600,
    cursor: 'pointer'
  },
  form: {
    padding: 24,
    display: 'flex',
    flexDirection: 'column',
    gap: 16
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6
  },
  row: {
    display: 'flex',
    gap: 16
  },
  formGroupFlex: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 6
  },
  label: {
    display: 'flex',
    alignItems: 'center',
    fontSize: 13,
    fontWeight: 600,
    color: '#334155'
  },
  input: {
    padding: '10px 14px',
    borderRadius: 8,
    border: '1px solid #CBD5E1',
    fontSize: 14,
    outline: 'none',
    color: '#0F172A'
  },
  select: {
    padding: '10px 14px',
    borderRadius: 8,
    border: '1px solid #CBD5E1',
    fontSize: 14,
    outline: 'none',
    color: '#0F172A',
    backgroundColor: '#FFFFFF'
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 12,
    paddingTop: 16,
    borderTop: '1px solid #F1F5F9'
  },
  cancelBtn: {
    padding: '10px 18px',
    backgroundColor: '#F1F5F9',
    color: '#475569',
    border: 'none',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer'
  },
  saveBtn: {
    padding: '10px 20px',
    backgroundColor: '#2563EB',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center'
  }
};
