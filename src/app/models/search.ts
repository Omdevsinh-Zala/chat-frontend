export interface SearchUserResponse {
  avatar_url: string;
  first_name: string;
  full_name: string;
  id: string;
  is_active: boolean;
  last_name: string;
  username: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  total: number;
  limit: number;
}