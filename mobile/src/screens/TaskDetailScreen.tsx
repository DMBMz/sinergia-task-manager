import React, { useState } from 'react';
import { ArrowLeft, Clock, Calendar, CheckSquare, Square, Send, Paperclip, ChevronDown, Mic } from 'lucide-react';

interface TaskDetailScreenProps {
  onBack: () => void;
}

export const TaskDetailScreen: React.FC<TaskDetailScreenProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'comments' | 'attachments'>('comments');
  const [subtasks, setSubtasks] = useState([
    { id: '1', title: 'Pesquisar seções hero de concorrentes', completed: true },
    { id: '2', title: 'Rascunhar variações de wireframe', completed: true },
    { id: '3', title: 'Selecionar combinação de tipografia', completed: false },
    { id: '4', title: 'Criar mockup de alta fidelidade no Figma', completed: false, tag: 'Design', time: '2.5h' },
    { id: '5', title: 'Entrega para desenvolvedor e exportação de assets', completed: false, tag: 'Design', time: '0.5h' }
  ]);
  const [newComment, setNewComment] = useState('');

  const completedCount = subtasks.filter(s => s.completed).length;

  const toggleSubtask = (id: string) => {
    setSubtasks(subtasks.map(s => s.id === id ? { ...s, completed: !s.completed } : s));
  };

  const handleAddSubtask = () => {
    const title = prompt('Nova sub-tarefa:');
    if (title) {
      setSubtasks([...subtasks, { id: String(Date.now()), title, completed: false }]);
    }
  };

  return (
    <div style={styles.container}>
      {/* Top Header & Breadcrumbs */}
      <div style={styles.topHeader}>
        <button onClick={onBack} style={styles.backBtn}>
          <ArrowLeft size={18} color="#1E293B" />
        </button>
        <div style={styles.breadcrumbRow}>
          <span style={styles.pillBreadcrumb}>Prioridades Diárias</span>
          <span style={{ ...styles.pillBreadcrumb, backgroundColor: '#F1F5F9', color: '#475569' }}>
            Plano de Marketing T4
          </span>
        </div>
      </div>

      {/* Task Title */}
      <h1 style={styles.taskTitle}>Redesenhar seção hero da página inicial</h1>

      {/* Meta Row: Prioridade e Prazo */}
      <div style={styles.metaRow}>
        <div style={styles.priorityBox}>
          <span style={styles.metaLabel}>Prioridade:</span>
          <button style={styles.priorityBtn}>
            <span style={{ color: '#EF4444' }}>Alta</span>
            <ChevronDown size={14} color="#64748B" />
          </button>
        </div>

        <div style={styles.dueDateBox}>
          <span style={styles.metaLabel}>Prazo:</span>
          <span style={styles.dateVal}>18 de Dez, 2024</span>
        </div>
      </div>

      {/* Estimativa de Tempo IA */}
      <div style={styles.aiEstimateCard}>
        <div style={styles.aiEstimateHeader}>
          <span style={styles.aiEstimateTitle}>Estimativa de Tempo IA:</span>
          <span style={styles.aiConfidenceBadge}>baseado em histórico</span>
        </div>
        <div style={styles.aiHoursRow}>
          <strong style={styles.aiHours}>~4,5 horas</strong>
          <div style={styles.aiDots}>
            <span style={styles.dotActive} />
            <span style={styles.dotActive} />
            <span style={styles.dotActive} />
          </div>
        </div>
      </div>

      {/* Atribuído a */}
      <div style={styles.assigneeSection}>
        <span style={styles.sectionSmallLabel}>Atribuído a</span>
        <div style={styles.assigneeChip}>
          <img
            src="https://api.dicebear.com/7.x/avataaars/svg?seed=Neco"
            alt="Assignee"
            style={styles.assigneeAvatar}
          />
          <span style={styles.assigneeName}>Fulanoso Neco</span>
        </div>
      </div>

      {/* Sub-tarefas */}
      <div style={styles.subtasksCard}>
        <div style={styles.subtasksHeader}>
          <h3 style={styles.subtasksTitle}>Sub-tarefas</h3>
          <span style={styles.subtasksCount}>
            {completedCount}/{subtasks.length} concluídas
          </span>
        </div>

        <div style={styles.subtaskList}>
          {subtasks.map(s => (
            <div key={s.id} style={styles.subtaskRow} onClick={() => toggleSubtask(s.id)}>
              <button style={styles.checkBtn}>
                {s.completed ? (
                  <CheckSquare size={16} color="#10B981" />
                ) : (
                  <Square size={16} color="#CBD5E1" />
                )}
              </button>
              <span style={{
                ...styles.subtaskText,
                textDecoration: s.completed ? 'line-through' : 'none',
                color: s.completed ? '#94A3B8' : '#1E293B'
              }}>
                {s.title}
              </span>
              {s.tag && (
                <span style={styles.subtaskBadge}>
                  {s.tag} • {s.time}
                </span>
              )}
            </div>
          ))}
        </div>

        <button onClick={handleAddSubtask} style={styles.addSubtaskBtn}>
          + Adicionar sub-tarefa
        </button>
      </div>

      {/* Tabs: Comentários / Anexos */}
      <div style={styles.tabsRow}>
        <button
          onClick={() => setActiveTab('comments')}
          style={{
            ...styles.tabBtn,
            borderBottom: activeTab === 'comments' ? '2px solid #2563EB' : 'none',
            color: activeTab === 'comments' ? '#2563EB' : '#64748B',
            fontWeight: activeTab === 'comments' ? 700 : 500
          }}
        >
          Comentários
        </button>
        <button
          onClick={() => setActiveTab('attachments')}
          style={{
            ...styles.tabBtn,
            borderBottom: activeTab === 'attachments' ? '2px solid #2563EB' : 'none',
            color: activeTab === 'attachments' ? '#2563EB' : '#64748B',
            fontWeight: activeTab === 'attachments' ? 700 : 500
          }}
        >
          Anexos (1)
        </button>
      </div>

      {/* Feed de Comentários / Anexos */}
      {activeTab === 'comments' ? (
        <div style={styles.commentFeed}>
          {/* Comentário 1 */}
          <div style={styles.commentCard}>
            <div style={styles.commentTop}>
              <div style={styles.commentAuthor}>
                <span style={styles.authorName}>Fulana F.</span>
                <span style={styles.authorTime}>Hoje, 10:20</span>
              </div>
            </div>
            <p style={styles.commentText}>
              Compartilhei o documento de análise de concorrência. Vamos buscar uma abordagem ousada e minimalista — similar ao hero da Stripe, mas com nosso tom de marca.
            </p>

            {/* Resposta Aninhada */}
            <div style={styles.nestedComment}>
              <div style={styles.commentAuthor}>
                <span style={styles.authorName}>FulanoSon</span>
                <span style={styles.authorTime}>2h atrás</span>
              </div>
              <p style={styles.commentText}>
                Concordo! Vou começar o mockup no Figma hoje à noite. Devemos incluir o gradiente animado?
              </p>
            </div>
          </div>

          {/* Comentário 2 */}
          <div style={styles.commentCard}>
            <div style={styles.commentTop}>
              <div style={styles.commentAuthor}>
                <span style={styles.authorName}>Fulanana Nana</span>
                <span style={styles.authorTime}>14:35</span>
              </div>
            </div>
            <p style={styles.commentText}>
              Acabei de enviar os assets de marca mais recentes. Confira a aba de anexos! ✨
            </p>
          </div>
        </div>
      ) : (
        <div style={styles.commentFeed}>
          <div style={styles.attachmentCard}>
            <span style={{ fontSize: 18 }}>📁</span>
            <div>
              <strong style={{ fontSize: 13, color: '#1E293B', display: 'block' }}>analise_concorrencia_hero.pdf</strong>
              <span style={{ fontSize: 11, color: '#64748B' }}>1.4 MB • MinIO Storage</span>
            </div>
          </div>
        </div>
      )}

      {/* Input de Comentário */}
      <div style={styles.inputContainer}>
        <input
          type="text"
          placeholder="Adicionar um comentário..."
          value={newComment}
          onChange={e => setNewComment(e.target.value)}
          style={styles.commentInput}
        />
        <button style={styles.voiceBtn} title="Gravação de Áudio">
          <Mic size={16} color="#64748B" />
        </button>
        <button style={styles.sendBtn} title="Enviar">
          <Send size={15} color="#FFFFFF" />
        </button>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '16px 16px 85px 16px',
    backgroundColor: '#F8FAFC',
    minHeight: '100%',
    boxSizing: 'border-box'
  },
  topHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12
  },
  backBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0
  },
  breadcrumbRow: {
    display: 'flex',
    gap: 6
  },
  pillBreadcrumb: {
    backgroundColor: '#EFF6FF',
    color: '#2563EB',
    fontSize: 10,
    fontWeight: 700,
    padding: '3px 8px',
    borderRadius: 9999
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: 800,
    color: '#0F172A',
    lineHeight: 1.3,
    marginBottom: 12
  },
  metaRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14
  },
  priorityBox: {
    display: 'flex',
    alignItems: 'center',
    gap: 4
  },
  metaLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: 600
  },
  priorityBtn: {
    background: 'none',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: 2,
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer'
  },
  dueDateBox: {
    display: 'flex',
    alignItems: 'center',
    gap: 4
  },
  dateVal: {
    fontSize: 12,
    fontWeight: 700,
    color: '#0F172A'
  },
  aiEstimateCard: {
    backgroundColor: '#EFF6FF',
    border: '1px solid #BFDBFE',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16
  },
  aiEstimateHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  aiEstimateTitle: {
    fontSize: 11,
    color: '#1E40AF',
    fontWeight: 700
  },
  aiConfidenceBadge: {
    fontSize: 9,
    color: '#2563EB',
    backgroundColor: '#DBEAFE',
    padding: '2px 6px',
    borderRadius: 4
  },
  aiHoursRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  aiHours: {
    fontSize: 16,
    fontWeight: 800,
    color: '#1E3A8A'
  },
  aiDots: {
    display: 'flex',
    gap: 3
  },
  dotActive: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    backgroundColor: '#2563EB'
  },
  assigneeSection: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16
  },
  sectionSmallLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: 600
  },
  assigneeChip: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    padding: '3px 10px',
    borderRadius: 9999
  },
  assigneeAvatar: {
    width: 18,
    height: 18,
    borderRadius: '50%'
  },
  assigneeName: {
    fontSize: 12,
    fontWeight: 600,
    color: '#1E293B'
  },
  subtasksCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    border: '1px solid #E2E8F0',
    padding: 14,
    marginBottom: 16
  },
  subtasksHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  subtasksTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: '#0F172A',
    margin: 0
  },
  subtasksCount: {
    fontSize: 11,
    color: '#64748B'
  },
  subtaskList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    marginBottom: 10
  },
  subtaskRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    cursor: 'pointer'
  },
  checkBtn: {
    background: 'none',
    border: 'none',
    padding: 0,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center'
  },
  subtaskText: {
    fontSize: 12,
    flex: 1
  },
  subtaskBadge: {
    fontSize: 9,
    fontWeight: 700,
    color: '#D97706',
    backgroundColor: '#FEF3C7',
    padding: '2px 6px',
    borderRadius: 4
  },
  addSubtaskBtn: {
    background: 'none',
    border: 'none',
    color: '#2563EB',
    fontSize: 11,
    fontWeight: 700,
    cursor: 'pointer',
    padding: 0
  },
  tabsRow: {
    display: 'flex',
    gap: 20,
    borderBottom: '1px solid #E2E8F0',
    marginBottom: 12
  },
  tabBtn: {
    background: 'none',
    border: 'none',
    padding: '6px 0',
    fontSize: 13,
    cursor: 'pointer'
  },
  commentFeed: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    marginBottom: 16
  },
  commentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    border: '1px solid #E2E8F0',
    padding: 10
  },
  commentTop: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: 4
  },
  commentAuthor: {
    display: 'flex',
    alignItems: 'center',
    gap: 6
  },
  authorName: {
    fontSize: 12,
    fontWeight: 700,
    color: '#0F172A'
  },
  authorTime: {
    fontSize: 10,
    color: '#94A3B8'
  },
  commentText: {
    fontSize: 11,
    color: '#475569',
    lineHeight: 1.4,
    margin: 0
  },
  nestedComment: {
    backgroundColor: '#F8FAFC',
    borderLeft: '2px solid #CBD5E1',
    padding: '6px 8px',
    marginTop: 8,
    borderRadius: '0 8px 8px 0'
  },
  attachmentCard: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: 12,
    padding: 12,
    display: 'flex',
    alignItems: 'center',
    gap: 10
  },
  inputContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    border: '1px solid #CBD5E1',
    borderRadius: 24,
    padding: '4px 10px'
  },
  commentInput: {
    flex: 1,
    border: 'none',
    outline: 'none',
    fontSize: 12,
    color: '#0F172A'
  },
  voiceBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 4
  },
  sendBtn: {
    backgroundColor: '#2563EB',
    border: 'none',
    borderRadius: '50%',
    width: 26,
    height: 26,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer'
  }
};
