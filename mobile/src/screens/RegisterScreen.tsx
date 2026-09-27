import React, { useState } from 'react';

interface RegisterScreenProps {
  onRegister: () => void;
  onGoToLogin: () => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ onRegister, onGoToLogin }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onRegister();
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
        <h2 style={styles.title}>Sign up</h2>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              style={styles.input}
              placeholder="Escolha um nome de usuário"
              required
            />
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>E-mail</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={styles.input}
              placeholder="exemplo@email.com"
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
              placeholder="Crie uma senha forte"
              required
            />
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Repita a senha</label>
            <input
              type="password"
              value={repeatPassword}
              onChange={e => setRepeatPassword(e.target.value)}
              style={styles.input}
              placeholder="Confirme sua senha"
              required
            />
          </div>

          <button type="submit" style={styles.registerBtn}>
            Criar conta
          </button>
        </form>

        <button type="button" onClick={onGoToLogin} style={styles.linkBtn}>
          Já possui conta? Fazer login
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
    marginBottom: 30
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
    marginBottom: 24
  },
  form: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: 16
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
  registerBtn: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#2563EB',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: 24,
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    marginTop: 8,
    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
  },
  linkBtn: {
    background: 'none',
    border: 'none',
    color: '#2563EB',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: 20
  }
};
