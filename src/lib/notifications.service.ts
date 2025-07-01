
import { db } from './firebase';
import { collection, getDocs, query, where, writeBatch, orderBy, limit, addDoc } from 'firebase/firestore';

// NOTE: This service is now migrated to use Firestore for data persistence.

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

function sanitizeData<T>(data: T): T {
    return JSON.parse(JSON.stringify(data));
}

class NotificationService {
    private getNotificationsCollection(tenantId: string) {
        return collection(db, 'tenants', tenantId, 'notifications');
    }

    private async _seedNotifications(tenantId: string, userId: string) {
        const notificationsToAdd = [
            { userId, type: 'assignment', actor: { name: 'Maria Garcia' }, text: "assigned 'Data Retention Policy' to you.", timestamp: new Date(Date.now() - 5 * 60000).toISOString(), isRead: false },
            { userId, type: 'comment', actor: { name: 'Maria Garcia' }, text: "mentioned you on 'SLA for uptime'", timestamp: new Date(Date.now() - 60 * 60000).toISOString(), isRead: false },
            { userId, type: 'review', actor: { name: 'AI Expert' }, text: "review for 'Pricing Structure' is complete.", timestamp: new Date(Date.now() - 3 * 3600 * 1000).toISOString(), isRead: false },
            { userId, type: 'status', actor: { name: 'Priya Patel' }, text: "marked 'CRM Integration' as Completed.", timestamp: new Date(Date.now() - 24 * 3600 * 1000).toISOString(), isRead: true },
        ];

        const batch = writeBatch(db);
        notificationsToAdd.forEach(notif => {
            const docRef = doc(this.getNotificationsCollection(tenantId));
            batch.set(docRef, notif);
        });
        await batch.commit();
    }

    public async getNotifications(tenantId: string, userId: string): Promise<Notification[]> {
        const q = query(
            this.getNotificationsCollection(tenantId),
            where('userId', '==', userId),
            orderBy('timestamp', 'desc'),
            limit(20)
        );

        const snapshot = await getDocs(q);

        if (snapshot.empty && tenantId === 'megacorp') {
            await this._seedNotifications(tenantId, userId);
            const seededSnapshot = await getDocs(q);
            const notifications = seededSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
            return sanitizeData(notifications);
        }
        
        const notifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
        return sanitizeData(notifications);
    }
    
    public async markAllAsRead(tenantId: string, userId: string): Promise<Notification[]> {
        const q = query(
            this.getNotificationsCollection(tenantId),
            where('userId', '==', userId),
            where('isRead', '==', false)
        );
        const snapshot = await getDocs(q);
        if (snapshot.empty) {
            return this.getNotifications(tenantId, userId);
        }

        const batch = writeBatch(db);
        snapshot.docs.forEach(doc => {
            batch.update(doc.ref, { isRead: true });
        });
        await batch.commit();

        return this.getNotifications(tenantId, userId);
    }
}

export const notificationService = new NotificationService();
