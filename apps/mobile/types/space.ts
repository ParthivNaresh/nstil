export interface JournalSpace {
  readonly id: string;
  readonly user_id: string;
  readonly name: string;
  readonly description: string | null;
  readonly color: string | null;
  readonly icon: string | null;
  readonly sort_order: number;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface JournalSpaceCreate {
  readonly name: string;
  readonly description?: string;
  readonly color?: string;
  readonly icon?: string;
}

export interface JournalSpaceUpdate {
  readonly name?: string;
  readonly description?: string;
  readonly color?: string;
  readonly icon?: string;
  readonly sort_order?: number;
}

export interface JournalSpaceListResponse {
  readonly items: JournalSpace[];
}
