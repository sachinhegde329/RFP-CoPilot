

// NOTE: With Firebase removed, this service now uses a temporary in-memory store.
// Data will NOT persist across server restarts.

export type NotificationType = 'assignment' | 'comment' | 'review' | 'status';

export interface Notification {
    id: string;
    tenantId: string;
    userId: string;
    type: NotificationType;
    text: string;
    timestamp: string;
    isRead: boolean;
    actor: {
        name: string;
    };
}

const getSeedNotifications = (tenantId: string, userId: string): Notification[] => [
    { id: '1', tenantId, userId, type: 'assignment', actor: { name: 'Maria Garcia' }, text: "assigned 'Data Retention Policy' to you.", timestamp: new Date(Date.now() - 5 * 60000).toISOString(), isRead: false },
    { id: '2', tenantId, userId, type: 'comment', actor: { name: 'Maria Garcia' }, text: "mentioned you on 'SLA for uptime'", timestamp: new Date(Date.now() - 60 * 60000).toISOString(), isRead: false },
    { id: '3', tenantId, userId, type: 'review', actor: { name: 'AI Expert' }, text: "review for 'Pricing Structure' is complete.", timestamp: new Date(Date.now() - 3 * 3600 * 1000).toISOString(), isRead: false },
    { id: '4', tenantId, userId, type: 'status', actor: { name: 'Priya Patel' }, text: "marked 'CRM Integration' as Completed.", timestamp: new Date(Date.now() - 24 * 3600 * 1000).toISOString(), isRead: true },
];

let inMemoryNotifications: Record<string, Notification[]> = {};

const initializeDemoData = (tenantId: string, userId: string) => {
    if (tenantId === 'megacorp' && !inMemoryNotifications[tenantId]) {
        inMemoryNotifications[tenantId] = getSeedNotifications(tenantId, userId);
    }
}

class NotificationService {

    public async getNotifications(tenantId: string, userId: string): Promise<Notification[]> {
        initializeDemoData(tenantId, userId);
        const tenantNotifications = inMemoryNotifications[tenantId] || [];
        return tenantNotifications.filter(n => n.userId === userId).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }
    
    public async markAllAsRead(tenantId: string, userId: string): Promise<Notification[]> {
        initializeDemoData(tenantId, userId);
        const tenantNotifications = inMemoryNotifications[tenantId];
        if (tenantNotifications) {
            inMemoryNotifications[tenantId] = tenantNotifications.map(n => 
                n.userId === userId ? { ...n, isRead: true } : n
            );
        }
        return this.getNotifications(tenantId, userId);
    }
}

export const notificationService = new NotificationService();
