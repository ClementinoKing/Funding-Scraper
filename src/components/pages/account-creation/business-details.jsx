import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, CheckCircle2, FileText, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Building2, Search } from "lucide-react";
import {
  BUSINESS_TYPES,
  PROVINCES,
  INDUSTRIES,
  TIMELINE_OPTIONS,
  FUNDING_PURPOSES,
} from "@/constants/account-creation";
import StepTimeline from '@/components/pages/account-creation/step-timeline'

export default function BusinessDetails({
  handleNext,
  handleBack,
  formData,
  updateFormData,
}) {
  return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4">
        <div className="max-w-4xl mx-auto pt-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Tell us about your business</h1>
          </div>

          <Card className="w-full">
            <CardContent className="p-8 space-y-6">
              {formData.businessType === 'registered' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-indigo-600" />
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
                        placeholder="3243521324323112"
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
                        placeholder="ABC Pty Ltd"
                      />
                      {/* {formData.businessName && (
                        <div className="flex items-center gap-1 mt-2 text-green-600">
                          <CheckCircle2 className="w-4 h-4" />
                          <span className="text-sm">Verified with CIPC</span>
                        </div>
                      )} */}
                    </div>
                  </Field>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                  <div className={"grid grid-cols-1 md:grid-cols-2 gap-4 bg-primary-foreground border p-4 rounded " + (formData.differentTradingAddress ? "" : "hidden")}>
                    <Field>
                      <FieldLabel>Trading Province</FieldLabel>
                      <Select value={formData.secondaryProvince} onValueChange={(value) => updateFormData('secondaryProvince', value)}>
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
                      <FieldLabel>Trading Postal Code</FieldLabel>
                      <Input
                        value={formData.secondaryPostalCode}
                        onChange={(e) => updateFormData('secondaryPostalCode', e.target.value)}
                        placeholder="2001"
                      />
                    </Field>
                  </div>
                  
                </div>
              )}

              <Separator />

              <div className="space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600" />
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
                        <Badge 
                          key={reg} 
                          variant={formData.regulatedBy === reg ? 'default' : 'outline'}
                          className="cursor-pointer"
                          onClick={() => updateFormData('regulatedBy', reg)}
                        >
                          {reg}
                          </Badge>
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
