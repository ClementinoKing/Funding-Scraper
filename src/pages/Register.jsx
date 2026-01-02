import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { getCurrentSession, signUpWithEmail, signUpWithPhoneOTP, verifyPhoneOTP, setToken } from '@/lib/auth'
import { validatePhone, normalizePhone, formatPhone, isEmail } from '@/lib/utils'
import { supabase } from '@/lib/supabase'

export default function Register() {
  const [registrationMethod, setRegistrationMethod] = useState('phone') // 'email' or 'phone'
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [showOTP, setShowOTP] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    async function checkAuth() {
      const session = await getCurrentSession()
      const tempReg = localStorage.getItem('temp_registration')
      
      // If user has session but also has temp_registration, they're in the signup flow
      // Don't redirect them - let them complete account creation
      if (session && !tempReg) {
        // Check if user has completed profile
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('profile_completed')
            .eq('user_id', user.id)
            .single()
          
          // If profile exists and is completed, redirect to dashboard
          if (profile && profile.profile_completed) {
            navigate('/dashboard', { replace: true })
          } else {
            // User is authenticated but no profile, redirect to account creation
            navigate('/account-creation', { replace: true })
          }
        } else {
          navigate('/dashboard', { replace: true })
        }
      } else if (session && tempReg) {
        // User just signed up, redirect to account creation
        navigate('/account-creation', { replace: true })
      }
    }
    checkAuth()
  }, [navigate])

  function updateField(field, value) {
    if (field === 'email') setEmail(value)
    if (field === 'phone') setPhone(value)
    if (field === 'password') setPassword(value)
    if (field === 'confirmPassword') setConfirmPassword(value)
    if (field === 'otp') {
      const value = value.replace(/\D/g, '').slice(0, 6)
      setOtp(value)
    }
    // Clear error when user starts typing
    if (error) setError('')
  }

  async function handleSendOTP() {
    setError('')
    
    if (!validatePhone(phone)) {
      setError('Please enter a valid phone number')
      return
    }

    const normalizedPhone = normalizePhone(phone)
    setLoading(true)
    
    try {
      // Use Supabase/Twilio to send OTP for registration
      const { data, error } = await signUpWithPhoneOTP(normalizedPhone)
      
      if (error) {
        // Handle specific Supabase/Twilio errors
        const errorMessage = error.message || ''
        
        if (errorMessage.includes('Invalid From Number') || errorMessage.includes('caller ID') || errorMessage.includes('21212')) {
          setError(
            '⚠️ Twilio Configuration Error\n\n' +
            'The SMS service is not properly configured. Please contact support or check:\n' +
            '1. Supabase Dashboard → Authentication → Phone Auth\n' +
            '2. Ensure Twilio phone number is configured\n' +
            '3. Verify Twilio credentials are correct\n\n' +
            'Error: Invalid From Number (caller ID)'
          )
        } else if (errorMessage.includes('rate limit') || errorMessage.includes('too many')) {
          setError('Too many OTP requests. Please wait a few minutes before trying again.')
        } else if (errorMessage.includes('Invalid phone')) {
          setError('Please enter a valid phone number with country code (e.g., +27 12 345 6789)')
        } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
          setError('Network error. Please check your connection and try again.')
        } else if (errorMessage.includes('already registered') || errorMessage.includes('already exists')) {
          setError('An account with this phone number already exists. Please sign in instead.')
        } else {
          setError(errorMessage || 'Failed to send OTP. Please try again.')
        }
        setLoading(false)
        return
      }
      
      setShowOTP(true)
      setLoading(false)
    } catch (err) {
      console.error('OTP send error:', err)
      setError('Failed to send OTP. Please try again.')
      setLoading(false)
    }
  }

  function handleResendOTP() {
    handleSendOTP()
  }

  async function validateForm() {
    if (registrationMethod === 'email') {
      if (!email.trim()) {
        setError('Email is required')
        return false
      }
      if (!isEmail(email)) {
        setError('Invalid email format')
        return false
      }
      
      // Password validation for email registration
      if (!password) {
        setError('Password is required')
        return false
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters')
        return false
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match')
        return false
      }
    } else {
      // Phone registration (passwordless)
      if (!validatePhone(phone)) {
        setError('Please enter a valid phone number')
        return false
      }
      
      if (!showOTP) {
        setError('Please verify your phone number with OTP first')
        return false
      }
      
      if (!otp || otp.length !== 6) {
        setError('Please enter the 6-digit OTP code')
        return false
      }
    }
    
    return true
  }

  async function onSubmit(e) {
    e.preventDefault()
    setError('')

    // For phone registration, handle OTP sending first
    if (registrationMethod === 'phone' && !showOTP) {
      await handleSendOTP()
      return
    }

    if (!(await validateForm())) {
      setLoading(false)
      return
    }

    setLoading(true)

    try {
      let result
      
      if (registrationMethod === 'email') {
        // Sign up with email using Supabase
        result = await signUpWithEmail(email, password)
        
        if (result.error) {
          // Handle Supabase errors
          console.error('Registration error:', result.error)
          
          // Check for specific error types
          const errorMessage = result.error.message || ''
          const errorStatus = result.error.status || ''
          
          if (errorStatus === 500 || errorMessage.includes('500') || errorMessage.includes('Database error')) {
            // Database error - likely a trigger issue
            setError(
              '⚠️ Database configuration error detected.\n\n' +
              'QUICK FIX:\n' +
              '1. Open Supabase Dashboard → SQL Editor\n' +
              '2. Run: supabase-quick-fix.sql (temporary fix)\n' +
              '3. Then run: supabase-migration.sql (permanent fix)\n\n' +
              'See DATABASE_SETUP.md for detailed instructions.\n\n' +
              `Error: ${errorMessage}`
            )
          } else if (errorMessage.includes('already registered') || errorMessage.includes('already exists') || errorMessage.includes('User already registered')) {
            setError('An account with this email already exists')
          } else if (errorMessage.includes('Password') || errorMessage.includes('password')) {
            setError('Password does not meet requirements')
          } else if (errorMessage.includes('Invalid email')) {
            setError('Please enter a valid email address')
          } else {
            setError(errorMessage || 'Failed to create account. Please try again.')
          }
          setLoading(false)
          return
        }

        if (!result.user) {
          setError('Failed to create account. Please try again.')
          setLoading(false)
          return
        }

        // Store temporary registration data for account creation page
        const tempRegistration = {
          id: result.user.id,
          loginMethod: 'email',
          email: email,
          phone: null,
          registeredAt: new Date().toISOString(),
          profileCompleted: false,
        }

        localStorage.setItem('temp_registration', JSON.stringify(tempRegistration))
        
        // Set temporary token (Supabase session will be set automatically)
        if (result.user) {
          // Get the session after signup
          const { data: { session } } = await supabase.auth.getSession()
          if (session) {
            setToken(session.access_token)
          }
        }

      } else {
        // Phone registration - verify OTP (passwordless)
        const normalizedPhone = normalizePhone(phone)
        
        if (!otp || otp.length !== 6) {
          setError('Please enter the 6-digit OTP code')
          setLoading(false)
          return
        }
        
        // Verify OTP with Supabase
        const { user, session, error: authError } = await verifyPhoneOTP(normalizedPhone, otp)
        
        if (authError || !user || !session) {
          // Handle specific Supabase/Twilio OTP errors
          const errorMessage = authError?.message || ''
          
          if (errorMessage.includes('expired') || errorMessage.includes('Expired')) {
            setError('OTP code has expired. Please request a new one.')
          } else if (errorMessage.includes('Invalid') || errorMessage.includes('invalid')) {
            setError('Invalid OTP code. Please check and try again.')
          } else if (errorMessage.includes('rate limit') || errorMessage.includes('too many')) {
            setError('Too many verification attempts. Please request a new OTP code.')
          } else if (errorMessage.includes('500') || errorMessage.includes('Database error')) {
            setError(
              '⚠️ Database configuration error detected.\n\n' +
              'QUICK FIX:\n' +
              '1. Open Supabase Dashboard → SQL Editor\n' +
              '2. Run: supabase-quick-fix.sql (temporary fix)\n' +
              '3. Then run: supabase-migration.sql (permanent fix)\n\n' +
              'See DATABASE_SETUP.md for detailed instructions.\n\n' +
              `Error: ${errorMessage}`
            )
          } else {
            setError(errorMessage || 'Failed to create account. Please try again.')
          }
          setLoading(false)
          return
        }

        // Store temporary registration data
        const tempRegistration = {
          id: user.id,
          loginMethod: 'phone',
          email: null,
          phone: normalizedPhone,
          registeredAt: new Date().toISOString(),
          profileCompleted: false,
        }

        localStorage.setItem('temp_registration', JSON.stringify(tempRegistration))
        
        // Set temporary token
        if (session) {
          setToken(session.access_token)
        }
      }

      setLoading(false)
      // Redirect to account creation page
      navigate('/account-creation', { replace: true })
    } catch (err) {
      console.error('Registration error:', err)
      setError('An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className={cn('min-h-screen grid place-items-center p-4 bg-gradient-to-br from-background to-muted/20')}>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Create Account</CardTitle>
          <CardDescription>Choose your preferred registration method</CardDescription>
        </CardHeader>
        <CardContent>
          <form 
            onSubmit={(e) => {
              e.preventDefault()
              // Only submit if the submit button was explicitly clicked
              const submitter = e.nativeEvent?.submitter
              if (submitter?.type === 'submit' || (submitter?.tagName === 'BUTTON' && submitter?.getAttribute('type') === 'submit')) {
                onSubmit(e)
              }
            }}
            onKeyDown={(e) => {
              // Prevent Enter key from submitting form automatically
              if (e.key === 'Enter') {
                e.preventDefault()
                e.stopPropagation()
              }
            }}
          >
            <Tabs 
              value={registrationMethod} 
              onValueChange={(value) => {
                setRegistrationMethod(value)
                setError('')
                setShowOTP(false)
                setOtp('')
                setEmail('')
                setPhone('')
                setPassword('')
                setConfirmPassword('')
              }}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="phone">Phone</TabsTrigger>
                <TabsTrigger value="email">Email</TabsTrigger>
              </TabsList>

              {error && (
                <div className="mt-4 p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-md whitespace-pre-line">
                  {error}
                </div>
              )}

              {/* Email Registration Tab */}
              <TabsContent value="email" className="mt-4">
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="email">Email</FieldLabel>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => updateField('email', e.target.value)}
                      placeholder="john@example.com"
                      required
                      disabled={loading}
                      className={error && error.includes('email') ? 'border-red-500' : ''}
                    />
                  </Field>
                </FieldGroup>
              </TabsContent>

              {/* Phone Registration Tab */}
              <TabsContent value="phone" className="mt-4">
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="phone">Phone Number</FieldLabel>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+27 12 345 6789"
                      value={phone}
                      onChange={(e) => updateField('phone', e.target.value)}
                      required
                      disabled={loading || showOTP}
                      className={error && error.includes('phone') ? 'border-red-500' : ''}
                    />
                    <FieldDescription>
                      Enter your phone number with country code (e.g., +27 12 345 6789)
                    </FieldDescription>
                  </Field>

                  {showOTP && (
                    <>
                      <Field>
                        <FieldLabel htmlFor="otp">OTP Code</FieldLabel>
                        <Input
                          id="otp"
                          type="text"
                          placeholder="000000"
                          value={otp}
                          onChange={(e) => updateField('otp', e.target.value)}
                          maxLength={6}
                          required
                          disabled={loading}
                          className="text-center text-2xl tracking-widest"
                        />
                        <FieldDescription>
                          Enter the 6-digit code sent to {formatPhone(phone)} via SMS
                        </FieldDescription>
                      </Field>
                      <div className="text-sm text-center">
                        <button
                          type="button"
                          onClick={handleResendOTP}
                          disabled={loading}
                          className="text-primary hover:underline"
                        >
                          Resend OTP
                        </button>
                      </div>
                    </>
                  )}
                </FieldGroup>
              </TabsContent>

              {/* Password Fields (Email Registration Only) */}
              {registrationMethod === 'email' && (
                <div className="mt-4">
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="password">Password</FieldLabel>
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => updateField('password', e.target.value)}
                        required
                        minLength={6}
                        disabled={loading}
                        className={error && error.includes('Password') ? 'border-red-500' : ''}
                      />
                      <FieldDescription>Must be at least 6 characters</FieldDescription>
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="confirmPassword">Confirm Password</FieldLabel>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => updateField('confirmPassword', e.target.value)}
                        required
                        disabled={loading}
                        className={error && error.includes('match') ? 'border-red-500' : ''}
                      />
                    </Field>
                  </FieldGroup>
                </div>
              )}

              <div className="mt-6">
                <div className="flex flex-col gap-2">
                  <Button type="submit" disabled={loading} className="w-full">
                    {loading 
                      ? registrationMethod === 'phone' && !showOTP
                        ? 'Sending OTP...'
                        : 'Creating Account...'
                      : registrationMethod === 'phone' && !showOTP
                        ? 'Send OTP'
                        : 'Continue'}
                  </Button>
                  {registrationMethod === 'email' && (
                    <Button variant="outline" type="button" disabled={loading} className="w-full">
                      Sign up with Google
                    </Button>
                  )}
                </div>
                <FieldDescription className="text-center mt-4">
                  Already have an account? <Link to="/login" className="hover:underline">Sign in</Link>
                </FieldDescription>
              </div>
            </Tabs>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
