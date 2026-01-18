import { supabase } from './supabase'

export interface AuthUser {
  id: string
  email: string
  username: string
  role: 'user' | 'admin'
}

export interface RegisterData {
  email: string
  username: string
  password: string
}

export interface LoginData {
  email: string
  password: string
}

export interface OTPVerificationData {
  email: string
  otp: string
}

export async function sendOTPSimple(email: string) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: 'temporary_password_123!',
      options: {
        emailRedirectTo: undefined,
      }
    })

    if (error) {
      if (error.message.includes('User already registered')) {
        return { 
          success: false, 
          error: 'Email already registered. Please use login instead.',
          userExists: true
        }
      }
      throw error
    }

    return { 
      success: true, 
      message: 'Verification code sent to your email!',
      userId: data.user?.id
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function verifyEmailToken(email: string, token: string) {
  try {
    const { data, error } = await supabase.auth.verifyOtp({
      email: email,
      token: token,
      type: 'signup'
    })

    if (error) throw error

    return { success: true, authData: data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function completeRegistration(data: RegisterData & { otp: string }) {
  try {
    const verifyResult = await verifyEmailToken(data.email, data.otp)
    
    if (!verifyResult.success || !verifyResult.authData?.user) {
      return { success: false, error: 'Invalid verification code' }
    }

    const user = verifyResult.authData.user

    const { error: passwordError } = await supabase.auth.updateUser({
      password: data.password
    })

    if (passwordError) {
      console.warn('Password update warning:', passwordError.message)
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        email: data.email,
        username: data.username,
        role: 'user'
      }, {
        onConflict: 'id'
      })

    if (profileError) throw profileError

    return { success: true, user: user }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function registerUser(data: RegisterData) {
  try {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    })

    if (authError) throw authError

    if (!authData.user) {
      throw new Error('Failed to create user')
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: data.email,
        username: data.username,
        role: 'user'
      })

    if (profileError) throw profileError

    return { success: true, user: authData.user }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function loginUser(data: LoginData) {
  try {
    // Add timeout to prevent stuck requests
    const loginPromise = supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })

    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Login request timeout. Please check your connection.')), 15000)
    )

    const { data: authData, error: authError } = await Promise.race([
      loginPromise,
      timeoutPromise
    ]) as any

    if (authError) {
      // Handle specific auth errors
      if (authError.message === 'signal is aborted without reason') {
        return { success: false, error: 'Login request was cancelled. Please try again.' }
      }
      throw authError
    }

    if (!authData.user || !authData.session) {
      throw new Error('Login failed - no session created')
    }

    // Verify session is valid and not expired
    const expiresAt = authData.session.expires_at
    if (expiresAt && expiresAt * 1000 < Date.now()) {
      console.log('Session expired immediately, refreshing...')
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
      if (refreshError) {
        throw new Error('Failed to refresh session after login')
      }
    }

    // Get user profile with retry logic and timeout
    let retryCount = 0
    const maxRetries = 3
    
    while (retryCount < maxRetries) {
      try {
        const profilePromise = supabase
          .from('profiles')
          .select('*')
          .eq('id', authData.user.id)
          .single()

        const profileTimeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Profile fetch timeout')), 10000)
        )

        const { data: profile, error: profileError } = await Promise.race([
          profilePromise,
          profileTimeoutPromise
        ]) as any

        if (profileError) {
          if (profileError.message === 'signal is aborted without reason' || 
              profileError.message === 'Profile fetch timeout') {
            retryCount++
            if (retryCount >= maxRetries) {
              return { success: false, error: 'Unable to load user profile. Please try again.' }
            }
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount))
            continue
          }
          throw profileError
        }

        return { 
          success: true, 
          user: {
            id: profile.id,
            email: profile.email,
            username: profile.username,
            role: profile.role
          } as AuthUser,
          session: authData.session
        }
      } catch (error: any) {
        retryCount++
        
        // Don't retry on AbortError
        if (error?.name === 'AbortError' || error?.message?.includes('aborted')) {
          return { success: false, error: 'Login request was cancelled. Please try again.' }
        }
        
        if (retryCount >= maxRetries) {
          throw error
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount))
      }
    }

    throw new Error('Failed to load user profile after multiple attempts')
  } catch (error: any) {
    // Handle AbortError gracefully
    if (error?.name === 'AbortError' || error?.message?.includes('aborted')) {
      return { success: false, error: 'Login request was cancelled. Please try again.' }
    }
    
    // Handle timeout errors
    if (error?.message?.includes('timeout')) {
      return { success: false, error: error.message }
    }
    
    return { success: false, error: error.message || 'Login failed' }
  }
}

