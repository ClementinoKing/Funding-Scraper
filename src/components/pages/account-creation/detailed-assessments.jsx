import { cn } from "@/lib/utils";
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
import StepTimeline from '@/components/pages/account-creation/step-timeline'
import {Field, FieldLabel, FieldDescription} from '@/components/ui/field'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {Card, CardContent} from '@/components/ui/card'
import {Checkbox} from '@/components/ui/checkbox'
import {Label} from '@/components/ui/label'

export default function DetailedAssessments({
    currentStep,
    handleBack,
    completedAssessmentSections,
    currentAssessmentSection,
    setCurrentAssessmentSection,
    handleAssessmentNext,
    handleAssessmentBack,
    formData,
    updateFormData,
}) {
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
                        <SelectItem value="pre_revenue">Idea stage</SelectItem>
                        <SelectItem value="early">Early stage</SelectItem>
                        <SelectItem value="growing">Scaling</SelectItem>
                        <SelectItem value="established">Well established</SelectItem>
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
                        <SelectItem value="yes">Yes, I'm up to date</SelectItem>
                        <SelectItem value="no">No, I'm behind on tax</SelectItem>
                        <SelectItem value="not_sure">Not registered</SelectItem>
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
                        <SelectItem value="not_sure">Maybe, depending on terms</SelectItem>
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
                  <Button variant="outline" onClick={handleBack}>
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