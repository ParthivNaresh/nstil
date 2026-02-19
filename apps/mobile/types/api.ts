export interface PaginatedResponse<T> {
  readonly items: T[];
  readonly next_cursor: string | null;
  readonly has_more: boolean;
}

export interface CursorParams {
  readonly cursor?: string;
  readonly limit?: number;
}

export interface SearchParams {
  readonly query: string;
  readonly cursor?: string;
  readonly limit?: number;
}
