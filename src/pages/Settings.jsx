import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { MobileNav } from '@/components/layout/MobileNav'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { useNavigate } from 'react-router-dom'
import { signOut, getCurrentUser } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { 
  Bell, 
  Sun, 
  Shield, 
  Trash2,
  Loader2,
  CheckCircle2
} from 'lucide-react'
import { ThemeToggle } from '@/components/ui/theme-toggle'

export default function Settings() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [settings, setSettings] = useState({
    emailNotifications: true,
    programMatches: true,
    deadlineReminders: true,
    weeklyDigest: false,
    dataSharing: false,
  })
  const [authUser, setAuthUser] = useState(null)

  useEffect(() => {
    async function fetchSettings() {
      try {
        setLoading(true)
        setError('')

        // Get current authenticated user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
          setError('Not authenticated. Please log in.')
          navigate('/login', { replace: true })
          return
        }

        setAuthUser(user)

        // Fetch user settings from user_profiles table (if exists)
        const { data: userProfile, error: profileError } = await supabase
          .from('user_profiles')
          .select('settings')
          .eq('user_id', user.id)
          .single()

        if (!profileError && userProfile?.settings) {
          setSettings({ ...settings, ...userProfile.settings })
        }
      } catch (err) {
        console.error('Error fetching settings:', err)
        setError('An unexpected error occurred.')
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [navigate])

  async function logout() {
    await signOut()
    navigate('/login', { replace: true })
  }

  async function handleSave() {
    if (!authUser) return

    try {
      setSaving(true)
      setError('')
      setSuccess('')

      // Update settings in user_profiles table
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          settings: settings,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', authUser.id)

      if (updateError) {
        console.error('Error updating settings:', updateError)
        setError('Failed to save settings. Please try again.')
        return
      }

      setSuccess('Settings saved successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      console.error('Error saving settings:', err)
      setError('An unexpected error occurred while saving.')
    } finally {
      setSaving(false)
    }
  }

  function handleSettingChange(key, value) {
    setSettings({ ...settings, [key]: value })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex bg-background">
        <Sidebar onLogout={logout} />
        <div className="flex-1 flex flex-col pb-16 md:pb-0">
          <Header onLogout={logout} />
          <main className="flex-1 px-4 md:px-6 py-6 max-w-4xl mx-auto w-full">
            <Breadcrumbs items={[{ label: 'Settings' }]} className="mb-6" />
            <div className="mb-6">
              <Skeleton className="h-9 w-64 mb-2" />
              <Skeleton className="h-5 w-96" />
            </div>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          </main>
        </div>
        <MobileNav />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar onLogout={logout} />
      <div className="flex-1 flex flex-col pb-16 md:pb-0">
        <Header onLogout={logout} />
        <main className="flex-1 px-4 md:px-6 py-6 max-w-4xl mx-auto w-full">
          <Breadcrumbs items={[{ label: 'Settings' }]} className="mb-6" />
          
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">Settings</h1>
            <p className="text-muted-foreground">
              Manage your account preferences and application settings
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-md">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 text-sm text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400 rounded-md flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              {success}
            </div>
          )}

          {/* Appearance */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sun className="h-5 w-5" />
                Appearance
              </CardTitle>
              <CardDescription>
                Customize how the application looks and feels
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="theme">Theme</Label>
                  <p className="text-sm text-muted-foreground">
                    Choose between light and dark mode
                  </p>
                </div>
                <ThemeToggle />
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
              <CardDescription>
                Manage how and when you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5 flex-1">
                  <Label htmlFor="emailNotifications">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications via email
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.emailNotifications}
                    onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5 flex-1">
                  <Label htmlFor="programMatches">Program Matches</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when new programs match your profile
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.programMatches}
                    onChange={(e) => handleSettingChange('programMatches', e.target.checked)}
                    className="sr-only peer"
                    disabled={!settings.emailNotifications}
                  />
                  <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600 ${!settings.emailNotifications ? 'opacity-50 cursor-not-allowed' : ''}`}></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5 flex-1">
                  <Label htmlFor="deadlineReminders">Deadline Reminders</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive reminders about upcoming application deadlines
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.deadlineReminders}
                    onChange={(e) => handleSettingChange('deadlineReminders', e.target.checked)}
                    className="sr-only peer"
                    disabled={!settings.emailNotifications}
                  />
                  <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600 ${!settings.emailNotifications ? 'opacity-50 cursor-not-allowed' : ''}`}></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5 flex-1">
                  <Label htmlFor="weeklyDigest">Weekly Digest</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive a weekly summary of new opportunities
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.weeklyDigest}
                    onChange={(e) => handleSettingChange('weeklyDigest', e.target.checked)}
                    className="sr-only peer"
                    disabled={!settings.emailNotifications}
                  />
                  <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600 ${!settings.emailNotifications ? 'opacity-50 cursor-not-allowed' : ''}`}></div>
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Privacy & Security */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Privacy & Security
              </CardTitle>
              <CardDescription>
                Control your privacy and security settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5 flex-1">
                  <Label htmlFor="dataSharing">Data Sharing</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow anonymized data to improve our matching algorithm
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.dataSharing}
                    onChange={(e) => handleSettingChange('dataSharing', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5 flex-1">
                  <Label>Email Address</Label>
                  <p className="text-sm text-muted-foreground">
                    {authUser?.email || 'Not available'}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => navigate('/profile')}>
                  Change Email
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Account Actions */}
          <Card className="mb-6 border-destructive/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <Trash2 className="h-5 w-5" />
                Account Actions
              </CardTitle>
              <CardDescription>
                Dangerous actions that cannot be undone
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5 flex-1">
                  <Label>Delete Account</Label>
                  <p className="text-sm text-muted-foreground">
                    Permanently delete your account and all associated data
                  </p>
                </div>
                <Button variant="destructive" size="sm" disabled>
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </main>
      </div>
      <MobileNav />
    </div>
  )
}

