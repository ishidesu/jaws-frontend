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
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })

    if (authError) throw authError

    if (!authData.user) {
      throw new Error('Login failed')
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    if (profileError) throw profileError

    return { 
      success: true, 
      user: {
        id: profile.id,
        email: profile.email,
        username: profile.username,
        role: profile.role
      } as AuthUser
    }
  } catch (error: any) {
    return { success: false, error: error.message }
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
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    return { success: true }
  } catch (error: any) {
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
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('Session error:', sessionError)
      return null
    }
    
    if (!session || !session.user) {
      console.log('No active session found')
      return null
    }
    
    if (session.expires_at! * 1000 < Date.now()) {
      console.log('Token expired, attempting refresh...')
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
      
      if (refreshError || !refreshData.session) {
        console.error('Token refresh failed:', refreshError)
        return null
      }
    }
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.error('Get user error:', userError)
      return null
    }

    let retryCount = 0
    const maxRetries = 3
    
    while (retryCount < maxRetries) {
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profileError) {
          if (profileError.code === 'PGRST116') {
            console.error('Profile not found for user:', user.id)
            return null
          }
          throw profileError
        }

        return {
          id: profile.id,
          email: profile.email,
          username: profile.username,
          role: profile.role
        }
      } catch (error: any) {
        retryCount++
        console.error(`Profile fetch attempt ${retryCount} failed:`, error)
        
        if (retryCount >= maxRetries) {
          console.error('Max retries reached for profile fetch')
          return null
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount))
      }
    }
    
    return null
  } catch (error: any) {
    console.error('getCurrentUser error:', error)
    return null
  }
}