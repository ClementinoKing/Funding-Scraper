import { isEmail, isPhone, normalizePhone } from './utils'
import { supabase } from './supabase'
import { clearSavedProgramsCache } from './savedPrograms'
import { clearUserProfileCache } from './userProfile'

const TOKEN_KEY = 'auth_token'
const USER_KEY = 'auth_user'
const TEMP_REGISTRATION_KEY = 'temp_registration'

// Legacy localStorage functions for backward compatibility during migration
export function getToken() {
  try {
    // Check Supabase session first
    const session = getCurrentSession()
    if (session) {
      return session.access_token
    }
    // Fallback to localStorage for backward compatibility
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token) {
  try {
    // Store in localStorage for backward compatibility
    localStorage.setItem(TOKEN_KEY, token)
  } catch {
    // ignore
  }
}

export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    localStorage.removeItem(TEMP_REGISTRATION_KEY)
  } catch {
    // ignore
  }
}

export function getUser() {
  try {
    // Try to get from Supabase session first
    const session = getCurrentSession()
    if (session?.user) {
      return session.user
    }
    // Fallback to localStorage
    const userStr = localStorage.getItem(USER_KEY)
    return userStr ? JSON.parse(userStr) : null
  } catch {
    return null
  }
}

export function setUser(user) {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  } catch {
    // ignore
  }
}

export function clearUser() {
  try {
    localStorage.removeItem(USER_KEY)
  } catch {
    // ignore
  }
}

/**
 * Check if user is authenticated using Supabase session
 * @returns {boolean} True if user has valid session
 */
export async function isAuthenticated() {
  try {
    const session = await getCurrentSession()
    return Boolean(session)
  } catch {
    return false
  }
}

/**
 * Get current Supabase session
 * @returns {Promise<Object|null>} Session object or null
 */
export async function getCurrentSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) {
      console.error('Error getting session:', error)
      return null
    }
    return session
  } catch (error) {
    console.error('Error getting session:', error)
    return null
  }
}

/**
 * Get current Supabase user
 * @returns {Promise<Object|null>} User object or null
 */
export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) {
      console.error('Error getting user:', error)
      return null
    }
    return user
  } catch (error) {
    console.error('Error getting user:', error)
    return null
  }
}

/**
 * Sign up with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<{user: Object|null, error: Error|null}>}
 */
export async function signUpWithEmail(email, password) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Disable email confirmation for now (can be enabled later)
        emailRedirectTo: undefined,
        // Don't trigger database functions that might fail
        data: {
          // Add any metadata here if needed
        }
      }
    })

    if (error) {
      console.error('Signup error details:', {
        message: error.message,
        status: error.status,
        name: error.name,
        fullError: error
      })
      
      // If it's a 500 error, the user might still be created but the trigger failed
      // Try to get the session anyway
      if (error.status === 500 || error.message?.includes('500')) {
        console.warn('500 error detected - user may have been created despite error')
        // Wait a moment for the user to be created
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Try to sign in to verify if user was created
        const signInResult = await signInWithEmail(email, password)
        if (signInResult.user && !signInResult.error) {
          console.log('User was created successfully despite 500 error')
          // Try to create profile manually
          await createUserProfile()
          return { user: signInResult.user, error: null }
        }
      }
      
      return { user: null, error }
    }

    // If signup succeeded, try to create profile manually (in case trigger failed)
    if (data.user) {
      // Wait a moment for auth to settle
      await new Promise(resolve => setTimeout(resolve, 300))
      await createUserProfile()
    }

    return { user: data.user, error: null }
  } catch (error) {
    console.error('Signup exception:', error)
    return { user: null, error: { message: error.message || 'An unexpected error occurred', ...error } }
  }
}

/**
 * Sign in with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<{user: Object|null, session: Object|null, error: Error|null}>}
 */
export async function signInWithEmail(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return { user: null, session: null, error }
    }

    // Store session info for backward compatibility
    if (data.session) {
      setToken(data.session.access_token)
      setUser(data.user)
    }

    return { user: data.user, session: data.session, error: null }
  } catch (error) {
    return { user: null, session: null, error }
  }
}

/**
 * Sign up with phone number (custom OTP flow)
 * @param {string} phone - User phone number
 * @param {string} password - User password
 * @returns {Promise<{user: Object|null, error: Error|null}>}
 */
export async function signUpWithPhone(phone, password) {
  try {
    // Normalize phone number
    const normalizedPhone = normalizePhone(phone)
    
    // Sign up with phone (Supabase will send OTP)
    // Note: For custom OTP, we'll create the user after OTP verification
    // This is a placeholder - actual implementation depends on your OTP flow
    const { data, error } = await supabase.auth.signUp({
      phone: normalizedPhone,
      password,
      options: {
        // Disable phone confirmation for now (can be enabled later)
        // Don't trigger database functions that might fail
        data: {
          // Add any metadata here if needed
        }
      }
    })

    if (error) {
      console.error('Phone signup error details:', {
        message: error.message,
        status: error.status,
        name: error.name,
        fullError: error
      })
      return { user: null, error }
    }

    return { user: data.user, error: null }
  } catch (error) {
    console.error('Phone signup exception:', error)
    return { user: null, error: { message: error.message || 'An unexpected error occurred', ...error } }
  }
}

/**
 * Sign in with phone (custom OTP flow)
 * After OTP verification, use this to sign in
 * @param {string} phone - User phone number
 * @param {string} password - User password
 * @returns {Promise<{user: Object|null, session: Object|null, error: Error|null}>}
 */
