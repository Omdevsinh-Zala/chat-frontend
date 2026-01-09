import { User } from './user';

export interface CreateChannel {
  title: string;
  topic: string;
  description: string;
  isPrivate: boolean;
}

export interface ChannelMember {
  ban_until: Date | null;
  custom_data: string | null;
  id: string;
  invite_by: string | null;
  is_active: boolean;
  is_muted: boolean;
  joined_at: Date;
  left_at: Date | null;
  mute_until: Date | null;
  role: string;
  user_id: string;
  last_read_at: Date | null;
  User: Omit<User, 'is_active' | 'active_chat_id'>;
}

export interface Channel {
  avatar_url: string;
  created_at: Date;
  is_private: boolean;
  last_message_at: Date | null;
  slug: string;
  title: string;
}

export interface ChannelData {
  ChannelMembers: ChannelMember[];
  admin_ids: string[];
  avatar_url: string;
  created_at: Date;
  description: string;
  id: string;
  is_private: boolean;
  last_message_at: Date | null;
  only_admin_can_message: boolean;
  owner_id: string;
  slug: string;
  status: string;
  title: string;
  topic: string;
}
