import { z } from 'zod';

// Common validation schemas
export const emailSchema = z.string().email('Invalid email address');
export const passwordSchema = z.string().min(8, 'Password must be at least 8 characters');
export const urlSchema = z.string().url('Invalid URL');
export const tenantIdSchema = z.string().min(1, 'Tenant ID is required');
export const rfpIdSchema = z.string().min(1, 'RFP ID is required');

// File validation
export const fileSchema = z.object({
  name: z.string().min(1, 'File name is required'),
  size: z.number().max(10 * 1024 * 1024, 'File size must be less than 10MB'), // 10MB limit
  type: z.string().refine((type) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    return allowedTypes.includes(type);
  }, 'File type not allowed'),
});

// RFP validation
export const rfpSchema = z.object({
  name: z.string().min(1, 'RFP name is required').max(255, 'RFP name too long'),
  text: z.string().min(1, 'RFP text is required'),
  tenantId: tenantIdSchema,
});

// Question validation
export const questionSchema = z.object({
  text: z.string().min(1, 'Question text is required').max(1000, 'Question too long'),
  category: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
});

// Answer validation
export const answerSchema = z.object({
  text: z.string().min(1, 'Answer text is required').max(10000, 'Answer too long'),
  sources: z.array(z.string()).optional(),
  confidence: z.number().min(0).max(1).optional(),
});

// Knowledge source validation
export const knowledgeSourceSchema = z.object({
  type: z.enum(['document', 'website', 'api']),
  name: z.string().min(1, 'Source name is required'),
  config: z.record(z.any()),
  auth: z.record(z.any()).optional(),
});

// User input sanitization
export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, ''); // Remove event handlers
}

export function sanitizeHTML(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '') // Remove iframe tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, ''); // Remove event handlers
}

// Validation helper
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0]?.message || 'Validation failed' };
    }
    return { success: false, error: 'Unknown validation error' };
  }
}

// Rate limiting validation
export function validateRateLimit(identifier: string, rateLimiter: any): boolean {
  return rateLimiter.isAllowed(identifier);
}

// CSRF protection
export function generateCSRFToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export function validateCSRFToken(token: string, expectedToken: string): boolean {
  return token === expectedToken;
} 