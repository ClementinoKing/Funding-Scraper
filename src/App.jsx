import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import AccountCreation from './pages/AccountCreation.jsx'
import Dashboard from './pages/Dashboard.jsx'
import FundingDetail from './pages/FundingDetail.jsx'
import SubprogramDetail from './pages/SubprogramDetail.jsx'
import SavedPrograms from './pages/SavedPrograms.jsx'
import Profile from './pages/Profile.jsx'
import SearchResults from './pages/SearchResults.jsx'
import ProtectedRoute from './routes/ProtectedRoute.jsx'
import { supabase } from './lib/supabase'
import { setToken, setUser, clearToken, clearUser } from './lib/auth'

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
        path="/search"
        element={
          <ProtectedRoute>
            <SearchResults />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App
