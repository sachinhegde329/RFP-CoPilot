

// NOTE: This service is currently using an in-memory store for prototype purposes.
// For a production environment, this should be migrated to a persistent database (e.g., Firestore).

export type NotificationType = 'assignment' | 'comment' | 'review' | 'status';

export interface Notification {
    id: number;
    tenantId: string;
    userId: number; // The user who should receive the notification
    type: NotificationType;
    text: string;
    timestamp: string; // Using string for simplicity, could be Date
    isRead: boolean;
    actor: { // The user who performed the action
        name: string;
    };
}

class NotificationService {
    private notifications: Notification[] = [
        {
            id: 1,
            tenantId: 'megacorp',
            userId: 1, // For Alex Johnson
            type: 'assignment',
            actor: { name: 'Maria Garcia' },
            text: "assigned 'Data Retention Policy' to you.",
            timestamp: '5m ago',
            isRead: false,
        },
        {
            id: 2,
            tenantId: 'megacorp',
            userId: 1,
            type: 'comment',
            actor: { name: 'Maria Garcia' },
            text: "mentioned you on 'SLA for uptime'",
            timestamp: '1h ago',
            isRead: false,
        },
        {
            id: 3,
            tenantId: 'megacorp',
            userId: 1,
            type: 'review',
            actor: { name: 'AI Expert' },
            text: "review for 'Pricing Structure' is complete.",
            timestamp: '3h ago',
            isRead: false,
        },
        {
            id: 4,
            tenantId: 'megacorp',
            userId: 1,
            type: 'status',
            actor: { name: 'Priya Patel' },
            text: "marked 'CRM Integration' as Completed.",
            timestamp: '1d ago',
            isRead: true,
        },
        // Notifications for acme tenant
        {
            id: 5,
            tenantId: 'acme',
            userId: 1,
            type: 'assignment',
            actor: { name: 'Bob (Admin)' },
            text: "assigned 'New Security Protocol' to you.",
            timestamp: '10m ago',
            isRead: false,
        },
    ];

    public getNotifications(tenantId: string, userId: number): Notification[] {
        // In a real app, this would be a DB query
        return this.notifications.filter(n => n.tenantId === tenantId && n.userId === userId);
    }
    
    // In a real app, you would also have createNotification, etc.

    public markAllAsRead(tenantId: string, userId: number): Notification[] {
        this.notifications.forEach(n => {
            if (n.tenantId === tenantId && n.userId === userId) {
                n.isRead = true;
            }
        });
        return this.getNotifications(tenantId, userId);
    }
}

export const notificationService = new NotificationService();
