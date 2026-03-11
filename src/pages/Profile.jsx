import { useState } from "react";
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
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { MobileNav } from "@/components/layout/MobileNav";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import { useNavigate } from "react-router-dom";
import { signOut } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { clearUserProfileCache } from "@/lib/userProfile";
import {
  User,
  Building2,
  TrendingUp,
  DollarSign,
  CheckCircle2,
  IdCard,
  Loader2,
} from "lucide-react";
import {
  BUSINESS_TYPES,
  PROVINCES,
  INDUSTRIES,
  TIMELINE_OPTIONS,
  FUNDING_PURPOSES,
} from "@/constants/account-creation";
import BusinessMetrics from "@/components/pages/profile/business-metrics";
import FundingRequirements from "@/components/pages/profile/funding-requirements";
import { cn } from "@/lib/utils";

export default function Profile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState(null);
  const [authUser, setAuthUser] = useState(null);

  async function logout() {
    await signOut();
    navigate("/login", { replace: true });
  }

  const handleSave = async () => {
    setSaving(true);
    setTimeout(() => {
      alert("Nothing Happened! This is just a simulation!")
      setSaving(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar onLogout={logout} />
      <MobileNav />

      <div className="flex-1 flex flex-col pb-16 md:pb-0">
        <Header onLogout={logout} />
        <main className="flex-1 px-4 md:px-6 py-6 max-w-4xl mx-auto w-full">
          <Breadcrumbs items={[{ label: "Profile" }]} className="mb-6" />

          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">Profile Settings</h1>
            <p className="text-muted-foreground">
              Manage your personal and business details.
            </p>
          </div>

          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="flex ">
              <TabsTrigger
                className="flex-1 flex gap-1 items-center"
                value="personal"
              >
                <User className="h-4 w-4" /> Personal Information
              </TabsTrigger>
              <TabsTrigger
                className="flex-1 flex gap-1 items-center"
                value="business-details"
              >
                <Building2 className="h-4 w-4" /> Business Details
              </TabsTrigger>
              <TabsTrigger
                className="flex-1 flex gap-1 items-center"
                value="business-metrics"
              >
                <TrendingUp className="h-4 w-4" /> Business Metrics
              </TabsTrigger>
              <TabsTrigger
                className="flex-1 flex gap-1 items-center"
                value="funding-requirements"
              >
                <DollarSign className="h-4 w-4" /> Funding Requirements
              </TabsTrigger>
            </TabsList>

            <TabsContent value="personal">
              {/* Personal Information */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="ownerFullName">Owner Full Name</Label>
                    <Input
                      id="ownerFullName"
                      value={profile?.owner_full_name || ""}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          owner_full_name: e.target.value,
                        })
                      }
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profile?.email || authUser?.email || ""}
                        disabled
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={profile?.phone || ""}
                        onChange={(e) =>
                          setProfile({ ...profile, phone: e.target.value })
                        }
                        placeholder="+27 12 345 6789"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="dob">Date of Birth</Label>
                      <Input
                        id="dob"
                        type="date"
                        value={profile?.dob ? profile?.dob.split("T")[0] : ""}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            dob: e.target.value || null,
                          })
                        }
                        max={new Date().toISOString().split("T")[0]}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dob">Highest Qualification</Label>
                      <Input
                        id="dob"
                        type="date"
                        value={profile?.dob ? profile?.dob.split("T")[0] : ""}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            dob: e.target.value || null,
                          })
                        }
                        max={new Date().toISOString().split("T")[0]}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Identification & Location */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IdCard className="h-5 w-5" />
                    Identification & Location
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">ID Type</Label>
                      <Select
                        defaultValue={profile?.idType || "sa-id"}
                        onValueChange={(value) =>
                          setProfile({ ...profile, idType: value })
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select an ID Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>ID Types</SelectLabel>
                            <SelectItem value="sa-id">SA ID</SelectItem>
                            <SelectItem value="passport">Passport</SelectItem>
                            <SelectItem value="asylum-seeker-permit">
                              Asylum Seeker Permit
                            </SelectItem>
                            <SelectItem value="work-permit">
                              Work Permit
                            </SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">ID Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={profile?.phone || ""}
                        onChange={(e) =>
                          setProfile({ ...profile, phone: e.target.value })
                        }
                        placeholder="+27 12 345 6789"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="dob">Country</Label>
                      <Select
                        defaultValue={profile?.country || "south-africa"}
                        onValueChange={(value) =>
                          setProfile({ ...profile, country: value })
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a country" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Countries</SelectLabel>
                            <SelectItem value="south-africa">
                              South Africa
                            </SelectItem>
                            <SelectItem value="botswana">Botswana</SelectItem>
                            <SelectItem value="eswatini">Eswatini</SelectItem>
                            <SelectItem value="lesotho">Lesotho</SelectItem>
                            <SelectItem value="zimbabwe">Zimbabwe</SelectItem>
                            <SelectItem value="mozambique">
                              Mozambique
                            </SelectItem>
                            <SelectItem value="zambia">Zambia</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dob">Province</Label>
                      <Select
                        defaultValue={profile?.province || "gauteng"}
                        onValueChange={(value) =>
                          setProfile({ ...profile, province: value })
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a province" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Provinces</SelectLabel>
                            {PROVINCES.map((province) => (
                              <SelectItem key={province} value={province}>
                                {province}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="postal-code">Postal Code</Label>
                      <Input
                        id="dob"
                        type="date"
                        value={profile?.dob ? profile?.dob.split("T")[0] : ""}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            dob: e.target.value || null,
                          })
                        }
                        max={new Date().toISOString().split("T")[0]}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="business-details">
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
                      value={profile?.business_name || ""}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          business_name: e.target.value,
                        })
                      }
                      placeholder="Business name"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="businessType">Business Type</Label>
                      <Select
                        defaultValue={profile?.business_type || "registered"}
                        onValueChange={(value) =>
                          setProfile({ ...profile, business_type: value })
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a business type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Business Types</SelectLabel>
                            <SelectItem value="registered">
                              Registered
                            </SelectItem>
                            <SelectItem value="not-registered">
                              Not Registered
                            </SelectItem>
                            <SelectItem value="spaza">Spaza</SelectItem>
                            <SelectItem value="just-an-idea">
                              Just an Idea
                            </SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="industry">Industry</Label>
                      <Select
                        defaultValue={profile?.industry || "Technology & IT"}
                        onValueChange={(value) =>
                          setProfile({ ...profile, industry: value })
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select an industry" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Industries</SelectLabel>
                            {INDUSTRIES.map((industry) => (
                              <SelectItem key={industry} value={industry}>
                                {industry}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyRegistrationNumber">
                      Company Registration Number
                    </Label>
                    <Input
                      id="companyRegistrationNumber"
                      value={profile?.company_registration_number || ""}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          company_registration_number: e.target.value,
                        })
                      }
                      placeholder="CIPC registration number"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="dob">Province</Label>
                      <Select
                        defaultValue={profile?.province || "gauteng"}
                        onValueChange={(value) =>
                          setProfile({ ...profile, province: value })
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a province" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Provinces</SelectLabel>
                            {PROVINCES.map((province) => (
                              <SelectItem key={province} value={province}>
                                {province}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="postal-code">Postal Code</Label>
                      <Input
                        id="dob"
                        type="date"
                        value={profile?.dob ? profile?.dob.split("T")[0] : ""}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            dob: e.target.value || null,
                          })
                        }
                        max={new Date().toISOString().split("T")[0]}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="physicalAddress">Physical Address</Label>
                    <Input
                      id="physicalAddress"
                      value={profile?.physical_address || ""}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          physical_address: e.target.value,
                        })
                      }
                      placeholder="Physical address"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        type="url"
                        value={profile?.website || ""}
                        onChange={(e) =>
                          setProfile({ ...profile, website: e.target.value })
                        }
                        placeholder="https://www.example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="taxNumber">Tax Number</Label>
                      <Input
                        id="taxNumber"
                        value={profile?.tax_number || ""}
                        onChange={(e) =>
                          setProfile({ ...profile, tax_number: e.target.value })
                        }
                        placeholder="Tax number"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5 flex-1">
                      <Label htmlFor="emailNotifications">Do you export?</Label>
                      <p className="text-sm text-muted-foreground">
                        Sell products/services outside South Africa
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        // checked={settings.emailNotifications}
                        // onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="space-y-0.5 flex-1">
                    <Label>How seasonal is your business?</Label>
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    <button
                      onClick={() =>
                        setProfile({ ...profile, seasonality: "none" })
                      }
                      className={cn(
                        "p-2 rounded-lg border-2 text-left transition-all",
                        profile?.seasonality === "none"
                          ? "border-primary bg-primary-foreground dark:bg-primary/20"
                          : "border-border hover:border-primary",
                        "flex justify-between items-start",
                      )}
                    >
                      <h3 className="font-semibold">None</h3>
                      {profile?.seasonality === "none" && (
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                      )}
                    </button>
                    <button
                      onClick={() =>
                        setProfile({ ...profile, seasonality: "low" })
                      }
                      className={cn(
                        "p-2 rounded-lg border-2 text-left transition-all",
                        profile?.seasonality === "low"
                          ? "border-primary bg-primary-foreground dark:bg-primary/20"
                          : "border-border hover:border-primary",
                        "flex justify-between items-start",
                      )}
                    >
                      <h3 className="font-semibold">Low</h3>
                      {profile?.seasonality === "low" && (
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                      )}
                    </button>
                    <button
                      onClick={() =>
                        setProfile({ ...profile, seasonality: "medium" })
                      }
                      className={cn(
                        "p-2 rounded-lg border-2 text-left transition-all",
                        profile?.seasonality === "medium"
                          ? "border-primary bg-primary-foreground dark:bg-primary/20"
                          : "border-border hover:border-primary",
                        "flex justify-between items-start",
                      )}
                    >
                      <h3 className="font-semibold">Medium</h3>
                      {profile?.seasonality === "medium" && (
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                      )}
                    </button>
                    <button
                      onClick={() =>
                        setProfile({ ...profile, seasonality: "high" })
                      }
                      className={cn(
                        "p-2 rounded-lg border-2 text-left transition-all",
                        profile?.seasonality === "high"
                          ? "border-primary bg-primary-foreground dark:bg-primary/20"
                          : "border-border hover:border-primary",
                        "flex justify-between items-start",
                      )}
                    >
                      <h3 className="font-semibold">High</h3>
                      {profile?.seasonality === "high" && (
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                      )}
                    </button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="business-metrics">
              {/* Business Metrics */}
              <BusinessMetrics profile={profile} setProfile={setProfile} />
            </TabsContent>

            <TabsContent value="funding-requirements">
              <FundingRequirements profile={profile} setProfile={setProfile} />
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => navigate("/dashboard")}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </main>
      </div>
    </div>
  );
}
