export interface User {
  id: string;
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  full_name: string;
  avatar_url: string;
  is_active: boolean;
  active_chat_id: string;
  is_last_active_chat_channel: boolean;
  token: string;
  profileToken: string;
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
