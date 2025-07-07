
import type { Role } from './tenant-types';

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

// In-memory store for demo purposes
const inMemoryLibrary: QnAPair[] = [];

class AnswerLibraryService {

  public async getLibrary(tenantId: string): Promise<QnAPair[]> {
    return inMemoryLibrary.filter(item => item.tenantId === tenantId);
  }

  public async findByQuestion(tenantId: string, question: string): Promise<QnAPair | undefined> {
    // In a real system, this would use fuzzy search or semantic search.
    // For the prototype, we'll do a case-insensitive exact match.
    return inMemoryLibrary.find(item =>
      item.tenantId === tenantId && item.question.toLowerCase() === question.toLowerCase()
    );
  }

  public async addOrUpdate(itemData: Omit<QnAPair, 'id' | 'usageCount' | 'lastUsedAt'>): Promise<QnAPair> {
    const existing = await this.findByQuestion(itemData.tenantId, itemData.question);

    if (existing) {
      // Update existing answer
      const itemIndex = inMemoryLibrary.findIndex(i => i.id === existing.id);
      const updatedItem = {
        ...existing,
        ...itemData,
        lastUsedAt: new Date().toISOString(),
      };
      inMemoryLibrary[itemIndex] = updatedItem;
      return updatedItem;
    } else {
      // Add new answer
      const newItem: QnAPair = {
        ...itemData,
        id: `lib-ans-${Date.now()}`,
        usageCount: 0,
        lastUsedAt: new Date().toISOString(),
      };
      inMemoryLibrary.push(newItem);
      return newItem;
    }
  }

  public async incrementUsage(tenantId: string, id: string): Promise<void> {
    const itemIndex = inMemoryLibrary.findIndex(i => i.tenantId === tenantId && i.id === id);
    if (itemIndex > -1) {
      inMemoryLibrary[itemIndex].usageCount += 1;
      inMemoryLibrary[itemIndex].lastUsedAt = new Date().toISOString();
    }
  }

   public async deleteAnswer(tenantId: string, id: string): Promise<boolean> {
      const initialLength = inMemoryLibrary.length;
      const filtered = inMemoryLibrary.filter(item => !(item.tenantId === tenantId && item.id === id));
      inMemoryLibrary.length = 0;
      inMemoryLibrary.push(...filtered);
      return inMemoryLibrary.length < initialLength;
   }
}

export const answerLibraryService = new AnswerLibraryService();
