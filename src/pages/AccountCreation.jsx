import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentSession } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Building2,
  Store,
  Lightbulb,
  FileText,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  Search,
  Info,
  Target,
  TrendingUp,
  Clock,
  Zap,
  Star,
  X,
  MapPin,
  DollarSign,
  Users,
  Shield,
  Wallet,
  CreditCard,
  Smartphone,
  Banknote,
  Receipt,
  Sparkles,
} from 'lucide-react'

// Constants
const BUSINESS_TYPES = [
  { id: 'registered', label: 'Registered Company', description: 'Formally registered with CIPC', icon: Building2, color: 'text-purple-600' },
  { id: 'not-registered', label: 'Not Registered', description: 'Operating business, not formally registered', icon: Store, color: 'text-blue-600' },
  { id: 'spaza', label: 'Spaza Shop', description: 'Informal retail business', icon: Store, color: 'text-yellow-600' },
  { id: 'idea', label: 'Business Idea', description: 'Planning to start a business', icon: Lightbulb, color: 'text-orange-600' },
]

const PROVINCES = [
  'Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal',
  'Limpopo', 'Mpumalanga', 'Northern Cape', 'North West', 'Western Cape'
]

const INDUSTRIES = [
  'Agriculture & Agro-processing',
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

const FUNDING_PURPOSES = [
  'Working capital',
  'Equipment / Assets (vehicles, machinery, IT hardware)',
  'Technology / Digitisation (POS, accounting, ERP, e-commerce, cybersecurity)',
  'Property / Premises',
  'Marketing & Sales',
  'Research & Development',
  'Debt consolidation',
  'Expansion / Growth',
]

const TIMELINE_OPTIONS = [
  { value: 'immediately', label: 'Immediately', description: 'Need funds ASAP (days)' },
  { value: '1-2-weeks', label: '1-2 weeks', description: 'Can wait a short while' },
  { value: 'within-month', label: 'Within a month', description: 'Planning ahead' },
  { value: '2-3-months', label: '2-3 months', description: 'Future planning' },
  { value: '3-plus-months', label: '3+ months', description: 'Longer lead items (grants, capex, equity)' },
  { value: 'flexible', label: "I'm flexible", description: 'Show me best options across timelines' },
]

const STEPS = [
  { number: 1, title: 'Business Type', shortTitle: 'Type' },
  { number: 2, title: 'Business Details', shortTitle: 'Details' },
  { number: 3, title: 'Funding Needs', shortTitle: 'Funding' },
  { number: 4, title: 'Assessment', shortTitle: 'Assessment' },
]

function StepTimeline({ currentStep }) {
  return (
    <div className="w-full max-w-4xl mx-auto mb-12">
      <div className="flex items-center justify-between relative px-4 sm:px-8">
        {/* Connection lines */}
        <div className="absolute top-6 left-8 right-8 h-[2px] bg-border -z-10">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-500 ease-out"
            style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
          />
        </div>

        {STEPS.map((step, index) => {
          const isCompleted = step.number < currentStep
          const isActive = step.number === currentStep
          const isPending = step.number > currentStep

          return (
            <div key={step.number} className="flex flex-col items-center flex-1 relative z-10">
              {/* Step Circle */}
              <div className="relative">
                <div
                  className={cn(
                    "w-14 h-14 rounded-full flex items-center justify-center font-semibold transition-all duration-300",
                    (isCompleted || isActive) && "bg-white border-4 border-blue-400 dark:border-blue-500 shadow-md",
                    isPending && "bg-gray-100 dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-700"
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-7 h-7 text-purple-600 dark:text-purple-400" />
                  ) : (
                    <span
                      className={cn(
                        "text-lg font-semibold",
                        (isCompleted || isActive) && "text-purple-600 dark:text-purple-400",
                        isPending && "text-gray-500 dark:text-gray-400"
                      )}
                    >
                      {step.number}
                    </span>
                  )}
                </div>
              </div>

              {/* Step Labels */}
              <div className="mt-3 text-center max-w-[140px]">
                <div
                  className={cn(
                    "text-sm font-semibold transition-colors duration-300",
                    (isCompleted || isActive) && "text-purple-600 dark:text-purple-400",
                    isPending && "text-gray-600 dark:text-gray-400"
                  )}
                >
                  {step.title}
                </div>
                <div
                  className={cn(
                    "text-xs mt-1 transition-colors duration-300",
                    (isCompleted || isActive) && "text-gray-600 dark:text-gray-400",
                    isPending && "text-gray-500 dark:text-gray-500"
                  )}
                >
                  Step {step.number}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function AccountCreation() {
  const [loading, setLoading] = useState(true)
  const [currentStep, setCurrentStep] = useState(1)
  const [currentAssessmentSection, setCurrentAssessmentSection] = useState(1)
  const [completedAssessmentSections, setCompletedAssessmentSections] = useState([])
  const navigate = useNavigate()

  // Form data state
  const [formData, setFormData] = useState({
    // Step 1
    businessType: '',
    
    // Step 2
    companyRegistrationNumber: '',
    businessName: '',
    province: '',
    postalCode: '',
    differentTradingAddress: false,
    industry: '',
    subIndustry: [],
    whoDoYouSellTo: '',
    isRegulated: false,
    regulatedSectors: [],
    doYouExport: false,
    seasonality: '',
    secondaryIndustries: [],
    
    // Step 3
    fundingAmount: 100000,
    fundingTimeline: '',
    fundingPurposes: [],
    fundingDetails: '',
    
    // Step 4 - Assessment
    // Section 1: Business & Trading
    mainCustomers: '',
    monthlyCustomers: '',
    revenueFromBiggestCustomer: '',
    customerPaymentSpeed: '',
    averageDaysToGetPaid: '',
    paymentMethods: [],
    posAcquirers: [],
    monthlyCardTurnover: '',
    issueInvoices: '',
    percentFromLargestCustomer: '',
    typicalPaymentTerms: '',
    walletProviders: [],
    
    // Section 2: Financial & Banking
    moneyGoesTo: '',
    bank: '',
    accountDuration: '',
    monthlyIncomeRange: '',
    exactMonthlyIncome: '',
    trackFinances: '',
    
    // Section 3: Team & Compliance
    numberOfEmployees: '',
    businessStage: '',
    ownerBackground: [],
    demographics: [],
    sarsStatus: '',
    vatRegistered: '',
    bbbeeLevel: '',
    financialDocuments: [],
    
    // Section 4: Preferences & Location
    repaymentFrequency: '',
    repaymentDuration: '',
    openToEquity: '',
    canProvideCollateral: '',
    cityTown: '',
    impactFocus: '',
  })

  useEffect(() => {
    async function checkAuth() {
      const session = await getCurrentSession()
      
      if (!session) {
        navigate('/register', { replace: true })
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('profile_completed')
          .eq('user_id', user.id)
          .single()
        
        if (profile && profile.profile_completed) {
          navigate('/dashboard', { replace: true })
          return
        }
      }

      setLoading(false)
    }

    checkAuth()
  }, [navigate])

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(prev => prev + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const handleAssessmentNext = () => {
    if (currentAssessmentSection < 4) {
      setCompletedAssessmentSections(prev => [...prev, currentAssessmentSection])
      setCurrentAssessmentSection(prev => prev + 1)
    } else {
      // All assessment sections complete, go to step 5
      setCompletedAssessmentSections(prev => [...prev, 4])
      setCurrentStep(5)
    }
  }

  const handleAssessmentBack = () => {
    if (currentAssessmentSection > 1) {
      setCurrentAssessmentSection(prev => prev - 1)
    } else {
      setCurrentStep(3) // Go back to funding needs
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        navigate('/register')
        return
      }

      // Save profile data to Supabase
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          ...formData,
          profile_completed: true,
          updated_at: new Date().toISOString(),
        })

      if (error) {
        console.error('Error saving profile:', error)
        alert('Error saving profile. Please try again.')
        setLoading(false)
        return
      }

      navigate('/dashboard')
    } catch (error) {
      console.error('Error:', error)
      alert('An error occurred. Please try again.')
      setLoading(false)
    }
  }

  if (loading && currentStep === 1) {
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

  // Step 1: Business Type Selection
  if (currentStep === 1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4">
        <div className="max-w-4xl mx-auto pt-8">
          <StepTimeline currentStep={currentStep} />
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/30 mb-4">
              <Building2 className="w-8 h-8 text-purple-600" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Tell us about your business</h1>
            <p className="text-muted-foreground text-lg">
              We'll help you find the right funding based on your business type
            </p>
          </div>

          <Card className="w-full">
            <CardContent className="p-8">
              <h2 className="text-2xl font-semibold mb-6">What describes your business?</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {BUSINESS_TYPES.map((type) => {
                  const Icon = type.icon
                  return (
                    <button
                      key={type.id}
                      onClick={() => {
                        updateFormData('businessType', type.id)
                        setTimeout(() => handleNext(), 300)
                      }}
                      className={cn(
                        "p-6 rounded-lg border-2 transition-all text-left",
                        formData.businessType === type.id
                          ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                          : "border-border hover:border-purple-300 hover:bg-muted/50"
                      )}
                    >
                      <Icon className={cn("w-8 h-8 mb-3", type.color)} />
                      <h3 className="font-semibold text-lg mb-1">{type.label}</h3>
                      <p className="text-sm text-muted-foreground">{type.description}</p>
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Step 2: Business Details
  if (currentStep === 2) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4">
        <div className="max-w-4xl mx-auto pt-8">
          <StepTimeline currentStep={currentStep} />
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Tell us about your business</h1>
          </div>

          <Card className="w-full">
            <CardContent className="p-8 space-y-6">
              {formData.businessType === 'registered' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-purple-600" />
                      Registered Company Details
                    </h2>
                    <Button variant="ghost" size="sm">Change</Button>
                  </div>

                  <Field>
                    <FieldLabel>Company Registration Number</FieldLabel>
                    <div className="flex gap-2">
                      <Input
                        value={formData.companyRegistrationNumber}
                        onChange={(e) => updateFormData('companyRegistrationNumber', e.target.value)}
                        placeholder="3243521324353423112"
                      />
                      <Button variant="outline">
                        <Search className="w-4 h-4 mr-2" />
                        Lookup
                      </Button>
                    </div>
                    <FieldDescription>
                      Click "Lookup" to verify with CIPC and prefill your details.
                    </FieldDescription>
                  </Field>

                  <Field>
                    <FieldLabel>Business Name</FieldLabel>
                    <div className="relative">
                      <Input
                        value={formData.businessName}
                        onChange={(e) => updateFormData('businessName', e.target.value)}
                        placeholder="Thabo Pty Ltd"
                      />
                      {formData.businessName && (
                        <div className="flex items-center gap-1 mt-2 text-green-600">
                          <CheckCircle2 className="w-4 h-4" />
                          <span className="text-sm">Verified with CIPC</span>
                        </div>
                      )}
                    </div>
                  </Field>

                  <div className="grid grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel>Province *</FieldLabel>
                      <Select value={formData.province} onValueChange={(value) => updateFormData('province', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select province" />
                        </SelectTrigger>
                        <SelectContent>
                          {PROVINCES.map(province => (
                            <SelectItem key={province} value={province}>{province}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>

                    <Field>
                      <FieldLabel>Postal Code *</FieldLabel>
                      <Input
                        value={formData.postalCode}
                        onChange={(e) => updateFormData('postalCode', e.target.value)}
                        placeholder="2001"
                      />
                    </Field>
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={formData.differentTradingAddress}
                      onCheckedChange={(checked) => updateFormData('differentTradingAddress', checked)}
                    />
                    <Label>Different trading address?</Label>
                  </div>
                  <FieldDescription>If you operate from a different location.</FieldDescription>
                </div>
              )}

              <Separator />

              <div className="space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-600" />
                  Your Industry
                </h2>

                <Field>
                  <FieldLabel>What industry is your business in? *</FieldLabel>
                  <Select value={formData.industry} onValueChange={(value) => updateFormData('industry', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {INDUSTRIES.map(industry => (
                        <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                {formData.industry === 'Agriculture & Agro-processing' && (
                  <Field>
                    <FieldLabel>What type of agriculture business? *</FieldLabel>
                    <div className="flex flex-wrap gap-2">
                      {['Horticulture', 'Crop farming', 'Livestock', 'Agri-inputs', 'Agro-processing'].map(option => (
                        <Badge
                          key={option}
                          variant={formData.subIndustry.includes(option) ? 'default' : 'outline'}
                          className="cursor-pointer"
                          onClick={() => {
                            const newSub = formData.subIndustry.includes(option)
                              ? formData.subIndustry.filter(s => s !== option)
                              : [...formData.subIndustry, option]
                            updateFormData('subIndustry', newSub)
                          }}
                        >
                          {option}
                        </Badge>
                      ))}
                    </div>
                  </Field>
                )}

                <div className="space-y-4">
                  <h3 className="font-medium">Quick details about your business</h3>

                  <Field>
                    <FieldLabel>Who do you mainly sell to?</FieldLabel>
                    <div className="flex flex-wrap gap-2">
                      {['Consumers', 'Businesses', 'Government/SoEs', 'Mixed'].map(option => (
                        <Badge
                          key={option}
                          variant={formData.whoDoYouSellTo === option ? 'default' : 'outline'}
                          className="cursor-pointer"
                          onClick={() => updateFormData('whoDoYouSellTo', option)}
                        >
                          {option}
                        </Badge>
                      ))}
                    </div>
                  </Field>

                  <div className="flex items-center justify-between">
                    <div>
                      <FieldLabel>Is your sub-sector regulated?</FieldLabel>
                      <FieldDescription>Select applicable regulations</FieldDescription>
                    </div>
                    <Checkbox
                      checked={formData.isRegulated}
                      onCheckedChange={(checked) => updateFormData('isRegulated', checked)}
                    />
                  </div>

                  {formData.isRegulated && (
                    <div className="flex flex-wrap gap-2">
                      {['Food Safety', 'Health', 'Financial', 'Transport', 'Education', 'Energy/ENV'].map(reg => (
                        <Badge key={reg} variant="outline">{reg}</Badge>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div>
                      <FieldLabel>Do you export?</FieldLabel>
                      <FieldDescription>Sell products/services outside South Africa</FieldDescription>
                    </div>
                    <Checkbox
                      checked={formData.doYouExport}
                      onCheckedChange={(checked) => updateFormData('doYouExport', checked)}
                    />
                  </div>

                  <Field>
                    <FieldLabel>How seasonal is your business?</FieldLabel>
                    <div className="flex flex-wrap gap-2">
                      {['None', 'Low', 'Medium', 'High'].map(option => (
                        <Badge
                          key={option}
                          variant={formData.seasonality === option ? 'default' : 'outline'}
                          className="cursor-pointer"
                          onClick={() => updateFormData('seasonality', option)}
                        >
                          {option}
                        </Badge>
                      ))}
                    </div>
                  </Field>
                </div>

                <Button variant="ghost" className="w-full">
                  + Add secondary industry (optional)
                </Button>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold mb-1">Why we need your location</h4>
                    <p className="text-sm text-muted-foreground">
                      Many funding programs have specific geographic requirements. Your location helps us show you relevant opportunities in your area.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={handleBack}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button onClick={handleNext} disabled={!formData.industry}>
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Step 3: Funding Needs
  if (currentStep === 3) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4">
        <div className="max-w-4xl mx-auto pt-8">
          <StepTimeline currentStep={currentStep} />
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Tell us about your funding needs</h1>
          </div>

          <Card className="w-full">
            <CardContent className="p-8 space-y-8">
              {/* Funding Amount */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold">How much funding do you need?</h2>
                  <Info className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="text-center p-6 border-2 border-dashed rounded-lg">
                  <div className="text-4xl font-bold text-purple-600 mb-2">
                    R {formData.fundingAmount.toLocaleString()}
                  </div>
                  <p className="text-sm text-muted-foreground">Type an amount or use the slider below</p>
                </div>
                <Input
                  type="number"
                  value={formData.fundingAmount}
                  onChange={(e) => updateFormData('fundingAmount', parseInt(e.target.value) || 0)}
                  className="text-center text-2xl"
                />
                <input
                  type="range"
                  min="10000"
                  max="100000000"
                  step="10000"
                  value={formData.fundingAmount}
                  onChange={(e) => updateFormData('fundingAmount', parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>R10k</span>
                  <span>R100k</span>
                  <span>R500k</span>
                  <span>R1m</span>
                  <span>R5m</span>
                  <span>R25m</span>
                  <span>R100m</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-blue-600">
                  <Info className="w-4 h-4" />
                  <span>Selected amount falls in the range: R90k - R110k</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Lightbulb className="w-4 h-4" />
                  <span>Tip: Rounded estimates are fine. You can refine this later based on the funding options available to you.</span>
                </div>
              </div>

              {/* Timeline */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold">When do you need the funding?</h2>
                  <Clock className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {TIMELINE_OPTIONS.map(option => (
                    <button
                      key={option.value}
                      onClick={() => updateFormData('fundingTimeline', option.value)}
                      className={cn(
                        "p-4 rounded-lg border-2 text-left transition-all",
                        formData.fundingTimeline === option.value
                          ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                          : "border-border hover:border-purple-300"
                      )}
                    >
                      <div className="font-semibold mb-1">{option.label}</div>
                      <div className="text-xs text-muted-foreground">{option.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Funding Purposes */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold">What do you need the funding for?</h2>
                  <Lightbulb className="w-4 h-4 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">Pick one or more purposes. Add details if helpful.</p>
                
                <div>
                  <FieldLabel>Primary purpose(s) *</FieldLabel>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.fundingPurposes.map(purpose => (
                      <Badge key={purpose} variant="default" className="gap-1">
                        {purpose}
                        <X
                          className="w-3 h-3 cursor-pointer"
                          onClick={() => {
                            updateFormData('fundingPurposes', formData.fundingPurposes.filter(p => p !== purpose))
                          }}
                        />
                      </Badge>
                    ))}
                  </div>
                  {formData.fundingPurposes.length >= 3 && (
                    <p className="text-sm text-muted-foreground mt-2">Maximum reached — remove one to add another</p>
                  )}
                  {formData.fundingPurposes.length < 3 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {FUNDING_PURPOSES.filter(p => !formData.fundingPurposes.includes(p)).map(purpose => (
                        <Badge
                          key={purpose}
                          variant="outline"
                          className="cursor-pointer"
                          onClick={() => {
                            if (formData.fundingPurposes.length < 3) {
                              updateFormData('fundingPurposes', [...formData.fundingPurposes, purpose])
                            }
                          }}
                        >
                          {purpose}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground mt-2 text-right">
                    {formData.fundingPurposes.length} of 3 max
                  </div>
                </div>

                <Field>
                  <div className="flex items-center gap-2 mb-2">
                    <FieldLabel>Additional details (optional)</FieldLabel>
                    <Info className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <textarea
                    value={formData.fundingDetails}
                    onChange={(e) => updateFormData('fundingDetails', e.target.value)}
                    placeholder="E.g., R250k for refrigerated delivery van in KZN + R120k winter stock; POS upgrade for card acceptance."
                    className="w-full min-h-[100px] p-3 border rounded-md"
                    maxLength={400}
                  />
                  <div className="flex justify-between mt-1">
                    <FieldDescription>AI will extract key details to improve matching</FieldDescription>
                    <span className="text-xs text-muted-foreground">{formData.fundingDetails.length}/400</span>
                  </div>
                </Field>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold mb-1">Building your funding profile</h4>
                    <p className="text-sm text-muted-foreground">
                      These details help us match you with the most suitable funding options. You can always refine them later.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={handleBack}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button onClick={() => setCurrentStep(4)} disabled={!formData.fundingTimeline || formData.fundingPurposes.length === 0}>
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Step 4: Detailed Assessment
  if (currentStep === 4) {
    const assessmentSections = [
      { id: 1, name: 'Business & Trading', icon: Building2 },
      { id: 2, name: 'Financial & Banking', icon: DollarSign },
      { id: 3, name: 'Team & Compliance', icon: Users },
      { id: 4, name: 'Preferences & Location', icon: MapPin },
    ]

    const progress = completedAssessmentSections.length + (currentAssessmentSection === 4 ? 1 : 0)

    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4">
        <div className="max-w-4xl mx-auto pt-8">
          <StepTimeline currentStep={currentStep} />
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-2">
              <CheckCircle2 className="w-6 h-6 text-purple-600" />
              <h1 className="text-3xl font-bold">Detailed Assessment</h1>
            </div>
            <p className="text-muted-foreground">
              Complete this comprehensive assessment to get the most accurate funding matches for your business.
            </p>
          </div>

          <Card className="w-full">
            <CardContent className="p-8">
              <div className="mb-6">
                <div className="flex justify-between text-sm mb-2">
                  <span>Assessment Progress</span>
                  <span>{progress} of 4 sections</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full transition-all"
                    style={{ width: `${(progress / 4) * 100}%` }}
                  />
                </div>
              </div>

              <div className="flex gap-2 mb-8 overflow-x-auto">
                {assessmentSections.map((section) => {
                  const Icon = section.icon
                  const isCompleted = completedAssessmentSections.includes(section.id)
                  const isActive = currentAssessmentSection === section.id
                  return (
                    <button
                      key={section.id}
                      onClick={() => setCurrentAssessmentSection(section.id)}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-lg border transition-all whitespace-nowrap",
                        isActive && "border-purple-500 bg-purple-50 dark:bg-purple-900/20",
                        !isActive && !isCompleted && "border-border",
                        isCompleted && !isActive && "border-green-500 bg-green-50 dark:bg-green-900/20"
                      )}
                    >
                      {isCompleted && <CheckCircle2 className="w-4 h-4 text-green-600" />}
                      <Icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{section.name}</span>
                    </button>
                  )
                })}
              </div>

              {/* Section 1: Business & Trading */}
              {currentAssessmentSection === 1 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold">Business & Trading</h2>
                  <p className="text-muted-foreground">Tell us about your business model and customers</p>

                  <Field>
                    <FieldLabel>Who are your main customers?</FieldLabel>
                    <Select value={formData.mainCustomers} onValueChange={(value) => updateFormData('mainCustomers', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="consumers">Consumers (B2C)</SelectItem>
                        <SelectItem value="businesses">Other businesses (B2B)</SelectItem>
                        <SelectItem value="government">Government/SoEs</SelectItem>
                        <SelectItem value="mixed">Mixed</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>

                  {formData.mainCustomers === 'businesses' && (
                    <Card className="bg-muted/50">
                      <CardContent className="p-4 space-y-4">
                        <h3 className="font-semibold">Business Customer Details</h3>
                        <Field>
                          <FieldLabel>How many customers do you serve monthly?</FieldLabel>
                          <Select value={formData.monthlyCustomers} onValueChange={(value) => updateFormData('monthlyCustomers', value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select range" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1-10">1-10 customers</SelectItem>
                              <SelectItem value="11-50">11-50 customers</SelectItem>
                              <SelectItem value="51-100">51-100 customers</SelectItem>
                              <SelectItem value="100+">100+ customers</SelectItem>
                            </SelectContent>
                          </Select>
                        </Field>
                        <Field>
                          <FieldLabel>What % of revenue comes from your biggest customer?</FieldLabel>
                          <Select value={formData.revenueFromBiggestCustomer} onValueChange={(value) => updateFormData('revenueFromBiggestCustomer', value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select percentage" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0-10">0-10%</SelectItem>
                              <SelectItem value="11-25">11-25%</SelectItem>
                              <SelectItem value="26-50">26-50%</SelectItem>
                              <SelectItem value="50+">50%+</SelectItem>
                            </SelectContent>
                          </Select>
                        </Field>
                        <Field>
                          <FieldLabel>How quickly do customers usually pay you?</FieldLabel>
                          <Select value={formData.customerPaymentSpeed} onValueChange={(value) => updateFormData('customerPaymentSpeed', value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select timeframe" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="immediate">Immediate</SelectItem>
                              <SelectItem value="7-days">7 days</SelectItem>
                              <SelectItem value="30-days">30 days</SelectItem>
                              <SelectItem value="60-days">60 days</SelectItem>
                              <SelectItem value="90+">90+ days</SelectItem>
                            </SelectContent>
                          </Select>
                        </Field>
                        <Field>
                          <FieldLabel>Average days to get paid (if known)</FieldLabel>
                          <Input
                            type="number"
                            value={formData.averageDaysToGetPaid}
                            onChange={(e) => updateFormData('averageDaysToGetPaid', e.target.value)}
                            placeholder="45"
                          />
                        </Field>
                      </CardContent>
                    </Card>
                  )}

                  <Field>
                    <FieldLabel>How do customers pay you?</FieldLabel>
                    <FieldDescription>Choose all that apply. Add detail for better matches.</FieldDescription>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {['Card', 'Cash', 'Mobile / App / QR', 'Debit Orders', 'Instant EFT / Pay-by-link', 'EFT / Bank Transfer'].map(method => (
                        <Badge
                          key={method}
                          variant={formData.paymentMethods.includes(method) ? 'default' : 'outline'}
                          className="cursor-pointer gap-1"
                          onClick={() => {
                            const newMethods = formData.paymentMethods.includes(method)
                              ? formData.paymentMethods.filter(m => m !== method)
                              : [...formData.paymentMethods, method]
                            updateFormData('paymentMethods', newMethods)
                          }}
                        >
                          {method}
                          {formData.paymentMethods.includes(method) && (
                            <X className="w-3 h-3" />
                          )}
                        </Badge>
                      ))}
                    </div>
                  </Field>

                  {formData.paymentMethods.includes('Card') && (
                    <Card className="bg-muted/50">
                      <CardContent className="p-4 space-y-4">
                        <h3 className="font-semibold">Card details</h3>
                        <Field>
                          <FieldLabel>POS/Acquirer</FieldLabel>
                          <div className="flex flex-wrap gap-2">
                            {['FNB', 'Nedbank', 'iKhokha', 'Yoco', 'SnapScan', 'Adumo', 'Absa', 'Capitec', 'Peach', 'Other'].map(provider => (
                              <Badge
                                key={provider}
                                variant={formData.posAcquirers.includes(provider) ? 'default' : 'outline'}
                                className="cursor-pointer"
                                onClick={() => {
                                  const newProviders = formData.posAcquirers.includes(provider)
                                    ? formData.posAcquirers.filter(p => p !== provider)
                                    : [...formData.posAcquirers, provider]
                                  updateFormData('posAcquirers', newProviders)
                                }}
                              >
                                {provider}
                              </Badge>
                            ))}
                          </div>
                        </Field>
                        <Field>
                          <FieldLabel>Monthly card turnover</FieldLabel>
                          <div className="flex gap-2">
                            {['<R50k', 'R50-250k', 'R250k-R1m', 'R1-3m', '>R3m'].map(range => (
                              <Badge
                                key={range}
                                variant={formData.monthlyCardTurnover === range ? 'default' : 'outline'}
                                className="cursor-pointer"
                                onClick={() => updateFormData('monthlyCardTurnover', range)}
                              >
                                {range}
                              </Badge>
                            ))}
                          </div>
                        </Field>
                      </CardContent>
                    </Card>
                  )}

                  {formData.paymentMethods.includes('EFT / Bank Transfer') && (
                    <Card className="bg-muted/50">
                      <CardContent className="p-4 space-y-4">
                        <h3 className="font-semibold">EFT details</h3>
                        <Field>
                          <FieldLabel>Do you issue invoices?</FieldLabel>
                          <div className="flex gap-4">
                            <Badge
                              variant={formData.issueInvoices === 'yes' ? 'default' : 'outline'}
                              className="cursor-pointer"
                              onClick={() => updateFormData('issueInvoices', 'yes')}
                            >
                              Yes
                            </Badge>
                            <Badge
                              variant={formData.issueInvoices === 'no' ? 'default' : 'outline'}
                              className="cursor-pointer"
                              onClick={() => updateFormData('issueInvoices', 'no')}
                            >
                              No
                            </Badge>
                          </div>
                        </Field>
                        <Field>
                          <FieldLabel>% from largest customer</FieldLabel>
                          <div className="flex gap-2">
                            {['<20%', '20-40%', '40-60%', '>60%'].map(percent => (
                              <Badge
                                key={percent}
                                variant={formData.percentFromLargestCustomer === percent ? 'default' : 'outline'}
                                className="cursor-pointer"
                                onClick={() => updateFormData('percentFromLargestCustomer', percent)}
                              >
                                {percent}
                              </Badge>
                            ))}
                          </div>
                        </Field>
                        <Field>
                          <FieldLabel>Typical payment terms</FieldLabel>
                          <div className="flex gap-2">
                            {['0-15 days', '30 days', '45 days', '60+ days'].map(term => (
                              <Badge
                                key={term}
                                variant={formData.typicalPaymentTerms === term ? 'default' : 'outline'}
                                className="cursor-pointer"
                                onClick={() => updateFormData('typicalPaymentTerms', term)}
                              >
                                {term}
                              </Badge>
                            ))}
                          </div>
                        </Field>
                      </CardContent>
                    </Card>
                  )}

                  {formData.paymentMethods.includes('Mobile / App / QR') && (
                    <Card className="bg-muted/50">
                      <CardContent className="p-4">
                        <h3 className="font-semibold mb-4">Wallet/QR provider</h3>
                        <div className="flex flex-wrap gap-2">
                          {['SnapScan', 'Zapper', 'Apple Pay', 'Samsung Pay', 'Ozow', 'PayFast', 'Other'].map(provider => (
                            <Badge
                              key={provider}
                              variant={formData.walletProviders.includes(provider) ? 'default' : 'outline'}
                              className="cursor-pointer"
                              onClick={() => {
                                const newProviders = formData.walletProviders.includes(provider)
                                  ? formData.walletProviders.filter(p => p !== provider)
                                  : [...formData.walletProviders, provider]
                                updateFormData('walletProviders', newProviders)
                              }}
                            >
                              {provider}
                            </Badge>
                          ))}
                        </div>
                        <Button variant="ghost" className="mt-2 text-sm">+ Add % split (optional)</Button>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* Section 2: Financial & Banking */}
              {currentAssessmentSection === 2 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold">Financial & Banking</h2>
                  <p className="text-muted-foreground">Your business finances and money flow</p>

                  <div>
                    <FieldLabel className="mb-4 block">Where does your money go?</FieldLabel>
                    <FieldDescription className="mb-4">This helps match you with suitable funders</FieldDescription>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => updateFormData('moneyGoesTo', 'bank')}
                        className={cn(
                          "p-6 rounded-lg border-2 text-left transition-all",
                          formData.moneyGoesTo === 'bank'
                            ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                            : "border-border hover:border-green-300"
                        )}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <Building2 className="w-8 h-8 text-green-600" />
                          {formData.moneyGoesTo === 'bank' && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                        </div>
                        <h3 className="font-semibold">I bank my money</h3>
                      </button>
                      <button
                        onClick={() => updateFormData('moneyGoesTo', 'cash')}
                        className={cn(
                          "p-6 rounded-lg border-2 text-left transition-all",
                          formData.moneyGoesTo === 'cash'
                            ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                            : "border-border hover:border-green-300"
                        )}
                      >
                        <Banknote className="w-8 h-8 text-green-600 mb-2" />
                        <h3 className="font-semibold">Mostly cash-based</h3>
                      </button>
                    </div>
                    {formData.moneyGoesTo === 'bank' && (
                      <div className="mt-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-green-600" />
                          <span className="text-sm font-medium text-green-800 dark:text-green-200">
                            Great! You have access to the widest range of funding options.
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <Field>
                    <FieldLabel>Which bank do you use?</FieldLabel>
                    <Select value={formData.bank} onValueChange={(value) => updateFormData('bank', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select bank" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fnb">FNB</SelectItem>
                        <SelectItem value="absa">Absa</SelectItem>
                        <SelectItem value="nedbank">Nedbank</SelectItem>
                        <SelectItem value="standard-bank">Standard Bank</SelectItem>
                        <SelectItem value="capitec">Capitec</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field>
                    <FieldLabel>How long have you had this account?</FieldLabel>
                    <Select value={formData.accountDuration} onValueChange={(value) => updateFormData('accountDuration', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select duration" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="less-than-1">Less than 1 year</SelectItem>
                        <SelectItem value="1-2-years">1-2 years</SelectItem>
                        <SelectItem value="3-5-years">3-5 years</SelectItem>
                        <SelectItem value="more-than-5">More than 5 years</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field>
                    <FieldLabel>What's your monthly income/revenue?</FieldLabel>
                    <Select value={formData.monthlyIncomeRange} onValueChange={(value) => updateFormData('monthlyIncomeRange', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="under-10k">Under R10,000</SelectItem>
                        <SelectItem value="10k-25k">R10,000 - R25,000</SelectItem>
                        <SelectItem value="25k-50k">R25,000 - R50,000</SelectItem>
                        <SelectItem value="50k-100k">R50,000 - R100,000</SelectItem>
                        <SelectItem value="100k-250k">R100,000 - R250,000</SelectItem>
                        <SelectItem value="250k-500k">R250,000 - R500,000</SelectItem>
                        <SelectItem value="500k+">R500,000+</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field>
                    <FieldLabel>Exact monthly income (optional)</FieldLabel>
                    <Input
                      type="number"
                      value={formData.exactMonthlyIncome}
                      onChange={(e) => updateFormData('exactMonthlyIncome', e.target.value)}
                      placeholder="150000"
                    />
                  </Field>

                  <Field>
                    <FieldLabel>How do you track your finances?</FieldLabel>
                    <Select value={formData.trackFinances} onValueChange={(value) => updateFormData('trackFinances', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="excel">Excel or Google Sheets</SelectItem>
                        <SelectItem value="accounting-software">Accounting software (Xero, QuickBooks, etc.)</SelectItem>
                        <SelectItem value="bank-statements">Bank statements only</SelectItem>
                        <SelectItem value="accountant">Accountant/bookkeeper</SelectItem>
                        <SelectItem value="none">I don't track</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
              )}

              {/* Section 3: Team & Compliance */}
              {currentAssessmentSection === 3 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold">Team & Compliance</h2>
                  <p className="text-muted-foreground">About your team and business compliance status</p>

                  <Field>
                    <FieldLabel>How many people work in your business?</FieldLabel>
                    <Select value={formData.numberOfEmployees} onValueChange={(value) => updateFormData('numberOfEmployees', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="just-me">Just me</SelectItem>
                        <SelectItem value="2-5">2-5 people</SelectItem>
                        <SelectItem value="6-10">6-10 people</SelectItem>
                        <SelectItem value="11-20">11-20 people</SelectItem>
                        <SelectItem value="21-50">21-50 people</SelectItem>
                        <SelectItem value="50+">50+ people</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field>
                    <FieldLabel>What stage is your business at?</FieldLabel>
                    <Select value={formData.businessStage} onValueChange={(value) => updateFormData('businessStage', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select stage" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="idea">Idea stage</SelectItem>
                        <SelectItem value="early">Early stage</SelectItem>
                        <SelectItem value="established">Well established</SelectItem>
                        <SelectItem value="scaling">Scaling</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field>
                    <FieldLabel>What's your background as the owner/founder?</FieldLabel>
                    <FieldDescription>Choose up to 2 that best describe you</FieldDescription>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {['Technical/Engineering', 'Commercial/Sales/Marketing', 'Operations/Supply Chain', 'Finance/Accounting', 'Legal/Compliance/Risk', 'Product/UX/Design', 'Industry Specialist', 'Non-profit/Social Enterprise', 'Academic/Research', 'Franchise Owner/Operator', 'Trader/Informal Retail/Spaza', 'Agriculture/Farming', 'First-time Founder', 'Serial Entrepreneur'].map(bg => (
                        <Badge
                          key={bg}
                          variant={formData.ownerBackground.includes(bg) ? 'default' : 'outline'}
                          className="cursor-pointer"
                          onClick={() => {
                            if (formData.ownerBackground.includes(bg)) {
                              updateFormData('ownerBackground', formData.ownerBackground.filter(b => b !== bg))
                            } else if (formData.ownerBackground.length < 2) {
                              updateFormData('ownerBackground', [...formData.ownerBackground, bg])
                            }
                          }}
                        >
                          {bg}
                        </Badge>
                      ))}
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">
                      Selected: {formData.ownerBackground.length}/2
                    </div>
                  </Field>

                  <Field>
                    <FieldLabel>Demographics (helps match you to specialized funding)</FieldLabel>
                    <FieldDescription>Select all that apply to your business ownership</FieldDescription>
                    <div className="space-y-2 mt-2">
                      {[
                        { id: 'youth', label: 'Youth-owned (18-35 years)' },
                        { id: 'rural', label: 'Based in rural area or township' },
                        { id: 'coloured', label: 'Coloured-owned (51%+ Coloured ownership)' },
                        { id: 'disability', label: 'Disability-owned (51%+ people with disabilities)' },
                        { id: 'women', label: 'Women-owned (51%+ women ownership)' },
                        { id: 'black', label: 'Black-owned (51%+ Black ownership)' },
                        { id: 'indian', label: 'Indian-owned (51%+ Indian ownership)' },
                      ].map(demo => (
                        <div key={demo.id} className="flex items-center gap-2">
                          <Checkbox
                            checked={formData.demographics.includes(demo.id)}
                            onCheckedChange={(checked) => {
                              const newDemos = checked
                                ? [...formData.demographics, demo.id]
                                : formData.demographics.filter(d => d !== demo.id)
                              updateFormData('demographics', newDemos)
                            }}
                          />
                          <Label>{demo.label}</Label>
                        </div>
                      ))}
                    </div>
                  </Field>

                  <Field>
                    <FieldLabel>Are you up to date with SARS?</FieldLabel>
                    <Select value={formData.sarsStatus} onValueChange={(value) => updateFormData('sarsStatus', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="up-to-date">Yes, I'm up to date</SelectItem>
                        <SelectItem value="behind">No, I'm behind on tax</SelectItem>
                        <SelectItem value="not-registered">Not registered</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field>
                    <FieldLabel>Are you VAT registered?</FieldLabel>
                    <Select value={formData.vatRegistered} onValueChange={(value) => updateFormData('vatRegistered', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field>
                    <FieldLabel>Do you have a B-BBEE certificate?</FieldLabel>
                    <Select value={formData.bbbeeLevel} onValueChange={(value) => updateFormData('bbbeeLevel', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="level-1">Level 1</SelectItem>
                        <SelectItem value="level-2">Level 2</SelectItem>
                        <SelectItem value="level-3">Level 3</SelectItem>
                        <SelectItem value="level-4">Level 4</SelectItem>
                        <SelectItem value="level-5">Level 5</SelectItem>
                        <SelectItem value="level-6">Level 6</SelectItem>
                        <SelectItem value="level-7">Level 7</SelectItem>
                        <SelectItem value="level-8">Level 8</SelectItem>
                        <SelectItem value="none">Not certified</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field>
                    <FieldLabel>What financial documents do you have?</FieldLabel>
                    <FieldDescription>Select all documents you can provide</FieldDescription>
                    <div className="space-y-2 mt-2">
                      {[
                        '3-month bank statements',
                        'Audited financial statements',
                        'Tax returns',
                        'Monthly financial summaries',
                        'Customer contracts or purchase orders',
                        "I don't have any of these documents",
                      ].map(doc => (
                        <div key={doc} className="flex items-center gap-2">
                          <Checkbox
                            checked={formData.financialDocuments.includes(doc)}
                            onCheckedChange={(checked) => {
                              const newDocs = checked
                                ? [...formData.financialDocuments, doc]
                                : formData.financialDocuments.filter(d => d !== doc)
                              updateFormData('financialDocuments', newDocs)
                            }}
                          />
                          <Label>{doc}</Label>
                        </div>
                      ))}
                    </div>
                  </Field>
                </div>
              )}

              {/* Section 4: Preferences & Location */}
              {currentAssessmentSection === 4 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold">Funding Preferences & Location</h2>
                  <p className="text-muted-foreground">Your preferred funding terms and business location</p>

                  <Field>
                    <FieldLabel>How often would you prefer to repay funding?</FieldLabel>
                    <Select value={formData.repaymentFrequency} onValueChange={(value) => updateFormData('repaymentFrequency', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="annually">Annually</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field>
                    <FieldLabel>How long do you want to repay over?</FieldLabel>
                    <Select value={formData.repaymentDuration} onValueChange={(value) => updateFormData('repaymentDuration', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select duration" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0-3-months">0-3 months</SelectItem>
                        <SelectItem value="3-6-months">3-6 months</SelectItem>
                        <SelectItem value="6-12-months">6-12 months</SelectItem>
                        <SelectItem value="12-24-months">12-24 months</SelectItem>
                        <SelectItem value="24+months">24+ months</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field>
                    <FieldLabel>Are you open to giving investors a share of your business?</FieldLabel>
                    <Select value={formData.openToEquity} onValueChange={(value) => updateFormData('openToEquity', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes, I'm open to equity investment</SelectItem>
                        <SelectItem value="no">No, I prefer debt/loans</SelectItem>
                        <SelectItem value="maybe">Maybe, depending on terms</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field>
                    <FieldLabel>Can you provide security/collateral for funding?</FieldLabel>
                    <Select value={formData.canProvideCollateral} onValueChange={(value) => updateFormData('canProvideCollateral', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes, I have assets</SelectItem>
                        <SelectItem value="no">No, I don't have assets</SelectItem>
                        <SelectItem value="partial">Partial collateral available</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field>
                    <FieldLabel>Which city/town is your business in?</FieldLabel>
                    <Input
                      value={formData.cityTown}
                      onChange={(e) => updateFormData('cityTown', e.target.value)}
                      placeholder="Cape Town"
                    />
                  </Field>

                  <Field>
                    <FieldLabel>Does your business have a specific impact focus?</FieldLabel>
                    <Select value={formData.impactFocus} onValueChange={(value) => updateFormData('impactFocus', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select focus" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="social">Social (community, education, health)</SelectItem>
                        <SelectItem value="environmental">Environmental</SelectItem>
                        <SelectItem value="economic">Economic development</SelectItem>
                        <SelectItem value="none">No specific impact focus</SelectItem>
                      </SelectContent>
                    </Select>
                    <FieldDescription className="mt-2">
                      Impact-focused businesses may qualify for specialized funding programs.
                    </FieldDescription>
                  </Field>
                </div>
              )}

              <div className="flex justify-between pt-6 border-t">
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setCurrentStep(3)}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Funding
                  </Button>
                  {currentAssessmentSection > 1 && (
                    <Button variant="outline" onClick={handleAssessmentBack}>
                      Previous
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleAssessmentNext}>
                    Skip to Next Section
                  </Button>
                  <Button onClick={handleAssessmentNext}>
                    Continue to Next Section
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Step 5: Funding-Ready Status
  if (currentStep === 5) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4">
        <div className="max-w-4xl mx-auto pt-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 mb-4">
              <Sparkles className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-purple-600 mb-2">Great news! You're funding-ready</h1>
            <p className="text-muted-foreground text-lg">
              Based on your profile, we've identified 1 funding categories perfect for your business. Complete the detailed assessment to unlock specific programs and funders.
            </p>
          </div>

          {/* Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardContent className="p-6 text-center">
                <Target className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <div className="text-3xl font-bold mb-1">89%</div>
                <div className="text-sm text-muted-foreground">Match Score</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <FileText className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <div className="text-3xl font-bold mb-1">1</div>
                <div className="text-sm text-muted-foreground">Categories</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <Clock className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                <div className="text-3xl font-bold mb-1">1-2 weeks</div>
                <div className="text-sm text-muted-foreground">Timeline</div>
              </CardContent>
            </Card>
          </div>

          {/* Funding Categories */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                <CardTitle>Your Funding Categories</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-start justify-between p-4 border rounded-lg">
                <div className="flex items-start gap-4">
                  <TrendingUp className="w-8 h-8 text-green-600 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Working Capital</h3>
                    <p className="text-sm text-muted-foreground mb-2">Cash flow solutions for operations</p>
                    <div className="flex items-center gap-4">
                      <Badge variant="outline" className="text-purple-600 border-purple-600">
                        R50k - R2M
                      </Badge>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Zap className="w-4 h-4" />
                        <span>72 hours</span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">3 specific programs match your profile</p>
                  </div>
                </div>
                <Badge className="bg-green-600">89% match</Badge>
              </div>
            </CardContent>
          </Card>

          {/* CTA Card */}
          <Card className="bg-gradient-to-br from-purple-600 to-blue-600 text-white mb-8">
            <CardContent className="p-8">
              <div className="text-center mb-6">
                <Target className="w-12 h-12 mx-auto mb-4 text-white" />
                <h2 className="text-2xl font-bold mb-2">Ready to unlock specific funders?</h2>
                <p className="text-white/90">
                  Complete our detailed assessment to get matched with specific funding programs, application deadlines, and direct contact details.
                </p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white/10 backdrop-blur rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold">50+</div>
                  <div className="text-sm text-white/80">Active Funders</div>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold">15+</div>
                  <div className="text-sm text-white/80">Your Programs</div>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold">5</div>
                  <div className="text-sm text-white/80">Closing Soon</div>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold">92%</div>
                  <div className="text-sm text-white/80">Success Rate</div>
                </div>
              </div>
              <div className="flex gap-4 justify-center">
                <Button
                  onClick={handleSubmit}
                  className="bg-white text-purple-600 hover:bg-white/90"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Complete Assessment →
                </Button>
                <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                  Save & Continue Later
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Testimonial */}
          <Card>
            <CardContent className="p-6 text-center">
              <div className="flex justify-center gap-1 mb-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                500+ SA businesses have successfully secured funding through our platform
              </p>
              <p className="text-sm italic text-muted-foreground">
                "The detailed assessment helped me find grants I never knew existed" - Sarah M., Cape Town
              </p>
            </CardContent>
          </Card>

          <div className="text-center mt-6">
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              Back to Funding
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return null
}
