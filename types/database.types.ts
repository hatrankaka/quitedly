// This file should contain your Supabase database types
// You can generate these types using the Supabase CLI:
// npx supabase gen types typescript --project-id your-project-id > types/database.types.ts

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
      // Define your tables here
      users: {
        Row: {
          id: string
          email: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      // Define your views here
    }
    Functions: {
      // Define your functions here
    }
    Enums: {
      // Define your enums here
    }
  }
}