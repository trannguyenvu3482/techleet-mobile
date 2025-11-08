export interface BulkOperationResult<T = unknown> {
  success: boolean;
  item: T;
  error?: Error;
}

export interface BulkOperationProgress {
  total: number;
  completed: number;
  failed: number;
  currentItem?: string;
}

export interface BulkOperationOptions {
  onProgress?: (progress: BulkOperationProgress) => void;
  batchSize?: number;
  delayBetweenBatches?: number;
}

export class BulkOperations {
  static async executeSequentially<T, R>(
    items: T[],
    operation: (item: T) => Promise<R>,
    options: BulkOperationOptions = {}
  ): Promise<BulkOperationResult<R>[]> {
    const { onProgress, batchSize = 1, delayBetweenBatches = 0 } = options;
    const results: BulkOperationResult<R>[] = [];
    let completed = 0;
    let failed = 0;

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      
      for (const item of batch) {
        try {
          const result = await operation(item);
          results.push({ success: true, item: result });
          completed++;
        } catch (error) {
          results.push({
            success: false,
            item: null as unknown as R,
            error: error instanceof Error ? error : new Error(String(error)),
          });
          failed++;
        }

        if (onProgress) {
          onProgress({
            total: items.length,
            completed,
            failed,
          });
        }
      }

      if (delayBetweenBatches > 0 && i + batchSize < items.length) {
        await new Promise((resolve) => setTimeout(resolve, delayBetweenBatches));
      }
    }

    return results;
  }

  static async executeInParallel<T, R>(
    items: T[],
    operation: (item: T) => Promise<R>,
    options: BulkOperationOptions = {}
  ): Promise<BulkOperationResult<R>[]> {
    const { onProgress, batchSize = 5 } = options;
    const results: BulkOperationResult<R>[] = [];
    let completed = 0;
    let failed = 0;

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      
      const batchResults = await Promise.allSettled(
        batch.map((item) => operation(item))
      );

      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push({ success: true, item: result.value });
          completed++;
        } else {
          results.push({
            success: false,
            item: null as unknown as R,
            error: result.reason instanceof Error ? result.reason : new Error(String(result.reason)),
          });
          failed++;
        }

        if (onProgress) {
          onProgress({
            total: items.length,
            completed,
            failed,
          });
        }
      });
    }

    return results;
  }

  static getSummary(results: BulkOperationResult[]): {
    total: number;
    success: number;
    failed: number;
    successRate: number;
  } {
    const total = results.length;
    const success = results.filter((r) => r.success).length;
    const failed = total - success;
    const successRate = total > 0 ? (success / total) * 100 : 0;

    return {
      total,
      success,
      failed,
      successRate: Math.round(successRate * 100) / 100,
    };
  }
}