export async function crewLogin(data: LoginData) {
  try {
    const loginResult = await loginUser(data)
    
    if (!loginResult.success) {
      return loginResult
    }

    if (loginResult.user?.role !== 'admin') {
      await supabase.auth.signOut()
      return { success: false, error: 'Access denied. Admin privileges required.' }
    }

    return loginResult
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function logoutUser() {
  try {
    // Sign out from Supabase
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    
    // Force clear all local storage related to auth
    if (typeof window !== 'undefined') {
      // Clear Supabase auth tokens
      const keys = Object.keys(localStorage)
      keys.forEach(key => {
        if (key.startsWith('sb-') || key.includes('supabase')) {
          localStorage.removeItem(key)
        }
      })
    }
    
    return { success: true }
  } catch (error: any) {
    console.error('Logout error:', error)
    
    // Even if logout fails, clear local storage
    if (typeof window !== 'undefined') {
      const keys = Object.keys(localStorage)
      keys.forEach(key => {
        if (key.startsWith('sb-') || key.includes('supabase')) {
          localStorage.removeItem(key)
        }
      })
    }
    
    return { success: false, error: error.message }
  }
}

export async function sendOTPWithFallback(email: string) {
  try {
    const otpResult = await sendOTPSimple(email)
    return otpResult
  } catch (error: any) {
    return { 
      success: false, 
      error: 'Email verification not available. Using regular signup instead.',
      fallbackToRegular: true
    }
  }
}

export async function registerUserSmart(data: RegisterData & { otp?: string }) {
  try {
    if (data.otp) {
      return await completeRegistration(data as RegisterData & { otp: string })
    }
    
    return await registerUser(data)
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    console.log('[getCurrentUser] Fetching session...')
    
    // Try cached user first for instant load
    if (typeof window !== 'undefined') {
      const cachedUser = localStorage.getItem('jaws-cached-user')
      const cacheTime = localStorage.getItem('jaws-cached-user-time')
      
      if (cachedUser && cacheTime) {
        const age = Date.now() - parseInt(cacheTime)
        // Use cache if less than 5 minutes old
        if (age < 5 * 60 * 1000) {
          try {
            const parsed = JSON.parse(cachedUser)
            console.log('[getCurrentUser] Using cached user (age: ' + Math.round(age/1000) + 's):', parsed.username)
            return parsed
          } catch (e) {
            console.warn('Failed to parse cached user')
          }
        }
      }
    }
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    console.log('[getCurrentUser] Session result:', session ? 'Found' : 'None', sessionError ? `Error: ${sessionError.message}` : '')
    
    if (sessionError) {
      console.error('Session error:', sessionError)
      return null
    }
    
    if (!session || !session.user) {
      // Clear cached user if no session
      if (typeof window !== 'undefined') {
        localStorage.removeItem('jaws-cached-user')
        localStorage.removeItem('jaws-cached-user-time')
      }
      return null
    }
    
    const user = session.user
    
    console.log('[getCurrentUser] Fetching profile for user:', user.id)

    // Try to get profile from database
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      console.log('[getCurrentUser] Profile result:', profile ? 'Found' : 'None', profileError ? `Error: ${profileError.message}` : '')

      if (profileError) {
        if (profileError.code === 'PGRST116') {
          console.warn('Profile not found, creating...')
          // Try to create profile
          const newProfile = {
            id: user.id,
            email: user.email || '',
            username: user.email?.split('@')[0] || 'User',
            role: 'user' as const
          }
          
          await supabase.from('profiles').insert(newProfile)
          
          // Cache and return
          if (typeof window !== 'undefined') {
            localStorage.setItem('jaws-cached-user', JSON.stringify(newProfile))
            localStorage.setItem('jaws-cached-user-time', Date.now().toString())
          }
          return newProfile
        }
        
        // Return basic user from session and cache it
        console.log('[getCurrentUser] Using session data as fallback')
        const fallbackUser = {
          id: user.id,
          email: user.email || '',
          username: user.email?.split('@')[0] || 'User',
          role: 'user' as const
        }
        
        if (typeof window !== 'undefined') {
          localStorage.setItem('jaws-cached-user', JSON.stringify(fallbackUser))
          localStorage.setItem('jaws-cached-user-time', Date.now().toString())
        }
        
        return fallbackUser
      }

      const userProfile = {
        id: profile.id,
        email: profile.email,
        username: profile.username,
        role: profile.role
      }
      
      // Cache successful profile fetch with timestamp
      if (typeof window !== 'undefined') {
        localStorage.setItem('jaws-cached-user', JSON.stringify(userProfile))
        localStorage.setItem('jaws-cached-user-time', Date.now().toString())
      }
      
      console.log('[getCurrentUser] Success:', profile.username)
      return userProfile
    } catch (error: any) {
      // If profile fetch fails, use session data
      console.warn('[getCurrentUser] Profile fetch failed, using session data:', error.message)
      const fallbackUser = {
        id: user.id,
        email: user.email || '',
        username: user.email?.split('@')[0] || 'User',
        role: 'user' as const
      }
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('jaws-cached-user', JSON.stringify(fallbackUser))
        localStorage.setItem('jaws-cached-user-time', Date.now().toString())
      }
      
      return fallbackUser
    }
  } catch (error: any) {
    console.error('[getCurrentUser] Fatal error:', error)
    return null
  }
}

// Background profile fetch to update cache (not used anymore, kept for compatibility)
async function fetchAndCacheProfile(userId: string) {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (profile && typeof window !== 'undefined') {
      localStorage.setItem('jaws-cached-user', JSON.stringify({
        id: profile.id,
        email: profile.email,
        username: profile.username,
        role: profile.role
      }))
      localStorage.setItem('jaws-cached-user-time', Date.now().toString())
      console.log('[Background] Profile cache updated')
    }
  } catch (error) {
    console.warn('[Background] Profile fetch failed, keeping cache')
  }
}