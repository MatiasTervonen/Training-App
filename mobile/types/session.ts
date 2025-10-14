export type Feed_item = {
  id: string;
  item_id?: string;
  type: "notes" | "weight" | "gym_sessions" | "todo_lists";
  created_at: string;
  notes?: string | null;
  title?: string | null;
  weight?: number | null;
  duration?: number | null;
  user_id: string;
  pinned: boolean;
  pinned_at?: string | null;
  notify_at?: string | Date | null;
  delivered?: string | null;
};


export type FeedCardProps = {
  table: "notes" | "gym_sessions" | "weight" | "todo_lists" | "reminders";
  item: Feed_item;
  pinned: boolean;
  onTogglePin: () => void;
  onDelete: () => void;
  onExpand: () => void;
  onEdit: () => void;
};

export type FeedResponse = {
  feed: Feed_item[];
  nextPage: number | null;
};