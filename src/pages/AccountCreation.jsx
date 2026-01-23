import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentSession } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import BusinessTypeSelection from "@/components/pages/account-creation/business-type-selection";
import BusinessDetails from "@/components/pages/account-creation/business-details";
import FundingNeeds from "@/components/pages/account-creation/funding-needs";
import DetailedAssessments from "@/components/pages/account-creation/detailed-assessments";
import FundingReadyStatus from "@/components/pages/account-creation/funding-ready-status";
import StepTimeline from "@/components/pages/account-creation/step-timeline";
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
import { useStore } from "@/store/zustand";

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
  const navigate = useNavigate();
  const {
    onboardingData,
    setOnboardingData,
    onboardingSession,
    setOnboardingSession,
  } = useStore();
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(onboardingSession?.currentStep || 1);
  const [currentAssessmentSection, setCurrentAssessmentSection] = useState(onboardingSession?.currentAssessmentStep || 1);
  const [completedAssessmentSections, setCompletedAssessmentSections] =
    useState([]);
  const [fundingPurposes, setFundingPurposes] = useState([]);

  // Form data state
  const [formData, setFormData] = useState(onboardingData ||{
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
    secondaryProvince: "",
    secondaryPostalCode: "",

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

  const goToStep = (step, assessmentStep) => {
    setCurrentStep(step);
    setOnboardingSession({ currentStep: step, currentAssessmentStep: assessmentStep || currentAssessmentSection, is_completed: false });
  }

  const handleNext = () => {
    if (currentStep < 5) {
      setOnboardingSession({ currentStep: currentStep + 1, currentAssessmentStep: currentAssessmentSection, is_completed: false });
      setCurrentStep((prev) => prev + 1);
    }

    toast.promise(saveProgress(currentStep, formData), {
      loading: "Saving Progress...",
      success: (data) => data,
      error: (error) => {
        console.error("Error saving progress:", error);
        return `Error saving progress: ${error.message || error}`;
      },
    });
    setOnboardingData(formData);
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setOnboardingSession({ currentStep: currentStep - 1, currentAssessmentStep: currentAssessmentSection, is_completed: false });
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
      setOnboardingSession({ currentStep, currentAssessmentStep: currentAssessmentSection + 1, is_completed: false });
    } else {
      // All assessment sections complete, go to step 5
      setCompletedAssessmentSections((prev) => [...prev, 4]);
      setCurrentStep(5);
      setOnboardingSession({ currentStep: 5, currentAssessmentStep: 4, is_completed: false });
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
    setOnboardingData(formData);
  };

  const handleAssessmentBack = () => {
    if (currentAssessmentSection > 1) {
      setOnboardingSession({ currentStep, currentAssessmentStep: currentAssessmentSection - 1, is_completed: false });
      setCurrentAssessmentSection((prev) => prev - 1);
    } else {
      setCurrentStep(3); // Go back to funding needs
      setOnboardingSession({ currentStep: 3, currentAssessmentStep: currentAssessmentSection, is_completed: false });
    }
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

      setOnboardingSession({ currentStep: 5, currentAssessmentStep: currentAssessmentSection, is_completed: true });
      setOnboardingData(null);

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

  return (
    <>
      <StepTimeline currentStep={currentStep} />

      {currentStep === 1 && (
        <BusinessTypeSelection
          formData={formData}
          updateFormData={updateFormData}
          handleNext={handleNext}
        />
      )}

      {currentStep === 2 && (
        <BusinessDetails
          handleNext={handleNext}
          handleBack={handleBack}
          formData={formData}
          updateFormData={updateFormData}
        />
      )}

      {currentStep === 3 && (
        <FundingNeeds
          handleNext={handleNext}
          handleBack={handleBack}
          formData={formData}
          updateFormData={updateFormData}
          fundingPurposes={fundingPurposes}
        />
      )}

      {currentStep === 4 && (
        <DetailedAssessments
          handleBack={handleBack}
          completedAssessmentSections={completedAssessmentSections}
          currentAssessmentSection={currentAssessmentSection}
          setCurrentAssessmentSection={setCurrentAssessmentSection}
          handleAssessmentNext={handleAssessmentNext}
          handleAssessmentBack={handleAssessmentBack}
          formData={formData}
          updateFormData={updateFormData}
        />
      )}

      {currentStep === 5 && (
        <FundingReadyStatus
          handleSubmit={handleSubmit}
          handleBack={handleBack}
          formData={formData}
          fundingPurposes={fundingPurposes}
          goToStep={goToStep}
        />
      )}
    </>
  );
}
