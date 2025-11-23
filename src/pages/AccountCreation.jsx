import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getToken, setToken, setUser, getCurrentSession } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { CheckCircle2, ArrowRight, ArrowLeft, User, Building2, TrendingUp, DollarSign, FileCheck, Shield } from 'lucide-react'

const STEPS = [
  { id: 1, title: 'Personal & Owner Info', description: 'Tell us about yourself' },
  { id: 2, title: 'Business Details', description: 'Business information' },
  { id: 3, title: 'Business Metrics', description: 'Financial and operational metrics' },
  { id: 4, title: 'Funding Requirements', description: 'What are you looking for?' },
  { id: 5, title: 'Review', description: 'Review and complete' },
]

const INDUSTRIES = [
  'Agriculture & Forestry',
  'Manufacturing',
  'Technology & IT',
  'Tourism & Hospitality',
  'Mining & Quarrying',
  'Energy & Utilities',
  'Healthcare & Pharmaceuticals',
  'Education & Training',
  'Retail & Wholesale',
  'Professional Services',
  'Construction & Real Estate',
  'Transport & Logistics',
  'Finance & Insurance',
  'Media & Communications',
  'Food & Beverage',
  'Textiles & Clothing',
  'Other',
]

const SECTORS = [
  'Agriculture',
  'Manufacturing',
  'Technology',
  'Tourism',
  'Mining',
  'Energy',
  'Healthcare',
  'Education',
  'Retail',
  'Services',
  'Construction',
  'Transport',
  'Finance',
]

const FUNDING_TYPES = [
  'Grants',
  'Loans',
  'Equity Investment',
  'Vouchers',
  'Subsidies',
  'Mentorship Programs',
]

const REVENUE_RANGES = [
  { value: 'under-100k', label: 'Under R100,000' },
  { value: '100k-500k', label: 'R100,000 - R500,000' },
  { value: '500k-1m', label: 'R500,000 - R1 Million' },
  { value: '1m-5m', label: 'R1 Million - R5 Million' },
  { value: '5m-10m', label: 'R5 Million - R10 Million' },
  { value: '10m-50m', label: 'R10 Million - R50 Million' },
  { value: 'over-50m', label: 'Over R50 Million' },
]

const EMPLOYEE_RANGES = [
  { value: '1-5', label: '1-5 employees' },
  { value: '6-10', label: '6-10 employees' },
  { value: '11-20', label: '11-20 employees' },
  { value: '21-50', label: '21-50 employees' },
  { value: '51-100', label: '51-100 employees' },
  { value: '101-250', label: '101-250 employees' },
  { value: 'over-250', label: 'Over 250 employees' },
]

const TIMELINE_OPTIONS = [
  { value: 'immediately', label: 'Immediately (within 1 month)' },
  { value: 'short-term', label: 'Short-term (1-3 months)' },
  { value: 'medium-term', label: 'Medium-term (3-6 months)' },
  { value: 'long-term', label: 'Long-term (6-12 months)' },
  { value: 'planning', label: 'Planning phase (12+ months)' },
]

const GENDERS = ['Male', 'Female', 'Other', 'Prefer not to say']
const RACES = ['Black', 'Coloured', 'Indian/Asian', 'White', 'Other', 'Prefer not to say']
const DISABILITY_STATUSES = ['Yes', 'No', 'Prefer not to say']
const BEE_LEVELS = ['Level 1', 'Level 2', 'Level 3', 'Level 4', 'Level 5', 'Level 6', 'Level 7', 'Level 8', 'Not Certified']

