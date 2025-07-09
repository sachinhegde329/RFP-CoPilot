
import { InfisicalClient } from 'infisical-node';

class SecretsService {
  private client: InfisicalClient | null = null;
  private environment: string;

  constructor() {
    this.environment = process.env.INFISICAL_ENVIRONMENT || 'prod';
    
    if (process.env.INFISICAL_TOKEN) {
      this.client = new InfisicalClient({
        token: process.env.INFISICAL_TOKEN,
      });
    } else {
      console.warn("INFISICAL_TOKEN not set. Secrets service will be disabled.");
    }
  }

  private getSecretPath(tenantId: string): string {
    return `/tenants/${tenantId}/datasources`;
  }
  
  /**
   * Creates or updates a secret in Infisical.
   * @param tenantId The ID of the tenant, used for namespacing.
   * @param sourceId The ID of the data source, used as the secret key.
   * @param value The credentials object to store.
   * @returns The path used to reference the secret.
   */
  async createOrUpdateSecret(tenantId: string, sourceId: string, value: object): Promise<string> {
    if (!this.client) {
      throw new Error("Secrets service is not initialized.");
    }

    const secretPath = this.getSecretPath(tenantId);
    const secretKey = sourceId;

    try {
      // First, try to update the secret. This will fail if it doesn't exist.
      await this.client.updateSecret({
        projectId: process.env.INFISICAL_PROJECT_ID!,
        environment: this.environment,
        secretPath: secretPath,
        secretKey: secretKey,
        secretValue: JSON.stringify(value),
      });
    } catch (error) {
      // If update fails (likely a 404), create the secret instead.
       await this.client.createSecret({
        projectId: process.env.INFISICAL_PROJECT_ID!,
        environment: this.environment,
        secretPath: secretPath,
        secretKey: secretKey,
        secretValue: JSON.stringify(value),
       });
    }

    return `${secretPath}/${secretKey}`;
  }

  /**
   * Retrieves a secret from Infisical.
   * @param tenantId The ID of the tenant.
   * @param sourceId The ID of the data source.
   * @returns The parsed credentials object.
   */
  async getSecret<T extends object>(tenantId: string, sourceId: string): Promise<T | null> {
    if (!this.client) {
      throw new Error("Secrets service is not initialized.");
    }

    try {
      const secret = await this.client.getSecret({
        projectId: process.env.INFISICAL_PROJECT_ID!,
        environment: this.environment,
        secretPath: this.getSecretPath(tenantId),
        secretKey: sourceId,
      });

      if (secret.secretValue) {
        return JSON.parse(secret.secretValue) as T;
      }
      return null;
    } catch (error) {
      console.error(`Failed to retrieve secret for source ${sourceId} in tenant ${tenantId}:`, error);
      return null;
    }
  }

  /**
   * Deletes a secret from Infisical.
   * @param tenantId The ID of the tenant.
   * @param sourceId The ID of the data source.
   */
  async deleteSecret(tenantId: string, sourceId: string): Promise<void> {
    if (!this.client) {
      throw new Error("Secrets service is not initialized.");
    }

    try {
      await this.client.deleteSecret({
        projectId: process.env.INFISICAL_PROJECT_ID!,
        environment: this.environment,
        secretPath: this.getSecretPath(tenantId),
        secretKey: sourceId,
      });
    } catch (error) {
       console.error(`Failed to delete secret for source ${sourceId} in tenant ${tenantId}:`, error);
       // We don't re-throw here to allow the deletion of the source record to proceed.
    }
  }
}

export const secretsService = new SecretsService();
