import { useState, useEffect } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { MobileNav } from "@/components/layout/MobileNav";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { useNavigate } from "react-router-dom";
import { signOut } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { clearUserProfileCache } from "@/lib/userProfile";
import {
  User,
  Building2,
  TrendingUp,
  DollarSign,
  Loader2,
  IdCard,
} from "lucide-react";
import {
  BUSINESS_TYPES,
  PROVINCES,
  INDUSTRIES,
  TIMELINE_OPTIONS,
  FUNDING_PURPOSES,
} from "@/constants/account-creation";

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
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="business-metrics">
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
                      <Label htmlFor="numberOfEmployees">
                        Number of Employees
                      </Label>
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
            </TabsContent>

            <TabsContent value="funding-requirements">
              <Card>
                <CardHeader>
                  <CardTitle>Funding Requirements</CardTitle>
                  <CardDescription>
                    Manage your account preferences and options. Customize your
                    experience to fit your needs.
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Configure notifications, security, and themes.
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