// Helper function to normalize values
const normalizeValue = (value, useSpaceSlash = false) => {
  if (!value) return ''
  let normalized = value.toLowerCase()
  if (useSpaceSlash) {
    normalized = normalized.replace(/\s+\//g, '-')
  }
  return normalized.replace(/\s+/g, '-')
}

export default function AccountCreation() {
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    // Step 1: Personal & Owner Information
    ownerFullName: '',
    idNumber: '',
    phone: '',
    email: '',
    gender: '',
    race: '',
    disabilityStatus: '',
    
    // Step 2: Business Details
    businessName: '',
    companyRegistrationNumber: '',
    businessType: '',
    industry: '',
    businessRegistrationDate: '',
    yearsInBusiness: '',
    physicalAddress: '',
    website: '',
    taxNumber: '',
    vatNumber: '',
    
    // Step 3: Business Metrics
    annualRevenue: '',
    numberOfEmployees: '',
    beeLevel: '',
    
    // Step 4: Funding Requirements
    fundingAmountNeeded: '',
    timeline: '',
    purposeOfFunding: '',
    previousFundingHistory: false,
    previousFundingDetails: '',
    sectors: [],
    fundingTypes: [],
  })
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [registrationData, setRegistrationData] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    async function checkRegistration() {
      const tempReg = localStorage.getItem('temp_registration')
      const token = getToken()
      const session = await getCurrentSession()
      
      if (!tempReg && !session) {
        navigate('/register', { replace: true })
        return
      }

      if (session && !tempReg) {
        const tempRegistration = {
          id: session.user.id,
          loginMethod: session.user.email ? 'email' : 'phone',
          email: session.user.email || null,
          phone: session.user.phone || null,
          registeredAt: new Date().toISOString(),
          profileCompleted: false,
        }
        localStorage.setItem('temp_registration', JSON.stringify(tempRegistration))
        setRegistrationData(tempRegistration)
        setFormData(prev => ({
          ...prev,
          phone: session.user.phone || prev.phone,
          email: session.user.email || prev.email,
        }))
        return
      }

      if (tempReg) {
        try {
          const regData = JSON.parse(tempReg)
          setRegistrationData(regData)
          setFormData(prev => ({
            ...prev,
            phone: regData.loginMethod === 'phone' ? regData.phone : prev.phone,
            email: regData.loginMethod === 'email' ? regData.email : prev.email,
          }))
        } catch (error) {
          console.error('Error parsing registration data:', error)
          navigate('/register', { replace: true })
        }
      }
    }

    checkRegistration()
  }, [navigate])

  function updateFormData(field, value) {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
    if (error) setError('')
  }

  function validateIDNumber(idNumber) {
    if (!idNumber) return false
    const cleaned = idNumber.replace(/\D/g, '')
    return cleaned.length === 13 && /^\d{13}$/.test(cleaned)
  }

  function validateStep(step) {
    const newErrors = {}

    if (step === 1) {
      if (!formData.ownerFullName.trim()) newErrors.ownerFullName = 'Owner full name is required'
      if (!formData.idNumber.trim()) {
        newErrors.idNumber = 'ID number is required'
      } else if (!validateIDNumber(formData.idNumber)) {
        newErrors.idNumber = 'Please enter a valid 13-digit South African ID number'
      }
      if (!formData.phone.trim()) newErrors.phone = 'Phone number is required'
      if (!formData.gender) newErrors.gender = 'Gender is required'
      if (!formData.race) newErrors.race = 'Race/Ethnicity is required'
      if (!formData.disabilityStatus) newErrors.disabilityStatus = 'Disability status is required'
    }

    if (step === 2) {
      if (!formData.businessName.trim()) newErrors.businessName = 'Business name is required'
      if (!formData.businessType) newErrors.businessType = 'Business type is required'
      if (!formData.industry) newErrors.industry = 'Industry is required'
    }

    if (step === 3) {
      if (!formData.annualRevenue) newErrors.annualRevenue = 'Annual revenue is required'
      if (!formData.numberOfEmployees) newErrors.numberOfEmployees = 'Number of employees is required'
    }

    if (step === 4) {
      if (!formData.fundingAmountNeeded) newErrors.fundingAmountNeeded = 'Funding amount needed is required'
      if (!formData.timeline) newErrors.timeline = 'Timeline is required'
      if (!formData.purposeOfFunding.trim()) {
        newErrors.purposeOfFunding = 'Purpose of funding is required'
      } else if (formData.purposeOfFunding.trim().length < 20) {
        newErrors.purposeOfFunding = 'Please provide more details (at least 20 characters)'
      }
      if (formData.sectors.length === 0) {
        newErrors.sectors = 'Select at least one sector'
      }
      if (formData.fundingTypes.length === 0) {
        newErrors.fundingTypes = 'Select at least one funding type'
      }
      if (formData.previousFundingHistory && !formData.previousFundingDetails.trim()) {
        newErrors.previousFundingDetails = 'Please provide details about previous funding'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function handleNext() {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length))
    }
  }

  function handleBack() {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    
    if (!validateStep(currentStep)) return

    setLoading(true)
    setError('')

    try {
      if (!registrationData) {
        setLoading(false)
        navigate('/register', { replace: true })
        return
      }

      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !currentUser) {
        console.error('Error getting current user:', userError)
        setError('Authentication error. Please try logging in again.')
        setLoading(false)
        navigate('/register', { replace: true })
        return
      }

      // Prepare user profile data for user_profiles table
      const userProfileData = {
        user_id: currentUser.id,
        login_method: registrationData.loginMethod || (currentUser.email ? 'email' : 'phone'),
        email: currentUser.email || registrationData.email || formData.email || null,
        phone: formData.phone || registrationData.phone || null,
        password_hash: 'password_stored_in_auth_users_table', // Passwords stored in auth.users
        owner_full_name: formData.ownerFullName,
        id_number: formData.idNumber.replace(/\D/g, ''), // Remove non-digits
        gender: normalizeValue(formData.gender),
        race: normalizeValue(formData.race, true),
        disability_status: normalizeValue(formData.disabilityStatus),
        business_name: formData.businessName,
        company_registration_number: formData.companyRegistrationNumber || null,
        business_type: formData.businessType,
        industry: normalizeValue(formData.industry),
        business_registration_date: formData.businessRegistrationDate || null,
        years_in_business: formData.yearsInBusiness ? parseInt(formData.yearsInBusiness) : null,
        physical_address: formData.physicalAddress || null,
        website: formData.website || null,
        tax_number: formData.taxNumber || null,
        vat_number: formData.vatNumber || null,
        annual_revenue: formData.annualRevenue,
        number_of_employees: formData.numberOfEmployees,
        bee_level: formData.beeLevel ? normalizeValue(formData.beeLevel) : null,
        funding_amount_needed: formData.fundingAmountNeeded,
        timeline: formData.timeline,
        purpose_of_funding: formData.purposeOfFunding,
        previous_funding_history: formData.previousFundingHistory,
        previous_funding_details: formData.previousFundingDetails || null,
        sectors: formData.sectors.length > 0 ? formData.sectors : [],
        funding_types: formData.fundingTypes.length > 0 ? formData.fundingTypes : [],
        profile_completed: true,
      }

      // Check if profile already exists
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('user_id', currentUser.id)
        .single()

      let profile
      let profileError

      if (existingProfile) {
        const { data: updatedProfile, error: updateError } = await supabase
          .from('user_profiles')
          .update({
            ...userProfileData,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', currentUser.id)
          .select()
          .single()
        
        profile = updatedProfile
        profileError = updateError
      } else {
        const { data: insertedProfile, error: insertError } = await supabase
          .from('user_profiles')
          .insert(userProfileData)
          .select()
          .single()
        
        profile = insertedProfile
        profileError = insertError
      }

      if (profileError) {
        console.error('Error saving user profile:', profileError)
        setError(`Failed to save profile: ${profileError.message || 'Please try again.'}`)
        setLoading(false)
        return
      }

      // Remove temp registration
      localStorage.removeItem('temp_registration')

      // Set user data
      const completeUser = {
        id: currentUser.id,
        email: currentUser.email || registrationData.email,
        ...userProfileData,
      }
      setUser(completeUser)

      // Get session and set token
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setToken(session.access_token)
      }

      setLoading(false)
      navigate('/dashboard', { replace: true })
    } catch (error) {
      console.error('Error completing profile:', error)
      setError('An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  function toggleSector(sector) {
    setFormData(prev => ({
      ...prev,
      sectors: prev.sectors.includes(sector)
        ? prev.sectors.filter(s => s !== sector)
        : [...prev.sectors, sector],
    }))
    if (errors.sectors) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors.sectors
        return newErrors
      })
    }
  }

  function toggleFundingType(type) {
    setFormData(prev => ({
      ...prev,
      fundingTypes: prev.fundingTypes.includes(type)
        ? prev.fundingTypes.filter(t => t !== type)
        : [...prev.fundingTypes, type],
    }))
    if (errors.fundingTypes) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors.fundingTypes
        return newErrors
      })
    }
  }

  if (!registrationData) {
    return (
      <div className="min-h-screen grid place-items-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">Loading...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const stepIcons = [User, Building2, TrendingUp, DollarSign, FileCheck]
  const progressPercentage = (currentStep / STEPS.length) * 100

  return (
    <div className={cn('min-h-screen py-8 px-4 bg-gradient-to-br from-background to-muted/20')}>
      <div className="max-w-5xl mx-auto">
        <Card className="w-full shadow-xl">
          <CardHeader className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-b pb-6">
            <div className="text-center mb-6">
              <CardTitle className="text-3xl font-bold mb-2">Complete Your Profile</CardTitle>
              <CardDescription className="text-base">
                Let's set up your account - this will only take a few minutes
              </CardDescription>
              <div className="mt-4">
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <span>Progress:</span>
                  <div className="flex-1 max-w-[200px] h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                  <span className="font-semibold text-primary">
                    {Math.round(progressPercentage)}%
                  </span>
                </div>
              </div>
            </div>
            
            {/* Progress Steps */}
            <div className="mt-8 flex items-center justify-between relative">
              {STEPS.map((step, index) => {
                const StepIcon = stepIcons[index]
                const isCompleted = currentStep > step.id
                const isCurrent = currentStep === step.id
                
                return (
                  <div key={step.id} className="flex items-center flex-1 relative z-10">
                    <div className="flex flex-col items-center flex-1">
                      <div
                        className={cn(
                          'w-14 h-14 rounded-full flex items-center justify-center border-2 transition-all duration-300 shadow-lg',
                          isCompleted
                            ? 'bg-primary border-primary text-primary-foreground'
                            : isCurrent
                            ? 'border-primary text-primary bg-primary/10 ring-4 ring-primary/20'
                            : 'border-muted text-muted-foreground bg-background'
                        )}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-6 h-6" />
                        ) : (
                          <StepIcon className="w-5 h-5" />
                        )}
                      </div>
                      <div className="mt-3 text-center max-w-[120px]">
                        <p className={cn(
                          'text-xs font-semibold leading-tight',
                          isCompleted || isCurrent 
                            ? 'text-foreground' 
                            : 'text-muted-foreground'
                        )}>
                          {step.title}
                        </p>
                        <p className={cn(
                          'text-[10px] mt-1',
                          isCurrent ? 'text-primary font-medium' : 'text-muted-foreground'
                        )}>
                          {step.description}
                        </p>
                      </div>
                    </div>
                    {index < STEPS.length - 1 && (
                      <div className={cn(
                        'h-1 flex-1 mx-3 transition-all duration-500 rounded-full',
                        currentStep > step.id 
                          ? 'bg-primary' 
                          : 'bg-muted'
                      )} />
                    )}
                  </div>
                )
              })}
            </div>
          </CardHeader>

          <CardContent className="p-8">
            {error && (
              <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-md">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit}>
              {/* Step 1: Personal & Owner Information */}
              {currentStep === 1 && (
                <div className="space-y-6 animate-in fade-in-50 duration-300">
                  <div className="mb-6 pb-4 border-b">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">{STEPS[0].title}</h3>
                        <p className="text-sm text-muted-foreground">{STEPS[0].description}</p>
                      </div>
                    </div>
                  </div>
                  <FieldGroup className="space-y-5">
                    <Field>
                      <FieldLabel htmlFor="ownerFullName">Owner Full Name *</FieldLabel>
                      <Input
                        id="ownerFullName"
                        value={formData.ownerFullName}
                        onChange={(e) => updateFormData('ownerFullName', e.target.value)}
                        placeholder="John Doe"
                        required
                        className={errors.ownerFullName ? 'border-red-500' : ''}
                      />
                      {errors.ownerFullName && (
                        <p className="text-sm text-red-500 mt-1">{errors.ownerFullName}</p>
                      )}
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="idNumber">ID Number *</FieldLabel>
                      <Input
                        id="idNumber"
                        value={formData.idNumber}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 13)
                          updateFormData('idNumber', value)
                        }}
                        placeholder="1234567890123"
                        maxLength={13}
                        required
                        className={errors.idNumber ? 'border-red-500' : ''}
                      />
                      <FieldDescription>13-digit South African ID number</FieldDescription>
                      {errors.idNumber && (
                        <p className="text-sm text-red-500 mt-1">{errors.idNumber}</p>
                      )}
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="phone">Phone Number *</FieldLabel>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => updateFormData('phone', e.target.value)}
                        placeholder="+27 12 345 6789"
                        required
                        disabled={registrationData?.loginMethod === 'phone'}
                        className={errors.phone ? 'border-red-500' : ''}
                      />
                      {errors.phone && (
                        <p className="text-sm text-red-500 mt-1">{errors.phone}</p>
                      )}
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="email">Email</FieldLabel>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => updateFormData('email', e.target.value)}
                        placeholder="john@example.com"
                        disabled={registrationData?.loginMethod === 'email'}
                        className={errors.email ? 'border-red-500' : ''}
                      />
                      <FieldDescription>
                        {registrationData?.loginMethod === 'email' 
                          ? 'Email from registration' 
                          : 'Optional contact email'}
                      </FieldDescription>
                    </Field>
                    
                    <div className="border-t pt-6 mt-6">
                      <div className="flex items-center gap-2 mb-4">
                        <Shield className="w-4 h-4 text-primary" />
                        <h4 className="text-sm font-semibold">Demographics (for BEE compliance) *</h4>
                      </div>
                      
                      <Field>
                        <FieldLabel>Gender *</FieldLabel>
                        <RadioGroup
                          value={formData.gender}
                          onValueChange={(value) => updateFormData('gender', value)}
                        >
                          <div className="grid grid-cols-2 gap-3">
                            {GENDERS.map((gender) => (
                              <div key={gender} className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted transition-colors">
                                <RadioGroupItem value={normalizeValue(gender)} id={`gender-${gender}`} />
                                <Label htmlFor={`gender-${gender}`} className="font-normal cursor-pointer text-sm flex-1">
                                  {gender}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </RadioGroup>
                        {errors.gender && (
                          <p className="text-sm text-red-500 mt-2">{errors.gender}</p>
                        )}
                      </Field>
                      
                      <Field>
                        <FieldLabel>Race/Ethnicity *</FieldLabel>
                        <RadioGroup
                          value={formData.race}
                          onValueChange={(value) => updateFormData('race', value)}
                        >
                          <div className="grid grid-cols-2 gap-3">
                            {RACES.map((race) => (
                              <div key={race} className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted transition-colors">
                                <RadioGroupItem value={normalizeValue(race, true)} id={`race-${race}`} />
                                <Label htmlFor={`race-${race}`} className="font-normal cursor-pointer text-sm flex-1">
                                  {race}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </RadioGroup>
                        {errors.race && (
                          <p className="text-sm text-red-500 mt-2">{errors.race}</p>
                        )}
                      </Field>
                      
                      <Field>
                        <FieldLabel>Disability Status *</FieldLabel>
                        <RadioGroup
                          value={formData.disabilityStatus}
                          onValueChange={(value) => updateFormData('disabilityStatus', value)}
                        >
                          <div className="grid grid-cols-3 gap-3">
                            {DISABILITY_STATUSES.map((status) => (
                              <div key={status} className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted transition-colors">
                                <RadioGroupItem value={normalizeValue(status)} id={`disability-${status}`} />
                                <Label htmlFor={`disability-${status}`} className="font-normal cursor-pointer text-sm flex-1">
                                  {status}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </RadioGroup>
                        {errors.disabilityStatus && (
                          <p className="text-sm text-red-500 mt-2">{errors.disabilityStatus}</p>
                        )}
                      </Field>
                    </div>
                  </FieldGroup>
                </div>
              )}

              {/* Step 2: Business Details */}
              {currentStep === 2 && (
                <div className="space-y-6 animate-in fade-in-50 duration-300">
                  <div className="mb-6 pb-4 border-b">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">{STEPS[1].title}</h3>
                        <p className="text-sm text-muted-foreground">{STEPS[1].description}</p>
                      </div>
                    </div>
                  </div>
                  <FieldGroup className="space-y-5">
                    <Field>
                      <FieldLabel htmlFor="businessName">Business Name *</FieldLabel>
                      <Input
                        id="businessName"
                        value={formData.businessName}
                        onChange={(e) => updateFormData('businessName', e.target.value)}
                        placeholder="ABC Enterprises (Pty) Ltd"
                        required
                        className={errors.businessName ? 'border-red-500' : ''}
                      />
                      {errors.businessName && (
                        <p className="text-sm text-red-500 mt-1">{errors.businessName}</p>
                      )}
                    </Field>
                    <div className="grid grid-cols-2 gap-4">
                      <Field>
                        <FieldLabel htmlFor="companyRegistrationNumber">Company Registration Number</FieldLabel>
                        <Input
                          id="companyRegistrationNumber"
                          value={formData.companyRegistrationNumber}
                          onChange={(e) => updateFormData('companyRegistrationNumber', e.target.value)}
                          placeholder="2023/123456/07"
                          className={errors.companyRegistrationNumber ? 'border-red-500' : ''}
                        />
                        <FieldDescription>CIPC registration (optional)</FieldDescription>
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="businessType">Business Type *</FieldLabel>
                        <Select
                          value={formData.businessType}
                          onValueChange={(value) => updateFormData('businessType', value)}
                        >
                          <SelectTrigger className={errors.businessType ? 'border-red-500' : ''}>
                            <SelectValue placeholder="Select business type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sole-proprietor">Sole Proprietor</SelectItem>
                            <SelectItem value="partnership">Partnership</SelectItem>
                            <SelectItem value="pty-ltd">Pty (Ltd)</SelectItem>
                            <SelectItem value="cc">Close Corporation (CC)</SelectItem>
                            <SelectItem value="npc">Non-Profit Company (NPC)</SelectItem>
                            <SelectItem value="cooperative">Cooperative</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        {errors.businessType && (
                          <p className="text-sm text-red-500 mt-1">{errors.businessType}</p>
                        )}
                      </Field>
                    </div>
                    <Field>
                      <FieldLabel htmlFor="industry">Industry *</FieldLabel>
                      <Select
                        value={formData.industry}
                        onValueChange={(value) => updateFormData('industry', value)}
                      >
                        <SelectTrigger className={errors.industry ? 'border-red-500' : ''}>
                          <SelectValue placeholder="Select primary industry" />
                        </SelectTrigger>
                        <SelectContent>
                          {INDUSTRIES.map((industry) => (
                            <SelectItem key={industry} value={normalizeValue(industry)}>
                              {industry}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.industry && (
                        <p className="text-sm text-red-500 mt-1">{errors.industry}</p>
                      )}
                    </Field>
                    <div className="grid grid-cols-2 gap-4">
                      <Field>
                        <FieldLabel htmlFor="businessRegistrationDate">Business Registration Date</FieldLabel>
                        <Input
                          id="businessRegistrationDate"
                          type="date"
                          value={formData.businessRegistrationDate}
                          onChange={(e) => updateFormData('businessRegistrationDate', e.target.value)}
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="yearsInBusiness">Years in Business</FieldLabel>
                        <Input
                          id="yearsInBusiness"
                          type="number"
                          min="0"
                          value={formData.yearsInBusiness}
                          onChange={(e) => updateFormData('yearsInBusiness', e.target.value)}
                          placeholder="5"
                        />
                      </Field>
                    </div>
                    <Field>
                      <FieldLabel htmlFor="physicalAddress">Physical Address</FieldLabel>
                      <textarea
                        id="physicalAddress"
                        value={formData.physicalAddress}
                        onChange={(e) => updateFormData('physicalAddress', e.target.value)}
                        placeholder="123 Main Street, City, Province, Postal Code"
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        rows={3}
                      />
                    </Field>
                    <div className="grid grid-cols-2 gap-4">
                      <Field>
                        <FieldLabel htmlFor="website">Website</FieldLabel>
                        <Input
                          id="website"
                          type="url"
                          value={formData.website}
                          onChange={(e) => updateFormData('website', e.target.value)}
                          placeholder="https://www.example.com"
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="taxNumber">Tax Number</FieldLabel>
                        <Input
                          id="taxNumber"
                          value={formData.taxNumber}
                          onChange={(e) => updateFormData('taxNumber', e.target.value)}
                          placeholder="1234567890"
                        />
                      </Field>
                    </div>
                    <Field>
                      <FieldLabel htmlFor="vatNumber">VAT Number</FieldLabel>
                      <Input
                        id="vatNumber"
                        value={formData.vatNumber}
                        onChange={(e) => updateFormData('vatNumber', e.target.value)}
                        placeholder="4123456789"
                      />
                    </Field>
                  </FieldGroup>
                </div>
              )}

              {/* Step 3: Business Metrics */}
              {currentStep === 3 && (
                <div className="space-y-6 animate-in fade-in-50 duration-300">
                  <div className="mb-6 pb-4 border-b">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">{STEPS[2].title}</h3>
                        <p className="text-sm text-muted-foreground">{STEPS[2].description}</p>
                      </div>
                    </div>
                  </div>
                  <FieldGroup className="space-y-5">
                    <Field>
                      <FieldLabel htmlFor="annualRevenue">Annual Revenue *</FieldLabel>
                      <Select
                        value={formData.annualRevenue}
                        onValueChange={(value) => updateFormData('annualRevenue', value)}
                      >
                        <SelectTrigger className={errors.annualRevenue ? 'border-red-500' : ''}>
                          <SelectValue placeholder="Select annual revenue range" />
                        </SelectTrigger>
                        <SelectContent>
                          {REVENUE_RANGES.map((range) => (
                            <SelectItem key={range.value} value={range.value}>
                              {range.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.annualRevenue && (
                        <p className="text-sm text-red-500 mt-1">{errors.annualRevenue}</p>
                      )}
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="numberOfEmployees">Number of Employees *</FieldLabel>
                      <Select
                        value={formData.numberOfEmployees}
                        onValueChange={(value) => updateFormData('numberOfEmployees', value)}
                      >
                        <SelectTrigger className={errors.numberOfEmployees ? 'border-red-500' : ''}>
                          <SelectValue placeholder="Select number of employees" />
                        </SelectTrigger>
                        <SelectContent>
                          {EMPLOYEE_RANGES.map((range) => (
                            <SelectItem key={range.value} value={range.value}>
                              {range.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.numberOfEmployees && (
                        <p className="text-sm text-red-500 mt-1">{errors.numberOfEmployees}</p>
                      )}
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="beeLevel">BEE Level</FieldLabel>
                      <Select
                        value={formData.beeLevel}
                        onValueChange={(value) => updateFormData('beeLevel', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select BEE level (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          {BEE_LEVELS.map((level) => (
                            <SelectItem key={level} value={normalizeValue(level)}>
                              {level}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                  </FieldGroup>
                </div>
              )}

              {/* Step 4: Funding Requirements */}
              {currentStep === 4 && (
                <div className="space-y-6 animate-in fade-in-50 duration-300">
                  <div className="mb-6 pb-4 border-b">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">{STEPS[3].title}</h3>
                        <p className="text-sm text-muted-foreground">{STEPS[3].description}</p>
                      </div>
                    </div>
                  </div>
                  <FieldGroup className="space-y-5">
                    <Field>
                      <FieldLabel htmlFor="fundingAmountNeeded">Funding Amount Needed *</FieldLabel>
                      <Select
                        value={formData.fundingAmountNeeded}
                        onValueChange={(value) => updateFormData('fundingAmountNeeded', value)}
                      >
                        <SelectTrigger className={errors.fundingAmountNeeded ? 'border-red-500' : ''}>
                          <SelectValue placeholder="Select funding amount needed" />
                        </SelectTrigger>
                        <SelectContent>
                          {REVENUE_RANGES.map((range) => (
                            <SelectItem key={range.value} value={range.value}>
                              {range.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.fundingAmountNeeded && (
                        <p className="text-sm text-red-500 mt-1">{errors.fundingAmountNeeded}</p>
                      )}
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="timeline">Timeline *</FieldLabel>
                      <Select
                        value={formData.timeline}
                        onValueChange={(value) => updateFormData('timeline', value)}
                      >
                        <SelectTrigger className={errors.timeline ? 'border-red-500' : ''}>
                          <SelectValue placeholder="Select timeline" />
                        </SelectTrigger>
                        <SelectContent>
                          {TIMELINE_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.timeline && (
                        <p className="text-sm text-red-500 mt-1">{errors.timeline}</p>
                      )}
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="purposeOfFunding">Purpose of Funding *</FieldLabel>
                      <textarea
                        id="purposeOfFunding"
                        value={formData.purposeOfFunding}
                        onChange={(e) => updateFormData('purposeOfFunding', e.target.value)}
                        placeholder="Describe what you need the funding for..."
                        className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        rows={5}
                        required
                      />
                      <FieldDescription>Please provide at least 20 characters</FieldDescription>
                      {errors.purposeOfFunding && (
                        <p className="text-sm text-red-500 mt-1">{errors.purposeOfFunding}</p>
                      )}
                    </Field>
                    <Field>
                      <FieldLabel>Sectors of Interest *</FieldLabel>
                      <FieldDescription>Select all sectors that apply to your business</FieldDescription>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                        {SECTORS.map((sector) => (
                          <div key={sector} className="flex items-center space-x-2">
                            <Checkbox
                              id={`sector-${sector}`}
                              checked={formData.sectors.includes(sector)}
                              onCheckedChange={() => toggleSector(sector)}
                            />
                            <Label htmlFor={`sector-${sector}`} className="text-sm font-normal cursor-pointer">
                              {sector}
                            </Label>
                          </div>
                        ))}
                      </div>
                      {errors.sectors && (
                        <p className="text-sm text-red-500 mt-2">{errors.sectors}</p>
                      )}
                    </Field>
                    <Field>
                      <FieldLabel>Funding Types *</FieldLabel>
                      <FieldDescription>What types of funding are you interested in?</FieldDescription>
                      <div className="grid grid-cols-2 gap-3 mt-2">
                        {FUNDING_TYPES.map((type) => (
                          <div key={type} className="flex items-center space-x-2">
                            <Checkbox
                              id={`funding-${type}`}
                              checked={formData.fundingTypes.includes(type)}
                              onCheckedChange={() => toggleFundingType(type)}
                            />
                            <Label htmlFor={`funding-${type}`} className="text-sm font-normal cursor-pointer">
                              {type}
                            </Label>
                          </div>
                        ))}
                      </div>
                      {errors.fundingTypes && (
                        <p className="text-sm text-red-500 mt-2">{errors.fundingTypes}</p>
                      )}
                    </Field>
                    <Field>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="previousFundingHistory"
                          checked={formData.previousFundingHistory}
                          onCheckedChange={(checked) => updateFormData('previousFundingHistory', checked)}
                        />
                        <Label htmlFor="previousFundingHistory" className="text-sm font-normal cursor-pointer">
                          Have you received funding before?
                        </Label>
                      </div>
                      {formData.previousFundingHistory && (
                        <div className="mt-3">
                          <FieldLabel htmlFor="previousFundingDetails">Previous Funding Details *</FieldLabel>
                          <textarea
                            id="previousFundingDetails"
                            value={formData.previousFundingDetails}
                            onChange={(e) => updateFormData('previousFundingDetails', e.target.value)}
                            placeholder="Describe your previous funding experience..."
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-2"
                            rows={3}
                          />
                          {errors.previousFundingDetails && (
                            <p className="text-sm text-red-500 mt-1">{errors.previousFundingDetails}</p>
                          )}
                        </div>
                      )}
                    </Field>
                  </FieldGroup>
                </div>
              )}

              {/* Step 5: Review */}
              {currentStep === 5 && (
                <div className="space-y-6 animate-in fade-in-50 duration-300">
                  <div className="mb-6 pb-4 border-b">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FileCheck className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">{STEPS[4].title}</h3>
                        <p className="text-sm text-muted-foreground">{STEPS[4].description}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                    <div>
                      <h4 className="font-semibold mb-2">Personal Information</h4>
                      <div className="space-y-1 text-sm">
                        <p><span className="text-muted-foreground">Name:</span> {formData.ownerFullName}</p>
                        <p><span className="text-muted-foreground">ID Number:</span> {formData.idNumber}</p>
                        <p><span className="text-muted-foreground">Phone:</span> {formData.phone}</p>
                        <p><span className="text-muted-foreground">Email:</span> {formData.email || registrationData.email}</p>
                        <p><span className="text-muted-foreground">Gender:</span> {formData.gender}</p>
                        <p><span className="text-muted-foreground">Race:</span> {formData.race}</p>
                        <p><span className="text-muted-foreground">Disability Status:</span> {formData.disabilityStatus}</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Business Details</h4>
                      <div className="space-y-1 text-sm">
                        <p><span className="text-muted-foreground">Business Name:</span> {formData.businessName}</p>
                        <p><span className="text-muted-foreground">Business Type:</span> {formData.businessType}</p>
                        <p><span className="text-muted-foreground">Industry:</span> {formData.industry}</p>
                        {formData.companyRegistrationNumber && (
                          <p><span className="text-muted-foreground">Registration Number:</span> {formData.companyRegistrationNumber}</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Business Metrics</h4>
                      <div className="space-y-1 text-sm">
                        <p><span className="text-muted-foreground">Annual Revenue:</span> {REVENUE_RANGES.find(r => r.value === formData.annualRevenue)?.label}</p>
                        <p><span className="text-muted-foreground">Employees:</span> {EMPLOYEE_RANGES.find(e => e.value === formData.numberOfEmployees)?.label}</p>
                        {formData.beeLevel && (
                          <p><span className="text-muted-foreground">BEE Level:</span> {formData.beeLevel}</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Funding Requirements</h4>
                      <div className="space-y-1 text-sm">
                        <p><span className="text-muted-foreground">Amount Needed:</span> {REVENUE_RANGES.find(r => r.value === formData.fundingAmountNeeded)?.label}</p>
                        <p><span className="text-muted-foreground">Timeline:</span> {TIMELINE_OPTIONS.find(t => t.value === formData.timeline)?.label}</p>
                        <p><span className="text-muted-foreground">Sectors:</span> {formData.sectors.join(', ') || 'None'}</p>
                        <p><span className="text-muted-foreground">Funding Types:</span> {formData.fundingTypes.join(', ') || 'None'}</p>
                        <p><span className="text-muted-foreground">Purpose:</span> {formData.purposeOfFunding}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between mt-6 pt-6 border-t">
                <div>
                  {currentStep > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleBack}
                      disabled={loading}
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  {currentStep < STEPS.length ? (
                    <Button
                      type="button"
                      onClick={handleNext}
                      disabled={loading}
                    >
                      Next
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={loading}
                    >
                      {loading ? 'Creating Profile...' : 'Complete Setup'}
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
