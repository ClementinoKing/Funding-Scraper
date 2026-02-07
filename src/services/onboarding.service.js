import { supabase } from "@/lib/supabase";

export const saveBusinessDetails = async (formData) => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  const businessData = {
    profile_id: user.id,
    business_name: formData.businessName,
    registration_number: formData.companyRegistrationNumber,
    registration_date: formData.registration_date,
    business_type: formData.businessType,
    business_age_band: formData.business_age_band,
    // employees_band: '', // to be filled at a later step
    // website: '', // to be filled at a later step
    // impact_focus: '', // to be filled at a later step
  };

  const locationData = {
    business_id: "", // to be filled after business creation
    type: "registered",
    province: formData.province,
    // municipality: '',
    postal_code: formData.postalCode,
    // latitude: '',
    // longitude: '',
    is_primary: true,
  };

  const locationData2 = {
    business_id: "", // to be filled after business creation
    type: "trading",
    province: formData.secondaryProvince,
    // municipality: '',
    postal_code: formData.secondaryPostalCode,
    // latitude: '',
    // longitude: '',
    is_primary: false,
  };

  const industryData = {
    business_id: "",
    industry_name: formData.industry,
    specialisation: formData.specialization,
    target_consumer: formData.whoDoYouSellTo,
    regulator: formData.regulatedBy,
    seasonality: formData.seasonality,
    is_export: formData.doYouExport,
    is_primary: true,
    sub_industries: formData.subIndustry,
  };

  const industryData2 = {
    business_id: "",
    industry_name: formData.secondaryIndustry,
    specialisation: formData.secondarySpecialization,
    is_primary: false,
    sub_industries: formData.secondarySubIndustry,
  };

  const { data: existingBusiness } = await supabase
    .from("businesses")
    .select("*")
    .eq("profile_id", user.id)
    .single();

  if (existingBusiness) {
    businessData.id = existingBusiness.id;
  }

  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .upsert(businessData)
    .select()
    .single();

  console.log(business);

  if (businessError) {
    console.log(businessData, businessError)
    throw businessError;
  }

  locationData.business_id = business.id;
  industryData.business_id = business.id;
  locationData2.business_id = business.id;
  industryData2.business_id = business.id;

  await Promise.allSettled([
    existingBusiness
      ? supabase
          .from("business_locations")
          .update(locationData)
          .eq("business_id", business.id)
          .select()
      : supabase.from("business_locations").upsert(locationData).select(),
    existingBusiness
      ? supabase
          .from("business_industries")
          .update(industryData)
          .eq("business_id", business.id)
          .eq("is_primary", true)
          .select()
      : supabase.from("business_industries").upsert(industryData).select(),
    existingBusiness
      ? supabase
          .from("business_locations")
          .update(locationData2)
          .eq("business_id", business.id)
          .eq("is_primary", false)
          .select()
      : supabase.from("business_locations").upsert(locationData2).select(),
    existingBusiness
      ? supabase
          .from("business_industries")
          .update(industryData2)
          .eq("business_id", business.id)
          .eq("is_primary", false)
          .select()
      : supabase.from("business_industries").upsert(industryData2).select(),
  ]);

  localStorage.setItem("b_id", business.id);

  return "Progress saved successfully";
};

export const saveFundingNeeds = async (formData) => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("User not authenticated");
  }
  const { data: business } = await supabase
    .from("businesses")
    .select("*")
    .eq("profile_id", user.id)
    .single();
  if (!business) {
    throw new Error("Business profile not found");
  }

  const fundingNeedsData = {
    business_id: business.id,
    amount_mode: "exact",
    // amount_min: ,
    // amount_max: ,
    amount_exact: formData.fundingAmount,
    timeline_band: formData.fundingTimeline,
    description: formData.fundingDetails,
  };
  const { data: existingNeeds } = await supabase
    .from("funding_needs")
    .select("*")
    .eq("business_id", business.id)
    .single();
  if (existingNeeds) {
    fundingNeedsData.id = existingNeeds.id;
  }
  const { data: funding_need } = await supabase
    .from("funding_needs")
    .upsert(fundingNeedsData)
    .select()
    .single();
  console.log(funding_need);

  await supabase
    .from("funding_need_purposes")
    .delete()
    .eq("funding_need_id", funding_need.id);

  await supabase
    .from("funding_need_purposes")
    .insert(
      formData.fundingPurposes.map((purpose) => ({
        funding_need_id: funding_need.id,
        funding_purpose_id: purpose,
      })),
    )
    .select();

  return "Progress saved successfully";
};

