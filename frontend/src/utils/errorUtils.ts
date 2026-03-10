import { ApiError } from '../types';

/**
 * Type guard to check if an error is an ApiError
 */
export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    ('response' in error || 'message' in error)
  );
}
