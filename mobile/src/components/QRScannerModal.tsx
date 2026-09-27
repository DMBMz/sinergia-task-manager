import React, { useState, useEffect, useRef } from 'react';
import { Camera, CheckCircle2, AlertCircle, X, Shield } from 'lucide-react';

interface QRScannerModalProps {
  isOpen: boolean;
  onScanSuccess: (token: string) => void;
  onClose: () => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onScanSuccess,
  onClose
}) => {
  const [manualToken, setManualToken] = useState('');
  const [isScanning, setIsScanning] = useState(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    let activeStream: MediaStream | null = null;
    if (isOpen) {
      navigator.mediaDevices?.getUserMedia({
        video: { facingMode: 'environment' }
      }).then(stream => {
        activeStream = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      }).catch(err => {
        console.warn('Camera não acessível:', err);
      });
    }
    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSimulateScan = (role: string) => {
    const simulatedToken = `sinergia-inv-demo-${role.toLowerCase()}`;
    onScanSuccess(simulatedToken);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualToken.trim()) return;
    onScanSuccess(manualToken.trim());
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={styles.headerIcon}>
              <Camera size={20} color="#10B981" />
            </div>
            <div>
              <h3 style={styles.title}>Leitor de QR Code</h3>
              <p style={styles.subtitle}>Escaneie o código do gestor para entrar no projeto</p>
            </div>
          </div>
          <button onClick={onClose} style={styles.closeBtn}><X size={20} /></button>
        </div>

        <div style={styles.body}>
          {/* Viewfinder da Câmera */}
          <div style={styles.viewfinder}>
            <video
              ref={videoRef}
              playsInline
              muted
              style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
            <div style={styles.laserLine} />
            <div style={styles.cornerTL} />
            <div style={styles.cornerTR} />
            <div style={styles.cornerBL} />
            <div style={styles.cornerBR} />
            <span style={styles.scanningText}>Posicione o QR Code dentro do quadro</span>
          </div>

          {/* Atalhos para Simulação Rápida em Testes */}
          <div style={styles.simBox}>
            <span style={styles.simTitle}>Simular leitura de convite:</span>
            <div style={styles.simButtons}>
              <button onClick={() => handleSimulateScan('EDIT')} style={styles.simBtn}>
                <Shield size={12} /> Papel EDIT
              </button>
              <button onClick={() => handleSimulateScan('ADMIN')} style={styles.simBtn}>
                <Shield size={12} /> Papel ADMIN
              </button>
              <button onClick={() => handleSimulateScan('VIEW')} style={styles.simBtn}>
                <Shield size={12} /> Papel VIEW
              </button>
            </div>
          </div>

          {/* Inserção Manual de Token */}
          <form onSubmit={handleManualSubmit} style={styles.manualForm}>
            <input
              type="text"
              placeholder="Ou cole o token / link de convite aqui..."
              value={manualToken}
              onChange={e => setManualToken(e.target.value)}
              style={styles.manualInput}
            />
            <button type="submit" style={styles.submitBtn}>Entrar</button>
          </form>
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
    maxWidth: 440,
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
    backgroundColor: '#ECFDF5',
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
  viewfinder: {
    position: 'relative',
    height: 220,
    backgroundColor: '#0F172A',
    borderRadius: 12,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 16
  },
  laserLine: {
    position: 'absolute',
    left: '15%',
    right: '15%',
    top: '50%',
    height: 2,
    backgroundColor: '#EF4444',
    boxShadow: '0 0 8px #EF4444'
  },
  scanningText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    marginTop: 12
  },
  cornerTL: { position: 'absolute', top: 20, left: 30, width: 24, height: 24, borderTop: '3px solid #10B981', borderLeft: '3px solid #10B981' },
  cornerTR: { position: 'absolute', top: 20, right: 30, width: 24, height: 24, borderTop: '3px solid #10B981', borderRight: '3px solid #10B981' },
  cornerBL: { position: 'absolute', bottom: 20, left: 30, width: 24, height: 24, borderBottom: '3px solid #10B981', borderLeft: '3px solid #10B981' },
  cornerBR: { position: 'absolute', bottom: 20, right: 30, width: 24, height: 24, borderBottom: '3px solid #10B981', borderRight: '3px solid #10B981' },
  simBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
    border: '1px solid #E2E8F0',
    marginBottom: 14
  },
  simTitle: {
    fontSize: 11,
    fontWeight: 600,
    color: '#64748B',
    display: 'block',
    marginBottom: 6
  },
  simButtons: {
    display: 'flex',
    gap: 8
  },
  simBtn: {
    flex: 1,
    padding: '6px 8px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #CBD5E1',
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 600,
    color: '#334155',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4
  },
  manualForm: {
    display: 'flex',
    gap: 8
  },
  manualInput: {
    flex: 1,
    padding: '8px 12px',
    borderRadius: 8,
    border: '1px solid #CBD5E1',
    fontSize: 12,
    outline: 'none'
  },
  submitBtn: {
    padding: '8px 14px',
    backgroundColor: '#10B981',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer'
  }
};
