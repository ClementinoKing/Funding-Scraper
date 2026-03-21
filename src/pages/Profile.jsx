import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { MobileNav } from "@/components/layout/MobileNav";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { useNavigate } from "react-router-dom";
import { signOut } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { User, Building2, TrendingUp, DollarSign, Loader2 } from "lucide-react";
import BusinessMetrics from "@/components/pages/profile/business-metrics";
import FundingRequirements from "@/components/pages/profile/funding-requirements";
import BusinessDetail from "@/components/pages/profile/business-detail";
import PersonalDetails from "@/components/pages/profile/personal-details";
import { toast } from "sonner";
import {
  saveBusinessDetails,
  saveBusinessMetrics,
  savePersonalDetails,
  saveFundingRequirements,
} from "../services/profile-saving.service";

export default function Profile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState(null);

  async function logout() {
    await signOut();
    navigate("/login", { replace: true });
  }

  const handleSave = async () => {
    setSaving(true);
    toast.promise(
      Promise.allSettled([
        savePersonalDetails(profile),
        saveBusinessDetails(profile),
        saveBusinessMetrics(profile),
        saveFundingRequirements(profile),
      ]),
      {
        loading: "Saving Progress...",
        success: () => {
          setSaving(false);
          return "Changes saved successfully!";
        },
        error: (error) => {
          setSaving(false)
          return `Error saving progress: ${error.message || error}`;
        },
      },
    );
  };

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("business_profile_view")
          .select("*")
          .single();
        if (error) {
          setError("Failed to load profile");
        } else {
          setProfile(data);
          console.log(data);
        }
      } catch (error) {
        console.log(error);
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

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

          {error && (
            <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-md">
              {error}
            </div>
          )}

          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="flex gap-2 flex-wrap h-fit">
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
              <PersonalDetails profile={profile} setProfile={setProfile} />
            </TabsContent>

            <TabsContent value="business-details">
              {/* Business Information */}
              <BusinessDetail profile={profile} setProfile={setProfile} />
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
