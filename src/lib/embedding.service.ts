
/**
 * @fileOverview A service for generating text embeddings using Genkit.
 * This service acts as a wrapper around the Genkit embedding models,
 * providing a simple interface for converting text into vector representations.
 */

import { ai } from '@/ai/genkit';

class EmbeddingService {
    /**
     * Generates an embedding vector for a given text string.
     * @param text The text to embed.
     * @returns A promise that resolves to an array of numbers representing the embedding.
     */
    async generateEmbedding(text: string): Promise<number[]> {
        // Return an empty array if the input text is empty or null.
        if (!text) {
            return [];
        }

        try {
            // Use the Genkit AI utility to generate the embedding.
            // We are using 'text-embedding-004', a powerful and efficient model from Google.
            const { embedding } = await ai.embed({
                model: 'googleai/text-embedding-004',
                content: text,
            });
            return embedding;
        } catch (error) {
            console.error('Failed to generate embedding:', error);
            // In case of an error, return an empty array to prevent downstream issues.
            return [];
        }
    }
}

// Export a singleton instance of the service for use throughout the application.
export const embeddingService = new EmbeddingService();
