"use client";

import { createContext, useContext, useEffect, useState } from 'react'
import { AuthUser, getCurrentUser } from '../lib/auth'
import { supabase } from '../lib/supabase'

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  refreshUser: async () => {}
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshUser = async () => {
    try {
      // Check if token is expired and refresh if needed
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session && session.expires_at! * 1000 < Date.now() + 60000) { // Refresh 1 minute before expiry
        console.log('Token expiring soon, refreshing...')
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
        
        if (refreshError) {
          console.error('Token refresh failed:', refreshError)
        }
      }
      
      const currentUser = await getCurrentUser()
      setUser(currentUser)
    } catch (error) {
      console.error('Error refreshing user:', error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Get initial user
    refreshUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session ? 'session exists' : 'no session')
        
        if (event === 'SIGNED_IN' && session) {
          await refreshUser()
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setLoading(false)
        } else if (event === 'TOKEN_REFRESHED' && session) {
          console.log('Token refreshed automatically')
          await refreshUser()
        }
      }
    )

    // Set up periodic token refresh check
    const tokenCheckInterval = setInterval(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session && session.expires_at! * 1000 < Date.now() + 300000) { // Refresh 5 minutes before expiry
        console.log('Periodic token refresh check - refreshing token')
        const { error } = await supabase.auth.refreshSession()
        if (error) {
          console.error('Periodic token refresh failed:', error)
        }
      }
    }, 60000) // Check every minute

    return () => {
      subscription.unsubscribe()
      clearInterval(tokenCheckInterval)
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}