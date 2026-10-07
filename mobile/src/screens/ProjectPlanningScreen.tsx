import React from 'react';
import { Bell, AlertTriangle, AlertCircle, CheckCircle2, Clock, UserPlus, LayoutDashboard, Plus, FolderKanban } from 'lucide-react';

interface ProjectPlanningScreenProps {
  onGoToDashboard: () => void;
  onGoToCreateTask: () => void;
  onOpenInvite: () => void;
}

export const ProjectPlanningScreen: React.FC<ProjectPlanningScreenProps> = ({
  onGoToDashboard,
  onGoToCreateTask,
  onOpenInvite
}) => {
  return (
    <div style={styles.container}>
      {/* Top Header */}
      <div style={styles.header}>
        <div style={styles.logoRow}>
          <span style={styles.logoText}>Sinergia</span>
          <div style={styles.logoIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="#FFFFFF"/>
            </svg>
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

      {/* Title & View Toggle */}
      <div style={styles.titleRow}>
        <h2 style={styles.screenTitle}>Planejamento de Projeto</h2>
        <button style={styles.toggleBtn}>Visão Diária</button>
      </div>

      {/* Mini Stats (Saúde, Atrasadas, Conflitos) */}
      <div style={styles.statsRow}>
        <div style={styles.statBox}>
          <span style={styles.statLabel}>
            <span style={{ color: '#10B981', marginRight: 4 }}>●</span> Saúde
          </span>
          <strong style={{ ...styles.statVal, color: '#10B981' }}>82% <span style={{ fontSize: 10, fontWeight: 500 }}>bom</span></strong>
        </div>
        <div style={styles.statBox}>
          <span style={styles.statLabel}>
            <span style={{ color: '#F59E0B', marginRight: 4 }}>●</span> Atrasadas
          </span>
          <strong style={{ ...styles.statVal, color: '#F59E0B' }}>3 <span style={{ fontSize: 10, fontWeight: 500 }}>Tarefas</span></strong>
        </div>
        <div style={styles.statBox}>
          <span style={styles.statLabel}>
            <span style={{ color: '#EF4444', marginRight: 4 }}>●</span> Conflitos
          </span>
          <strong style={{ ...styles.statVal, color: '#EF4444' }}>2 <span style={{ fontSize: 10, fontWeight: 500 }}>ativos</span></strong>
        </div>
      </div>

      {/* Linha do Tempo de Dependências */}
      <div style={styles.sectionHeader}>
        <h3 style={styles.sectionTitle}>Linha do Tempo de Dependências</h3>
        <span style={styles.sprintTag}>Sprint 14</span>
      </div>

      <div style={styles.timelineList}>
        {/* Item 1 */}
        <div style={styles.timelineCard}>
          <div style={styles.timelineTop}>
            <h4 style={styles.taskName}>Integração de API</h4>
            <span style={{ ...styles.statusTag, backgroundColor: '#DCFCE7', color: '#15803D' }}>Concluído</span>
          </div>
          <p style={styles.taskMeta}>5 de Jun - 8 de Jun • Fulano Fu</p>
        </div>

        {/* Item 2 */}
        <div style={styles.timelineCard}>
          <div style={styles.timelineTop}>
            <h4 style={styles.taskName}>Módulo de Autenticação</h4>
            <span style={{ ...styles.statusTag, backgroundColor: '#DBEAFE', color: '#1D4ED8' }}>Em Andamento</span>
          </div>
          <p style={styles.taskMeta}>7 de Jun - 10 de Jun • Fulanoso Neco</p>
          <span style={styles.depText}>↳ Depende de: Integração de API</span>
        </div>

        {/* Item 3 (Conflito) */}
        <div style={{ ...styles.timelineCard, borderColor: '#FCA5A5', backgroundColor: '#FEF2F2' }}>
          <div style={styles.timelineTop}>
            <h4 style={{ ...styles.taskName, color: '#991B1B' }}>Gateway de Pagamento</h4>
            <span style={{ ...styles.statusTag, backgroundColor: '#FEE2E2', color: '#DC2626' }}>Conflito</span>
          </div>
          <p style={styles.taskMeta}>10 de Jun - 15 de Jun • Fulaninha Ninha</p>
          <span style={{ ...styles.depText, color: '#DC2626' }}>⚠️ Bloqueado por: Módulo de Autenticação (sobreposição de 1d)</span>
        </div>

        {/* Item 4 */}
        <div style={styles.timelineCard}>
          <div style={styles.timelineTop}>
            <h4 style={styles.taskName}>Interface do Dashboard</h4>
            <span style={{ ...styles.statusTag, backgroundColor: '#F1F5F9', color: '#475569' }}>Na Fila</span>
          </div>
          <p style={styles.taskMeta}>14 de Jun - 20 de Jun • Fulano Leno</p>
          <span style={styles.depText}>↳ Depende de: Módulo de Autenticação</span>
        </div>

        {/* Item 5 (Em Risco) */}
        <div style={{ ...styles.timelineCard, borderColor: '#FDE68A', backgroundColor: '#FFFBEB' }}>
          <div style={styles.timelineTop}>
            <h4 style={{ ...styles.taskName, color: '#92400E' }}>Testes E2E</h4>
            <span style={{ ...styles.statusTag, backgroundColor: '#FEF3C7', color: '#B45309' }}>Em Risco</span>
          </div>
          <p style={styles.taskMeta}>19 de Jun - 24 de Jun • Fulano Fu</p>
          <span style={{ ...styles.depText, color: '#B45309' }}>⚠️ Dep. atrasada: Interface do Dashboard (est. +2d)</span>
        </div>

        {/* Milestone */}
        <div style={styles.milestone}>
          <span style={styles.milestoneDot}>📍</span>
          <span style={styles.milestoneText}>Marco: Lançamento Beta — 05 de Jun</span>
        </div>
      </div>

      {/* Capacidade de Carga de Trabalho */}
      <div style={styles.sectionHeader}>
        <h3 style={styles.sectionTitle}>Capacidade de Carga de Trabalho</h3>
        <span style={styles.sprintTag}>Esta Sprint</span>
      </div>

      <div style={styles.capacityCard}>
        <div style={styles.memberRow}>
          <div style={styles.memberInfo}>
            <div style={{ ...styles.memberAvatar, backgroundColor: '#3B82F6' }}>FF</div>
            <span style={styles.memberName}>Fulana Fu</span>
          </div>
          <div style={{ flex: 1, margin: '0 12px' }}>
            <div style={styles.barBg}>
              <div style={{ ...styles.barFill, width: '100%', backgroundColor: '#EF4444' }} />
            </div>
          </div>
          <span style={{ ...styles.percentText, color: '#EF4444' }}>100%</span>
        </div>

        <div style={styles.memberRow}>
          <div style={styles.memberInfo}>
            <div style={{ ...styles.memberAvatar, backgroundColor: '#10B981' }}>FN</div>
            <span style={styles.memberName}>Fulanoso Neco</span>
          </div>
          <div style={{ flex: 1, margin: '0 12px' }}>
            <div style={styles.barBg}>
              <div style={{ ...styles.barFill, width: '85%', backgroundColor: '#F59E0B' }} />
            </div>
          </div>
          <span style={{ ...styles.percentText, color: '#F59E0B' }}>85%</span>
        </div>

        <div style={styles.memberRow}>
          <div style={styles.memberInfo}>
            <div style={{ ...styles.memberAvatar, backgroundColor: '#8B5CF6' }}>LC</div>
            <span style={styles.memberName}>Fulaninha Ninha</span>
          </div>
          <div style={{ flex: 1, margin: '0 12px' }}>
            <div style={styles.barBg}>
              <div style={{ ...styles.barFill, width: '60%', backgroundColor: '#3B82F6' }} />
            </div>
          </div>
          <span style={{ ...styles.percentText, color: '#3B82F6' }}>60%</span>
        </div>

        <div style={styles.memberRow}>
          <div style={styles.memberInfo}>
            <div style={{ ...styles.memberAvatar, backgroundColor: '#64748B' }}>FL</div>
            <span style={styles.memberName}>Fulano Leno</span>
          </div>
          <div style={{ flex: 1, margin: '0 12px' }}>
            <div style={styles.barBg}>
              <div style={{ ...styles.barFill, width: '40%', backgroundColor: '#3B82F6' }} />
            </div>
          </div>
          <span style={{ ...styles.percentText, color: '#3B82F6' }}>40%</span>
        </div>
      </div>

      {/* Resumo de Conflitos */}
      <div style={styles.sectionHeader}>
        <h3 style={styles.sectionTitle}>Resumo de Conflitos</h3>
      </div>

      <div style={styles.conflictList}>
        <div style={styles.conflictCard}>
          <h5 style={styles.conflictTitle}>Gateway de Pagamento ➔ Módulo de Autenticação</h5>
          <p style={styles.conflictDesc}>
            Sobreposição de cronograma de 1 dias. Redistribuir ou estender prazo de Autenticação.
          </p>
        </div>

        <div style={styles.conflictCard}>
          <h5 style={styles.conflictTitle}>Testes E2E atrasados pela Interface do Dashboard</h5>
          <p style={styles.conflictDesc}>
            Atraso em cascata estimado de 2 dias. Marco Beta em risco.
          </p>
        </div>
      </div>

      {/* Floating Action Button "Convidar" */}
      <button style={styles.inviteFab} onClick={onOpenInvite} title="Convidar Membros">
        <UserPlus size={18} color="#FFFFFF" />
        <span>Convidar</span>
      </button>

      {/* Bottom Navigation */}
      <div style={styles.bottomNav}>
        <button style={styles.navItem} onClick={onGoToDashboard}>
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </button>
        <button style={styles.navItem} onClick={onGoToCreateTask}>
          <Plus size={22} style={styles.navPlusIcon} />
          <span>Nova Tarefa</span>
        </button>
        <button style={{ ...styles.navItem, color: '#2563EB' }}>
          <FolderKanban size={20} />
          <span>Projetos</span>
        </button>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '20px 16px 85px 16px',
    backgroundColor: '#F8FAFC',
    minHeight: '100%',
    boxSizing: 'border-box',
    position: 'relative'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  logoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6
  },
  logoText: {
    fontSize: 20,
    fontWeight: 800,
    color: '#0F172A'
  },
  logoIcon: {
    width: 26,
    height: 26,
    borderRadius: '50%',
    backgroundColor: '#2563EB',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
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
  titleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14
  },
  screenTitle: {
    fontSize: 16,
    fontWeight: 800,
    color: '#0F172A',
    margin: 0
  },
  toggleBtn: {
    backgroundColor: '#EFF6FF',
    color: '#2563EB',
    border: '1px solid #BFDBFE',
    borderRadius: 6,
    padding: '4px 10px',
    fontSize: 11,
    fontWeight: 700,
    cursor: 'pointer'
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 8,
    marginBottom: 20
  },
  statBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: '10px 8px',
    border: '1px solid #E2E8F0',
    boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
  },
  statLabel: {
    display: 'flex',
    alignItems: 'center',
    fontSize: 10,
    color: '#64748B',
    fontWeight: 600,
    marginBottom: 4
  },
  statVal: {
    fontSize: 14,
    fontWeight: 800
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 18
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 800,
    color: '#0F172A',
    margin: 0
  },
  sprintTag: {
    fontSize: 10,
    fontWeight: 700,
    color: '#64748B'
  },
  timelineList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8
  },
  timelineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    border: '1px solid #E2E8F0',
    boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
  },
  timelineTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  taskName: {
    fontSize: 13,
    fontWeight: 700,
    color: '#1E293B',
    margin: 0
  },
  statusTag: {
    fontSize: 10,
    fontWeight: 700,
    padding: '2px 8px',
    borderRadius: 9999
  },
  taskMeta: {
    fontSize: 11,
    color: '#64748B',
    margin: '2px 0 0 0'
  },
  depText: {
    display: 'block',
    fontSize: 10,
    color: '#3B82F6',
    fontWeight: 600,
    marginTop: 4
  },
  milestone: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 12px',
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    border: '1px dashed #93C5FD',
    marginTop: 4
  },
  milestoneDot: {
    fontSize: 12
  },
  milestoneText: {
    fontSize: 11,
    fontWeight: 700,
    color: '#1E40AF'
  },
  capacityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    border: '1px solid #E2E8F0',
    display: 'flex',
    flexDirection: 'column',
    gap: 12
  },
  memberRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  memberInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    width: 110
  },
  memberAvatar: {
    width: 22,
    height: 22,
    borderRadius: '50%',
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: 800,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  memberName: {
    fontSize: 11,
    fontWeight: 600,
    color: '#1E293B',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  barBg: {
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 9999,
    overflow: 'hidden'
  },
  barFill: {
    height: '100%',
    borderRadius: 9999
  },
  percentText: {
    fontSize: 11,
    fontWeight: 700,
    width: 32,
    textAlign: 'right'
  },
  conflictList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8
  },
  conflictCard: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #FEE2E2',
    borderLeft: '4px solid #EF4444',
    borderRadius: '0 12px 12px 0',
    padding: 10
  },
  conflictTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: '#991B1B',
    margin: '0 0 3px 0'
  },
  conflictDesc: {
    fontSize: 10,
    color: '#7F1D1D',
    lineHeight: 1.3,
    margin: 0
  },
  inviteFab: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    backgroundColor: '#2563EB',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: 24,
    padding: '10px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    boxShadow: '0 6px 16px rgba(37, 99, 235, 0.35)',
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
    zIndex: 40
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
