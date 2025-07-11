/**
 * @fileOverview A simplified secrets service for storing sensitive data.
 * This is a fallback implementation that stores secrets in memory.
 * In production, you should use a proper secrets management service.
 */

class SecretsService {
  private secrets: Map<string, any> = new Map();

  constructor() {
    console.warn("Using in-memory secrets storage. This is not suitable for production.");
  }

  private getSecretKey(tenantId: string, sourceId: string): string {
    return `${tenantId}:${sourceId}`;
  }
  
  /**
   * Creates or updates a secret in memory.
   * @param tenantId The ID of the tenant, used for namespacing.
   * @param sourceId The ID of the data source, used as the secret key.
   * @param value The credentials object to store.
   * @returns The path used to reference the secret.
   */
  async createOrUpdateSecret(tenantId: string, sourceId: string, value: object): Promise<string> {
    const secretKey = this.getSecretKey(tenantId, sourceId);
    this.secrets.set(secretKey, value);
    return `/tenants/${tenantId}/datasources/${sourceId}`;
  }

  /**
   * Retrieves a secret from memory.
   * @param tenantId The ID of the tenant.
   * @param sourceId The ID of the data source.
   * @returns The parsed credentials object.
   */
  async getSecret<T extends object>(tenantId: string, sourceId: string): Promise<T | null> {
    const secretKey = this.getSecretKey(tenantId, sourceId);
    const secret = this.secrets.get(secretKey);
    return secret ? secret as T : null;
  }

  /**
   * Deletes a secret from memory.
   * @param tenantId The ID of the tenant.
   * @param sourceId The ID of the data source.
   */
  async deleteSecret(tenantId: string, sourceId: string): Promise<void> {
    const secretKey = this.getSecretKey(tenantId, sourceId);
    this.secrets.delete(secretKey);
  }
}

export const secretsService = new SecretsService();
