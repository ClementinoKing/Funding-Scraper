import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  User,
  Building2,
  TrendingUp,
  DollarSign,
  Loader2,
  IdCard,
  Users,
} from "lucide-react";

export default function BusinessMetrics({ profile, setProfile }) {
  return (
    <>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team & Compliance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="annualRevenue">Number of Employees</Label>
              <Select>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select" />
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
            </div>
            <div className="space-y-2">
              <Label htmlFor="numberOfEmployees">Stage of Business</Label>
              <Select
                defaultValue={profile?.stageOfBusiness || "pre_revenue"}
                onValueChange={(value) =>
                  setProfile({ ...profile, stageOfBusiness: value })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a stage of business" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pre_revenue">Still an idea</SelectItem>
                  <SelectItem value="early">Just getting started</SelectItem>
                  <SelectItem value="growing">Growing Steadily</SelectItem>
                  <SelectItem value="established">Well established</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="annualRevenue">
                Are you up-to-date with SARS
              </Label>
              <Select
                defaultValue={profile?.sarsStatus || "maybe"}
                onValueChange={(value) =>
                  setProfile({ ...profile, sarsStatus: value })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>SARS Status</SelectLabel>
                    <SelectItem value="yes">Yes, I'm up-to-date.</SelectItem>
                    <SelectItem value="no">No, I'm behind on tax.</SelectItem>
                    <SelectItem value="maybe">Not Registered.</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="numberOfEmployees">Are you VAT registered?</Label>
              <Select
                defaultValue={profile?.vatStatus || "no"}
                onValueChange={(value) =>
                  setProfile({ ...profile, vatStatus: value })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>VAT Status</SelectLabel>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No.</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="numberOfEmployees">B-BBEE Certification</Label>
              <Select
                defaultValue={profile?.beeCertification || "none"}
                onValueChange={(value) =>
                  setProfile({ ...profile, beeCertification: value })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>B-BBEE Certification</SelectLabel>
                    <SelectItem value="none">Not Certified</SelectItem>
                    {[...Array(8)].map((_, i) => (
                      <SelectItem
                        key={i}
                        value={`level${i + 1}`}
                      >{`Level ${i + 1}`}</SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Field>
            <FieldLabel>
              Demographics (helps match you to specialized funding)
            </FieldLabel>
            <FieldDescription>
              Select all that apply to your business ownership
            </FieldDescription>
            <div className="space-y-2 mt-2">
              {[
                { id: "youth", label: "Youth-owned (18-35 years)" },
                { id: "rural", label: "Based in rural area or township" },
                // { id: 'coloured', label: 'Coloured-owned (51%+ Coloured ownership)' },
                {
                  id: "disability",
                  label: "Disability-owned (51%+ people with disabilities)",
                },
                { id: "women", label: "Women-owned (51%+ women ownership)" },
                { id: "black", label: "Black-owned (51%+ Black ownership)" },
                // { id: 'indian', label: 'Indian-owned (51%+ Indian ownership)' },
              ].map((demo) => (
                <div key={demo.id} className="flex items-center gap-2">
                  <Checkbox
                    id={demo.id}
                    // checked={formData.demographics.includes(demo.id)}
                    // onCheckedChange={(checked) => {
                    // const newDemos = checked
                    //     ? [...formData.demographics, demo.id]
                    //     : formData.demographics.filter(d => d !== demo.id)
                    // updateFormData('demographics', newDemos)
                    // }}
                  />
                  <Label htmlFor={demo.id}>{demo.label}</Label>
                </div>
              ))}
            </div>
          </Field>

          <Field>
            <FieldLabel>What financial documents do you have?</FieldLabel>
            <FieldDescription>
              Select all documents you can provide
            </FieldDescription>
            <div className="space-y-2 mt-2">
              {[
                "3-month bank statements",
                "Audited financial statements",
                "Tax returns",
                "Monthly financial summaries",
                "Customer contracts or purchase orders",
                "I don't have any of these documents",
              ].map((doc) => (
                <div key={doc} className="flex items-center gap-2">
                  <Checkbox
                    id={doc}
                    // checked={formData.financialDocuments.includes(doc)}
                    // onCheckedChange={(checked) => {
                    //     const newDocs = checked
                    //     ? [...formData.financialDocuments, doc]
                    //     : formData.financialDocuments.filter(d => d !== doc)
                    //     updateFormData('financialDocuments', newDocs)
                    // }}
                  />
                  <Label htmlFor={doc}>{doc}</Label>
                </div>
              ))}
            </div>
          </Field>
        </CardContent>
      </Card>

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
                value={profile?.annual_revenue || ""}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    annual_revenue: e.target.value,
                  })
                }
                placeholder="Annual revenue"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="numberOfEmployees">Number of Employees</Label>
              <Input
                id="numberOfEmployees"
                value={profile?.number_of_employees || ""}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    number_of_employees: e.target.value,
                  })
                }
                placeholder="Number of employees"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="beeLevel">BEE Level</Label>
            <Input
              id="beeLevel"
              value={profile?.bee_level || ""}
              onChange={(e) =>
                setProfile({ ...profile, bee_level: e.target.value })
              }
              placeholder="BEE level"
            />
          </div>
        </CardContent>
      </Card>

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
                value={profile?.annual_revenue || ""}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    annual_revenue: e.target.value,
                  })
                }
                placeholder="Annual revenue"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="numberOfEmployees">Number of Employees</Label>
              <Input
                id="numberOfEmployees"
                value={profile?.number_of_employees || ""}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    number_of_employees: e.target.value,
                  })
                }
                placeholder="Number of employees"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="beeLevel">BEE Level</Label>
            <Input
              id="beeLevel"
              value={profile?.bee_level || ""}
              onChange={(e) =>
                setProfile({ ...profile, bee_level: e.target.value })
              }
              placeholder="BEE level"
            />
          </div>
        </CardContent>
      </Card>

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
                value={profile?.annual_revenue || ""}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    annual_revenue: e.target.value,
                  })
                }
                placeholder="Annual revenue"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="numberOfEmployees">Number of Employees</Label>
              <Input
                id="numberOfEmployees"
                value={profile?.number_of_employees || ""}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    number_of_employees: e.target.value,
                  })
                }
                placeholder="Number of employees"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="beeLevel">BEE Level</Label>
            <Input
              id="beeLevel"
              value={profile?.bee_level || ""}
              onChange={(e) =>
                setProfile({ ...profile, bee_level: e.target.value })
              }
              placeholder="BEE level"
            />
          </div>
        </CardContent>
      </Card>
    </>
  );
}
