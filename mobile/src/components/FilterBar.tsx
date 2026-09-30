import React from 'react';
import { Search, Tag as TagIcon, Filter, Wifi, WifiOff, RefreshCw, SlidersHorizontal } from 'lucide-react';
import { LocalTag } from '../database/schema';

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedTag: string | null;
  onSelectTag: (tagName: string | null) => void;
  selectedStatus: string | null;
  onSelectStatus: (status: string | null) => void;
  selectedPriority: string | null;
  onSelectPriority: (priority: string | null) => void;
  tags: LocalTag[];
  isOnline: boolean;
  onToggleOnline: () => void;
  isSyncing: boolean;
  onTriggerSync: () => void;
  onOpenDrawer?: () => void;
  activeFiltersCount?: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  searchQuery,
  onSearchChange,
  selectedTag,
  onSelectTag,
  selectedStatus,
  onSelectStatus,
  selectedPriority,
  onSelectPriority,
  tags,
  isOnline,
  onToggleOnline,
  isSyncing,
  onTriggerSync,
  onOpenDrawer,
  activeFiltersCount = 0
}) => {
  return (
    <div style={styles.container}>
      {/* Barra Superior de Status e Rede */}
      <div style={styles.statusBar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={onToggleOnline}
            style={{
              ...styles.netBadge,
              backgroundColor: isOnline ? '#ECFDF5' : '#FEF2F2',
              borderColor: isOnline ? '#A7F3D0' : '#FECACA',
              color: isOnline ? '#065F46' : '#991B1B'
            }}
            title="Clique para alternar simulação de modo offline"
          >
            {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
            <span>{isOnline ? 'Online (Sync Ativo)' : 'Modo Offline (WatermelonDB)'}</span>
          </button>
        </div>

        <button
          onClick={onTriggerSync}
          disabled={!isOnline || isSyncing}
          style={styles.syncBtn}
          title="Forçar sincronização delta"
        >
          <RefreshCw size={13} style={{ animation: isSyncing ? 'spin 1s linear infinite' : 'none' }} />
          <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar'}</span>
        </button>
      </div>

      {/* Input de Busca com Tolerância a Erros (US05) e Botão do Drawer */}
      <div style={styles.searchRow}>
        <div style={styles.searchBox}>
          <Search size={16} color="#64748B" />
          <input
            type="text"
            placeholder="Busca semântica & fuzzy (tolerante a erros de digitação)..."
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            style={styles.searchInput}
          />
          {searchQuery && (
            <span style={styles.fuzzyNotice}>Fuzzy ativa</span>
          )}
        </div>

        {onOpenDrawer && (
          <button
            type="button"
            onClick={onOpenDrawer}
            style={{
              ...styles.filterDrawerBtn,
              backgroundColor: activeFiltersCount > 0 ? '#EFF6FF' : '#FFFFFF',
              borderColor: activeFiltersCount > 0 ? '#2563EB' : '#CBD5E1',
              color: activeFiltersCount > 0 ? '#2563EB' : '#475569'
            }}
            title="Abrir painel de filtros avançados"
          >
            <SlidersHorizontal size={15} />
            <span style={{ fontWeight: 600 }}>Filtros</span>
            {activeFiltersCount > 0 && (
              <span style={styles.filterBadge}>{activeFiltersCount}</span>
            )}
          </button>
        )}
      </div>

      {/* Chips de Tags Horizontais */}
      <div style={styles.chipsScroll}>
        <button
          onClick={() => onSelectTag(null)}
          style={{
            ...styles.tagChip,
            backgroundColor: selectedTag === null ? '#2563EB' : '#FFFFFF',
            color: selectedTag === null ? '#FFFFFF' : '#475569',
            borderColor: selectedTag === null ? '#2563EB' : '#CBD5E1'
          }}
        >
          Todas as Tags
        </button>

        {tags.map(tag => {
          const isSelected = selectedTag === tag.name;
          return (
            <button
              key={tag.id}
              onClick={() => onSelectTag(isSelected ? null : tag.name)}
              style={{
                ...styles.tagChip,
                backgroundColor: isSelected ? tag.color : '#FFFFFF',
                color: isSelected ? '#FFFFFF' : '#334155',
                borderColor: tag.color
              }}
            >
              <TagIcon size={12} style={{ marginRight: 4 }} />
              {tag.name}
            </button>
          );
        })}
      </div>

      {/* Filtros Rápidos de Status e Prioridade */}
      <div style={styles.filtersRow}>
        <div style={styles.filterGroup}>
          <span style={styles.filterLabel}>Status:</span>
          {(['PENDING', 'IN_PROGRESS', 'COMPLETED'] as const).map(st => (
            <button
              key={st}
              onClick={() => onSelectStatus(selectedStatus === st ? null : st)}
              style={{
                ...styles.pillBtn,
                backgroundColor: selectedStatus === st ? '#1E293B' : '#F1F5F9',
                color: selectedStatus === st ? '#FFFFFF' : '#475569'
              }}
            >
              {st === 'PENDING' && 'Pendente'}
              {st === 'IN_PROGRESS' && 'Em Andamento'}
              {st === 'COMPLETED' && 'Concluída'}
            </button>
          ))}
        </div>

        <div style={styles.filterGroup}>
          <span style={styles.filterLabel}>Prioridade:</span>
          {(['HIGH', 'URGENT'] as const).map(pr => (
            <button
              key={pr}
              onClick={() => onSelectPriority(selectedPriority === pr ? null : pr)}
              style={{
                ...styles.pillBtn,
                backgroundColor: selectedPriority === pr ? '#EF4444' : '#F1F5F9',
                color: selectedPriority === pr ? '#FFFFFF' : '#475569'
              }}
            >
              {pr === 'HIGH' ? 'Alta' : 'Urgente'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
    border: '1px solid #E2E8F0',
    marginBottom: 20
  },
  statusBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  netBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '4px 10px',
    borderRadius: 9999,
    fontSize: 12,
    fontWeight: 600,
    border: '1px solid',
    cursor: 'pointer'
  },
  syncBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: 8,
    padding: '4px 10px',
    fontSize: 12,
    color: '#475569',
    cursor: 'pointer'
  },
  searchRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12
  },
  searchBox: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: '8px 12px',
    border: '1px solid #CBD5E1'
  },
  filterDrawerBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 14px',
    borderRadius: 10,
    border: '1px solid #CBD5E1',
    backgroundColor: '#FFFFFF',
    fontSize: 12,
    cursor: 'pointer',
    position: 'relative' as const,
    whiteSpace: 'nowrap' as const,
    transition: 'all 0.15s ease'
  },
  filterBadge: {
    backgroundColor: '#2563EB',
    color: '#FFFFFF',
    borderRadius: 9999,
    fontSize: 10,
    fontWeight: 700,
    width: 17,
    height: 17,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2
  },
  searchInput: {
    flex: 1,
    border: 'none',
    outline: 'none',
    backgroundColor: 'transparent',
    fontSize: 13,
    color: '#0F172A'
  },
  fuzzyNotice: {
    fontSize: 11,
    color: '#3B82F6',
    backgroundColor: '#EFF6FF',
    padding: '2px 8px',
    borderRadius: 9999,
    fontWeight: 500
  },
  chipsScroll: {
    display: 'flex',
    gap: 8,
    overflowX: 'auto',
    paddingBottom: 4,
    marginBottom: 10
  },
  tagChip: {
    display: 'flex',
    alignItems: 'center',
    padding: '4px 12px',
    borderRadius: 9999,
    border: '1px solid',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap'
  },
  filtersRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    paddingTop: 8,
    borderTop: '1px solid #F1F5F9'
  },
  filterGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: 6
  },
  filterLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: 600
  },
  pillBtn: {
    padding: '3px 8px',
    borderRadius: 6,
    border: 'none',
    fontSize: 11,
    fontWeight: 500,
    cursor: 'pointer'
  }
};
