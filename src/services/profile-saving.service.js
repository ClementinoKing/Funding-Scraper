import { supabase } from "@/lib/supabase";

export async function savePersonalDetails(profile) {
  const { data, error } = await supabase
    .from("profiles")
    .update({
      email: profile.email,
      phone: profile.phone,
      whatsapp_opt_in: profile.whatsapp_opt_in,
      dob: profile.dob,
      qualification: profile.qualification,
      id_type: profile.id_type,
      id_number: profile.id_number,
      country: profile.owner_country,
      province: profile.owner_province,
      postal_code: profile.owner_postal_code,
      full_name: profile.owner_full_name,
      race: profile.race,
      gender: profile.gender,
    })
    .eq("id", profile.user_id);
  if (error) {
    console.error("Error saving personal details:", error);
  }
  return data;
}

export async function saveBusinessDetails(profile) {
  const { data, error } = await supabase
    .from("businesses")
    .update({
        business_name: profile.business_name,
        registration_number: profile.registration_number,
        registration_date: profile.registration_date,
        tax_number: profile.tax_number,
        business_type: profile.business_type,
        business_age_band: profile.business_age_band,
        employees_band: profile.employees_band,
        website: profile.website,
        impact_focus: profile.impact_focus,
        monthly_customers: profile.monthly_customers,
        revenue_from_biggest_customer: profile.revenue_from_biggest_customer,
        customer_payment_speed: profile.customer_payment_speed
    })
    .eq("id", profile.business_id);

    const { data: industryData, error: industryError } = await supabase
    .from("business_industries")
    .update({
        industry_name: profile.industry,
        specialisation: profile.specialisation,
        target_consumer: profile.target_consumer,
        regulator: profile.regulator,
        seasonality: profile.seasonality,
        is_export: profile.is_export,
    })
    .eq("business_id", profile.business_id)
    .eq("is_primary", true);

    const { data: locationData, error: locationError } = await supabase
    .from("business_locations")
    .update({
        province: profile.province,
        municipality: profile.municipality,
        postal_code: profile.postal_code,
        latitude: profile.latitude,
        longitude: profile.longitude,
        physical_address: profile.physical_address,
    })
    .eq("business_id", profile.business_id)
    .eq("is_primary", true);
  if (error) {
    console.error("Error saving business details:", error);
  }
  return {...data, ...industryData, ...locationData};
}

export async function saveBusinessMetrics(profile) {
    const {data, error} = await supabase
    .from("team_compliances")
    .update({
        team_size: profile.team_size,
        team_stage: profile.team_stage,
        sars_status: profile.sars_status,
        vat_status: profile.vat_status,
        bbee_certification: profile.bbee_certification,
        // demographics: profile.demographics,
        // financial_documents: profile.financial_documents,
    })
    .eq("business_id", profile.business_id);

    const { data: financialData, error: financialError } = await supabase
    .from("financial_moneyflows")
    .update({
        type: profile.financial_type,
        bank_name: profile.financial_bank_name,
        account_age: profile.account_age,
        monthly_income_band: profile.monthly_income_band,
        tracking_method: profile.tracking_method
    })
    .eq("business_id", profile.business_id);

    // TODO: Add payment types

    if (error) {
        console.error("Error saving business metrics:", error);
    }
    return {...data, ...financialData};
}


export async function saveFundingRequirements(profile) {
    const {data, error} = await supabase
    .from("funding_needs")
    .update({
        amount_min: profile.funding_amount_min,
        amount_max: profile.funding_amount_max,
        amount_exact: profile.funding_amount_exact,
        timeline_band: profile.timeline_band,
        description: profile.funding_description,
    })
    .eq("business_id", profile.business_id);

    const {data: repaymentData, error: repaymentError} = await supabase
    .from("funding_repayment_terms")
    .update({
        frequency: profile.repayment_frequency,
        period: profile.repayment_period,
        investors_share: profile.repayment_investor_share,
        collateral: profile.repayment_collateral
    })
    .eq("business_id", profile.business_id);

    // TODO: Add funding purposes
    if (error) {
        console.error("Error saving funding requirements:", error);
    }

    return {...data, ...repaymentData};
}