import React, { useState } from 'react';
import { LoginScreen } from './screens/LoginScreen';
import { RegisterScreen } from './screens/RegisterScreen';
import { TeamOnboardingScreen } from './screens/TeamOnboardingScreen';
import { DashboardScreen } from './screens/DashboardScreen';
import { TaskDetailScreen } from './screens/TaskDetailScreen';
import { CreateTaskScreen } from './screens/CreateTaskScreen';
import { ProjectPlanningScreen } from './screens/ProjectPlanningScreen';
import { ShareModal } from './components/ShareModal';
import { QRScannerModal } from './components/QRScannerModal';

export type ScreenType =
  | 'LOGIN'
  | 'REGISTER'
  | 'TEAM_ONBOARDING'
  | 'DASHBOARD'
  | 'TASK_DETAIL'
  | 'CREATE_TASK'
  | 'PROJECT_PLANNING';

export const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('DASHBOARD');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);

  return (
    <div style={styles.appWrapper}>
      {/* Screen Switcher Bar para fácil navegação e testes */}
      <div style={styles.screenNavRibbon}>
        <span style={styles.ribbonLabel}>Telas do Wireframe:</span>
        <div style={styles.ribbonButtons}>
          <button
            onClick={() => setCurrentScreen('LOGIN')}
            style={{ ...styles.ribbonBtn, ...(currentScreen === 'LOGIN' ? styles.ribbonActive : {}) }}
          >
            Login
          </button>
          <button
            onClick={() => setCurrentScreen('REGISTER')}
            style={{ ...styles.ribbonBtn, ...(currentScreen === 'REGISTER' ? styles.ribbonActive : {}) }}
          >
            Cadastro
          </button>
          <button
            onClick={() => setCurrentScreen('TEAM_ONBOARDING')}
            style={{ ...styles.ribbonBtn, ...(currentScreen === 'TEAM_ONBOARDING' ? styles.ribbonActive : {}) }}
          >
            Criar/Entrar Time
          </button>
          <button
            onClick={() => setCurrentScreen('DASHBOARD')}
            style={{ ...styles.ribbonBtn, ...(currentScreen === 'DASHBOARD' ? styles.ribbonActive : {}) }}
          >
            Dashboard
          </button>
          <button
            onClick={() => setCurrentScreen('TASK_DETAIL')}
            style={{ ...styles.ribbonBtn, ...(currentScreen === 'TASK_DETAIL' ? styles.ribbonActive : {}) }}
          >
            Detalhes Tarefa
          </button>
          <button
            onClick={() => setCurrentScreen('CREATE_TASK')}
            style={{ ...styles.ribbonBtn, ...(currentScreen === 'CREATE_TASK' ? styles.ribbonActive : {}) }}
          >
            Criar Task
          </button>
          <button
            onClick={() => setCurrentScreen('PROJECT_PLANNING')}
            style={{ ...styles.ribbonBtn, ...(currentScreen === 'PROJECT_PLANNING' ? styles.ribbonActive : {}) }}
          >
            Planejamento
          </button>
        </div>
      </div>

      {/* Dispositivo Mobile Frame */}
      <div style={styles.phoneContainer}>
        <div style={styles.phoneScreen}>
          {currentScreen === 'LOGIN' && (
            <LoginScreen
              onLogin={() => setCurrentScreen('DASHBOARD')}
              onGoToRegister={() => setCurrentScreen('REGISTER')}
            />
          )}

          {currentScreen === 'REGISTER' && (
            <RegisterScreen
              onRegister={() => setCurrentScreen('TEAM_ONBOARDING')}
              onGoToLogin={() => setCurrentScreen('LOGIN')}
            />
          )}

          {currentScreen === 'TEAM_ONBOARDING' && (
            <TeamOnboardingScreen
              onCreateTeam={() => setCurrentScreen('DASHBOARD')}
              onJoinTeam={() => setIsQRScannerOpen(true)}
            />
          )}

          {currentScreen === 'DASHBOARD' && (
            <DashboardScreen
              onSelectTask={id => setCurrentScreen('TASK_DETAIL')}
              onGoToCreateTask={() => setCurrentScreen('CREATE_TASK')}
              onGoToPlanning={() => setCurrentScreen('PROJECT_PLANNING')}
            />
          )}

          {currentScreen === 'TASK_DETAIL' && (
            <TaskDetailScreen
              onBack={() => setCurrentScreen('DASHBOARD')}
            />
          )}

          {currentScreen === 'CREATE_TASK' && (
            <CreateTaskScreen
              onBack={() => setCurrentScreen('DASHBOARD')}
              onSave={task => {
                alert(`Tarefa "${task.theme}" criada com sucesso!`);
                setCurrentScreen('DASHBOARD');
              }}
            />
          )}

          {currentScreen === 'PROJECT_PLANNING' && (
            <ProjectPlanningScreen
              onGoToDashboard={() => setCurrentScreen('DASHBOARD')}
              onGoToCreateTask={() => setCurrentScreen('CREATE_TASK')}
              onOpenInvite={() => setIsShareModalOpen(true)}
            />
          )}

          {/* Modais Globais */}
          <ShareModal
            isOpen={isShareModalOpen}
            projectName="Sinergia Mobile App"
            projectId="proj-sinergia-001"
            onClose={() => setIsShareModalOpen(false)}
          />

          <QRScannerModal
            isOpen={isQRScannerOpen}
            onScanSuccess={token => {
              setIsQRScannerOpen(false);
              alert(`Convite aceito! Token: ${token}`);
              setCurrentScreen('DASHBOARD');
            }}
            onClose={() => setIsQRScannerOpen(false)}
          />
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  appWrapper: {
    minHeight: '100vh',
    backgroundColor: '#0F172A',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '24px 16px',
    boxSizing: 'border-box'
  },
  screenNavRibbon: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#1E293B',
    padding: '8px 16px',
    borderRadius: 9999,
    marginBottom: 24,
    maxWidth: '100%',
    overflowX: 'auto',
    border: '1px solid #334155'
  },
  ribbonLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: 700,
    whiteSpace: 'nowrap'
  },
  ribbonButtons: {
    display: 'flex',
    gap: 6
  },
  ribbonBtn: {
    padding: '6px 12px',
    borderRadius: 9999,
    border: 'none',
    backgroundColor: 'transparent',
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'all 0.15s ease'
  },
  ribbonActive: {
    backgroundColor: '#2563EB',
    color: '#FFFFFF',
    fontWeight: 700
  },
  phoneContainer: {
    width: '100%',
    maxWidth: 420,
    height: 840,
    backgroundColor: '#000000',
    borderRadius: 44,
    padding: 12,
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.15)',
    display: 'flex',
    flexDirection: 'column'
  },
  phoneScreen: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 36,
    overflowY: 'auto',
    overflowX: 'hidden',
    position: 'relative'
  }
};

export default App;
