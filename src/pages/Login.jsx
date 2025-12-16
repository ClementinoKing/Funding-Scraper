import { useEffect, useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { getCurrentSession, signInWithEmail, signInWithPhone, setToken, setUser } from '@/lib/auth'
import { validatePhone, normalizePhone, formatPhone } from '@/lib/utils'
import { generateOTP, storeOTP, verifyOTP } from '@/lib/otp'
import { supabase } from '@/lib/supabase'

export default function Login() {
  const [loginMethod, setLoginMethod] = useState('email') // 'email' or 'phone'
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [showOTP, setShowOTP] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    async function checkAuth() {
      const session = await getCurrentSession()
      if (session) {
        navigate('/dashboard', { replace: true })
      }
    }
    checkAuth()
  }, [navigate])

  async function handleSendOTP() {
    setError('')
    
    if (!validatePhone(phone)) {
      setError('Please enter a valid phone number')
      return
    }

    const normalizedPhone = normalizePhone(phone)
    
    // Check if user exists by trying to sign in (this will fail if user doesn't exist)
    // For custom OTP flow, we'll just generate and store OTP
    // In production, you might want to verify the phone exists first
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

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (loginMethod === 'email') {
        // Email login with Supabase
        const { user, session, error: authError } = await signInWithEmail(email, password)
        
        if (authError || !user || !session) {
          if (authError?.message.includes('Invalid login')) {
            setError('Invalid email or password')
          } else if (authError?.message.includes('Email not confirmed')) {
            setError('Please verify your email before signing in')
          } else {
            setError(authError?.message || 'Invalid email or password')
          }
          setLoading(false)
          return
        }

        setToken(session.access_token)
        setUser(user)
        
        const redirectTo = location.state?.from?.pathname || '/dashboard'
        navigate(redirectTo, { replace: true })
      } else {
        // Phone login with custom OTP
        if (!showOTP) {
          // First step: send OTP
          handleSendOTP()
          setLoading(false)
          return
        }

        // Second step: verify OTP
        if (!otp || otp.length !== 6) {
          setError('Please enter the 6-digit OTP code')
          setLoading(false)
          return
        }

        const normalizedPhone = normalizePhone(phone)
        const isValidOTP = verifyOTP(normalizedPhone, otp)

        if (!isValidOTP) {
          setError('Invalid or expired OTP code')
          setLoading(false)
          return
        }

        // After OTP verification, sign in with phone and password
        const { user, session, error: authError } = await signInWithPhone(normalizedPhone, password)

        if (authError || !user || !session) {
          if (authError?.message.includes('Invalid login')) {
            setError('Invalid phone number or password')
          } else {
            setError(authError?.message || 'Failed to sign in. Please try again.')
          }
          setLoading(false)
          return
        }

        setToken(session.access_token)
        setUser(user)
        
        const redirectTo = location.state?.from?.pathname || '/dashboard'
        navigate(redirectTo, { replace: true })
      }
    } catch (err) {
      console.error('Login error:', err)
      setError('An error occurred. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className={cn('min-h-screen grid place-items-center p-4')}>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Login to your account</CardTitle>
          <CardDescription>Choose your preferred login method</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit}>
            <Tabs 
              value={loginMethod} 
              onValueChange={(value) => {
                setLoginMethod(value)
                setError('')
                setShowOTP(false)
                setOtp('')
              }}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="email">Email</TabsTrigger>
                <TabsTrigger value="phone">Phone</TabsTrigger>
              </TabsList>

              {error && (
                <div className="mt-4 p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-md">
                  {error}
                </div>
              )}

              {/* Email Login Tab */}
              <TabsContent value="email" className="mt-4">
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="email">Email</FieldLabel>
                    <Input
                      id="email"
                      type="email"
                      placeholder="m@example.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value)
                        setError('')
                      }}
                      required
                      disabled={loading}
                    />
                  </Field>
                  <Field>
                    <div className="flex items-center">
                      <FieldLabel htmlFor="password">Password</FieldLabel>
                      <a
                        href="#"
                        className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                      >
                        Forgot your password?
                      </a>
                    </div>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value)
                          setError('')
                        }}
                        required
                        disabled={loading}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        tabIndex={-1}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </Field>
                </FieldGroup>
              </TabsContent>

              {/* Phone Login Tab */}
              <TabsContent value="phone" className="mt-4">
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="phone">Phone Number</FieldLabel>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+27 12 345 6789"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value)
                        setError('')
                      }}
                      required
                      disabled={loading || showOTP}
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
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '').slice(0, 6)
                            setOtp(value)
                            setError('')
                          }}
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

                  {showOTP && (
                    <Field>
                      <FieldLabel htmlFor="password-phone">Password</FieldLabel>
                      <div className="relative">
                        <Input
                          id="password-phone"
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value)
                            setError('')
                          }}
                          required
                          disabled={loading}
                          placeholder="Enter your password"
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          tabIndex={-1}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </Field>
                  )}
                </FieldGroup>
              </TabsContent>

              <div className="mt-6">
                <div className="flex flex-col gap-2">
                  <Button type="submit" disabled={loading} className="w-full">
                    {loading 
                      ? 'Signing in…' 
                      : loginMethod === 'phone' && !showOTP
                        ? 'Send OTP'
                        : 'Login'}
                  </Button>
                  {loginMethod === 'email' && (
                    <Button variant="outline" type="button" className="w-full">
                      Login with Google
                    </Button>
                  )}
                </div>
                <FieldDescription className="text-center mt-4">
                  Don&apos;t have an account? <Link to="/register" className="hover:underline">Sign up</Link>
                </FieldDescription>
              </div>
            </Tabs>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
