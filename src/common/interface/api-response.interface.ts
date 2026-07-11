export interface ResponseMeta {
  timestamp: string;
  requestId: string;
  pagination?: CursorPaginationMeta;
}

export interface CursorPaginationMeta {
  nextCursor: string | null;
  hasMore: boolean;
}

export interface CursorPaginatedResult<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta: ResponseMeta;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta: Omit<ResponseMeta, 'pagination'>;
}
