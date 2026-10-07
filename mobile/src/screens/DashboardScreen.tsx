import React from 'react';
import { Bell, Sparkles, Plus, Clock, ChevronRight, LayoutDashboard, FolderKanban } from 'lucide-react';

interface DashboardScreenProps {
  userName?: string;
  onSelectTask: (taskId: string) => void;
  onGoToCreateTask: () => void;
  onGoToPlanning: () => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  userName = 'Fulano',
  onSelectTask,
  onGoToCreateTask,
  onGoToPlanning
}) => {
  const tasks = [
    {
      id: 'task-1',
      title: 'Finalizar Relatório Orçamentário T1',
      priority: 'Alta',
      priorityColor: '#EF4444',
      priorityBg: '#FEE2E2',
      time: 'Hoje, 14:00',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Fulano'
    },
    {
      id: 'task-2',
      title: 'Auditoria do Design System',
      priority: 'Média',
      priorityColor: '#F59E0B',
      priorityBg: '#FEF3C7',
      time: 'Hoje, 16:30',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ana'
    },
    {
      id: 'task-3',
      title: 'Atualizar Documentação da API',
      priority: 'Alta',
      priorityColor: '#EF4444',
      priorityBg: '#FEE2E2',
      time: 'Amanhã, 10:00',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos'
    },
    {
      id: 'task-4',
      title: 'Notas de Reunião Diária',
      priority: 'Baixa',
      priorityColor: '#64748B',
      priorityBg: '#F1F5F9',
      time: 'Amanhã, 11:30',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mariana'
    },
    {
      id: 'task-5',
      title: 'Fluxo de Integração do Cliente',
      priority: 'Média',
      priorityColor: '#F59E0B',
      priorityBg: '#FEF3C7',
      time: '17 de Jan, 09:00',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Pedro'
    }
  ];

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <h1 style={styles.greeting}>Olá, {userName}</h1>
            <span style={styles.waveHand}>👋</span>
          </div>
          <p style={styles.dateText}>Quarta-feira, 15 de Jan</p>
        </div>

        <div style={styles.headerRight}>
          <div style={styles.avatarMini}>
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Fulano" alt="Avatar" style={styles.avatarImg} />
          </div>
          <button style={styles.bellBtn}>
            <Bell size={18} color="#475569" />
          </button>
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div style={styles.metricsRow}>
        <div style={{ ...styles.metricCard, borderTop: '3px solid #10B981' }}>
          <span style={{ ...styles.metricValue, color: '#10B981' }}>12</span>
          <span style={styles.metricLabel}>Concluídas</span>
        </div>
        <div style={{ ...styles.metricCard, borderTop: '3px solid #2563EB' }}>
          <span style={{ ...styles.metricValue, color: '#2563EB' }}>8</span>
          <span style={styles.metricLabel}>Pendentes</span>
        </div>
        <div style={{ ...styles.metricCard, borderTop: '3px solid #EF4444' }}>
          <span style={{ ...styles.metricValue, color: '#EF4444' }}>2</span>
          <span style={styles.metricLabel}>Atrasadas</span>
        </div>
      </div>

      {/* Banner IA Carga de Trabalho */}
      <div style={styles.aiBanner}>
        <div style={styles.aiIconBox}>
          <Sparkles size={18} color="#2563EB" />
        </div>
        <div style={{ flex: 1 }}>
          <h4 style={styles.aiTitle}>Carga de Trabalho IA: <span style={{ color: '#10B981' }}>Equilibrada</span></h4>
          <p style={styles.aiDesc}>A capacidade da sua equipe está saudável hoje. 2 tarefas podem ser redistribuídas.</p>
        </div>
      </div>

      {/* Próximas Tarefas */}
      <div style={styles.sectionHeader}>
        <h3 style={styles.sectionTitle}>Próximas Tarefas</h3>
        <button style={styles.seeAllBtn}>Ver todas</button>
      </div>

      <div style={styles.taskList}>
        {tasks.map(t => (
          <div key={t.id} style={styles.taskItem} onClick={() => onSelectTask(t.id)}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <h4 style={styles.taskTitle}>{t.title}</h4>
                <span style={{ ...styles.priorityBadge, backgroundColor: t.priorityBg, color: t.priorityColor }}>
                  {t.priority}
                </span>
              </div>
              <div style={styles.timeRow}>
                <Clock size={12} color="#64748B" />
                <span style={styles.timeText}>{t.time}</span>
              </div>
            </div>

            <div style={styles.taskRight}>
              <img src={t.avatar} alt="Assignee" style={styles.assigneeImg} />
            </div>
          </div>
        ))}
      </div>

      {/* Botão Adicionar Tarefa */}
      <button style={styles.addTaskBtn} onClick={onGoToCreateTask}>
        <Plus size={16} />
        <span>Adicionar tarefa</span>
      </button>

      {/* Card Insights do Projeto */}
      <div style={styles.insightsCard} onClick={onGoToPlanning}>
        <div style={styles.insightIconBox}>
          <FolderKanban size={18} color="#2563EB" />
        </div>
        <div style={{ flex: 1 }}>
          <h4 style={styles.insightTitle}>Insights do Projeto</h4>
          <p style={styles.insightDesc}>2 projetos ativos • 78% no prazo</p>
        </div>
        <ChevronRight size={18} color="#94A3B8" />
      </div>

      {/* Bottom Navigation Bar */}
      <div style={styles.bottomNav}>
        <button style={{ ...styles.navItem, color: '#2563EB' }}>
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </button>
        <button style={styles.navItem} onClick={onGoToCreateTask}>
          <Plus size={22} style={styles.navPlusIcon} />
          <span>Nova Tarefa</span>
        </button>
        <button style={styles.navItem} onClick={onGoToPlanning}>
          <FolderKanban size={20} />
          <span>Projetos</span>
        </button>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '20px 16px 80px 16px',
    backgroundColor: '#F8FAFC',
    minHeight: '100%',
    boxSizing: 'border-box'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  greeting: {
    fontSize: 18,
    fontWeight: 800,
    color: '#0F172A',
    margin: 0
  },
  waveHand: {
    fontSize: 16
  },
  dateText: {
    fontSize: 12,
    color: '#64748B',
    margin: '2px 0 0 0'
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 8
  },
  avatarMini: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    overflow: 'hidden',
    backgroundColor: '#E2E8F0'
  },
  avatarImg: {
    width: '100%',
    height: '100%'
  },
  bellBtn: {
    background: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: 8,
    padding: 6,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  metricsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 10,
    marginBottom: 16
  },
  metricCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: '14px 8px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
    border: '1px solid #E2E8F0'
  },
  metricValue: {
    fontSize: 22,
    fontWeight: 800,
    lineHeight: 1.1
  },
  metricLabel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
    fontWeight: 600
  },
  aiBanner: {
    backgroundColor: '#EFF6FF',
    border: '1px solid #BFDBFE',
    borderRadius: 14,
    padding: 12,
    display: 'flex',
    gap: 12,
    alignItems: 'flex-start',
    marginBottom: 20
  },
  aiIconBox: {
    backgroundColor: '#DBEAFE',
    padding: 6,
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  aiTitle: {
    margin: 0,
    fontSize: 13,
    fontWeight: 700,
    color: '#1E3A8A'
  },
  aiDesc: {
    margin: '3px 0 0 0',
    fontSize: 11,
    color: '#3B82F6',
    lineHeight: 1.3
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 800,
    color: '#0F172A',
    margin: 0
  },
  seeAllBtn: {
    background: 'none',
    border: 'none',
    fontSize: 12,
    color: '#2563EB',
    fontWeight: 600,
    cursor: 'pointer'
  },
  taskList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    marginBottom: 14
  },
  taskItem: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: 12,
    padding: '12px 14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: 'pointer',
    boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
  },
  taskTitle: {
    margin: 0,
    fontSize: 13,
    fontWeight: 700,
    color: '#1E293B'
  },
  priorityBadge: {
    fontSize: 10,
    fontWeight: 700,
    padding: '2px 6px',
    borderRadius: 4
  },
  timeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 4
  },
  timeText: {
    fontSize: 11,
    color: '#64748B'
  },
  taskRight: {
    display: 'flex',
    alignItems: 'center'
  },
  assigneeImg: {
    width: 24,
    height: 24,
    borderRadius: '50%',
    backgroundColor: '#F1F5F9'
  },
  addTaskBtn: {
    width: '100%',
    padding: '10px',
    backgroundColor: '#FFFFFF',
    border: '1px dashed #CBD5E1',
    borderRadius: 12,
    color: '#2563EB',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 16
  },
  insightsCard: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: 14,
    padding: 12,
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    cursor: 'pointer',
    boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
  },
  insightIconBox: {
    backgroundColor: '#EFF6FF',
    padding: 8,
    borderRadius: 10
  },
  insightTitle: {
    margin: 0,
    fontSize: 13,
    fontWeight: 700,
    color: '#0F172A'
  },
  insightDesc: {
    margin: '2px 0 0 0',
    fontSize: 11,
    color: '#64748B'
  },
  bottomNav: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: '#FFFFFF',
    borderTop: '1px solid #E2E8F0',
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    zIndex: 1000
  },
  navItem: {
    background: 'none',
    border: 'none',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
    fontSize: 10,
    fontWeight: 600,
    color: '#64748B',
    cursor: 'pointer'
  },
  navPlusIcon: {
    backgroundColor: '#2563EB',
    color: '#FFFFFF',
    borderRadius: '50%',
    padding: 2
  }
};
