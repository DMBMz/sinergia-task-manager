import React from 'react';
import { AlertTriangle, RefreshCw, CheckCircle2, X } from 'lucide-react';
import { LocalTask } from '../database/schema';

interface ConflictModalProps {
  isOpen: boolean;
  localTask: Partial<LocalTask>;
  serverTask: LocalTask;
  onAcceptServer: () => void;
  onOverwriteWithNewVersion: () => void;
  onClose: () => void;
}

export const ConflictModal: React.FC<ConflictModalProps> = ({
  isOpen,
  localTask,
  serverTask,
  onAcceptServer,
  onOverwriteWithNewVersion,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <div style={styles.headerIcon}>
            <AlertTriangle size={24} color="#EF4444" />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={styles.title}>Bloqueio de Edição Simultânea (Lock Otimista)</h3>
            <p style={styles.subtitle}>
              Outro membro da equipe atualizou esta tarefa enquanto você editava.
              Para evitar sobrescrita acidental, escolha como deseja prosseguir:
            </p>
          </div>
          <button onClick={onClose} style={styles.closeBtn}><X size={20} /></button>
        </div>

        <div style={styles.diffContainer}>
          {/* Versão Local */}
          <div style={styles.diffColumn}>
            <div style={styles.columnHeaderLocal}>
              <span>Suas Alterações (Não Salvas)</span>
            </div>
            <div style={styles.diffContent}>
              <div style={styles.field}>
                <strong>Título:</strong> {localTask.title}
              </div>
              <div style={styles.field}>
                <strong>Prioridade:</strong> {localTask.priority}
              </div>
              <div style={styles.field}>
                <strong>Status:</strong> {localTask.status}
              </div>
              <div style={styles.field}>
                <strong>Descrição:</strong> {localTask.description || '(sem descrição)'}
              </div>
            </div>
          </div>

          {/* Versão no Servidor */}
          <div style={styles.diffColumn}>
            <div style={styles.columnHeaderServer}>
              <span>Versão Atual no Servidor (v{serverTask.version})</span>
            </div>
            <div style={styles.diffContent}>
              <div style={styles.field}>
                <strong>Título:</strong> {serverTask.title}
              </div>
              <div style={styles.field}>
                <strong>Prioridade:</strong> {serverTask.priority}
              </div>
              <div style={styles.field}>
                <strong>Status:</strong> {serverTask.status}
              </div>
              <div style={styles.field}>
                <strong>Descrição:</strong> {serverTask.description || '(sem descrição)'}
              </div>
            </div>
          </div>
        </div>

        <div style={styles.actions}>
          <button style={styles.secondaryBtn} onClick={onAcceptServer}>
            <RefreshCw size={16} style={{ marginRight: 6 }} />
            Descartar minhas alterações e carregar do servidor
          </button>
          <button style={styles.primaryBtn} onClick={onOverwriteWithNewVersion}>
            <CheckCircle2 size={16} style={{ marginRight: 6 }} />
            Mesclar & Salvar como nova versão
          </button>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: 16
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    maxWidth: 720,
    width: '100%',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column'
  },
  header: {
    padding: '20px 24px',
    backgroundColor: '#FEF2F2',
    borderBottom: '1px solid #FEE2E2',
    display: 'flex',
    alignItems: 'flex-start',
    gap: 16
  },
  headerIcon: {
    backgroundColor: '#FEE2E2',
    padding: 10,
    borderRadius: 12
  },
  title: {
    margin: 0,
    fontSize: 18,
    fontWeight: 700,
    color: '#991B1B'
  },
  subtitle: {
    margin: '6px 0 0 0',
    fontSize: 13,
    color: '#7F1D1D',
    lineHeight: 1.4
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#991B1B'
  },
  diffContainer: {
    display: 'flex',
    gap: 16,
    padding: 24,
    backgroundColor: '#F8FAFC'
  },
  diffColumn: {
    flex: 1,
    border: '1px solid #E2E8F0',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden'
  },
  columnHeaderLocal: {
    backgroundColor: '#EFF6FF',
    color: '#1E40AF',
    padding: '10px 14px',
    fontWeight: 600,
    fontSize: 13,
    borderBottom: '1px solid #DBEAFE'
  },
  columnHeaderServer: {
    backgroundColor: '#F0FDF4',
    color: '#166534',
    padding: '10px 14px',
    fontWeight: 600,
    fontSize: 13,
    borderBottom: '1px solid #DCFCE7'
  },
  diffContent: {
    padding: 14,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    fontSize: 13,
    color: '#334155'
  },
  field: {
    lineHeight: 1.4
  },
  actions: {
    padding: '16px 24px',
    backgroundColor: '#FFFFFF',
    borderTop: '1px solid #E2E8F0',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 12
  },
  secondaryBtn: {
    padding: '10px 16px',
    borderRadius: 8,
    border: '1px solid #CBD5E1',
    backgroundColor: '#FFFFFF',
    color: '#475569',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center'
  },
  primaryBtn: {
    padding: '10px 16px',
    borderRadius: 8,
    border: 'none',
    backgroundColor: '#2563EB',
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center'
  }
};
