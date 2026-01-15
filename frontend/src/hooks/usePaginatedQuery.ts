import { 
  useQuery, 
  keepPreviousData, 
  UseQueryOptions, 
  QueryKey 
} from '@tanstack/react-query';

export interface PaginationMetadata {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  data: T[] | undefined; // Allow undefined if backend doesn't return generic data field? No, we standardize.
  pagination: PaginationMetadata;
}

// Expected structure from API wrapper
export interface ApiResponse<T> {
  data: T[];
  pagination: PaginationMetadata;
}

export function usePaginatedQuery<TData>(
  options: {
    queryKey: QueryKey;
    queryFn: () => Promise<PaginatedResult<TData>>;
  } & Omit<UseQueryOptions<PaginatedResult<TData>>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    placeholderData: keepPreviousData,
    ...options
  });
}
