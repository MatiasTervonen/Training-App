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
          is_calories_relevant: boolean
          is_gps_relevant: boolean
          is_step_relevant: boolean
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
          is_calories_relevant?: boolean
          is_gps_relevant?: boolean
          is_step_relevant?: boolean
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
          is_calories_relevant?: boolean
          is_gps_relevant?: boolean
          is_step_relevant?: boolean
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
      activity_level_daily: {
        Row: {
          created_at: string
          day: string
          id: string
          level: number
          user_id: string
        }
        Insert: {
          created_at?: string
          day: string
          id?: string
          level?: number
          user_id?: string
        }
        Update: {
          created_at?: string
          day?: string
          id?: string
          level?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_level_daily_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
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
          sort_order: number
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
          sort_order?: number
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
          sort_order?: number
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
      chat_conversations: {
        Row: {
          created_at: string
          id: string
          is_group: boolean
          name: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_group?: boolean
          name?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_group?: boolean
          name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string | null
          conversation_id: string
          created_at: string
          deleted_at: string | null
          id: string
          link_preview: Json | null
          media_duration_ms: number | null
          media_storage_path: string | null
          media_thumbnail_path: string | null
          message_type: string
          reply_to_message_id: string | null
          sender_id: string
        }
        Insert: {
          content?: string | null
          conversation_id: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          link_preview?: Json | null
          media_duration_ms?: number | null
          media_storage_path?: string | null
          media_thumbnail_path?: string | null
          message_type?: string
          reply_to_message_id?: string | null
          sender_id?: string
        }
        Update: {
          content?: string | null
          conversation_id?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          link_preview?: Json | null
          media_duration_ms?: number | null
          media_storage_path?: string | null
          media_thumbnail_path?: string | null
          message_type?: string
          reply_to_message_id?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_reply_to_message_id_fkey"
            columns: ["reply_to_message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_participants: {
        Row: {
          conversation_id: string
          id: string
          is_active: boolean
          joined_at: string
          last_read_at: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          id?: string
          is_active?: boolean
          joined_at?: string
          last_read_at?: string
          user_id?: string
        }
        Update: {
          conversation_id?: string
          id?: string
          is_active?: boolean
          joined_at?: string
          last_read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          message_id: string
          user_id?: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_foods: {
        Row: {
          brand: string | null
          calories_per_100g: number | null
          carbs_per_100g: number | null
          created_at: string | null
          fat_per_100g: number | null
          fiber_per_100g: number | null
          id: string
          image_url: string | null
          name: string
          nutrition_label_url: string | null
          protein_per_100g: number | null
          saturated_fat_per_100g: number | null
          serving_description: string | null
          serving_size_g: number | null
          sodium_per_100g: number | null
          sugar_per_100g: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          brand?: string | null
          calories_per_100g?: number | null
          carbs_per_100g?: number | null
          created_at?: string | null
          fat_per_100g?: number | null
          fiber_per_100g?: number | null
          id?: string
          image_url?: string | null
          name: string
          nutrition_label_url?: string | null
          protein_per_100g?: number | null
          saturated_fat_per_100g?: number | null
          serving_description?: string | null
          serving_size_g?: number | null
          sodium_per_100g?: number | null
          sugar_per_100g?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Update: {
          brand?: string | null
          calories_per_100g?: number | null
          carbs_per_100g?: number | null
          created_at?: string | null
          fat_per_100g?: number | null
          fiber_per_100g?: number | null
          id?: string
          image_url?: string | null
          name?: string
          nutrition_label_url?: string | null
          protein_per_100g?: number | null
          saturated_fat_per_100g?: number | null
          serving_description?: string | null
          serving_size_g?: number | null
          sodium_per_100g?: number | null
          sugar_per_100g?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
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
      favorite_foods: {
        Row: {
          created_at: string | null
          custom_food_id: string | null
          food_id: string | null
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          custom_food_id?: string | null
          food_id?: string | null
          id?: string
          user_id?: string
        }
        Update: {
          created_at?: string | null
          custom_food_id?: string | null
          food_id?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorite_foods_custom_food_id_fkey"
            columns: ["custom_food_id"]
            isOneToOne: false
            referencedRelation: "custom_foods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorite_foods_food_id_fkey"
            columns: ["food_id"]
            isOneToOne: false
            referencedRelation: "foods"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_comments: {
        Row: {
          content: string
          created_at: string
          feed_item_id: string
          id: string
          parent_id: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          feed_item_id: string
          id?: string
          parent_id?: string | null
          user_id?: string
        }
        Update: {
          content?: string
          created_at?: string
          feed_item_id?: string
          id?: string
          parent_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feed_comments_feed_item_id_fkey"
            columns: ["feed_item_id"]
            isOneToOne: false
            referencedRelation: "feed_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "feed_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_items: {
        Row: {
          activity_at: string | null
          created_at: string
          extra_fields: Json
          hidden_at: string | null
          id: string
          occurred_at: string
          source_id: string
          title: string
          type: string
          updated_at: string | null
          user_id: string
          visibility: string
        }
        Insert: {
          activity_at?: string | null
          created_at?: string
          extra_fields?: Json
          hidden_at?: string | null
          id?: string
          occurred_at: string
          source_id: string
          title: string
          type: string
          updated_at?: string | null
          user_id?: string
          visibility?: string
        }
        Update: {
          activity_at?: string | null
          created_at?: string
          extra_fields?: Json
          hidden_at?: string | null
          id?: string
          occurred_at?: string
          source_id?: string
          title?: string
          type?: string
          updated_at?: string | null
          user_id?: string
          visibility?: string
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
      feed_likes: {
        Row: {
          created_at: string
          feed_item_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          feed_item_id: string
          id?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          feed_item_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feed_likes_feed_item_id_fkey"
            columns: ["feed_item_id"]
            isOneToOne: false
            referencedRelation: "feed_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_likes_user_id_fkey"
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
          image_paths: string[]
          message: string
          title: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          image_paths?: string[]
          message: string
          title: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          image_paths?: string[]
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
      food_logs: {
        Row: {
          calories: number
          carbs: number | null
          created_at: string | null
          custom_food_id: string | null
          fat: number | null
          food_id: string | null
          id: string
          logged_at: string
          meal_time: string | null
          meal_type: string
          notes: string | null
          protein: number | null
          quantity: number
          serving_size_g: number
          user_id: string
        }
        Insert: {
          calories: number
          carbs?: number | null
          created_at?: string | null
          custom_food_id?: string | null
          fat?: number | null
          food_id?: string | null
          id?: string
          logged_at: string
          meal_time?: string | null
          meal_type?: string
          notes?: string | null
          protein?: number | null
          quantity?: number
          serving_size_g: number
          user_id?: string
        }
        Update: {
          calories?: number
          carbs?: number | null
          created_at?: string | null
          custom_food_id?: string | null
          fat?: number | null
          food_id?: string | null
          id?: string
          logged_at?: string
          meal_time?: string | null
          meal_type?: string
          notes?: string | null
          protein?: number | null
          quantity?: number
          serving_size_g?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "food_logs_custom_food_id_fkey"
            columns: ["custom_food_id"]
            isOneToOne: false
            referencedRelation: "custom_foods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "food_logs_food_id_fkey"
            columns: ["food_id"]
            isOneToOne: false
            referencedRelation: "foods"
            referencedColumns: ["id"]
          },
        ]
      }
      food_nutrients: {
        Row: {
          food_id: string
          id: string
          nutrient_code: string
          unit: string
          value: number
        }
        Insert: {
          food_id: string
          id?: string
          nutrient_code: string
          unit: string
          value: number
        }
        Update: {
          food_id?: string
          id?: string
          nutrient_code?: string
          unit?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "food_nutrients_food_id_fkey"
            columns: ["food_id"]
            isOneToOne: false
            referencedRelation: "foods"
            referencedColumns: ["id"]
          },
        ]
      }
      food_reports: {
        Row: {
          created_at: string | null
          food_id: string
          id: string
          reported_calories_per_100g: number | null
          reported_carbs_per_100g: number | null
          reported_fat_per_100g: number | null
          reported_fiber_per_100g: number | null
          reported_protein_per_100g: number | null
          reported_saturated_fat_per_100g: number | null
          reported_sodium_per_100g: number | null
          reported_sugar_per_100g: number | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          food_id: string
          id?: string
          reported_calories_per_100g?: number | null
          reported_carbs_per_100g?: number | null
          reported_fat_per_100g?: number | null
          reported_fiber_per_100g?: number | null
          reported_protein_per_100g?: number | null
          reported_saturated_fat_per_100g?: number | null
          reported_sodium_per_100g?: number | null
          reported_sugar_per_100g?: number | null
          status?: string
          user_id?: string
        }
        Update: {
          created_at?: string | null
          food_id?: string
          id?: string
          reported_calories_per_100g?: number | null
          reported_carbs_per_100g?: number | null
          reported_fat_per_100g?: number | null
          reported_fiber_per_100g?: number | null
          reported_protein_per_100g?: number | null
          reported_saturated_fat_per_100g?: number | null
          reported_sodium_per_100g?: number | null
          reported_sugar_per_100g?: number | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "food_reports_food_id_fkey"
            columns: ["food_id"]
            isOneToOne: false
            referencedRelation: "foods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "food_reports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      foods: {
        Row: {
          barcode: string | null
          brand: string | null
          calories_per_100g: number | null
          carbs_per_100g: number | null
          created_at: string | null
          fat_per_100g: number | null
          fiber_per_100g: number | null
          id: string
          image_url: string | null
          name: string
          name_en: string | null
          nutrition_label_url: string | null
          protein_per_100g: number | null
          saturated_fat_per_100g: number | null
          serving_description: string | null
          serving_size_g: number | null
          sodium_per_100g: number | null
          source: string | null
          sugar_per_100g: number | null
        }
        Insert: {
          barcode?: string | null
          brand?: string | null
          calories_per_100g?: number | null
          carbs_per_100g?: number | null
          created_at?: string | null
          fat_per_100g?: number | null
          fiber_per_100g?: number | null
          id?: string
          image_url?: string | null
          name: string
          name_en?: string | null
          nutrition_label_url?: string | null
          protein_per_100g?: number | null
          saturated_fat_per_100g?: number | null
          serving_description?: string | null
          serving_size_g?: number | null
          sodium_per_100g?: number | null
          source?: string | null
          sugar_per_100g?: number | null
        }
        Update: {
          barcode?: string | null
          brand?: string | null
          calories_per_100g?: number | null
          carbs_per_100g?: number | null
          created_at?: string | null
          fat_per_100g?: number | null
          fiber_per_100g?: number | null
          id?: string
          image_url?: string | null
          name?: string
          name_en?: string | null
          nutrition_label_url?: string | null
          protein_per_100g?: number | null
          saturated_fat_per_100g?: number | null
          serving_description?: string | null
          serving_size_g?: number | null
          sodium_per_100g?: number | null
          source?: string | null
          sugar_per_100g?: number | null
        }
        Relationships: []
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
      generated_reports: {
        Row: {
          created_at: string
          id: string
          period_end: string
          period_start: string
          report_data: Json
          schedule_id: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          period_end: string
          period_start: string
          report_data?: Json
          schedule_id: string
          title: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          period_end?: string
          period_start?: string
          report_data?: Json
          schedule_id?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "generated_reports_user_id_fkey"
            columns: ["user_id"]
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
      gym_session_phases: {
        Row: {
          activity_id: string
          calories: number | null
          created_at: string | null
          distance_meters: number | null
          duration_seconds: number
          id: string
          is_manual: boolean | null
          phase_type: string
          session_id: string
          steps: number | null
          user_id: string
        }
        Insert: {
          activity_id: string
          calories?: number | null
          created_at?: string | null
          distance_meters?: number | null
          duration_seconds: number
          id?: string
          is_manual?: boolean | null
          phase_type: string
          session_id: string
          steps?: number | null
          user_id?: string
        }
        Update: {
          activity_id?: string
          calories?: number | null
          created_at?: string | null
          distance_meters?: number | null
          duration_seconds?: number
          id?: string
          is_manual?: boolean | null
          phase_type?: string
          session_id?: string
          steps?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gym_session_phases_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gym_session_phases_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      gym_sets: {
        Row: {
          created_at: string
          id: string
          reps: number | null
          rpe: string | null
          session_exercise_id: string
          set_number: number
          updated_at: string | null
          user_id: string
          weight: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          reps?: number | null
          rpe?: string | null
          session_exercise_id: string
          set_number: number
          updated_at?: string | null
          user_id?: string
          weight?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          reps?: number | null
          rpe?: string | null
          session_exercise_id?: string
          set_number?: number
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
          rest_timer_seconds: number | null
          superset_id: string
          template_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          exercise_id: string
          id?: string
          position: number
          rest_timer_seconds?: number | null
          superset_id: string
          template_id: string
          user_id?: string
        }
        Update: {
          created_at?: string
          exercise_id?: string
          id?: string
          position?: number
          rest_timer_seconds?: number | null
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
      gym_template_phases: {
        Row: {
          activity_id: string
          created_at: string | null
          id: string
          phase_type: string
          template_id: string
          user_id: string
        }
        Insert: {
          activity_id: string
          created_at?: string | null
          id?: string
          phase_type: string
          template_id: string
          user_id?: string
        }
        Update: {
          activity_id?: string
          created_at?: string | null
          id?: string
          phase_type?: string
          template_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gym_template_phases_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gym_template_phases_template_id_fkey"
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
          rest_timer_seconds: number | null
          sort_order: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          rest_timer_seconds?: number | null
          sort_order?: number
          updated_at?: string | null
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          rest_timer_seconds?: number | null
          sort_order?: number
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
      habit_logs: {
        Row: {
          accumulated_seconds: number | null
          completed_date: string
          created_at: string
          habit_id: string
          id: string
          user_id: string
        }
        Insert: {
          accumulated_seconds?: number | null
          completed_date: string
          created_at?: string
          habit_id: string
          id?: string
          user_id?: string
        }
        Update: {
          accumulated_seconds?: number | null
          completed_date?: string
          created_at?: string
          habit_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "habit_logs_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "habit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      habits: {
        Row: {
          alarm_type: string
          created_at: string
          frequency_days: number[] | null
          id: string
          is_active: boolean
          name: string
          reminder_time: string | null
          sort_order: number
          target_value: number | null
          type: string
          user_id: string
        }
        Insert: {
          alarm_type?: string
          created_at?: string
          frequency_days?: number[] | null
          id?: string
          is_active?: boolean
          name: string
          reminder_time?: string | null
          sort_order?: number
          target_value?: number | null
          type?: string
          user_id?: string
        }
        Update: {
          alarm_type?: string
          created_at?: string
          frequency_days?: number[] | null
          id?: string
          is_active?: boolean
          name?: string
          reminder_time?: string | null
          sort_order?: number
          target_value?: number | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "habits_user_id_fkey"
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
      notes_videos: {
        Row: {
          created_at: string
          duration_ms: number | null
          id: string
          note_id: string
          storage_path: string
          thumbnail_storage_path: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_ms?: number | null
          id?: string
          note_id: string
          storage_path: string
          thumbnail_storage_path?: string | null
          user_id?: string
        }
        Update: {
          created_at?: string
          duration_ms?: number | null
          id?: string
          note_id?: string
          storage_path?: string
          thumbnail_storage_path?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_videos_note_id_fkey"
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
      notifications: {
        Row: {
          body: string
          created_at: string | null
          data: Json | null
          id: string
          is_read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string | null
          data?: Json | null
          id?: string
          is_read?: boolean | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string | null
          data?: Json | null
          id?: string
          is_read?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      nutrition_goals: {
        Row: {
          calorie_goal: number | null
          carbs_goal: number | null
          created_at: string | null
          custom_meal_types: string[] | null
          fat_goal: number | null
          fiber_goal: number | null
          protein_goal: number | null
          saturated_fat_goal: number | null
          sodium_goal: number | null
          sugar_goal: number | null
          updated_at: string | null
          user_id: string
          visible_nutrients: string[] | null
        }
        Insert: {
          calorie_goal?: number | null
          carbs_goal?: number | null
          created_at?: string | null
          custom_meal_types?: string[] | null
          fat_goal?: number | null
          fiber_goal?: number | null
          protein_goal?: number | null
          saturated_fat_goal?: number | null
          sodium_goal?: number | null
          sugar_goal?: number | null
          updated_at?: string | null
          user_id?: string
          visible_nutrients?: string[] | null
        }
        Update: {
          calorie_goal?: number | null
          carbs_goal?: number | null
          created_at?: string | null
          custom_meal_types?: string[] | null
          fat_goal?: number | null
          fiber_goal?: number | null
          protein_goal?: number | null
          saturated_fat_goal?: number | null
          sodium_goal?: number | null
          sugar_goal?: number | null
          updated_at?: string | null
          user_id?: string
          visible_nutrients?: string[] | null
        }
        Relationships: []
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
      report_schedules: {
        Row: {
          created_at: string
          delivery_day_of_month: number | null
          delivery_day_of_week: number | null
          delivery_hour: number
          id: string
          included_features: string[]
          is_active: boolean
          schedule_type: string
          timezone: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          delivery_day_of_month?: number | null
          delivery_day_of_week?: number | null
          delivery_hour?: number
          id?: string
          included_features?: string[]
          is_active?: boolean
          schedule_type: string
          timezone?: string
          title: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          delivery_day_of_month?: number | null
          delivery_day_of_week?: number | null
          delivery_hour?: number
          id?: string
          included_features?: string[]
          is_active?: boolean
          schedule_type?: string
          timezone?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_schedules_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_meal_items: {
        Row: {
          custom_food_id: string | null
          food_id: string | null
          id: string
          quantity: number
          saved_meal_id: string
          serving_size_g: number
          sort_order: number
        }
        Insert: {
          custom_food_id?: string | null
          food_id?: string | null
          id?: string
          quantity?: number
          saved_meal_id: string
          serving_size_g?: number
          sort_order?: number
        }
        Update: {
          custom_food_id?: string | null
          food_id?: string | null
          id?: string
          quantity?: number
          saved_meal_id?: string
          serving_size_g?: number
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "saved_meal_items_custom_food_id_fkey"
            columns: ["custom_food_id"]
            isOneToOne: false
            referencedRelation: "custom_foods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_meal_items_food_id_fkey"
            columns: ["food_id"]
            isOneToOne: false
            referencedRelation: "foods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_meal_items_saved_meal_id_fkey"
            columns: ["saved_meal_id"]
            isOneToOne: false
            referencedRelation: "saved_meals"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_meals: {
        Row: {
          created_at: string | null
          id: string
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          updated_at?: string | null
          user_id?: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      session_images: {
        Row: {
          created_at: string
          id: string
          session_id: string
          storage_path: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          session_id: string
          storage_path: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          session_id?: string
          storage_path?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_images_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
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
      session_videos: {
        Row: {
          created_at: string
          duration_ms: number | null
          id: string
          session_id: string
          storage_path: string
          thumbnail_storage_path: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_ms?: number | null
          id?: string
          session_id: string
          storage_path: string
          thumbnail_storage_path?: string | null
          user_id?: string
        }
        Update: {
          created_at?: string
          duration_ms?: number | null
          id?: string
          session_id?: string
          storage_path?: string
          thumbnail_storage_path?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_videos_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
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
      sharing_defaults: {
        Row: {
          created_at: string
          id: string
          session_type: string
          share_with_friends: boolean
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          session_type: string
          share_with_friends?: boolean
          updated_at?: string | null
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          session_type?: string
          share_with_friends?: boolean
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sharing_defaults_user_id_fkey"
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
      todo_task_images: {
        Row: {
          created_at: string
          id: string
          storage_path: string
          task_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          storage_path: string
          task_id: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          storage_path?: string
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "todo_task_images_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "todo_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      todo_task_videos: {
        Row: {
          created_at: string
          duration_ms: number | null
          id: string
          storage_path: string
          task_id: string
          thumbnail_storage_path: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_ms?: number | null
          id?: string
          storage_path: string
          task_id: string
          thumbnail_storage_path?: string | null
          user_id?: string
        }
        Update: {
          created_at?: string
          duration_ms?: number | null
          id?: string
          storage_path?: string
          task_id?: string
          thumbnail_storage_path?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "todo_task_videos_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "todo_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      todo_task_voice: {
        Row: {
          created_at: string
          duration_ms: number | null
          id: string
          storage_path: string
          task_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_ms?: number | null
          id?: string
          storage_path: string
          task_id: string
          user_id?: string
        }
        Update: {
          created_at?: string
          duration_ms?: number | null
          id?: string
          storage_path?: string
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "todo_task_voice_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "todo_tasks"
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
          day_reset_hour: number
          gps_tracking_enabled: boolean
          has_completed_onboarding: boolean | null
          language: string
          push_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          day_reset_hour?: number
          gps_tracking_enabled?: boolean
          has_completed_onboarding?: boolean | null
          language?: string
          push_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Update: {
          day_reset_hour?: number
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
          birth_date: string | null
          created_at: string
          display_name: string
          distance_unit: string
          email: string | null
          gender: string | null
          height_cm: number | null
          id: string
          is_tracking_activity: boolean | null
          last_active_at: string | null
          platform: string | null
          profile_picture: string | null
          role: string
          weight_unit: string
        }
        Insert: {
          ban_reason?: string | null
          banned_until?: string | null
          birth_date?: string | null
          created_at?: string
          display_name: string
          distance_unit?: string
          email?: string | null
          gender?: string | null
          height_cm?: number | null
          id: string
          is_tracking_activity?: boolean | null
          last_active_at?: string | null
          platform?: string | null
          profile_picture?: string | null
          role?: string
          weight_unit?: string
        }
        Update: {
          ban_reason?: string | null
          banned_until?: string | null
          birth_date?: string | null
          created_at?: string
          display_name?: string
          distance_unit?: string
          email?: string | null
          gender?: string | null
          height_cm?: number | null
          id?: string
          is_tracking_activity?: boolean | null
          last_active_at?: string | null
          platform?: string | null
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
      weight_images: {
        Row: {
          created_at: string
          id: string
          storage_path: string
          user_id: string
          weight_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          storage_path: string
          user_id?: string
          weight_id: string
        }
        Update: {
          created_at?: string
          id?: string
          storage_path?: string
          user_id?: string
          weight_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "weight_images_weight_id_fkey"
            columns: ["weight_id"]
            isOneToOne: false
            referencedRelation: "weight"
            referencedColumns: ["id"]
          },
        ]
      }
      weight_videos: {
        Row: {
          created_at: string
          duration_ms: number | null
          id: string
          storage_path: string
          thumbnail_storage_path: string | null
          user_id: string
          weight_id: string
        }
        Insert: {
          created_at?: string
          duration_ms?: number | null
          id?: string
          storage_path: string
          thumbnail_storage_path?: string | null
          user_id?: string
          weight_id: string
        }
        Update: {
          created_at?: string
          duration_ms?: number | null
          id?: string
          storage_path?: string
          thumbnail_storage_path?: string | null
          user_id?: string
          weight_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "weight_videos_weight_id_fkey"
            columns: ["weight_id"]
            isOneToOne: false
            referencedRelation: "weight"
            referencedColumns: ["id"]
          },
        ]
      }
      weight_voice: {
        Row: {
          created_at: string
          duration_ms: number | null
          id: string
          storage_path: string
          user_id: string
          weight_id: string
        }
        Insert: {
          created_at?: string
          duration_ms?: number | null
          id?: string
          storage_path: string
          user_id?: string
          weight_id: string
        }
        Update: {
          created_at?: string
          duration_ms?: number | null
          id?: string
          storage_path?: string
          user_id?: string
          weight_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "weight_voice_weight_id_fkey"
            columns: ["weight_id"]
            isOneToOne: false
            referencedRelation: "weight"
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
      accept_friend_request: {
        Args: { p_sender_id: string }
        Returns: undefined
      }
      activities_compute_session_stats: {
        Args: {
          p_session_id: string
          p_step_distance_meters?: number
          p_steps: number
        }
        Returns: undefined
      }
      activities_get_full_session: {
        Args: { p_session_id: string }
        Returns: Json
      }
      activities_get_template_history: {
        Args: { p_template_id: string }
        Returns: Json
      }
      activities_get_templates: { Args: never; Returns: Json }
      activities_reorder_templates: {
        Args: { p_ids: string[] }
        Returns: undefined
      }
      activities_save_activity: {
        Args: {
          p_activity_id: string
          p_draftrecordings?: Json
          p_duration: number
          p_end_time: string
          p_images?: Json
          p_notes: string
          p_start_time: string
          p_step_distance_meters?: number
          p_steps: number
          p_template_id?: string
          p_title: string
          p_track: Json
          p_videos?: Json
          p_visibility?: string
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
          hidden_at: string | null
          id: string
          occurred_at: string
          source_id: string
          title: string
          type: string
          updated_at: string | null
          user_id: string
          visibility: string
        }
        SetofOptions: {
          from: "*"
          to: "feed_items"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      activity_level_get: { Args: { p_date: string }; Returns: number }
      activity_level_upsert: {
        Args: { p_date: string; p_level: number }
        Returns: undefined
      }
      add_feed_comment: {
        Args: {
          p_content: string
          p_feed_item_id: string
          p_parent_id?: string
        }
        Returns: string
      }
      admin_get_food_reports: {
        Args: { p_limit?: number; p_offset?: number; p_status?: string }
        Returns: {
          barcode: string
          brand: string
          created_at: string
          current_calories_per_100g: number
          current_carbs_per_100g: number
          current_fat_per_100g: number
          current_fiber_per_100g: number
          current_protein_per_100g: number
          current_saturated_fat_per_100g: number
          current_sodium_per_100g: number
          current_sugar_per_100g: number
          display_name: string
          food_id: string
          food_name: string
          id: string
          image_url: string
          nutrition_label_url: string
          reported_calories_per_100g: number
          reported_carbs_per_100g: number
          reported_fat_per_100g: number
          reported_fiber_per_100g: number
          reported_protein_per_100g: number
          reported_saturated_fat_per_100g: number
          reported_sodium_per_100g: number
          reported_sugar_per_100g: number
          status: string
          user_email: string
          user_id: string
        }[]
      }
      admin_resolve_food_report: {
        Args: {
          p_action: string
          p_calories_per_100g?: number
          p_carbs_per_100g?: number
          p_fat_per_100g?: number
          p_fiber_per_100g?: number
          p_protein_per_100g?: number
          p_report_id: string
          p_saturated_fat_per_100g?: number
          p_sodium_per_100g?: number
          p_sugar_per_100g?: number
        }
        Returns: undefined
      }
      attach_note_media: {
        Args: {
          p_images?: Json
          p_note_id: string
          p_recordings?: Json
          p_videos?: Json
        }
        Returns: undefined
      }
      attach_session_media: {
        Args: {
          p_images?: Json
          p_recordings?: Json
          p_session_id: string
          p_videos?: Json
        }
        Returns: undefined
      }
      attach_todo_task_media: {
        Args: {
          p_images?: Json
          p_recordings?: Json
          p_task_id: string
          p_videos?: Json
        }
        Returns: undefined
      }
      attach_weight_media: {
        Args: {
          p_images?: Json
          p_recordings?: Json
          p_videos?: Json
          p_weight_id: string
        }
        Returns: undefined
      }
      delete_feed_comment: {
        Args: { p_comment_id: string }
        Returns: undefined
      }
      delete_friend: { Args: { p_friend_id: string }; Returns: undefined }
      delete_message: {
        Args: { p_message_id: string }
        Returns: {
          media_path: string
          thumbnail_path: string
        }[]
      }
      energy_balance_get_daily: {
        Args: { p_date: string; p_tz?: string }
        Returns: Json
      }
      feed_delete_session: {
        Args: { p_id: string; p_type: string }
        Returns: undefined
      }
      get_admin_dashboard_stats: { Args: never; Returns: Json }
      get_admin_user_growth: {
        Args: { p_days?: number }
        Returns: {
          cumulative_users: number
          day: string
          new_users: number
        }[]
      }
      get_all_feedback: {
        Args: { p_limit?: number; p_offset?: number }
        Returns: {
          category: string
          created_at: string
          display_name: string
          id: string
          image_paths: string[]
          message: string
          title: string
          user_email: string
          user_id: string
        }[]
      }
      get_conversations: {
        Args: never
        Returns: {
          conversation_id: string
          conversation_name: string
          is_active: boolean
          is_group: boolean
          last_message_at: string
          last_message_content: string
          last_message_sender_id: string
          last_message_type: string
          other_user_display_name: string
          other_user_id: string
          other_user_profile_picture: string
          unread_count: number
          updated_at: string
        }[]
      }
      get_feed_comments: {
        Args: { p_feed_item_id: string }
        Returns: {
          author_display_name: string
          author_profile_picture: string
          content: string
          created_at: string
          feed_item_id: string
          id: string
          parent_id: string
          reply_to_display_name: string
          user_id: string
        }[]
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
          visibility: string
        }[]
      }
      get_friend_activity_session: {
        Args: { p_feed_item_id: string }
        Returns: Json
      }
      get_friend_activity_session_by_chat: {
        Args: { p_conversation_id: string; p_session_id: string }
        Returns: Json
      }
      get_friend_gym_session: {
        Args: { p_feed_item_id: string; p_language?: string }
        Returns: Json
      }
      get_friend_gym_session_by_chat: {
        Args: {
          p_conversation_id: string
          p_language?: string
          p_session_id: string
        }
        Returns: Json
      }
      get_friends_feed: {
        Args: { p_limit: number; p_offset: number }
        Returns: {
          activity_at: string
          author_display_name: string
          author_profile_picture: string
          comment_count: number
          created_at: string
          extra_fields: Json
          id: string
          like_count: number
          occurred_at: string
          source_id: string
          title: string
          type: string
          updated_at: string
          user_has_liked: boolean
          user_id: string
          visibility: string
        }[]
      }
      get_jwt: { Args: never; Returns: Json }
      get_messages: {
        Args: { p_before?: string; p_conversation_id: string; p_limit?: number }
        Returns: {
          content: string
          conversation_id: string
          created_at: string
          deleted_at: string
          id: string
          link_preview: Json
          media_duration_ms: number
          media_storage_path: string
          media_thumbnail_path: string
          message_type: string
          reactions: Json
          reply_to_content: string
          reply_to_deleted_at: string
          reply_to_message_id: string
          reply_to_message_type: string
          reply_to_sender_name: string
          sender_display_name: string
          sender_id: string
          sender_profile_picture: string
        }[]
      }
      get_or_create_dm: { Args: { p_friend_id: string }; Returns: string }
      get_other_participant_last_read: {
        Args: { p_conversation_id: string }
        Returns: string
      }
      get_total_unread_count: { Args: never; Returns: number }
      gym_edit_session: {
        Args: {
          p_deleted_image_ids?: string[]
          p_deleted_recording_ids?: string[]
          p_deleted_video_ids?: string[]
          p_duration: number
          p_exercises: Json
          p_id: string
          p_new_images?: Json
          p_new_recordings?: Json
          p_new_videos?: Json
          p_notes: string
          p_phases?: Json
          p_title: string
          p_updated_at: string
        }
        Returns: {
          activity_at: string | null
          created_at: string
          extra_fields: Json
          hidden_at: string | null
          id: string
          occurred_at: string
          source_id: string
          title: string
          type: string
          updated_at: string | null
          user_id: string
          visibility: string
        }
        SetofOptions: {
          from: "*"
          to: "feed_items"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      gym_edit_template: {
        Args: {
          p_exercises: Json
          p_id: string
          p_name: string
          p_phases?: Json
          p_rest_timer_seconds?: number
        }
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
      gym_reorder_templates: { Args: { p_ids: string[] }; Returns: undefined }
      gym_save_session: {
        Args: {
          p_duration: number
          p_end_time: string
          p_exercises: Json
          p_images?: Json
          p_notes: string
          p_phases?: Json
          p_recordings?: Json
          p_start_time: string
          p_title: string
          p_videos?: Json
          p_visibility?: string
        }
        Returns: string
      }
      gym_save_template: {
        Args: {
          p_exercises: Json
          p_name: string
          p_phases?: Json
          p_rest_timer_seconds?: number
        }
        Returns: string
      }
      habit_get_stats: {
        Args: { p_date?: string; p_habit_id: string }
        Returns: Json
      }
      habit_toggle_log: {
        Args: { p_date: string; p_habit_id: string; p_tz?: string }
        Returns: boolean
      }
      hide_feed_item: { Args: { p_feed_item_id: string }; Returns: undefined }
      is_chat_partner: { Args: { p_other_user_id: string }; Returns: boolean }
      last_30d_analytics: { Args: never; Returns: Json }
      mark_conversation_read: {
        Args: { p_conversation_id: string }
        Returns: undefined
      }
      notes_edit_note: {
        Args: {
          p_deleted_image_ids?: string[]
          p_deleted_recording_ids?: string[]
          p_deleted_video_ids?: string[]
          p_folder_id?: string
          p_id: string
          p_new_images?: Json
          p_new_recordings?: Json
          p_new_videos?: Json
          p_notes: string
          p_title: string
          p_updated_at: string
        }
        Returns: {
          activity_at: string | null
          created_at: string
          extra_fields: Json
          hidden_at: string | null
          id: string
          occurred_at: string
          source_id: string
          title: string
          type: string
          updated_at: string | null
          user_id: string
          visibility: string
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
          hidden_at: string | null
          id: string
          occurred_at: string
          source_id: string
          title: string
          type: string
          updated_at: string | null
          user_id: string
          visibility: string
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
          p_videos?: Json
        }
        Returns: string
      }
      nutrition_delete_food_log: {
        Args: { p_log_id: string; p_logged_at: string }
        Returns: undefined
      }
      nutrition_delete_saved_meal: {
        Args: { p_meal_id: string }
        Returns: undefined
      }
      nutrition_get_daily_logs: {
        Args: { p_date: string }
        Returns: {
          brand: string
          calories: number
          calories_per_100g: number
          carbs: number
          carbs_per_100g: number
          created_at: string
          custom_food_id: string
          fat: number
          fat_per_100g: number
          fiber_per_100g: number
          food_id: string
          food_name: string
          id: string
          image_url: string
          is_custom: boolean
          meal_time: string
          meal_type: string
          notes: string
          nutrition_label_url: string
          protein: number
          protein_per_100g: number
          quantity: number
          saturated_fat_per_100g: number
          serving_description: string
          serving_size_g: number
          sodium_per_100g: number
          sugar_per_100g: number
        }[]
      }
      nutrition_get_saved_meals: {
        Args: never
        Returns: {
          created_at: string
          id: string
          items: Json
          name: string
          updated_at: string
        }[]
      }
      nutrition_log_food: {
        Args: {
          p_calories?: number
          p_carbs?: number
          p_custom_food_id?: string
          p_fat?: number
          p_food_id?: string
          p_food_name?: string
          p_logged_at?: string
          p_meal_time?: string
          p_meal_type?: string
          p_notes?: string
          p_protein?: number
          p_quantity?: number
          p_serving_size_g?: number
        }
        Returns: string
      }
      nutrition_log_saved_meal: {
        Args: {
          p_logged_at?: string
          p_meal_time?: string
          p_meal_type?: string
          p_saved_meal_id: string
        }
        Returns: undefined
      }
      nutrition_report_food: {
        Args: {
          p_calories_per_100g?: number
          p_carbs_per_100g?: number
          p_fat_per_100g?: number
          p_fiber_per_100g?: number
          p_food_id: string
          p_protein_per_100g?: number
          p_saturated_fat_per_100g?: number
          p_sodium_per_100g?: number
          p_sugar_per_100g?: number
        }
        Returns: string
      }
      nutrition_save_meal: {
        Args: { p_items?: Json; p_meal_id?: string; p_name?: string }
        Returns: string
      }
      nutrition_toggle_favorite: {
        Args: { p_custom_food_id?: string; p_food_id?: string }
        Returns: boolean
      }
      nutrition_update_meal_time: {
        Args: { p_logged_at: string; p_meal_time: string; p_meal_type: string }
        Returns: undefined
      }
      nutrition_upsert_food_from_barcode: {
        Args: {
          p_barcode: string
          p_brand?: string
          p_calories_per_100g?: number
          p_carbs_per_100g?: number
          p_fat_per_100g?: number
          p_fiber_per_100g?: number
          p_image_url?: string
          p_name: string
          p_nutrition_label_url?: string
          p_protein_per_100g?: number
          p_saturated_fat_per_100g?: number
          p_serving_description?: string
          p_serving_size_g?: number
          p_sodium_per_100g?: number
          p_source?: string
          p_sugar_per_100g?: number
        }
        Returns: string
      }
      refresh_habit_feed: {
        Args: { p_date: string; p_tz?: string }
        Returns: undefined
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
          hidden_at: string | null
          id: string
          occurred_at: string
          source_id: string
          title: string
          type: string
          updated_at: string | null
          user_id: string
          visibility: string
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
          hidden_at: string | null
          id: string
          occurred_at: string
          source_id: string
          title: string
          type: string
          updated_at: string | null
          user_id: string
          visibility: string
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
      reminders_get_feed: {
        Args: { p_limit?: number; p_offset?: number; p_tab: string }
        Returns: {
          activity_at: string | null
          created_at: string
          extra_fields: Json
          hidden_at: string | null
          id: string
          occurred_at: string
          source_id: string
          title: string
          type: string
          updated_at: string | null
          user_id: string
          visibility: string
        }[]
        SetofOptions: {
          from: "*"
          to: "feed_items"
          isOneToOne: false
          isSetofReturn: true
        }
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
      report_delete_schedule: {
        Args: { p_schedule_id: string }
        Returns: undefined
      }
      report_generate: {
        Args: {
          p_period_end: string
          p_period_start: string
          p_report_data: Json
          p_schedule_id: string
        }
        Returns: string
      }
      report_get_schedules: { Args: never; Returns: Json }
      report_save_schedule: {
        Args: {
          p_delivery_day_of_month?: number
          p_delivery_day_of_week?: number
          p_delivery_hour?: number
          p_included_features: string[]
          p_schedule_type: string
          p_timezone?: string
          p_title: string
        }
        Returns: string
      }
      report_update_schedule: {
        Args: {
          p_delivery_day_of_month?: number
          p_delivery_day_of_week?: number
          p_delivery_hour?: number
          p_included_features: string[]
          p_schedule_id: string
          p_schedule_type: string
          p_timezone?: string
          p_title: string
        }
        Returns: undefined
      }
      send_message: {
        Args: {
          p_content?: string
          p_conversation_id: string
          p_media_duration_ms?: number
          p_media_storage_path?: string
          p_media_thumbnail_path?: string
          p_message_type?: string
          p_reply_to_message_id?: string
        }
        Returns: string
      }
      set_tracking_status: { Args: { p_tracking: boolean }; Returns: undefined }
      storage_friend_can_read: {
        Args: { p_bucket: string; p_path: string }
        Returns: boolean
      }
      todo_check_todo: {
        Args: { p_list_id: string; p_todo_tasks: Json; p_updated_at: string }
        Returns: {
          activity_at: string | null
          created_at: string
          extra_fields: Json
          hidden_at: string | null
          id: string
          occurred_at: string
          source_id: string
          title: string
          type: string
          updated_at: string | null
          user_id: string
          visibility: string
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
          p_deleted_ids?: string[]
          p_deleted_image_ids?: string[]
          p_deleted_video_ids?: string[]
          p_deleted_voice_ids?: string[]
          p_id: string
          p_tasks: Json
          p_title: string
          p_updated_at: string
        }
        Returns: Json
      }
      todo_get_filtered: {
        Args: { p_filter: string; p_limit: number; p_offset: number }
        Returns: {
          activity_at: string | null
          created_at: string
          extra_fields: Json
          hidden_at: string | null
          id: string
          occurred_at: string
          source_id: string
          title: string
          type: string
          updated_at: string | null
          user_id: string
          visibility: string
        }[]
        SetofOptions: {
          from: "*"
          to: "feed_items"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      todo_save_todo: {
        Args: { p_title: string; p_todo_list: Json }
        Returns: Json
      }
      toggle_feed_like: { Args: { p_feed_item_id: string }; Returns: boolean }
      toggle_reaction: {
        Args: { p_emoji: string; p_message_id: string }
        Returns: boolean
      }
      update_last_active: { Args: { p_platform?: string }; Returns: undefined }
      weight_edit_weight: {
        Args: {
          p_deleted_image_ids?: string[]
          p_deleted_recording_ids?: string[]
          p_deleted_video_ids?: string[]
          p_id: string
          p_new_images?: Json
          p_new_recordings?: Json
          p_new_videos?: Json
          p_notes: string
          p_title: string
          p_updated_at: string
          p_weight: number
        }
        Returns: {
          activity_at: string | null
          created_at: string
          extra_fields: Json
          hidden_at: string | null
          id: string
          occurred_at: string
          source_id: string
          title: string
          type: string
          updated_at: string | null
          user_id: string
          visibility: string
        }
        SetofOptions: {
          from: "*"
          to: "feed_items"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      weight_save_weight: {
        Args: {
          p_images?: Json
          p_notes: string
          p_recordings?: Json
          p_title: string
          p_videos?: Json
          p_weight: number
        }
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
