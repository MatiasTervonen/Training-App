export type MessageType = "text" | "image" | "video" | "voice";

export type LinkPreview = {
  url: string;
  title: string | null;
  description: string | null;
  image: string | null;
  site_name: string | null;
};

export type Conversation = {
  conversation_id: string;
  is_group: boolean;
  conversation_name: string | null;
  updated_at: string;
  last_message_content: string | null;
  last_message_at: string | null;
  last_message_sender_id: string | null;
  last_message_type: MessageType | null;
  unread_count: number;
  other_user_id: string | null;
  other_user_display_name: string | null;
  other_user_profile_picture: string | null;
  is_active: boolean;
};

export type ReactionSummary = {
  emoji: string;
  count: number;
  user_reacted: boolean;
};

export type ChatMessage = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string | null;
  created_at: string;
  sender_display_name: string;
  sender_profile_picture: string | null;
  message_type: MessageType;
  media_storage_path: string | null;
  media_thumbnail_path: string | null;
  media_duration_ms: number | null;
  link_preview: LinkPreview | null;
  deleted_at: string | null;
  reply_to_message_id: string | null;
  reply_to_content: string | null;
  reply_to_sender_name: string | null;
  reply_to_message_type: MessageType | null;
  reply_to_deleted_at: string | null;
  reactions: ReactionSummary[];
  // Client-only fields for optimistic updates:
  _localMediaUri?: string;
  _localThumbnailUri?: string;
  _isUploading?: boolean;
  _isFetchingPreview?: boolean;
};
