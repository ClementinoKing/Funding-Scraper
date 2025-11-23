import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { getCurrentSession, signUpWithEmail, signUpWithPhone, setToken } from '@/lib/auth'
import { validatePhone, normalizePhone, formatPhone, isEmail } from '@/lib/utils'
import { generateOTP, storeOTP, verifyOTP } from '@/lib/otp'
import { supabase } from '@/lib/supabase'

export default function Register() {
  const [registrationMethod, setRegistrationMethod] = useState('email') // 'email' or 'phone'
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
        // User is authenticated and profile is complete, redirect to dashboard
        navigate('/dashboard', { replace: true })
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
    
    // Check if phone number is already registered by trying to sign in
    // Note: In production, you might want a better way to check this
    try {
      // Generate and store OTP
      const otpCode = generateOTP()
      storeOTP(normalizedPhone, otpCode)
      setShowOTP(true)
    } catch (err) {
      setError('Failed to send OTP. Please try again.')
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
    } else {
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
      
      const normalizedPhone = normalizePhone(phone)
      const isValidOTP = verifyOTP(normalizedPhone, otp)
      
      if (!isValidOTP) {
        setError('Invalid or expired OTP code')
        return false
      }
    }
    
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
    return true
  }

  async function onSubmit(e) {
    e.preventDefault()
    setError('')

    // For phone registration, handle OTP sending first
    if (registrationMethod === 'phone' && !showOTP) {
      handleSendOTP()
      return
    }

    if (!(await validateForm())) return

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
        // Phone registration - verify OTP first, then sign up
        const normalizedPhone = normalizePhone(phone)
        
        result = await signUpWithPhone(normalizedPhone, password)
        
        if (result.error) {
          // Handle Supabase errors
          console.error('Phone registration error:', result.error)
          
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
            setError('An account with this phone number already exists')
          } else if (errorMessage.includes('Password') || errorMessage.includes('password')) {
            setError('Password does not meet requirements')
          } else if (errorMessage.includes('Invalid phone')) {
            setError('Please enter a valid phone number')
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

        // Store temporary registration data
        const tempRegistration = {
          id: result.user.id,
          loginMethod: 'phone',
          email: null,
          phone: normalizedPhone,
          registeredAt: new Date().toISOString(),
          profileCompleted: false,
        }

        localStorage.setItem('temp_registration', JSON.stringify(tempRegistration))
        
        // Set temporary token
        const { data: { session } } = await supabase.auth.getSession()
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
          <form onSubmit={onSubmit}>
            <Tabs 
              value={registrationMethod} 
              onValueChange={(value) => {
                setRegistrationMethod(value)
                setError('')
                setShowOTP(false)
                setOtp('')
                setEmail('')
                setPhone('')
              }}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="email">Email</TabsTrigger>
                <TabsTrigger value="phone">Phone</TabsTrigger>
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
                          Enter the 6-digit code sent to {formatPhone(phone)}
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

              {/* Common Fields (Password) */}
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

              <div className="mt-6">
                <div className="flex flex-col gap-2">
                  <Button type="submit" disabled={loading} className="w-full">
                    {loading 
                      ? 'Creating Account...' 
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
