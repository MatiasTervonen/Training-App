export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      chat_conversation_participants: {
        Row: {
          conversation_id: string | null
          created_at: string
          id: string
          joined_at: string | null
          user_id: string | null
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string
          id?: string
          joined_at?: string | null
          user_id?: string | null
        }
        Update: {
          conversation_id?: string | null
          created_at?: string
          id?: string
          joined_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_conversations: {
        Row: {
          created_at: string
          id: string
          is_group: boolean | null
          name: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_group?: boolean | null
          name?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_group?: boolean | null
          name?: string | null
        }
        Relationships: []
      }
      chat_message_status: {
        Row: {
          created_at: string
          id: string
          message_id: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          message_id?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          message_id?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_message_status_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          attachment_url: string | null
          content: string | null
          conversation_id: string | null
          created_at: string
          id: string
          read_by: string | null
          sender_id: string | null
        }
        Insert: {
          attachment_url?: string | null
          content?: string | null
          conversation_id?: string | null
          created_at?: string
          id?: string
          read_by?: string | null
          sender_id?: string | null
        }
        Update: {
          attachment_url?: string | null
          content?: string | null
          conversation_id?: string | null
          created_at?: string
          id?: string
          read_by?: string | null
          sender_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      disc_golf_course_holes: {
        Row: {
          course_id: string | null
          created_at: string
          hole_number: number | null
          id: number
          length: number | null
          par: number | null
        }
        Insert: {
          course_id?: string | null
          created_at?: string
          hole_number?: number | null
          id?: number
          length?: number | null
          par?: number | null
        }
        Update: {
          course_id?: string | null
          created_at?: string
          hole_number?: number | null
          id?: number
          length?: number | null
          par?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "disc_golf_course_holes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "disc_golf_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      disc_golf_courses: {
        Row: {
          created_at: string
          id: string
          name: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string | null
        }
        Relationships: []
      }
      disc_golf_session_scores: {
        Row: {
          c1_putt_attempted: boolean | null
          c1_putt_made: boolean | null
          c2_putt_attempted: boolean | null
          c2_putt_made: boolean | null
          course_name: string | null
          created_at: string
          duration: string | null
          fairway_hit: boolean | null
          hole_number: number | null
          id: number
          is_public: boolean | null
          session_id: string | null
          strokes: number | null
          type: string | null
          user_id: string | null
        }
        Insert: {
          c1_putt_attempted?: boolean | null
          c1_putt_made?: boolean | null
          c2_putt_attempted?: boolean | null
          c2_putt_made?: boolean | null
          course_name?: string | null
          created_at?: string
          duration?: string | null
          fairway_hit?: boolean | null
          hole_number?: number | null
          id?: number
          is_public?: boolean | null
          session_id?: string | null
          strokes?: number | null
          type?: string | null
          user_id?: string | null
        }
        Update: {
          c1_putt_attempted?: boolean | null
          c1_putt_made?: boolean | null
          c2_putt_attempted?: boolean | null
          c2_putt_made?: boolean | null
          course_name?: string | null
          created_at?: string
          duration?: string | null
          fairway_hit?: boolean | null
          hole_number?: number | null
          id?: number
          is_public?: boolean | null
          session_id?: string | null
          strokes?: number | null
          type?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      disc_golf_sessions: {
        Row: {
          course_id: string | null
          id: number
          played_at: string
          played_by: string | null
        }
        Insert: {
          course_id?: string | null
          id?: number
          played_at: string
          played_by?: string | null
        }
        Update: {
          course_id?: string | null
          id?: number
          played_at?: string
          played_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "disc_golf_sessions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "disc_golf_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      friend_requests: {
        Row: {
          created_at: string
          id: string
          receiver_id: string
          sender_id: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          receiver_id: string
          sender_id: string
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          receiver_id?: string
          sender_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "friend_requests_receiver_id_fkey1"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friend_requests_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      friends: {
        Row: {
          created_at: string
          id: string
          user1_id: string | null
          user2_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          user1_id?: string | null
          user2_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          user1_id?: string | null
          user2_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "friends_user1_id_fkey"
            columns: ["user1_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friends_user2_id_fkey"
            columns: ["user2_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      gym_exercises: {
        Row: {
          created_at: string
          equipment: string
          id: string
          language: string
          main_group: string
          muscle_group: string
          name: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          equipment: string
          id?: string
          language?: string
          main_group: string
          muscle_group: string
          name: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          equipment?: string
          id?: string
          language?: string
          main_group?: string
          muscle_group?: string
          name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      gym_session_exercises: {
        Row: {
          exercise_id: string
          id: string
          notes: string | null
          position: number
          session_id: string
          superset_id: string
        }
        Insert: {
          exercise_id: string
          id?: string
          notes?: string | null
          position: number
          session_id: string
          superset_id: string
        }
        Update: {
          exercise_id?: string
          id?: string
          notes?: string | null
          position?: number
          session_id?: string
          superset_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "gym_exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_exercises_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "gym_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      gym_sessions: {
        Row: {
          created_at: string
          duration: number
          id: string
          notes: string | null
          title: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          duration: number
          id?: string
          notes?: string | null
          title?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          duration?: number
          id?: string
          notes?: string | null
          title?: string | null
          user_id?: string
        }
        Relationships: []
      }
      gym_sets: {
        Row: {
          id: string
          reps: number
          rpe: string
          session_exercise_id: string
          set_number: number
          weight: number
        }
        Insert: {
          id?: string
          reps: number
          rpe: string
          session_exercise_id: string
          set_number: number
          weight: number
        }
        Update: {
          id?: string
          reps?: number
          rpe?: string
          session_exercise_id?: string
          set_number?: number
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "sets_session_exercise_id_fkey"
            columns: ["session_exercise_id"]
            isOneToOne: false
            referencedRelation: "gym_session_exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      gym_template_exercises: {
        Row: {
          created_at: string
          exercise_id: string
          id: string
          position: number
          reps: number | null
          sets: number | null
          superset_id: string
          template_id: string
        }
        Insert: {
          created_at?: string
          exercise_id?: string
          id?: string
          position: number
          reps?: number | null
          sets?: number | null
          superset_id: string
          template_id?: string
        }
        Update: {
          created_at?: string
          exercise_id?: string
          id?: string
          position?: number
          reps?: number | null
          sets?: number | null
          superset_id?: string
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gym_template_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "gym_exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gym_template_exercises_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "gym_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      gym_template_sets: {
        Row: {
          id: string
          reps: number | null
          rpe: string | null
          set_number: number | null
          template_exercise_id: string
          weight: number | null
        }
        Insert: {
          id?: string
          reps?: number | null
          rpe?: string | null
          set_number?: number | null
          template_exercise_id: string
          weight?: number | null
        }
        Update: {
          id?: string
          reps?: number | null
          rpe?: string | null
          set_number?: number | null
          template_exercise_id?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "gym_template_sets_template_exercise_id_fkey"
            columns: ["template_exercise_id"]
            isOneToOne: false
            referencedRelation: "gym_template_exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      gym_templates: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at: string
          id?: string
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notes: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          title: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          title?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          title?: string | null
          user_id?: string
        }
        Relationships: []
      }
      pinned_items: {
        Row: {
          id: string
          item_id: string
          pinned_at: string
          table: string
          user_id: string
        }
        Insert: {
          id?: string
          item_id?: string
          pinned_at?: string
          table: string
          user_id: string
        }
        Update: {
          id?: string
          item_id?: string
          pinned_at?: string
          table?: string
          user_id?: string
        }
        Relationships: []
      }
      players: {
        Row: {
          created_at: string
          id: number
          is_quest: boolean | null
          name: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          is_quest?: boolean | null
          name?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          is_quest?: boolean | null
          name?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      timers: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          time_seconds: number | null
          title: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          time_seconds?: number | null
          title?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          time_seconds?: number | null
          title?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          ban_reason: string | null
          banned_until: string | null
          created_at: string
          display_name: string
          email: string
          id: string
          profile_picture: string | null
          role: string
          weight_unit: string
        }
        Insert: {
          ban_reason?: string | null
          banned_until?: string | null
          created_at?: string
          display_name: string
          email: string
          id: string
          profile_picture?: string | null
          role?: string
          weight_unit?: string
        }
        Update: {
          ban_reason?: string | null
          banned_until?: string | null
          created_at?: string
          display_name?: string
          email?: string
          id?: string
          profile_picture?: string | null
          role?: string
          weight_unit?: string
        }
        Relationships: []
      }
      weight: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          title: string | null
          user_id: string
          weight: number
        }
        Insert: {
          created_at: string
          id?: string
          notes?: string | null
          title?: string | null
          user_id: string
          weight: number
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          title?: string | null
          user_id?: string
          weight?: number
        }
        Relationships: []
      }
    }
    Views: {
      debug_session: {
        Row: {
          jwt_role: string | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_jwt: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