export const saveBusinessAndTrading = async (formData) => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("User not authenticated");
  }
  const { data: business } = await supabase
    .from("businesses")
    .select("*")
    .eq("profile_id", user.id)
    .single();
  if (!business) {
    throw new Error("Business profile not found");
  }

  // Section 1: Business & Trading
    // mainCustomers: "",
    // monthlyCustomers: "",
    // revenueFromBiggestCustomer: "",
    // customerPaymentSpeed: "",
    // averageDaysToGetPaid: "",
    // paymentMethods: [],

  const businessDetails = {
    id: business.id,
    monthly_customers: formData.monthlyCustomers,
    revenue_from_biggest_customer: formData.revenueFromBiggestCustomer,
    customer_payment_speed: formData.customerPaymentSpeed,
  }

  const payment_methods = formData.paymentMethods.map((method) => ({
    business_id: business.id,
    ...method,
  }));

  await supabase
      .from("payment_types")
      .delete()
      .eq("business_id", business.id);

  await Promise.allSettled([
    supabase
      .from("businesses")
      .update(businessDetails)
      .eq("id", business.id)
      .select(),
    supabase
      .from("payment_types")
      .insert(payment_methods)
      .select(),
  ]);

  return "Progress saved successfully";
};

export const saveFinanceAndBanking = async (formData) => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("User not authenticated");
  }
  const { data: business } = await supabase
    .from("businesses")
    .select("*")
    .eq("profile_id", user.id)
    .single();
  if (!business) {
    throw new Error("Business profile not found");
  }

  const financialData = {
    business_id: business.id,
    type: formData.moneyGoesTo,
    bank_name: formData.bank,
    account_age: formData.accountDuration,
    monthly_income_band: formData.monthlyIncomeRange,
    tracking_method: formData.trackFinances,
  };
  const { data: existingFinancial } = await supabase
    .from("financial_moneyflows")
    .select("*")
    .eq("business_id", business.id)
    .single();
  if (existingFinancial) {
    financialData.id = existingFinancial.id;
  }

  await supabase.from("financial_moneyflows").upsert(financialData).select();

  return "Progress saved successfully";
};

export const saveTeamAndCompliance = async (formData) => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("User not authenticated");
  }
  const { data: business } = await supabase
    .from("businesses")
    .select("*")
    .eq("profile_id", user.id)
    .single();
  if (!business) {
    throw new Error("Business profile not found");
  }

  const teamComplianceData = {
    business_id: business.id,
    team_size: formData.numberOfEmployees,
    team_stage: formData.businessStage,
    owners_background: formData.ownerBackground,
    sars_status: formData.sarsStatus,
    vat_status: formData.vatRegistered,
    bbee_certification: formData.bbbeeLevel,
    demographics: formData.demographics,
    financial_documents: formData.financialDocuments,
  };

  const { data: existingTeamCompliance } = await supabase
    .from("team_compliances")
    .select("*")
    .eq("business_id", business.id)
    .single();
  if (existingTeamCompliance) {
    teamComplianceData.id = existingTeamCompliance.id;
  }
  await supabase.from("team_compliances").upsert(teamComplianceData).select();

  return "Progress saved successfully";
};

export const savePreferencesAndLocation = async (formData) => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("User not authenticated");
  }
  const { data: business } = await supabase
    .from("businesses")
    .select("*")
    .eq("profile_id", user.id)
    .single();
  if (!business) {
    throw new Error("Business profile not found");
  }
  // // Section 4: Preferences & Location
  // repaymentFrequency: '',
  // repaymentDuration: '',
  // openToEquity: '',
  // canProvideCollateral: '',

  // impactFocus: '',

  const repaymentData = {
    business_id: business.id,
    frequency: formData.repaymentFrequency,
    period: formData.repaymentDuration,
    investors_share: formData.openToEquity,
    collateral: formData.canProvideCollateral,
  };
  const { data: existingRepayment } = await supabase
    .from("funding_repayment_terms")
    .select("*")
    .eq("business_id", business.id)
    .single();
  if (existingRepayment) {
    repaymentData.id = existingRepayment.id;
  }
  await supabase.from("funding_repayment_terms").upsert(repaymentData).select();

  await supabase
    .from("businesses")
    .update({
      impact_focus: formData.impactFocus,
    })
    .eq("id", business.id);

  return "Progress saved successfully";
};


