export interface PushNotification {
  id: string;
  title: string;
  body: string;
  urgencyLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  color: string;
  taskId?: string;
  receivedAt: Date;
  isRead: boolean;
}

export class MobileNotificationService {
  private notifications: PushNotification[] = [];
  private listeners: Array<(notification: PushNotification) => void> = [];

  constructor() {
    this.registerChannels();
  }

  private registerChannels() {
    console.log('[Android FCM Channel] Registrando canais de notificação com cores contextuais (Verde, Amarelo, Laranja, Vermelho).');
  }

  addListener(cb: (notification: PushNotification) => void) {
    this.listeners.push(cb);
  }

  removeListener(cb: (notification: PushNotification) => void) {
    this.listeners = this.listeners.filter(l => l !== cb);
  }

  receiveNotification(payload: Omit<PushNotification, 'id' | 'receivedAt' | 'isRead'>) {
    const notification: PushNotification = {
      id: 'notif-' + Date.now(),
      ...payload,
      receivedAt: new Date(),
      isRead: false
    };
    this.notifications.unshift(notification);
    for (const cb of this.listeners) {
      cb(notification);
    }
  }

  getNotifications() {
    return this.notifications;
  }

  markAsRead(id: string) {
    const item = this.notifications.find(n => n.id === id);
    if (item) item.isRead = true;
  }
}

export const mobileNotifications = new MobileNotificationService();
