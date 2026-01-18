"use client";

import { createContext, useContext, useEffect, useState, useRef } from 'react'
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
  const isRefreshingRef = useRef(false)
  const lastRefreshRef = useRef<number>(0)

  const refreshUser = async () => {
    if (isRefreshingRef.current) {
      console.log('[AuthContext] Refresh already in progress, skipping...')
      return
    }

    const now = Date.now()
    if (now - lastRefreshRef.current < 10000) {
      console.log('[AuthContext] Refresh called too soon, skipping...')
      return
    }

    isRefreshingRef.current = true
    lastRefreshRef.current = now
    
    console.log('[AuthContext] Starting user refresh...')
    
    try {
      const currentUser = await getCurrentUser()
      console.log('[AuthContext] User fetched:', currentUser ? `${currentUser.username} (${currentUser.email})` : 'null')
      setUser(currentUser)
      
      if (!currentUser) {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          console.warn('[AuthContext] Session exists but user not found, forcing logout...')
          await supabase.auth.signOut()
        }
      }
    } catch (error: any) {
      if (error?.name !== 'AbortError' && !error?.message?.includes('aborted')) {
        console.error('[AuthContext] Error refreshing user:', error)
      }
      setUser(null)
    } finally {
      setLoading(false)
      isRefreshingRef.current = false
      console.log('[AuthContext] Refresh complete')
    }
  }

  useEffect(() => {
    const initAuth = async () => {
      const timeoutId = setTimeout(() => {
        if (loading) {
          console.warn('Auth initialization timeout, setting loading to false')
          setLoading(false)
        }
      }, 15000)

      await refreshUser()
      clearTimeout(timeoutId)
    }

    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event) => {
        console.log('Auth state changed:', event)
        
        if (event === 'SIGNED_IN') {
          await refreshUser()
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setLoading(false)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
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