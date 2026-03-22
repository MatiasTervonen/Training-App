export type SocialFeedItem = {
  id: string;
  user_id: string;
  title: string;
  type: string;
  extra_fields: Record<string, unknown>;
  source_id: string;
  occurred_at: string;
  created_at: string;
  updated_at: string | null;
  activity_at: string;
  visibility: "private" | "friends";
  author_display_name: string;
  author_profile_picture: string | null;
  like_count: number;
  user_has_liked: boolean;
  comment_count: number;
};

export type FeedComment = {
  id: string;
  feed_item_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  created_at: string;
  author_display_name: string;
  author_profile_picture: string | null;
  reply_to_display_name: string | null;
};
