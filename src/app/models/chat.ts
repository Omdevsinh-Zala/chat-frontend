export interface Chat {
  attachments: string | null;
  channel_id: string | null;
  content: string;
  created_at: string;
  deletedAt: string | null;
  deleted_at: string | null;
  edited_at: null;
  id: string;
  message_type: 'text' | 'image' | 'video' | 'file';
  reactions: null;
  receiver_id: string;
  reply_to: string | null;
  sender_id: string;
  status: 'sent' | 'failed' | 'delivered' | 'read';
  updatedAt: string;
  version: number;
}
