export interface PaginatedResponse<T> {
  readonly items: T[];
  readonly next_cursor: string | null;
  readonly has_more: boolean;
}

export interface CursorParams {
  readonly cursor?: string;
  readonly limit?: number;
}
