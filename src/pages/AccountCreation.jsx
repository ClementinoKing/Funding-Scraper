import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentSession } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import BusinessTypeSelection from "@/components/pages/account-creation/business-type-selection";
import BusinessDetails from "@/components/pages/account-creation/business-details";
import FundingNeeds from "@/components/pages/account-creation/funding-needs";
import DetailedAssessments from "@/components/pages/account-creation/detailed-assessments";
import FundingReadyStatus from "@/components/pages/account-creation/funding-ready-status";
import { FullPageLoader } from "@/components/LoadingSpinner";
import { toast } from "sonner";
import {
  saveBusinessDetails,
  saveFundingNeeds,
  saveFinanceAndBanking,
  saveTeamAndCompliance,
  savePreferencesAndLocation,
  saveBusinessAndTrading,
} from "@/services/onboarding.service";

const saveProgress = (currentStep, formData) => {
  switch (currentStep) {
    case 2:
      return saveBusinessDetails(formData);
    case 3:
      return saveFundingNeeds(formData);
    default:
      return Promise.resolve("No data to save");
  }
};

const saveDetailedAssessmentProgress = (currentStep, formData) => {
  switch (currentStep) {
    case 1:
      return saveBusinessAndTrading(formData);
    case 2:
      return saveFinanceAndBanking(formData);
    case 3:
      return saveTeamAndCompliance(formData);
    case 4:
      return savePreferencesAndLocation(formData);
    default:
      return Promise.resolve("No data to save");
  }
};

