import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { MobileNav } from '@/components/layout/MobileNav'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { useNavigate } from 'react-router-dom'
import { signOut, getCurrentUser } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { User, Building2, TrendingUp, DollarSign, Loader2 } from 'lucide-react'

export default function Profile() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [profile, setProfile] = useState(null)
  const [authUser, setAuthUser] = useState(null)

  useEffect(() => {
    async function fetchProfile() {
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

        // Fetch user profile from user_profiles table
        const { data: userProfile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (profileError) {
          // Profile might not exist yet - redirect to account creation
          if (profileError.code === 'PGRST116') {
            setError('Profile not found. Please complete your profile setup.')
            setTimeout(() => navigate('/account-creation', { replace: true }), 2000)
            return
          }
          console.error('Error fetching profile:', profileError)
          setError('Failed to load profile. Please try again.')
          return
        }

        setProfile(userProfile)
      } catch (err) {
        console.error('Error fetching profile:', err)
        setError('An unexpected error occurred.')
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [navigate])

  async function logout() {
    await signOut()
    navigate('/login', { replace: true })
  }

  async function handleSave() {
    if (!profile || !authUser) return

    try {
      setSaving(true)
      setError('')

      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          ...profile,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', authUser.id)

      if (updateError) {
        console.error('Error updating profile:', updateError)
        setError('Failed to save profile. Please try again.')
        return
      }

      // Show success message
      setError('')
      alert('Profile updated successfully!')
    } catch (err) {
      console.error('Error saving profile:', err)
      setError('An unexpected error occurred while saving.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex bg-background">
        <Sidebar onLogout={logout} />
        <div className="flex-1 flex flex-col pb-16 md:pb-0">
          <Header onLogout={logout} />
          <main className="flex-1 px-4 md:px-6 py-6 max-w-4xl mx-auto w-full">
            <Breadcrumbs items={[{ label: 'Profile' }]} className="mb-6" />
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

  if (!profile) {
    return (
      <div className="min-h-screen flex bg-background">
        <Sidebar onLogout={logout} />
        <div className="flex-1 flex flex-col pb-16 md:pb-0">
          <Header onLogout={logout} />
          <main className="flex-1 px-4 md:px-6 py-6 max-w-4xl mx-auto w-full">
            <Breadcrumbs items={[{ label: 'Profile' }]} className="mb-6" />
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground mb-4">{error || 'Profile not found'}</p>
                <Button onClick={() => navigate('/account-creation')}>
                  Complete Profile Setup
                </Button>
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
          <Breadcrumbs items={[{ label: 'Profile' }]} className="mb-6" />
          
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">Profile Settings</h1>
            <p className="text-muted-foreground">
              Manage your account information and preferences
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-md">
              {error}
            </div>
          )}

          {/* Personal Information */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={profile.email || authUser?.email || ''} 
                    disabled 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input 
                    id="phone" 
                    type="tel" 
                    value={profile.phone || ''} 
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    placeholder="+27 12 345 6789"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ownerFullName">Owner Full Name</Label>
                <Input
                  id="ownerFullName"
                  value={profile.owner_full_name || ''}
                  onChange={(e) => setProfile({ ...profile, owner_full_name: e.target.value })}
                  placeholder="Enter your full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="idNumber">ID Number</Label>
                <Input
                  id="idNumber"
                  value={profile.id_number || ''}
                  disabled
                  placeholder="ID Number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dob">Date of Birth</Label>
                <Input
                  id="dob"
                  type="date"
                  value={profile.dob ? profile.dob.split('T')[0] : ''}
                  onChange={(e) => setProfile({ ...profile, dob: e.target.value || null })}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
            </CardContent>
          </Card>

          {/* Business Information */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Business Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="businessName">Business Name</Label>
                <Input
                  id="businessName"
                  value={profile.business_name || ''}
                  onChange={(e) => setProfile({ ...profile, business_name: e.target.value })}
                  placeholder="Business name"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="businessType">Business Type</Label>
                  <Input
                    id="businessType"
                    value={profile.business_type || ''}
                    onChange={(e) => setProfile({ ...profile, business_type: e.target.value })}
                    placeholder="Business type"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Input
                    id="industry"
                    value={profile.industry || ''}
                    onChange={(e) => setProfile({ ...profile, industry: e.target.value })}
                    placeholder="Industry"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyRegistrationNumber">Company Registration Number</Label>
                <Input
                  id="companyRegistrationNumber"
                  value={profile.company_registration_number || ''}
                  onChange={(e) => setProfile({ ...profile, company_registration_number: e.target.value })}
                  placeholder="CIPC registration number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="physicalAddress">Physical Address</Label>
                <Input
                  id="physicalAddress"
                  value={profile.physical_address || ''}
                  onChange={(e) => setProfile({ ...profile, physical_address: e.target.value })}
                  placeholder="Physical address"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    type="url"
                    value={profile.website || ''}
                    onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                    placeholder="https://www.example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taxNumber">Tax Number</Label>
                  <Input
                    id="taxNumber"
                    value={profile.tax_number || ''}
                    onChange={(e) => setProfile({ ...profile, tax_number: e.target.value })}
                    placeholder="Tax number"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Business Metrics */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Business Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="annualRevenue">Annual Revenue</Label>
                  <Input
                    id="annualRevenue"
                    value={profile.annual_revenue || ''}
                    onChange={(e) => setProfile({ ...profile, annual_revenue: e.target.value })}
                    placeholder="Annual revenue"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="numberOfEmployees">Number of Employees</Label>
                  <Input
                    id="numberOfEmployees"
                    value={profile.number_of_employees || ''}
                    onChange={(e) => setProfile({ ...profile, number_of_employees: e.target.value })}
                    placeholder="Number of employees"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="beeLevel">BEE Level</Label>
                <Input
                  id="beeLevel"
                  value={profile.bee_level || ''}
                  onChange={(e) => setProfile({ ...profile, bee_level: e.target.value })}
                  placeholder="BEE level"
                />
              </div>
            </CardContent>
          </Card>

          {/* Funding Requirements */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Funding Requirements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fundingAmountNeeded">Funding Amount Needed</Label>
                  <Input
                    id="fundingAmountNeeded"
                    value={profile.funding_amount_needed || ''}
                    onChange={(e) => setProfile({ ...profile, funding_amount_needed: e.target.value })}
                    placeholder="Funding amount"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timeline">Timeline</Label>
                  <Input
                    id="timeline"
                    value={profile.timeline || ''}
                    onChange={(e) => setProfile({ ...profile, timeline: e.target.value })}
                    placeholder="Timeline"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="purposeOfFunding">Purpose of Funding</Label>
                <textarea
                  id="purposeOfFunding"
                  value={profile.purpose_of_funding || ''}
                  onChange={(e) => setProfile({ ...profile, purpose_of_funding: e.target.value })}
                  placeholder="Purpose of funding"
                  className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label>Sectors</Label>
                <div className="p-3 bg-muted rounded-md">
                  {profile.sectors && profile.sectors.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {profile.sectors.map((sector, index) => (
                        <span key={index} className="px-2 py-1 bg-background rounded text-sm">
                          {sector}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">No sectors selected</span>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Funding Types</Label>
                <div className="p-3 bg-muted rounded-md">
                  {profile.funding_types && profile.funding_types.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {profile.funding_types.map((type, index) => (
                        <span key={index} className="px-2 py-1 bg-background rounded text-sm">
                          {type}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">No funding types selected</span>
                  )}
                </div>
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

