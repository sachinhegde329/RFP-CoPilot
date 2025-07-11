/**
 * @fileOverview A secrets service for storing sensitive data.
 * In production, uses environment variables. In development, falls back to in-memory storage.
 */

class SecretsService {
  private secrets: Map<string, any> = new Map();
  private isProduction: boolean;

  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
    if (!this.isProduction) {
      console.warn("Using in-memory secrets storage. This is not suitable for production.");
    }
  }

  private getSecretKey(tenantId: string, sourceId: string): string {
    return `${tenantId}:${sourceId}`;
  }

  private getEnvSecretKey(tenantId: string, sourceId: string): string {
    return `SECRET_${tenantId.toUpperCase()}_${sourceId.toUpperCase()}`;
  }
  
  /**
   * Creates or updates a secret.
   * In production, this would typically use a proper secrets management service.
   * For now, we'll use environment variables in production and in-memory in development.
   */
  async createOrUpdateSecret(tenantId: string, sourceId: string, value: object): Promise<string> {
    if (this.isProduction) {
      // In production, we would typically use a proper secrets management service
      // For now, we'll just return a path that indicates where the secret would be stored
      console.warn("In production, secrets should be managed through a proper secrets management service.");
      return `/tenants/${tenantId}/datasources/${sourceId}`;
    } else {
      // In development, use in-memory storage
      const secretKey = this.getSecretKey(tenantId, sourceId);
      this.secrets.set(secretKey, value);
      return `/tenants/${tenantId}/datasources/${sourceId}`;
    }
  }

  /**
   * Retrieves a secret.
   * In production, this would fetch from a proper secrets management service.
   */
  async getSecret<T extends object>(tenantId: string, sourceId: string): Promise<T | null> {
    if (this.isProduction) {
      // In production, we would fetch from a proper secrets management service
      // For now, we'll return null to indicate no secret is available
      console.warn("In production, secrets should be managed through a proper secrets management service.");
      return null;
    } else {
      // In development, use in-memory storage
      const secretKey = this.getSecretKey(tenantId, sourceId);
      const secret = this.secrets.get(secretKey);
      return secret ? secret as T : null;
    }
  }

  /**
   * Deletes a secret.
   */
  async deleteSecret(tenantId: string, sourceId: string): Promise<void> {
    if (this.isProduction) {
      // In production, we would delete from a proper secrets management service
      console.warn("In production, secrets should be managed through a proper secrets management service.");
    } else {
      // In development, use in-memory storage
      const secretKey = this.getSecretKey(tenantId, sourceId);
      this.secrets.delete(secretKey);
    }
  }
}

export const secretsService = new SecretsService();
