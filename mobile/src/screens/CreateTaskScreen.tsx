import React, { useState } from 'react';
import { ArrowLeft, Bell, Plus, Clock, User, Tag as TagIcon } from 'lucide-react';

interface CreateTaskScreenProps {
  onBack: () => void;
  onSave: (task: any) => void;
}

export const CreateTaskScreen: React.FC<CreateTaskScreenProps> = ({ onBack, onSave }) => {
  const [theme, setTheme] = useState('Front-End');
  const [description, setDescription] = useState('Desenvolvimento dos componentes da tela de Dashboard e integração da API.');
  const [tags, setTags] = useState(['Front', 'UI/UX']);
  const [priority, setPriority] = useState('Alta');
  const [assignee, setAssignee] = useState('Fulanoso Neco');
  const [startTime, setStartTime] = useState('Hoje, 14:00');
  const [endTime, setEndTime] = useState('Hoje, 18:00');

  const handleSave = () => {
    onSave({
      theme,
      description,
      tags,
      priority,
      assignee,
      startTime,
      endTime
    });
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={onBack} style={styles.backBtn}>
            <ArrowLeft size={20} color="#1E293B" />
          </button>
          <div>
            <h2 style={styles.headerTitle}>Criar Tarefa</h2>
            <p style={styles.headerSub}>Quarta-feira, 15 de Jan</p>
          </div>
        </div>

        <div style={styles.headerRight}>
          <div style={styles.avatarMini}>
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Fulano" alt="Avatar" style={{ width: '100%', height: '100%' }} />
          </div>
          <button style={styles.bellBtn}>
            <Bell size={18} color="#475569" />
          </button>
        </div>
      </div>

      {/* Form Content */}
      <div style={styles.formCard}>
        {/* Campo Tema */}
        <div style={styles.formGroup}>
          <label style={styles.label}>Tema:</label>
          <input
            type="text"
            value={theme}
            onChange={e => setTheme(e.target.value)}
            style={styles.input}
            placeholder="Ex: Front-End, Back-End, Marketing"
          />
        </div>

        {/* Campo Descrição */}
        <div style={styles.formGroup}>
          <label style={styles.label}>Descrição:</label>
          <textarea
            rows={5}
            value={description}
            onChange={e => setDescription(e.target.value)}
            style={{ ...styles.input, resize: 'vertical' }}
            placeholder="Descreva as atividades da tarefa..."
          />
        </div>

        {/* Campo Tags */}
        <div style={styles.formGroup}>
          <label style={styles.label}>Tags:</label>
          <div style={styles.tagsRow}>
            {tags.map((tag, idx) => (
              <span key={idx} style={styles.tagChip}>
                {tag}
              </span>
            ))}
            <button
              type="button"
              onClick={() => {
                const newTag = prompt('Nova tag:');
                if (newTag) setTags([...tags, newTag]);
              }}
              style={styles.addTagBtn}
            >
              +
            </button>
          </div>
        </div>

        {/* Campo Prioridade */}
        <div style={styles.formGroup}>
          <div style={styles.splitRow}>
            <label style={styles.label}>Prioridade</label>
            <div style={styles.prioritySelector}>
              {(['Alta', 'Média', 'Baixa', 'Urgente'] as const).map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  style={{
                    ...styles.priorityPill,
                    backgroundColor: priority === p ? (p === 'Urgente' ? '#991B1B' : p === 'Alta' ? '#EF4444' : p === 'Média' ? '#F59E0B' : '#16A34A') : '#F1F5F9',
                    color: priority === p ? '#FFFFFF' : '#475569'
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Campo Responsável */}
        <div style={styles.formGroup}>
          <div style={styles.splitRow}>
            <label style={styles.label}>Responsável</label>
            <div style={styles.assigneeBox}>
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Neco" alt="Responsável" style={styles.assigneeAvatar} />
              <span style={styles.assigneeName}>{assignee}</span>
            </div>
          </div>
        </div>

        {/* Campo Prazo */}
        <div style={styles.formGroup}>
          <div style={styles.splitRow}>
            <label style={styles.label}>Prazo</label>
            <div style={styles.timeRangeBox}>
              <Clock size={12} color="#64748B" />
              <span>{startTime}</span>
              <span style={{ color: '#94A3B8' }}>até</span>
              <span>{endTime}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Big Blue Floating "+" Button */}
      <div style={styles.fabContainer}>
        <button onClick={handleSave} style={styles.bigPlusFab} title="Salvar Tarefa">
          <Plus size={36} color="#FFFFFF" />
        </button>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '20px 16px 40px 16px',
    backgroundColor: '#F8FAFC',
    minHeight: '100%',
    boxSizing: 'border-box',
    position: 'relative'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  backBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    padding: 0
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 800,
    color: '#0F172A',
    margin: 0
  },
  headerSub: {
    fontSize: 11,
    color: '#64748B',
    margin: '2px 0 0 0'
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 8
  },
  avatarMini: {
    width: 30,
    height: 30,
    borderRadius: '50%',
    overflow: 'hidden',
    backgroundColor: '#E2E8F0'
  },
  bellBtn: {
    background: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: 8,
    padding: 6,
    cursor: 'pointer'
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    border: '1px solid #E2E8F0',
    boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
    display: 'flex',
    flexDirection: 'column',
    gap: 18
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6
  },
  label: {
    fontSize: 13,
    fontWeight: 700,
    color: '#1E293B'
  },
  input: {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 12,
    border: '1px solid #E2E8F0',
    backgroundColor: '#F8FAFC',
    fontSize: 13,
    color: '#0F172A',
    outline: 'none',
    boxSizing: 'border-box'
  },
  tagsRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap'
  },
  tagChip: {
    backgroundColor: '#FEF3C7',
    color: '#B45309',
    fontSize: 11,
    fontWeight: 700,
    padding: '4px 12px',
    borderRadius: 9999,
    border: '1px solid #FDE68A'
  },
  addTagBtn: {
    backgroundColor: '#F1F5F9',
    border: '1px dashed #CBD5E1',
    color: '#64748B',
    width: 26,
    height: 26,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontWeight: 700
  },
  splitRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  prioritySelector: {
    display: 'flex',
    gap: 6
  },
  priorityPill: {
    padding: '4px 12px',
    borderRadius: 6,
    border: 'none',
    fontSize: 11,
    fontWeight: 700,
    cursor: 'pointer'
  },
  assigneeBox: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    padding: '4px 10px',
    borderRadius: 9999,
    border: '1px solid #E2E8F0'
  },
  assigneeAvatar: {
    width: 22,
    height: 22,
    borderRadius: '50%'
  },
  assigneeName: {
    fontSize: 12,
    fontWeight: 600,
    color: '#1E293B'
  },
  timeRangeBox: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 11,
    fontWeight: 600,
    color: '#475569',
    backgroundColor: '#F8FAFC',
    padding: '6px 10px',
    borderRadius: 8,
    border: '1px solid #E2E8F0'
  },
  fabContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginTop: 36
  },
  bigPlusFab: {
    width: 64,
    height: 64,
    borderRadius: '50%',
    backgroundColor: '#2563EB',
    border: 'none',
    boxShadow: '0 8px 20px rgba(37, 99, 235, 0.4)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }
};
