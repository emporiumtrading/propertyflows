export interface ServiceError {
  success: false;
  error: string;
  code?: string;
  details?: any;
}

export interface ServiceSuccess<T> {
  success: true;
  data: T;
}

export type ServiceResult<T> = ServiceSuccess<T> | ServiceError;

export async function withServiceErrorHandling<T>(
  operation: () => Promise<T>,
  context: {
    service: string;
    operation: string;
    fallbackValue?: T;
  }
): Promise<ServiceResult<T>> {
  try {
    const data = await operation();
    return { success: true, data };
  } catch (error: any) {
    const errorMessage = error?.message || String(error);
    console.error(`[${context.service}] ${context.operation} failed:`, {
      error: errorMessage,
      code: error?.code,
      details: error?.response?.data || error?.details,
    });

    if (context.fallbackValue !== undefined) {
      return { success: true, data: context.fallbackValue };
    }

    return {
      success: false,
      error: errorMessage,
      code: error?.code,
      details: error?.response?.data || error?.details,
    };
  }
}

export async function withExternalCall<T>(
  call: () => Promise<T>,
  serviceName: string,
  operationName: string
): Promise<T | null> {
  try {
    return await call();
  } catch (error: any) {
    console.error(`[${serviceName}] ${operationName} error:`, {
      message: error?.message || String(error),
      code: error?.code,
      statusCode: error?.statusCode || error?.status,
    });
    return null;
  }
}

export function createServiceError(message: string, code?: string, details?: any): ServiceError {
  return {
    success: false,
    error: message,
    code,
    details,
  };
}

export function createServiceSuccess<T>(data: T): ServiceSuccess<T> {
  return {
    success: true,
    data,
  };
}
