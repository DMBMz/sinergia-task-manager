import React, { useState } from 'react';
import { QrCode, Copy, Check, X, Shield, Clock, Link as LinkIcon } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  projectName: string;
  projectId: string;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  projectName,
  projectId,
  onClose
}) => {
  const [role, setRole] = useState<'VIEW' | 'EDIT' | 'DELEGATE' | 'ADMIN'>('EDIT');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const mockToken = `sinergia-inv-${projectId.substring(0, 4)}-${role.toLowerCase()}`;
  const inviteLink = `https://sinergia.app/invite/${mockToken}`;

  const handleCopy = () => {
    navigator.clipboard?.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={styles.headerIcon}>
              <QrCode size={20} color="#2563EB" />
            </div>
            <div>
              <h3 style={styles.title}>Convidar Membros</h3>
              <p style={styles.subtitle}>{projectName}</p>
            </div>
          </div>
          <button onClick={onClose} style={styles.closeBtn}><X size={20} /></button>
        </div>

        <div style={styles.body}>
          {/* Seletor de Papel / Nível de Permissão */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>
              <Shield size={14} style={{ marginRight: 4 }} />
              Nível de Permissão (ACL):
            </label>
            <div style={styles.roleGrid}>
              {(['VIEW', 'EDIT', 'DELEGATE', 'ADMIN'] as const).map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  style={{
                    ...styles.roleBtn,
                    backgroundColor: role === r ? '#EFF6FF' : '#FFFFFF',
                    borderColor: role === r ? '#2563EB' : '#E2E8F0',
                    color: role === r ? '#1D4ED8' : '#475569'
                  }}
                >
                  <span style={{ fontWeight: 600 }}>{r}</span>
                  <span style={styles.roleDesc}>
                    {r === 'VIEW' && 'Apenas leitura'}
                    {r === 'EDIT' && 'Criar e editar'}
                    {r === 'DELEGATE' && 'Alocar tarefas'}
                    {r === 'ADMIN' && 'Controle total'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* QR Code Gerado Real */}
          <div style={styles.qrContainer}>
            <div style={styles.qrBox}>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(inviteLink)}`}
                alt="QR Code de Convite"
                style={{ width: 160, height: 160, borderRadius: 8, display: 'block' }}
              />
            </div>
            <span style={styles.qrCaption}>Aponte a câmera do aplicativo para entrar imediatamente</span>
          </div>

          {/* Link Copiável */}
          <div style={styles.linkContainer}>
            <div style={styles.linkBox}>
              <LinkIcon size={16} color="#64748B" />
              <input
                type="text"
                readOnly
                value={inviteLink}
                style={styles.linkInput}
              />
              <button onClick={handleCopy} style={styles.copyBtn}>
                {copied ? <Check size={16} color="#10B981" /> : <Copy size={16} />}
                <span>{copied ? 'Copiado!' : 'Copiar'}</span>
              </button>
            </div>
          </div>

          <div style={styles.footerNote}>
            <Clock size={13} color="#64748B" />
            <span>Este link e QR Code expiram em 48 horas e são protegidos por token temporário.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: 16
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    maxWidth: 480,
    width: '100%',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
    overflow: 'hidden'
  },
  header: {
    padding: '16px 20px',
    borderBottom: '1px solid #E2E8F0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  headerIcon: {
    backgroundColor: '#EFF6FF',
    padding: 8,
    borderRadius: 10
  },
  title: {
    margin: 0,
    fontSize: 16,
    fontWeight: 700,
    color: '#0F172A'
  },
  subtitle: {
    margin: 0,
    fontSize: 12,
    color: '#64748B'
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#94A3B8'
  },
  body: {
    padding: 20
  },
  fieldGroup: {
    marginBottom: 16
  },
  label: {
    display: 'flex',
    alignItems: 'center',
    fontSize: 13,
    fontWeight: 600,
    color: '#334155',
    marginBottom: 8
  },
  roleGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 8
  },
  roleBtn: {
    padding: '8px 4px',
    borderRadius: 8,
    border: '1px solid',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
    fontSize: 11
  },
  roleDesc: {
    fontSize: 9,
    color: '#64748B'
  },
  qrContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    margin: '16px 0',
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 12,
    border: '1px solid #E2E8F0'
  },
  qrBox: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 12,
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
    marginBottom: 8
  },
  qrCaption: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center'
  },
  linkContainer: {
    marginBottom: 12
  },
  linkBox: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: '8px 12px',
    border: '1px solid #E2E8F0'
  },
  linkInput: {
    flex: 1,
    background: 'none',
    border: 'none',
    outline: 'none',
    fontSize: 12,
    color: '#334155'
  },
  copyBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    border: '1px solid #CBD5E1',
    borderRadius: 6,
    padding: '4px 8px',
    fontSize: 12,
    fontWeight: 600,
    color: '#1E293B',
    cursor: 'pointer'
  },
  footerNote: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 11,
    color: '#64748B'
  }
};
