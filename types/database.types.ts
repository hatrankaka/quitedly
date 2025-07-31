export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string | null
          display_name: string | null
          avatar_url: string | null
          commitment_mode: Database['public']['Enums']['commitment_mode']
          preferred_check_in_days: number[]
          timezone: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username?: string | null
          display_name?: string | null
          avatar_url?: string | null
          commitment_mode?: Database['public']['Enums']['commitment_mode']
          preferred_check_in_days?: number[]
          timezone?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          display_name?: string | null
          avatar_url?: string | null
          commitment_mode?: Database['public']['Enums']['commitment_mode']
          preferred_check_in_days?: number[]
          timezone?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      habits: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          category: Database['public']['Enums']['habit_category']
          commitment_mode: Database['public']['Enums']['commitment_mode']
          target_frequency: string | null
          preferred_days: number[] | null
          reminder_time: string | null
          is_active: boolean
          is_archived: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          category?: Database['public']['Enums']['habit_category']
          commitment_mode: Database['public']['Enums']['commitment_mode']
          target_frequency?: string | null
          preferred_days?: number[] | null
          reminder_time?: string | null
          is_active?: boolean
          is_archived?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          category?: Database['public']['Enums']['habit_category']
          commitment_mode?: Database['public']['Enums']['commitment_mode']
          target_frequency?: string | null
          preferred_days?: number[] | null
          reminder_time?: string | null
          is_active?: boolean
          is_archived?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "habits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      check_ins: {
        Row: {
          id: string
          habit_id: string
          user_id: string
          check_in_type: Database['public']['Enums']['check_in_type']
          content: string | null
          voice_url: string | null
          photo_url: string | null
          measurement_value: number | null
          measurement_unit: string | null
          mood_score: number | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          habit_id: string
          user_id: string
          check_in_type: Database['public']['Enums']['check_in_type']
          content?: string | null
          voice_url?: string | null
          photo_url?: string | null
          measurement_value?: number | null
          measurement_unit?: string | null
          mood_score?: number | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          habit_id?: string
          user_id?: string
          check_in_type?: Database['public']['Enums']['check_in_type']
          content?: string | null
          voice_url?: string | null
          photo_url?: string | null
          measurement_value?: number | null
          measurement_unit?: string | null
          mood_score?: number | null
          notes?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "check_ins_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "check_ins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      milestones: {
        Row: {
          id: string
          habit_id: string
          user_id: string
          name: string
          description: string | null
          target_date: string | null
          completed_date: string | null
          is_completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          habit_id: string
          user_id: string
          name: string
          description?: string | null
          target_date?: string | null
          completed_date?: string | null
          is_completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          habit_id?: string
          user_id?: string
          name?: string
          description?: string | null
          target_date?: string | null
          completed_date?: string | null
          is_completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "milestones_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "milestones_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      anonymous_posts: {
        Row: {
          id: string
          user_id: string
          habit_category: Database['public']['Enums']['habit_category'] | null
          content: string
          is_milestone: boolean
          support_count: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          habit_category?: Database['public']['Enums']['habit_category'] | null
          content: string
          is_milestone?: boolean
          support_count?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          habit_category?: Database['public']['Enums']['habit_category'] | null
          content?: string
          is_milestone?: boolean
          support_count?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "anonymous_posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      anonymous_supports: {
        Row: {
          id: string
          post_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          user_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "anonymous_supports_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "anonymous_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anonymous_supports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          tier: Database['public']['Enums']['subscription_tier']
          status: Database['public']['Enums']['subscription_status']
          current_period_start: string | null
          current_period_end: string | null
          cancel_at_period_end: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier?: Database['public']['Enums']['subscription_tier']
          status?: Database['public']['Enums']['subscription_status']
          current_period_start?: string | null
          current_period_end?: string | null
          cancel_at_period_end?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier?: Database['public']['Enums']['subscription_tier']
          status?: Database['public']['Enums']['subscription_status']
          current_period_start?: string | null
          current_period_end?: string | null
          cancel_at_period_end?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      handle_new_user: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      update_updated_at: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
    }
    Enums: {
      commitment_mode: 'free_flow' | 'gentle_rhythm' | 'committed_path'
      habit_category: 'health' | 'productivity' | 'personal' | 'relationships' | 'finance' | 'learning' | 'creative' | 'other'
      check_in_type: 'text' | 'voice' | 'photo' | 'measurement'
      subscription_status: 'active' | 'canceled' | 'past_due' | 'trialing'
      subscription_tier: 'free' | 'pro' | 'team'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types for better type inference
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]

// Specific table types for easier imports
export type Profile = Tables<'profiles'>
export type Habit = Tables<'habits'>
export type CheckIn = Tables<'check_ins'>
export type Milestone = Tables<'milestones'>
export type AnonymousPost = Tables<'anonymous_posts'>
export type AnonymousSupport = Tables<'anonymous_supports'>
export type Subscription = Tables<'subscriptions'>

// Enum types for easier imports
export type CommitmentMode = Enums<'commitment_mode'>
export type HabitCategory = Enums<'habit_category'>
export type CheckInType = Enums<'check_in_type'>
export type SubscriptionStatus = Enums<'subscription_status'>
export type SubscriptionTier = Enums<'subscription_tier'>

// Insert types for creating new records
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type HabitInsert = Database['public']['Tables']['habits']['Insert']
export type CheckInInsert = Database['public']['Tables']['check_ins']['Insert']
export type MilestoneInsert = Database['public']['Tables']['milestones']['Insert']
export type AnonymousPostInsert = Database['public']['Tables']['anonymous_posts']['Insert']
export type AnonymousSupportInsert = Database['public']['Tables']['anonymous_supports']['Insert']
export type SubscriptionInsert = Database['public']['Tables']['subscriptions']['Insert']

// Update types for updating records
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']
export type HabitUpdate = Database['public']['Tables']['habits']['Update']
export type CheckInUpdate = Database['public']['Tables']['check_ins']['Update']
export type MilestoneUpdate = Database['public']['Tables']['milestones']['Update']
export type AnonymousPostUpdate = Database['public']['Tables']['anonymous_posts']['Update']
export type AnonymousSupportUpdate = Database['public']['Tables']['anonymous_supports']['Update']
export type SubscriptionUpdate = Database['public']['Tables']['subscriptions']['Update']