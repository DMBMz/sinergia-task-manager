export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  urgencyLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  color: string; // Ex: '#10B981' (verde), '#F59E0B' (amarelo), '#F97316' (laranja), '#EF4444' (vermelho)
}

export class NotificationService {
  private sentNotifications: Array<{ userId: string; payload: NotificationPayload; timestamp: Date }> = [];

  constructor() {}

  /**
   * Calcula o nível de alerta e a cor com base na proximidade do prazo
   * Alertas iniciais: 7 dias, 3 dias, 1 dia e 1 hora antes do vencimento.
   */
  calculateDeadlineAlert(dueDate: Date, now: Date = new Date()): NotificationPayload | null {
    const diffMs = dueDate.getTime() - now.getTime();
    if (diffMs < 0) {
      return {
        title: '⚠️ Tarefa Atrasada!',
        body: 'O prazo de entrega desta tarefa expirou.',
        urgencyLevel: 'CRITICAL',
        color: '#DC2626' // Vermelho escuro
      };
    }

    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours <= 1) {
      return {
        title: '🚨 Vencimento em menos de 1 hora!',
        body: 'Sua tarefa está prestes a vencer. Conclua ou atualize o status.',
        urgencyLevel: 'CRITICAL',
        color: '#EF4444' // Vermelho
      };
    } else if (diffHours <= 24) {
      return {
        title: '⏰ Vence amanhã (24h)',
        body: 'Falta menos de 1 dia para o prazo final desta tarefa.',
        urgencyLevel: 'HIGH',
        color: '#F97316' // Laranja
      };
    } else if (diffHours <= 72) {
      return {
        title: '📅 Vencimento em 3 dias',
        body: 'Lembrete de atenção para entrega da tarefa nos próximos dias.',
        urgencyLevel: 'MEDIUM',
        color: '#F59E0B' // Amarelo
      };
    } else if (diffHours <= 168) {
      return {
        title: '🗓️ Vencimento em 7 dias',
        body: 'Planeje sua semana: esta tarefa vence em 7 dias.',
        urgencyLevel: 'LOW',
        color: '#10B981' // Verde
      };
    }

    return null;
  }

  /**
   * Envia notificação respeitando o modo 'Não Perturbe' (quietUntil)
   */
  async sendNotification(
    user: { id: string; fcmToken?: string | null; quietUntil?: Date | null },
    payload: NotificationPayload
  ): Promise<boolean> {
    const now = new Date();

    // Verifica período de silêncio
    if (user.quietUntil && new Date(user.quietUntil) > now) {
      console.log(`[NotificationService] Usuário ${user.id} em modo silencioso até ${user.quietUntil}. Alerta suprimido.`);
      return false;
    }

    this.sentNotifications.push({
      userId: user.id,
      payload,
      timestamp: now
    });

    console.log(`[FCM Notification] Push enviado para ${user.id} [${payload.urgencyLevel}] Cor: ${payload.color} - ${payload.title}: ${payload.body}`);
    return true;
  }

  getSentHistory() {
    return this.sentNotifications;
  }

  clearHistory() {
    this.sentNotifications = [];
  }
}
