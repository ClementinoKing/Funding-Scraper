import { Navigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getCurrentSession } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export default function ProtectedRoute({ children }) {
  const location = useLocation()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [hasProfile, setHasProfile] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function checkAuth() {
      try {
        const session = await getCurrentSession()
        const authenticated = Boolean(session)
        setIsAuthenticated(authenticated)

        // If authenticated, check if user has completed profile
        if (authenticated && session?.user) {
          const { data: { user } } = await supabase.auth.getUser()
          
          if (user) {
            const { data: profile, error: profileError } = await supabase
              .from('user_profiles')
              .select('profile_completed')
              .eq('user_id', user.id)
              .single()
            
            // User has a profile if profile exists and is completed
            const profileCompleted = profile && !profileError && profile.profile_completed === true
            setHasProfile(profileCompleted)
          } else {
            setHasProfile(false)
          }
        } else {
          setHasProfile(false)
        }
      } catch (error) {
        console.error('Error checking authentication:', error)
        setIsAuthenticated(false)
        setHasProfile(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  if (isLoading) {
    // Show loading state while checking authentication
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  // If authenticated but no profile, redirect to account creation
  if (isAuthenticated && !hasProfile) {
    return <Navigate to="/account-creation" replace />
  }

  return children
}
