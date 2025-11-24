import { useEffect, Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './routes/ProtectedRoute.jsx'
import { supabase } from './lib/supabase'
import { setToken, setUser, clearToken, clearUser } from './lib/auth'
import { FullPageLoader } from './components/LoadingSpinner.jsx'

// Lazy load pages for code splitting
const Login = lazy(() => import('./pages/Login.jsx'))
const Register = lazy(() => import('./pages/Register.jsx'))
const AccountCreation = lazy(() => import('./pages/AccountCreation.jsx'))
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'))
const FundingDetail = lazy(() => import('./pages/FundingDetail.jsx'))
const SubprogramDetail = lazy(() => import('./pages/SubprogramDetail.jsx'))
const SavedPrograms = lazy(() => import('./pages/SavedPrograms.jsx'))
const Profile = lazy(() => import('./pages/Profile.jsx'))
const Settings = lazy(() => import('./pages/Settings.jsx'))
const SearchResults = lazy(() => import('./pages/SearchResults.jsx'))

function App() {
  useEffect(() => {
    // Listen to auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // User signed in - update local storage
        setToken(session.access_token)
        setUser(session.user)
      } else if (event === 'SIGNED_OUT') {
        // User signed out - clear local storage
        clearToken()
        clearUser()
      } else if (event === 'TOKEN_REFRESHED' && session) {
        // Token refreshed - update local storage
        setToken(session.access_token)
        setUser(session.user)
      }
    })

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return (
    <Suspense fallback={<FullPageLoader />}>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/account-creation" element={<AccountCreation />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/funding/:slug"
          element={
            <ProtectedRoute>
              <FundingDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/funding/:parentSlug/subprogram/:subprogramSlug"
          element={
            <ProtectedRoute>
              <SubprogramDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/saved"
          element={
            <ProtectedRoute>
              <SavedPrograms />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/search"
          element={
            <ProtectedRoute>
              <SearchResults />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Suspense>
  )
}

export default App
