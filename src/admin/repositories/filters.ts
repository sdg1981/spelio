import type { AudioStatus } from '../types';

export interface AdminFocusFilters {
  listId?: string;
  audioStatus?: AudioStatus;
  search?: string;
}
