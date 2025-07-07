
import type { Role } from './tenant-types';
import { getTenantBySubdomain } from './tenants';

export interface QnAPair {
  id: string;
  tenantId: string;
  question: string;
  answer: string;
  category: string;
  tags: string[];
  usageCount: number;
  lastUsedAt: string; // ISO String
  status: 'Approved' | 'Draft';
  createdBy: { id: string; name: string; role: Role };
}

// In-memory store for demo purposes, keyed by tenantId
let inMemoryLibrary: Record<string, QnAPair[]> = {};

const initializeDemoData = () => {
  if (!inMemoryLibrary['megacorp']) {
    const tenant = getTenantBySubdomain('megacorp');
    if (tenant) {
      const demoUser = tenant.members[0];
      inMemoryLibrary['megacorp'] = [
        {
          id: 'lib-1',
          tenantId: 'megacorp',
          question: "What is your data retention policy, and how do you ensure customer data is securely deleted upon request?",
          answer: "Our data retention policy adheres to industry best practices, retaining customer data for the duration of the contract plus an additional 90 days for recovery purposes. Upon a verified request, data is securely deleted from all active and backup systems using a 3-pass overwrite method to ensure it is irrecoverable.",
          category: 'Security',
          tags: ['gdpr', 'data-security', 'deletion'],
          usageCount: 5,
          lastUsedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'Approved',
          createdBy: demoUser,
        },
        {
          id: 'lib-2',
          tenantId: 'megacorp',
          question: "How does your solution integrate with third-party CRM platforms like Salesforce?",
          answer: "Our solution provides a native, bi-directional integration with Salesforce via a managed package available on the AppExchange. This integration syncs custom objects, standard objects, and allows for seamless data flow between the two platforms without the need for middleware.",
          category: 'Product',
          tags: ['integration', 'salesforce', 'crm'],
          usageCount: 12,
          lastUsedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'Approved',
          createdBy: demoUser,
        },
      ];
    }
  }
};

class AnswerLibraryService {

  public async getLibrary(tenantId: string): Promise<QnAPair[]> {
    initializeDemoData();
    return inMemoryLibrary[tenantId] || [];
  }

  public async findByQuestion(tenantId: string, question: string): Promise<QnAPair | undefined> {
    initializeDemoData();
    const tenantLibrary = inMemoryLibrary[tenantId] || [];
    // In a real system, this would use fuzzy search or semantic search.
    // For the prototype, we'll do a case-insensitive exact match.
    return tenantLibrary.find(item =>
      item.question.toLowerCase() === question.toLowerCase() && item.status === 'Approved'
    );
  }

  public async addOrUpdate(itemData: Omit<QnAPair, 'id' | 'usageCount' | 'lastUsedAt'>): Promise<QnAPair> {
    const { tenantId } = itemData;
    initializeDemoData();
    if (!inMemoryLibrary[tenantId]) {
      inMemoryLibrary[tenantId] = [];
    }
    const tenantLibrary = inMemoryLibrary[tenantId];
    const existing = tenantLibrary.find(item => item.question.toLowerCase() === itemData.question.toLowerCase());

    if (existing) {
      // Update existing answer
      const itemIndex = tenantLibrary.findIndex(i => i.id === existing.id);
      const updatedItem = {
        ...existing,
        ...itemData,
        lastUsedAt: new Date().toISOString(),
      };
      tenantLibrary[itemIndex] = updatedItem;
      return updatedItem;
    } else {
      // Add new answer
      const newItem: QnAPair = {
        ...itemData,
        id: `lib-ans-${Date.now()}`,
        usageCount: 0,
        lastUsedAt: new Date().toISOString(),
      };
      tenantLibrary.push(newItem);
      return newItem;
    }
  }

  public async incrementUsage(tenantId: string, id: string): Promise<void> {
    initializeDemoData();
    const tenantLibrary = inMemoryLibrary[tenantId] || [];
    const itemIndex = tenantLibrary.findIndex(i => i.id === id);
    if (itemIndex > -1) {
      tenantLibrary[itemIndex].usageCount += 1;
      tenantLibrary[itemIndex].lastUsedAt = new Date().toISOString();
    }
  }

   public async deleteAnswer(tenantId: string, id: string): Promise<boolean> {
      initializeDemoData();
      const tenantLibrary = inMemoryLibrary[tenantId];
      if (!tenantLibrary) return false;

      const initialLength = tenantLibrary.length;
      inMemoryLibrary[tenantId] = tenantLibrary.filter(item => item.id !== id);
      return inMemoryLibrary[tenantId].length < initialLength;
   }
}

export const answerLibraryService = new AnswerLibraryService();