export async function signInWithPhone(phone, password) {
  try {
    const normalizedPhone = normalizePhone(phone)
    
    const { data, error } = await supabase.auth.signInWithPassword({
      phone: normalizedPhone,
      password,
    })

    if (error) {
      return { user: null, session: null, error }
    }

    // Store session info for backward compatibility
    if (data.session) {
      setToken(data.session.access_token)
      setUser(data.user)
    }

    return { user: data.user, session: data.session, error: null }
  } catch (error) {
    return { user: null, session: null, error }
  }
}

/**
 * Send OTP to phone number using Supabase/Twilio
 * @param {string} phone - User phone number
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function sendPhoneOTP(phone) {
  try {
    const normalizedPhone = normalizePhone(phone)
    
    const { data, error } = await supabase.auth.signInWithOtp({
      phone: normalizedPhone
    })

    if (error) {
      console.error('OTP send error:', error)
      return { data: null, error }
    }

    return { data, error: null }
  } catch (error) {
    console.error('OTP send exception:', error)
    return { data: null, error: { message: error.message || 'Failed to send OTP' } }
  }
}

/**
 * Verify OTP code for phone number
 * @param {string} phone - User phone number
 * @param {string} otp - OTP code
 * @returns {Promise<{user: Object|null, session: Object|null, error: Error|null}>}
 */
export async function verifyPhoneOTP(phone, otp) {
  try {
    const normalizedPhone = normalizePhone(phone)
    
    const { data, error } = await supabase.auth.verifyOtp({
      phone: normalizedPhone,
      token: otp,
      type: 'sms'
    })

    if (error) {
      return { user: null, session: null, error }
    }

    // Store session info for backward compatibility
    if (data.session) {
      setToken(data.session.access_token)
      setUser(data.user)
    }

    return { user: data.user, session: data.session, error: null }
  } catch (error) {
    return { user: null, session: null, error }
  }
}

/**
 * Sign up with phone number using OTP (passwordless)
 * Uses signInWithOtp - Supabase will create user if doesn't exist
 * @param {string} phone - User phone number
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function signUpWithPhoneOTP(phone) {
  try {
    const normalizedPhone = normalizePhone(phone)
    
    // For signup, use signInWithOtp - Supabase will create user if doesn't exist
    const { data, error } = await supabase.auth.signInWithOtp({
      phone: normalizedPhone
    })

    if (error) {
      console.error('Phone signup OTP error:', error)
      return { data: null, error }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Phone signup OTP exception:', error)
    return { data: null, error: { message: error.message || 'Failed to send OTP' } }
  }
}

/**
 * Create or update user profile in database
 * This can help work around database trigger issues
 * @param {Object} profileData - Profile data to insert/update
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function createUserProfile(profileData = {}) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { data: null, error: { message: 'No authenticated user' } }
    }

    // Try to insert/update profile in profiles table
    // Note: Adjust table name and columns based on your Supabase schema
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        email: user.email,
        phone: user.phone,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...profileData
      }, {
        onConflict: 'id'
      })
      .select()
      .single()

    if (error) {
      // If profiles table doesn't exist or has RLS issues, log but don't fail
      console.warn('Could not create profile (this may be expected if table/trigger doesn\'t exist):', error)
      return { data: null, error }
    }

    return { data, error: null }
  } catch (error) {
    console.warn('Error creating profile:', error)
    return { data: null, error }
  }
}

/**
 * Sign out current user
 * @returns {Promise<{error: Error|null}>}
 */
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut()
    
    // Clear local storage
    clearToken()
    clearUser()
    clearSavedProgramsCache() // Clear saved programs cache on logout
    clearUserProfileCache() // Clear user profile cache on logout
    
    return { error: error || null }
  } catch (error) {
    // Clear local storage even if signOut fails
    clearToken()
    clearUser()
    clearSavedProgramsCache() // Clear saved programs cache on logout
    clearUserProfileCache() // Clear user profile cache on logout
    return { error }
  }
}

/**
 * Detect if identifier is email or phone
 * @param {string} identifier - Email or phone number
 * @returns {'email'|'phone'|null} Type of identifier
 */
export function getIdentifierType(identifier) {
  if (!identifier || typeof identifier !== 'string') return null
  if (isEmail(identifier)) return 'email'
  if (isPhone(identifier)) return 'phone'
  return null
}

/**
 * Find user by email or phone number in Supabase
 * @param {string} identifier - Email or phone number
 * @returns {Promise<Object|null>} User object or null
 */
export async function findUserByIdentifier(identifier) {
  try {
    const type = getIdentifierType(identifier)
    
    if (type === 'email') {
      // Try to get user from Supabase Auth
      // Note: Supabase doesn't have a direct "find user by email" API
      // This would require querying the auth.users table via admin API
      // For now, we'll use a workaround: try to sign in (which will fail if user doesn't exist)
      // In production, you might want to use a server-side function
      return null // Will be handled by signInWithEmail
    } else if (type === 'phone') {
      const normalizedPhone = normalizePhone(identifier)
      // Similar limitation - would need admin API or server function
      return null // Will be handled by signInWithPhone
    }
    
    return null
  } catch (error) {
    console.error('Error finding user:', error)
    return null
  }
}

/**
 * Authenticate user with email/phone and password (legacy function for backward compatibility)
 * @param {string} identifier - Email or phone number
 * @param {string} password - Password
 * @returns {Promise<Object|null>} User object if authenticated, null otherwise
 */
export async function authenticateUser(identifier, password) {
  const type = getIdentifierType(identifier)
  
  if (type === 'email') {
    const { user, error } = await signInWithEmail(identifier, password)
    if (error || !user) {
      return null
    }
    return user
  } else if (type === 'phone') {
    const { user, error } = await signInWithPhone(identifier, password)
    if (error || !user) {
      return null
    }
    return user
  }
  
  return null
}