export default function AccountCreation() {
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [currentAssessmentSection, setCurrentAssessmentSection] = useState(1);
  const [completedAssessmentSections, setCompletedAssessmentSections] =
    useState([]);
  const [fundingPurposes, setFundingPurposes] = useState([]);
  const navigate = useNavigate();

  // Form data state
  const [formData, setFormData] = useState({
    // Step 1
    businessType: "",

    // Step 2
    companyRegistrationNumber: "",
    businessName: "",
    province: "",
    postalCode: "",
    differentTradingAddress: false,
    industry: "",
    subIndustry: [],
    whoDoYouSellTo: "",
    isRegulated: false,
    regulatedBy: "",
    regulatedSectors: [],
    doYouExport: false,
    seasonality: "",
    secondaryIndustries: [],

    // Step 3
    fundingAmount: 100000,
    fundingTimeline: "",
    fundingPurposes: [],
    fundingDetails: "",

    // Step 4 - Assessment
    // Section 1: Business & Trading
    mainCustomers: "",
    monthlyCustomers: "",
    revenueFromBiggestCustomer: "",
    customerPaymentSpeed: "",
    averageDaysToGetPaid: "",
    paymentMethods: [],
    posAcquirers: [],
    monthlyCardTurnover: "",
    issueInvoices: "",
    percentFromLargestCustomer: "",
    typicalPaymentTerms: "",
    walletProviders: [],

    // Section 2: Financial & Banking
    moneyGoesTo: "",
    bank: "",
    accountDuration: "",
    monthlyIncomeRange: "",
    exactMonthlyIncome: "",
    trackFinances: "",

    // Section 3: Team & Compliance
    numberOfEmployees: "",
    businessStage: "",
    ownerBackground: [],
    demographics: [],
    sarsStatus: "",
    vatRegistered: "",
    bbbeeLevel: "",
    financialDocuments: [],

    // Section 4: Preferences & Location
    repaymentFrequency: "",
    repaymentDuration: "",
    openToEquity: "",
    canProvideCollateral: "",
    cityTown: "",
    impactFocus: "",
  });

  useEffect(() => {
    (async () => {
      const { data: funding_purposes } = await supabase
        .from("funding_purposes")
        .select("*");
      if (funding_purposes) setFundingPurposes(funding_purposes);
    })();

    async function checkAuth() {
      const session = await getCurrentSession();

      if (!session) {
        navigate("/register", { replace: true });
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: onboarding_session } = await supabase
          .from("onboarding_sessions")
          .select("is_completed")
          .eq("profile_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();
          console.log(onboarding_session);

        if (onboarding_session) {
          if (onboarding_session.is_completed) {
            navigate("/dashboard", { replace: true });
            return;
          }
        } else {
          // No existing profile, start onboarding
          await supabase
            .from("onboarding_sessions")
            .upsert({
              profile_id: user.id,
              is_completed: false,
              current_step: 1,
            })
            .select();
        }
      }

      setLoading(false);
    }

    checkAuth();
  }, [navigate]);

  const updateFormData = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep((prev) => prev + 1);
    }

    console.log(formData);
    // return;

    toast.promise(saveProgress(currentStep, formData), {
      loading: "Saving Progress...",
      success: (data) => data,
      error: (error) => {
        console.error("Error saving progress:", error);
        return `Error saving progress: ${error.message || error}`;
      },
    });
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleAssessmentNext = () => {
    if (currentAssessmentSection < 4) {
      setCompletedAssessmentSections((prev) => [
        ...prev,
        currentAssessmentSection,
      ]);
      setCurrentAssessmentSection((prev) => prev + 1);
    } else {
      // All assessment sections complete, go to step 5
      setCompletedAssessmentSections((prev) => [...prev, 4]);
      setCurrentStep(5);
    }

    toast.promise(
      saveDetailedAssessmentProgress(currentAssessmentSection, formData),
      {
        loading: "Saving Progress...",
        success: (data) => data,
        error: (error) => {
          console.error("Error saving progress:", error);
          return `Error saving progress: ${error.message || error}`;
        },
      },
    );
  };

  const handleAssessmentBack = () => {
    if (currentAssessmentSection > 1) {
      setCurrentAssessmentSection((prev) => prev - 1);
    } else {
      setCurrentStep(3); // Go back to funding needs
    }
    console.log(formData);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        navigate("/register");
        return;
      }

      // Save profile data to Supabase
      const { error } = await supabase.from("onboarding_sessions").upsert({
        profile_id: user.id,
        is_completed: true,
        updated_at: new Date().toISOString(),
      });

      await supabase.from("user_profiles").upsert({
        user_id: user.id,
        ...formData,
        profile_completed: true,
        updated_at: new Date().toISOString(),
      });

      if (error) {
        console.error("Error saving profile:", error);
        alert("Error saving profile. Please try again.");
        setLoading(false);
        return;
      }

      navigate("/dashboard");
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred. Please try again.");
      setLoading(false);
    }
  };

  if (loading && currentStep === 1) {
    return <FullPageLoader />;
  }

  // Step 1: Business Type Selection
  if (currentStep === 1) {
    return (
      <BusinessTypeSelection
        currentStep={currentStep}
        formData={formData}
        updateFormData={updateFormData}
        handleNext={handleNext}
      />
    );
  }

  // Step 2: Business Details
  if (currentStep === 2) {
    return (
      <BusinessDetails
        currentStep={currentStep}
        handleNext={handleNext}
        handleBack={handleBack}
        formData={formData}
        updateFormData={updateFormData}
      />
    );
  }

  // Step 3: Funding Needs
  if (currentStep === 3) {
    return (
      <FundingNeeds
        currentStep={currentStep}
        handleNext={handleNext}
        handleBack={handleBack}
        formData={formData}
        updateFormData={updateFormData}
        fundingPurposes={fundingPurposes}
      />
    );
  }

  // Step 4: Detailed Assessment
  if (currentStep === 4) {
    return (
      <DetailedAssessments
        currentStep={currentStep}
        handleBack={handleBack}
        completedAssessmentSections={completedAssessmentSections}
        currentAssessmentSection={currentAssessmentSection}
        setCurrentAssessmentSection={setCurrentAssessmentSection}
        handleAssessmentNext={handleAssessmentNext}
        handleAssessmentBack={handleAssessmentBack}
        formData={formData}
        updateFormData={updateFormData}
      />
    );
  }

  // Step 5: Funding-Ready Status
  if (currentStep === 5) {
    return <FundingReadyStatus handleSubmit={handleSubmit} />;
  }

  return null;
}
