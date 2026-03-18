export type Conversation = {
  conversation_id: string;
  is_group: boolean;
  conversation_name: string | null;
  updated_at: string;
  last_message_content: string | null;
  last_message_at: string | null;
  last_message_sender_id: string | null;
  unread_count: number;
  other_user_id: string | null;
  other_user_display_name: string | null;
  other_user_profile_picture: string | null;
  is_active: boolean;
};

export type ChatMessage = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender_display_name: string;
  sender_profile_picture: string | null;
};
