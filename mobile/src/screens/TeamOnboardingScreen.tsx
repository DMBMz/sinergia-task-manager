import React from 'react';
import { PlusCircle, QrCode, ArrowRight } from 'lucide-react';

interface TeamOnboardingScreenProps {
  onCreateTeam: () => void;
  onJoinTeam: () => void;
}

export const TeamOnboardingScreen: React.FC<TeamOnboardingScreenProps> = ({ onCreateTeam, onJoinTeam }) => {
  return (
    <div style={styles.container}>
      {/* Sinergia Logo */}
      <div style={styles.logoContainer}>
        <div style={styles.logoRow}>
          <span style={styles.logoText}>Sinergia</span>
          <div style={styles.logoIcon}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="#FFFFFF"/>
            </svg>
          </div>
        </div>
      </div>

      <div style={styles.content}>
        <h2 style={styles.title}>Já possui um time?</h2>

        <div style={styles.optionsContainer}>
          {/* Card: Criar um time */}
          <div style={styles.choiceCard} onClick={onCreateTeam}>
            <div style={styles.cardHeader}>
              <PlusCircle size={20} color="#2563EB" />
              <span style={styles.choiceLabel}>Criar um</span>
            </div>
            <p style={styles.choiceTitle}>Criar time</p>
            <div style={styles.cardFooter}>
              <span style={styles.learnMore}>Iniciar novo projeto</span>
              <ArrowRight size={14} color="#2563EB" />
            </div>
          </div>

          {/* Card: Já possuo convite ou QR CODE */}
          <div style={{ ...styles.choiceCard, backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }} onClick={onJoinTeam}>
            <div style={styles.cardHeader}>
              <QrCode size={20} color="#16A34A" />
              <span style={{ ...styles.choiceLabel, color: '#16A34A' }}>Já possuo</span>
            </div>
            <p style={{ ...styles.choiceTitle, color: '#14532D' }}>Adicionar link de convite ou ler QR CODE</p>
            <div style={styles.cardFooter}>
              <span style={{ ...styles.learnMore, color: '#16A34A' }}>Escanear com a câmera</span>
              <ArrowRight size={14} color="#16A34A" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '32px 20px',
    backgroundColor: '#F8FAFC'
  },
  logoContainer: {
    marginBottom: 48
  },
  logoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8
  },
  logoText: {
    fontSize: 28,
    fontWeight: 800,
    color: '#0F172A',
    letterSpacing: '-0.02em'
  },
  logoIcon: {
    width: 34,
    height: 34,
    borderRadius: '50%',
    backgroundColor: '#2563EB',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 10px rgba(37, 99, 235, 0.3)'
  },
  content: {
    width: '100%',
    maxWidth: 380,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
    color: '#1E293B',
    marginBottom: 28,
    textAlign: 'center'
  },
  optionsContainer: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: 16
  },
  choiceCard: {
    padding: '20px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: 16,
    cursor: 'pointer',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.04)',
    transition: 'all 0.2s ease',
    display: 'flex',
    flexDirection: 'column',
    gap: 8
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 8
  },
  choiceLabel: {
    fontSize: 12,
    fontWeight: 700,
    color: '#2563EB',
    textTransform: 'uppercase',
    letterSpacing: '0.04em'
  },
  choiceTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: '#0F172A',
    lineHeight: 1.4,
    margin: '4px 0'
  },
  cardFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6
  },
  learnMore: {
    fontSize: 12,
    fontWeight: 600,
    color: '#2563EB'
  }
};
