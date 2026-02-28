export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          base_met: number
          category_id: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          slug: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          base_met: number
          category_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          slug?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          base_met?: number
          category_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          slug?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activities_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "activity_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_categories: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_categories_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_gps_points: {
        Row: {
          accuracy: number | null
          altitude: number | null
          bad_signal: boolean | null
          id: string
          is_stationary: boolean | null
          latitude: number
          longitude: number
          recorded_at: string
          session_id: string
        }
        Insert: {
          accuracy?: number | null
          altitude?: number | null
          bad_signal?: boolean | null
          id?: string
          is_stationary?: boolean | null
          latitude: number
          longitude: number
          recorded_at: string
          session_id: string
        }
        Update: {
          accuracy?: number | null
          altitude?: number | null
          bad_signal?: boolean | null
          id?: string
          is_stationary?: boolean | null
          latitude?: number
          longitude?: number
          recorded_at?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_gps_points_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_templates: {
        Row: {
          activity_id: string
          created_at: string
          distance_meters: number | null
          geom: unknown
          id: string
          name: string
          notes: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          activity_id: string
          created_at?: string
          distance_meters?: number | null
          geom?: unknown
          id?: string
          name: string
          notes?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Update: {
          activity_id?: string
          created_at?: string
          distance_meters?: number | null
          geom?: unknown
          id?: string
          name?: string
          notes?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_templates_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_templates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_counts: {
        Row: {
          count: number
          created_at: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          count: number
          created_at?: string | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          count?: number
          created_at?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
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
      feed_items: {
        Row: {
          activity_at: string | null
          created_at: string
          extra_fields: Json
          id: string
          occurred_at: string
          source_id: string
          title: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          activity_at?: string | null
          created_at?: string
          extra_fields?: Json
          id?: string
          occurred_at: string
          source_id: string
          title: string
          type: string
          updated_at?: string | null
          user_id?: string
        }
        Update: {
          activity_at?: string | null
          created_at?: string
          extra_fields?: Json
          id?: string
          occurred_at?: string
          source_id?: string
          title?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feed_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          category: string
          created_at: string
          id: string
          message: string
          title: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          message: string
          title: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          message?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
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
      global_reminders: {
        Row: {
          created_at: string
          created_from_device_id: string | null
          delivered: boolean
          id: string
          mode: string | null
          notes: string | null
          notify_at: string
          seen_at: string | null
          title: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          created_from_device_id?: string | null
          delivered?: boolean
          id?: string
          mode?: string | null
          notes?: string | null
          notify_at: string
          seen_at?: string | null
          title: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Update: {
          created_at?: string
          created_from_device_id?: string | null
          delivered?: boolean
          id?: string
          mode?: string | null
          notes?: string | null
          notify_at?: string
          seen_at?: string | null
          title?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminders_user_id_fkey"
            columns: ["user_id"]
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
          main_group: string
          muscle_group: string
          name: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          equipment: string
          id?: string
          main_group: string
          muscle_group: string
          name: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          equipment?: string
          id?: string
          main_group?: string
          muscle_group?: string
          name?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gym_exercises_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      gym_exercises_translations: {
        Row: {
          created_at: string
          exercise_id: string
          id: string
          language: string
          name: string
        }
        Insert: {
          created_at?: string
          exercise_id: string
          id?: string
          language?: string
          name: string
        }
        Update: {
          created_at?: string
          exercise_id?: string
          id?: string
          language?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "gym_exercises_translations_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "gym_exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      gym_session_exercises: {
        Row: {
          created_at: string | null
          exercise_id: string
          id: string
          notes: string | null
          position: number
          session_id: string
          superset_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          exercise_id: string
          id?: string
          notes?: string | null
          position: number
          session_id: string
          superset_id: string
          user_id?: string
        }
        Update: {
          created_at?: string | null
          exercise_id?: string
          id?: string
          notes?: string | null
          position?: number
          session_id?: string
          superset_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gym_session_exercises_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gym_session_exercises_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "gym_exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      gym_sets: {
        Row: {
          created_at: string
          distance_meters: number | null
          id: string
          reps: number | null
          rpe: string | null
          session_exercise_id: string
          set_number: number
          time_min: number | null
          updated_at: string | null
          user_id: string
          weight: number | null
        }
        Insert: {
          created_at?: string
          distance_meters?: number | null
          id?: string
          reps?: number | null
          rpe?: string | null
          session_exercise_id: string
          set_number: number
          time_min?: number | null
          updated_at?: string | null
          user_id?: string
          weight?: number | null
        }
        Update: {
          created_at?: string
          distance_meters?: number | null
          id?: string
          reps?: number | null
          rpe?: string | null
          session_exercise_id?: string
          set_number?: number
          time_min?: number | null
          updated_at?: string | null
          user_id?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "gym_sets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
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
          superset_id: string
          template_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          exercise_id: string
          id?: string
          position: number
          superset_id: string
          template_id: string
          user_id?: string
        }
        Update: {
          created_at?: string
          exercise_id?: string
          id?: string
          position?: number
          superset_id?: string
          template_id?: string
          user_id?: string
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
          {
            foreignKeyName: "gym_template_exercises_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
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
          user_id: string
          weight: number | null
        }
        Insert: {
          id?: string
          reps?: number | null
          rpe?: string | null
          set_number?: number | null
          template_exercise_id: string
          user_id?: string
          weight?: number | null
        }
        Update: {
          id?: string
          reps?: number | null
          rpe?: string | null
          set_number?: number | null
          template_exercise_id?: string
          user_id?: string
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
          {
            foreignKeyName: "gym_template_sets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
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
          created_at?: string
          id?: string
          name: string
          updated_at?: string | null
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gym_templates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      local_reminders: {
        Row: {
          created_at: string
          delivered: boolean
          id: string
          mode: string | null
          notes: string | null
          notify_at_time: string | null
          notify_date: string | null
          seen_at: string | null
          title: string
          type: string
          updated_at: string | null
          user_id: string
          weekdays: Json | null
        }
        Insert: {
          created_at?: string
          delivered?: boolean
          id?: string
          mode?: string | null
          notes?: string | null
          notify_at_time?: string | null
          notify_date?: string | null
          seen_at?: string | null
          title: string
          type: string
          updated_at?: string | null
          user_id?: string
          weekdays?: Json | null
        }
        Update: {
          created_at?: string
          delivered?: boolean
          id?: string
          mode?: string | null
          notes?: string | null
          notify_at_time?: string | null
          notify_date?: string | null
          seen_at?: string | null
          title?: string
          type?: string
          updated_at?: string | null
          user_id?: string
          weekdays?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "local_reminders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      note_folders: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string | null
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "note_folders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          activity_at: string
          created_at: string
          folder_id: string | null
          id: string
          notes: string | null
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          activity_at?: string
          created_at?: string
          folder_id?: string | null
          id?: string
          notes?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Update: {
          activity_at?: string
          created_at?: string
          folder_id?: string | null
          id?: string
          notes?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "note_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notes_images: {
        Row: {
          created_at: string
          id: string
          note_id: string
          storage_path: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          note_id: string
          storage_path: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          note_id?: string
          storage_path?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_images_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
        ]
      }
      notes_voice: {
        Row: {
          created_at: string
          duration_ms: number
          id: string
          note_id: string
          storage_path: string
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_ms: number
          id?: string
          note_id: string
          storage_path: string
          user_id?: string
        }
        Update: {
          created_at?: string
          duration_ms?: number
          id?: string
          note_id?: string
          storage_path?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_voice_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_voice_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      pinned_items: {
        Row: {
          created_at: string
          feed_item_id: string
          id: string
          pinned_context: string | null
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          feed_item_id: string
          id?: string
          pinned_context?: string | null
          type: string
          user_id?: string
        }
        Update: {
          created_at?: string
          feed_item_id?: string
          id?: string
          pinned_context?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pinned_items_feed_item_id_fkey"
            columns: ["feed_item_id"]
            isOneToOne: false
            referencedRelation: "feed_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pinned_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
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
      session_stats: {
        Row: {
          avg_pace: number | null
          avg_speed: number | null
          bad_signal_time_seconds: number | null
          calories: number | null
          computed_at: string | null
          created_at: string | null
          distance_meters: number | null
          elevation_gain: number | null
          id: string
          max_speed: number | null
          moving_time_seconds: number | null
          session_id: string
          steps: number | null
          total_volume: number | null
          updated_at: string | null
        }
        Insert: {
          avg_pace?: number | null
          avg_speed?: number | null
          bad_signal_time_seconds?: number | null
          calories?: number | null
          computed_at?: string | null
          created_at?: string | null
          distance_meters?: number | null
          elevation_gain?: number | null
          id?: string
          max_speed?: number | null
          moving_time_seconds?: number | null
          session_id: string
          steps?: number | null
          total_volume?: number | null
          updated_at?: string | null
        }
        Update: {
          avg_pace?: number | null
          avg_speed?: number | null
          bad_signal_time_seconds?: number | null
          calories?: number | null
          computed_at?: string | null
          created_at?: string | null
          distance_meters?: number | null
          elevation_gain?: number | null
          id?: string
          max_speed?: number | null
          moving_time_seconds?: number | null
          session_id?: string
          steps?: number | null
          total_volume?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_session_stats_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: true
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          activity_id: string
          created_at: string
          duration: number
          end_time: string
          geom: unknown
          id: string
          notes: string | null
          start_time: string
          template_id: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          activity_id: string
          created_at?: string
          duration: number
          end_time: string
          geom?: unknown
          id?: string
          notes?: string | null
          start_time: string
          template_id?: string | null
          title: string
          updated_at?: string | null
          user_id?: string
        }
        Update: {
          activity_id?: string
          created_at?: string
          duration?: number
          end_time?: string
          geom?: unknown
          id?: string
          notes?: string | null
          start_time?: string
          template_id?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_session_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_session_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_sessions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "activity_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions_voice: {
        Row: {
          created_at: string
          duration_ms: number
          id: string
          session_id: string
          storage_path: string
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_ms: number
          id?: string
          session_id: string
          storage_path: string
          user_id?: string
        }
        Update: {
          created_at?: string
          duration_ms?: number
          id?: string
          session_id?: string
          storage_path?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_voice_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_voice_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      steps_daily: {
        Row: {
          created_at: string
          day: string
          id: string
          steps: number
          timezone: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          day: string
          id?: string
          steps: number
          timezone: string
          updated_at?: string | null
          user_id?: string
        }
        Update: {
          created_at?: string
          day?: string
          id?: string
          steps?: number
          timezone?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "steps_daily_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      timers: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          time_seconds: number
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          time_seconds: number
          title: string
          updated_at?: string | null
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          time_seconds?: number
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "timers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      todo_lists: {
        Row: {
          created_at: string
          id: string
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title: string
          updated_at?: string | null
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "todo_lists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      todo_tasks: {
        Row: {
          created_at: string
          id: string
          is_completed: boolean
          list_id: string
          notes: string | null
          position: number | null
          task: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_completed?: boolean
          list_id: string
          notes?: string | null
          position?: number | null
          task: string
          updated_at?: string | null
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_completed?: boolean
          list_id?: string
          notes?: string | null
          position?: number | null
          task?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "todo_tasks_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "todo_lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "todo_tasks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_push_mobile_subscriptions: {
        Row: {
          created_at: string
          device_id: string
          id: string
          is_active: boolean | null
          platform: string
          token: string
          user_id: string
        }
        Insert: {
          created_at?: string
          device_id: string
          id?: string
          is_active?: boolean | null
          platform: string
          token: string
          user_id?: string
        }
        Update: {
          created_at?: string
          device_id?: string
          id?: string
          is_active?: boolean | null
          platform?: string
          token?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_push_mobile_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_push_subscriptions: {
        Row: {
          auth: string | null
          created_at: string
          device_type: string
          endpoint: string
          id: string
          is_active: boolean
          p256dh: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auth?: string | null
          created_at?: string
          device_type: string
          endpoint: string
          id?: string
          is_active?: boolean
          p256dh?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Update: {
          auth?: string | null
          created_at?: string
          device_type?: string
          endpoint?: string
          id?: string
          is_active?: boolean
          p256dh?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          gps_tracking_enabled: boolean
          has_completed_onboarding: boolean | null
          language: string
          push_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          gps_tracking_enabled?: boolean
          has_completed_onboarding?: boolean | null
          language?: string
          push_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Update: {
          gps_tracking_enabled?: boolean
          has_completed_onboarding?: boolean | null
          language?: string
          push_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          ban_reason: string | null
          banned_until: string | null
          created_at: string
          display_name: string
          email: string | null
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
          email?: string | null
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
          email?: string | null
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
          title: string
          updated_at: string | null
          user_id: string
          weight: number
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          title: string
          updated_at?: string | null
          user_id?: string
          weight: number
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "weight_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
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
      activities_compute_session_stats: {
        Args: { p_session_id: string; p_steps: number }
        Returns: undefined
      }
      activities_get_full_session: {
        Args: { p_session_id: string }
        Returns: Json
      }
      activities_get_templates: { Args: never; Returns: Json }
      activities_save_activity: {
        Args: {
          p_activity_id: string
          p_draftrecordings?: Json
          p_duration: number
          p_end_time: string
          p_notes: string
          p_start_time: string
          p_steps: number
          p_title: string
          p_track: Json
        }
        Returns: string
      }
      activities_save_template: {
        Args: { p_name: string; p_notes: string; p_session_id: string }
        Returns: string
      }
      activity_edit_session: {
        Args: {
          p_activity_id: string
          p_id: string
          p_notes: string
          p_title: string
          p_updated_at: string
        }
        Returns: {
          activity_at: string | null
          created_at: string
          extra_fields: Json
          id: string
          occurred_at: string
          source_id: string
          title: string
          type: string
          updated_at: string | null
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "feed_items"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      feed_delete_session: {
        Args: { p_id: string; p_type: string }
        Returns: undefined
      }
      get_feed_sorted: {
        Args: { p_limit: number; p_offset: number }
        Returns: {
          activity_at: string
          created_at: string
          extra_fields: Json
          id: string
          occurred_at: string
          source_id: string
          title: string
          type: string
          updated_at: string
          user_id: string
        }[]
      }
      get_jwt: { Args: never; Returns: Json }
      gym_edit_session: {
        Args: {
          p_duration: number
          p_exercises: Json
          p_id: string
          p_notes: string
          p_title: string
          p_updated_at: string
        }
        Returns: {
          activity_at: string | null
          created_at: string
          extra_fields: Json
          id: string
          occurred_at: string
          source_id: string
          title: string
          type: string
          updated_at: string | null
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "feed_items"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      gym_edit_template: {
        Args: { p_exercises: Json; p_id: string; p_name: string }
        Returns: string
      }
      gym_latest_history_per_exercise: {
        Args: { exercise_ids: string[] }
        Returns: {
          created_at: string
          equipment: string
          exercise_id: string
          main_group: string
          name: string
          sets: Json
        }[]
      }
      gym_save_session: {
        Args: {
          p_duration: number
          p_end_time: string
          p_exercises: Json
          p_notes: string
          p_start_time: string
          p_title: string
        }
        Returns: string
      }
      gym_save_template: {
        Args: { p_exercises: Json; p_name: string }
        Returns: string
      }
      last_30d_analytics: { Args: never; Returns: Json }
      notes_edit_note: {
        Args: {
          p_deleted_image_ids?: string[]
          p_deleted_recording_ids?: string[]
          p_folder_id?: string
          p_id: string
          p_new_images?: Json
          p_new_recordings?: Json
          p_notes: string
          p_title: string
          p_updated_at: string
        }
        Returns: {
          activity_at: string | null
          created_at: string
          extra_fields: Json
          id: string
          occurred_at: string
          source_id: string
          title: string
          type: string
          updated_at: string | null
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "feed_items"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      notes_get_by_folder: {
        Args: {
          p_folder_id?: string
          p_limit?: number
          p_offset?: number
          p_unfiled_only?: boolean
        }
        Returns: {
          activity_at: string | null
          created_at: string
          extra_fields: Json
          id: string
          occurred_at: string
          source_id: string
          title: string
          type: string
          updated_at: string | null
          user_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "feed_items"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      notes_move_to_folder: {
        Args: { p_folder_id?: string; p_note_id: string }
        Returns: undefined
      }
      notes_save_note: {
        Args: {
          p_draftrecordings?: Json
          p_folder_id?: string
          p_images?: Json
          p_notes: string
          p_title: string
        }
        Returns: string
      }
      reminders_delete_global_reminder: {
        Args: { p_id: string }
        Returns: undefined
      }
      reminders_delete_local_reminder: {
        Args: { p_id: string }
        Returns: undefined
      }
      reminders_edit_global_reminder: {
        Args: {
          p_delivered: boolean
          p_id: string
          p_mode?: string
          p_notes: string
          p_notify_at: string
          p_seen_at: string
          p_title: string
          p_updated_at: string
        }
        Returns: {
          activity_at: string | null
          created_at: string
          extra_fields: Json
          id: string
          occurred_at: string
          source_id: string
          title: string
          type: string
          updated_at: string | null
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "feed_items"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      reminders_edit_local_reminder: {
        Args: {
          p_id: string
          p_mode: string
          p_notes?: string
          p_notify_at_time?: string
          p_notify_date?: string
          p_seen_at?: string
          p_title: string
          p_type: string
          p_updated_at: string
          p_weekdays?: Json
        }
        Returns: {
          activity_at: string | null
          created_at: string
          extra_fields: Json
          id: string
          occurred_at: string
          source_id: string
          title: string
          type: string
          updated_at: string | null
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "feed_items"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      reminders_get_by_tab: {
        Args: { p_tab: string }
        Returns: {
          created_at: string
          delivered: boolean
          id: string
          mode: string
          notes: string
          notify_at: string
          notify_at_time: string
          notify_date: string
          seen_at: string
          title: string
          type: string
          updated_at: string
          weekdays: Json
        }[]
      }
      reminders_save_global_reminder: {
        Args: {
          p_created_from_device_id?: string
          p_mode?: string
          p_notes: string
          p_notify_at: string
          p_title: string
          p_type: string
        }
        Returns: string
      }
      reminders_save_local_reminder: {
        Args: {
          p_mode: string
          p_notes?: string
          p_notify_at_time?: string
          p_notify_date?: string
          p_title: string
          p_type: string
          p_weekdays?: Json
        }
        Returns: string
      }
      todo_check_todo: {
        Args: { p_list_id: string; p_todo_tasks: Json; p_updated_at: string }
        Returns: {
          activity_at: string | null
          created_at: string
          extra_fields: Json
          id: string
          occurred_at: string
          source_id: string
          title: string
          type: string
          updated_at: string | null
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "feed_items"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      todo_edit_todo: {
        Args: {
          p_deleted_ids: string[]
          p_id: string
          p_tasks: Json
          p_title: string
          p_updated_at: string
        }
        Returns: {
          activity_at: string | null
          created_at: string
          extra_fields: Json
          id: string
          occurred_at: string
          source_id: string
          title: string
          type: string
          updated_at: string | null
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "feed_items"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      todo_save_todo: {
        Args: { p_title: string; p_todo_list: Json }
        Returns: string
      }
      weight_edit_weight: {
        Args: {
          p_id: string
          p_notes: string
          p_title: string
          p_updated_at: string
          p_weight: number
        }
        Returns: {
          activity_at: string | null
          created_at: string
          extra_fields: Json
          id: string
          occurred_at: string
          source_id: string
          title: string
          type: string
          updated_at: string | null
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "feed_items"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      weight_save_weight: {
        Args: { p_notes: string; p_title: string; p_weight: number }
        Returns: string
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
