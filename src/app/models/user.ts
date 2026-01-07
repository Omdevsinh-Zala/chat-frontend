export interface User {
  id: string;
  first_name: string;
  username: string;
  last_name: string;
  email: string;
  full_name: string;
  avatar_url: string;
  is_active: boolean;
  active_chat_id: string;
}

export interface ReceiverUser {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  full_name: string;
  avatar_url: string;
  is_typing?: boolean;
}
