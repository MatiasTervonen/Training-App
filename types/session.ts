export type Exercise = {
  name: string;
  sets: {
    reps: string;
    weight: string;
  }[];
};

export interface Session {
  id: string;
  user_id: string;
  title: string;
  exercises?: Exercise[];
  notes: string;
  duration: number;
  created_at: string;
  type: string;
  pinned: boolean;
}
