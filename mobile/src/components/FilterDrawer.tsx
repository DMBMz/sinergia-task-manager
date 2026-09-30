import React from 'react';
import { X, Check, Filter, User, Tag as TagIcon, Calendar, AlertCircle, RotateCcw } from 'lucide-react';
import { LocalTag } from '../database/schema';

export interface FilterState {
  scope: 'all' | 'root_only' | 'subtasks_only';
  assigneeId: string | null;
  tagNames: string[];
  statuses: string[];
  priorities: string[];
  overdueOnly: boolean;
  thisWeekOnly: boolean;
}

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onResetFilters: () => void;
  tags: LocalTag[];
  members: Array<{ id: string; name: string; avatarUrl?: string }>;
  activeCount: number;
}

export const FilterDrawer: React.FC<FilterDrawerProps> = ({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
  onResetFilters,
  tags,
  members,
  activeCount
}) => {
  if (!isOpen) return null;

  const toggleTag = (tagName: string) => {
    const next = filters.tagNames.includes(tagName)
      ? filters.tagNames.filter(t => t !== tagName)
      : [...filters.tagNames, tagName];
    onFiltersChange({ ...filters, tagNames: next });
  };

  const toggleStatus = (status: string) => {
    const next = filters.statuses.includes(status)
      ? filters.statuses.filter(s => s !== status)
      : [...filters.statuses, status];
    onFiltersChange({ ...filters, statuses: next });
  };

  const togglePriority = (priority: string) => {
    const next = filters.priorities.includes(priority)
      ? filters.priorities.filter(p => p !== priority)
      : [...filters.priorities, priority];
    onFiltersChange({ ...filters, priorities: next });
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.drawer} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={styles.iconBadge}>
              <Filter size={18} color="#2563EB" />
            </div>
            <div>
              <h2 style={styles.title}>Filtros Avançados</h2>
              <p style={styles.subtitle}>Combine critérios para refinar suas tarefas</p>
            </div>
          </div>
          <button onClick={onClose} style={styles.closeBtn} title="Fechar">
            <X size={20} color="#64748B" />
          </button>
        </div>

        {/* Content Body */}
        <div style={styles.body}>
          {/* 1. Escopo das Tarefas */}
          <div style={styles.section}>
            <label style={styles.sectionTitle}>Escopo da Tarefa</label>
            <div style={styles.segmentedControl}>
              <button
                type="button"
                onClick={() => onFiltersChange({ ...filters, scope: 'root_only' })}
                style={{
                  ...styles.segmentBtn,
                  ...(filters.scope === 'root_only' ? styles.segmentBtnActive : {})
                }}
              >
                Apenas Principais
              </button>
              <button
                type="button"
                onClick={() => onFiltersChange({ ...filters, scope: 'all' })}
                style={{
                  ...styles.segmentBtn,
                  ...(filters.scope === 'all' ? styles.segmentBtnActive : {})
                }}
              >
                Todas (Pai + Filhas)
              </button>
              <button
                type="button"
                onClick={() => onFiltersChange({ ...filters, scope: 'subtasks_only' })}
                style={{
                  ...styles.segmentBtn,
                  ...(filters.scope === 'subtasks_only' ? styles.segmentBtnActive : {})
                }}
              >
                Apenas Subtarefas
              </button>
            </div>
          </div>

          {/* 2. Responsável */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <label style={styles.sectionTitle}>Responsável</label>
              {filters.assigneeId && (
                <button
                  type="button"
                  onClick={() => onFiltersChange({ ...filters, assigneeId: null })}
                  style={styles.clearChipText}
                >
                  Limpar
                </button>
              )}
            </div>
            <div style={styles.membersGrid}>
              <button
                type="button"
                onClick={() => onFiltersChange({ ...filters, assigneeId: null })}
                style={{
                  ...styles.memberChip,
                  borderColor: filters.assigneeId === null ? '#2563EB' : '#E2E8F0',
                  backgroundColor: filters.assigneeId === null ? '#EFF6FF' : '#FFFFFF'
                }}
              >
                <div style={styles.avatarPlaceholder}>👥</div>
                <span style={{ fontWeight: filters.assigneeId === null ? 600 : 400 }}>Qualquer Membro</span>
              </button>

              {members.length === 0 && (
                <span style={{ fontSize: 12, color: '#94A3B8', padding: '6px 2px' }}>
                  Nenhum membro com tarefas no time atual.
                </span>
              )}
              {members.map(member => {
                const isSelected = filters.assigneeId === member.id;
                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => onFiltersChange({ ...filters, assigneeId: isSelected ? null : member.id })}
                    style={{
                      ...styles.memberChip,
                      borderColor: isSelected ? '#2563EB' : '#E2E8F0',
                      backgroundColor: isSelected ? '#EFF6FF' : '#FFFFFF'
                    }}
                  >
                    <img
                      src={member.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.name}`}
                      alt={member.name}
                      style={styles.avatarImg}
                    />
                    <span style={{ fontWeight: isSelected ? 600 : 400 }}>{member.name}</span>
                    {isSelected && <Check size={14} color="#2563EB" style={{ marginLeft: 'auto' }} />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Múltiplas Tags */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <label style={styles.sectionTitle}>Tags do Projeto ({filters.tagNames.length} selecionadas)</label>
              {filters.tagNames.length > 0 && (
                <button
                  type="button"
                  onClick={() => onFiltersChange({ ...filters, tagNames: [] })}
                  style={styles.clearChipText}
                >
                  Desmarcar todas
                </button>
              )}
            </div>
            <div style={styles.chipsWrap}>
              {tags.length === 0 && (
                <span style={{ fontSize: 12, color: '#94A3B8', padding: '6px 2px' }}>
                  Nenhuma tag adicionada em tarefas deste time.
                </span>
              )}
              {tags.map(tag => {
                const isSelected = filters.tagNames.includes(tag.name);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.name)}
                    style={{
                      ...styles.tagChip,
                      borderColor: isSelected ? (tag.color || '#2563EB') : '#E2E8F0',
                      backgroundColor: isSelected ? (tag.color ? `${tag.color}20` : '#EFF6FF') : '#FFFFFF',
                      color: isSelected ? (tag.color || '#1E40AF') : '#475569'
                    }}
                  >
                    <span style={{ ...styles.tagDot, backgroundColor: tag.color || '#3B82F6' }} />
                    <span>{tag.name}</span>
                    {isSelected && <Check size={13} style={{ marginLeft: 4 }} />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Status da Tarefa */}
          <div style={styles.section}>
            <label style={styles.sectionTitle}>Status</label>
            <div style={styles.chipsWrap}>
              {[
                { id: 'PENDING', label: 'Pendente', color: '#64748B' },
                { id: 'IN_PROGRESS', label: 'Em Andamento', color: '#2563EB' },
                { id: 'IN_REVIEW', label: 'Em Revisão', color: '#D97706' },
                { id: 'BLOCKED', label: 'Bloqueada', color: '#DC2626' },
                { id: 'COMPLETED', label: 'Concluída', color: '#059669' }
              ].map(st => {
                const isSelected = filters.statuses.includes(st.id);
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => toggleStatus(st.id)}
                    style={{
                      ...styles.filterChip,
                      borderColor: isSelected ? st.color : '#E2E8F0',
                      backgroundColor: isSelected ? `${st.color}15` : '#FFFFFF',
                      color: isSelected ? st.color : '#475569',
                      fontWeight: isSelected ? 600 : 400
                    }}
                  >
                    <span style={{ ...styles.tagDot, backgroundColor: st.color }} />
                    <span>{st.label}</span>
                    {isSelected && <Check size={13} style={{ marginLeft: 4 }} />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. Prioridade */}
          <div style={styles.section}>
            <label style={styles.sectionTitle}>Prioridade</label>
            <div style={styles.chipsWrap}>
              {[
                { id: 'LOW', label: 'Baixa', color: '#10B981' },
                { id: 'MEDIUM', label: 'Média', color: '#3B82F6' },
                { id: 'HIGH', label: 'Alta', color: '#F59E0B' },
                { id: 'URGENT', label: 'Urgente', color: '#EF4444' }
              ].map(pr => {
                const isSelected = filters.priorities.includes(pr.id);
                return (
                  <button
                    key={pr.id}
                    type="button"
                    onClick={() => togglePriority(pr.id)}
                    style={{
                      ...styles.filterChip,
                      borderColor: isSelected ? pr.color : '#E2E8F0',
                      backgroundColor: isSelected ? `${pr.color}15` : '#FFFFFF',
                      color: isSelected ? pr.color : '#475569',
                      fontWeight: isSelected ? 600 : 400
                    }}
                  >
                    <span style={{ ...styles.tagDot, backgroundColor: pr.color }} />
                    <span>{pr.label}</span>
                    {isSelected && <Check size={13} style={{ marginLeft: 4 }} />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 6. Filtros Rápidos Temporais */}
          <div style={styles.section}>
            <label style={styles.sectionTitle}>Filtros Rápidos</label>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => onFiltersChange({ ...filters, overdueOnly: !filters.overdueOnly })}
                style={{
                  ...styles.quickBtn,
                  backgroundColor: filters.overdueOnly ? '#FEF2F2' : '#FFFFFF',
                  borderColor: filters.overdueOnly ? '#EF4444' : '#E2E8F0',
                  color: filters.overdueOnly ? '#991B1B' : '#475569'
                }}
              >
                <AlertCircle size={15} color={filters.overdueOnly ? '#EF4444' : '#64748B'} />
                <span>Apenas Atrasadas (Overdue)</span>
              </button>

              <button
                type="button"
                onClick={() => onFiltersChange({ ...filters, thisWeekOnly: !filters.thisWeekOnly })}
                style={{
                  ...styles.quickBtn,
                  backgroundColor: filters.thisWeekOnly ? '#EFF6FF' : '#FFFFFF',
                  borderColor: filters.thisWeekOnly ? '#2563EB' : '#E2E8F0',
                  color: filters.thisWeekOnly ? '#1E40AF' : '#475569'
                }}
              >
                <Calendar size={15} color={filters.thisWeekOnly ? '#2563EB' : '#64748B'} />
                <span>Vence Esta Semana</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div style={styles.footer}>
          <button
            type="button"
            onClick={onResetFilters}
            style={styles.resetBtn}
            disabled={activeCount === 0}
          >
            <RotateCcw size={16} />
            <span>Limpar Filtros</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            style={styles.applyBtn}
          >
            <span>Aplicar {activeCount > 0 ? `(${activeCount} ativos)` : ''}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    backdropFilter: 'blur(3px)',
    zIndex: 9999,
    display: 'flex',
    justifyContent: 'flex-end',
    animation: 'fadeIn 0.2s ease-out'
  },
  drawer: {
    width: '100%',
    maxWidth: 420,
    height: '100%',
    backgroundColor: '#FFFFFF',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '-4px 0 25px rgba(0, 0, 0, 0.15)',
    animation: 'slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
  },
  header: {
    padding: '20px 24px',
    borderBottom: '1px solid #E2E8F0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC'
  },
  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  title: {
    fontSize: 16,
    fontWeight: 700,
    color: '#0F172A',
    margin: 0
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    margin: '2px 0 0 0'
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 6,
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#64748B'
  },
  body: {
    flex: 1,
    overflowY: 'auto',
    padding: '20px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: 22
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: '#1E293B',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  clearChipText: {
    background: 'none',
    border: 'none',
    color: '#2563EB',
    fontSize: 11,
    fontWeight: 600,
    cursor: 'pointer'
  },
  segmentedControl: {
    display: 'flex',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 3,
    gap: 4
  },
  segmentBtn: {
    flex: 1,
    padding: '8px 10px',
    border: 'none',
    background: 'none',
    fontSize: 11,
    fontWeight: 500,
    color: '#64748B',
    borderRadius: 7,
    cursor: 'pointer',
    textAlign: 'center',
    transition: 'all 0.15s ease'
  },
  segmentBtnActive: {
    backgroundColor: '#FFFFFF',
    color: '#2563EB',
    fontWeight: 700,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)'
  },
  membersGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6
  },
  memberChip: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '8px 12px',
    border: '1px solid #E2E8F0',
    borderRadius: 10,
    background: '#FFFFFF',
    fontSize: 13,
    color: '#1E293B',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.15s ease'
  },
  avatarImg: {
    width: 26,
    height: 26,
    borderRadius: 13,
    objectFit: 'cover'
  },
  avatarPlaceholder: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#E2E8F0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 13
  },
  chipsWrap: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8
  },
  tagChip: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 12px',
    borderRadius: 20,
    border: '1px solid #E2E8F0',
    fontSize: 12,
    cursor: 'pointer',
    transition: 'all 0.15s ease'
  },
  tagDot: {
    width: 7,
    height: 7,
    borderRadius: '50%'
  },
  filterChip: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 12px',
    borderRadius: 10,
    border: '1px solid #E2E8F0',
    fontSize: 12,
    cursor: 'pointer',
    transition: 'all 0.15s ease'
  },
  quickBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 14px',
    borderRadius: 10,
    border: '1px solid #E2E8F0',
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.15s ease'
  },
  footer: {
    padding: '16px 24px',
    borderTop: '1px solid #E2E8F0',
    display: 'flex',
    gap: 12,
    backgroundColor: '#F8FAFC'
  },
  resetBtn: {
    flex: 1,
    padding: '12px 14px',
    borderRadius: 10,
    border: '1px solid #CBD5E1',
    backgroundColor: '#FFFFFF',
    color: '#475569',
    fontSize: 13,
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    cursor: 'pointer'
  },
  applyBtn: {
    flex: 2,
    padding: '12px 18px',
    borderRadius: 10,
    border: 'none',
    backgroundColor: '#2563EB',
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)'
  }
};
