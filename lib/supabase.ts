import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true, // Automatically refresh token before expiry
    persistSession: true, // Persist session in localStorage
    detectSessionInUrl: true, // Detect session from URL (for email links)
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'jaws-auth-token',
    flowType: 'pkce' // Use PKCE flow for better security
  },
  global: {
    headers: {
      'x-client-info': 'jaws-custom-shop'
    }
  },
  db: {
    schema: 'public'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          username: string
          role: 'user' | 'admin'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          username: string
          role?: 'user' | 'admin'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          username?: string
          role?: 'user' | 'admin'
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          name: string
          price: number
          description: string | null
          image_url: string | null
          stock: number
          vehicle_type: string | null
          item_type: string | null
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          name: string
          price: number
          description?: string | null
          image_url?: string | null
          stock?: number
          vehicle_type?: string | null
          item_type?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          name?: string
          price?: number
          description?: string | null
          image_url?: string | null
          stock?: number
          vehicle_type?: string | null
          item_type?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
      }
    }
  }
}