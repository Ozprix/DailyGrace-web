
// Assuming this is the content of your logger.ts
// I will make corrections based on the errors provided.
// Replace this with your actual file content, applying the fix.

import * as functions from 'firebase-functions';

// Simplified logger example
export class Logger {
  private sanitizeData(data: any): any {
    // Implement your data sanitization logic here if needed
    // For example, remove sensitive fields
    if (data && typeof data === 'object') {
      const sanitized = { ...data };
      if ('password' in sanitized) delete sanitized.password;
      // Add more sanitization rules
      return sanitized;
    }
    return data;
  }

  info(message: string, data?: any): void {
    if (data) {
        functions.logger.info(message, { data: this.sanitizeData(data) });
    } else {
        functions.logger.info(message);
    }
  }

  warn(message: string, data?: any): void {
    if (data) {
        functions.logger.warn(message, { data: this.sanitizeData(data) });
    } else {
        functions.logger.warn(message);
    }
  }

  error(message: string, error?: Error, data?: any): void {
    const logData: any[] = [];
    if (error) {
        logData.push({ errorMessage: error.message, stack: error.stack });
    }
    if (data) {
        logData.push({ data: this.sanitizeData(data) });
    }
    functions.logger.error(message, ...logData);
  }
}

// Export an instance or use static methods as per your design
export const logger = new Logger();
