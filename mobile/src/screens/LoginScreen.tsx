import React, { useState } from 'react';

interface LoginScreenProps {
  onLogin: () => void;
  onGoToRegister: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, onGoToRegister }) => {
  const [username, setUsername] = useState('davi.marinho');
  const [password, setPassword] = useState('••••••••');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin();
  };

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

      <div style={styles.card}>
        <h2 style={styles.title}>Sign in</h2>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              style={styles.input}
              placeholder="Digite seu username"
              required
            />
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Senha</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={styles.input}
              placeholder="Digite sua senha"
              required
            />
          </div>

          <button type="submit" style={styles.loginBtn}>
            Logar
          </button>
        </form>

        <button type="button" onClick={onGoToRegister} style={styles.linkBtn}>
          Não possui conta?
        </button>
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
    marginBottom: 40
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
  card: {
    width: '100%',
    maxWidth: 360,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    color: '#1E293B',
    marginBottom: 32
  },
  form: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: 20
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6
  },
  label: {
    fontSize: 13,
    fontWeight: 600,
    color: '#1E293B'
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    borderRadius: 12,
    border: '1px solid #E2E8F0',
    backgroundColor: '#FFFFFF',
    fontSize: 14,
    color: '#0F172A',
    outline: 'none',
    boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
    boxSizing: 'border-box'
  },
  loginBtn: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#2563EB',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: 24,
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    marginTop: 12,
    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
  },
  linkBtn: {
    background: 'none',
    border: 'none',
    color: '#2563EB',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: 24
  }
};
