export interface GroupedChat {
  monthYear: string;
  messages: Message[];
}

export interface Message {
  attachments: AttachmentsType[] | null;
  channel_id: string | null;
  content: string;
  created_at: string;
  deletedAt: string | null;
  deleted_at: string | null;
  edited_at: null;
  id: string;
  message_type: 'image' | 'video' | 'file' | 'audio' | 'pdf' | 'system' | null;
  reactions: null;
  receiver_id: string;
  reply_to: string | null;
  sender_id: string;
  status: 'sending' | 'sent' | 'failed' | 'delivered' | 'read';
  updatedAt: string;
  version: number;
}

export interface AttachmentsType {
  id?: string,
  message_id?: string,
  sender_id?: string,
  receiver_id?: string,
  file_type: string | null,
  file_url: string,
  file_name: string,
  file_size: number,
  mime_type: string,
  metadata?: any
}
