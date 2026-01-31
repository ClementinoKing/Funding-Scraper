-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.business_compliance (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid,
  created_at timestamp without time zone,
  updated_at timestamp without time zone,
  CONSTRAINT business_compliance_pkey PRIMARY KEY (id),
  CONSTRAINT business_compliance_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id)
);
CREATE TABLE public.business_industries (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid,
  industry_name character varying,
  specialisation character varying,
  target_consumer character varying,
  regulator character varying,
  seasonality character varying,
  is_export boolean,
  is_primary boolean,
  created_at timestamp without time zone,
  updated_at timestamp without time zone,
  sub_industries jsonb,
  CONSTRAINT business_industries_pkey PRIMARY KEY (id),
  CONSTRAINT business_industries_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id)
);
CREATE TABLE public.business_locations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid,
  type USER-DEFINED,
  province character varying,
  municipality character varying,
  postal_code character varying,
  latitude double precision,
  longitude double precision,
  is_primary boolean,
  created_at timestamp without time zone,
  updated_at timestamp without time zone,
  CONSTRAINT business_locations_pkey PRIMARY KEY (id),
  CONSTRAINT business_locations_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id)
);
CREATE TABLE public.businesses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  profile_id uuid,
  business_name character varying,
  registration_number character varying,
  registration_date date,
  business_type character varying,
  business_age_band character varying,
  employees_band character varying,
  website character varying,
  impact_focus character varying,
  created_at timestamp without time zone,
  updated_at timestamp without time zone,
  monthly_customers text,
  revenue_from_biggest_customer text,
  customer_payment_speed text,
  average_days_to_get_paid bigint,
  CONSTRAINT businesses_pkey PRIMARY KEY (id),
  CONSTRAINT businesses_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.demographics (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid,
  description text,
  created_at timestamp without time zone,
  updated_at timestamp without time zone,
  CONSTRAINT demographics_pkey PRIMARY KEY (id),
  CONSTRAINT demographics_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id)
);

CREATE TABLE public.financial_documents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid,
  document_type character varying,
  description text,
  is_available boolean,
  created_at timestamp without time zone,
  updated_at timestamp without time zone,
  CONSTRAINT financial_documents_pkey PRIMARY KEY (id),
  CONSTRAINT financial_documents_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id)
);
CREATE TABLE public.financial_moneyflows (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid,
  type USER-DEFINED,
  bank_name character varying,
  account_age character varying,
  monthly_income_band character varying,
  monthly_income_exact double precision,
  tracking_method character varying,
  created_at timestamp without time zone,
  updated_at timestamp without time zone,
  CONSTRAINT financial_moneyflows_pkey PRIMARY KEY (id),
  CONSTRAINT financial_moneyflows_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id)
);
CREATE TABLE public.funder_programs_bak (
  program_id text NOT NULL,
  funder_name text,
  program_name text,
  industries ARRAY,
  provinces ARRAY,
  municipalities ARRAY,
  postal_code_ranges text,
  min_turnover numeric,
  max_turnover numeric,
  eligible_turnover_bands ARRAY,
  min_business_age integer,
  max_business_age integer,
  eligible_owner_demographics ARRAY,
  business_stage_eligibility ARRAY,
  eligible_credit_score_bands ARRAY,
  required_certifications ARRAY,
  funding_timeline text,
  min_funding_amount numeric,
  max_funding_amount numeric,
  eligible_funding_amount_bands ARRAY,
  min_payback_period integer,
  max_payback_period integer,
  eligible_payback_period_bands ARRAY,
  use_of_funds ARRAY,
  security_required text,
  equity_required text,
  payment_instrument_types ARRAY,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT funder_programs_bak_pkey PRIMARY KEY (program_id)
);
CREATE TABLE public.funding_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  category text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT funding_categories_pkey PRIMARY KEY (id)
);
CREATE TABLE public.funding_need_purposes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  funding_need_id uuid,
  funding_purpose_id uuid,
  CONSTRAINT funding_need_purposes_pkey PRIMARY KEY (id),
  CONSTRAINT funding_need_purposes_funding_need_id_fkey FOREIGN KEY (funding_need_id) REFERENCES public.funding_needs(id),
  CONSTRAINT funding_need_purposes_funding_purpose_id_fkey FOREIGN KEY (funding_purpose_id) REFERENCES public.funding_purposes(id)
);
CREATE TABLE public.funding_needs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid,
  amount_mode USER-DEFINED,
  amount_min double precision,
  amount_max double precision,
  amount_exact double precision,
  timeline_band character varying,
  description text,
  created_at timestamp without time zone,
  updated_at timestamp without time zone,
  CONSTRAINT funding_needs_pkey PRIMARY KEY (id),
  CONSTRAINT funding_needs_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id)
);
CREATE TABLE public.funding_purposes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code character varying,
  category character varying,
  CONSTRAINT funding_purposes_pkey PRIMARY KEY (id)
);
CREATE TABLE public.funding_repayment_terms (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid,
  frequency character varying,
  period character varying,
  investors_share USER-DEFINED,
  collateral text,
  created_at timestamp without time zone,
  updated_at timestamp without time zone,
  CONSTRAINT funding_repayment_terms_pkey PRIMARY KEY (id),
  CONSTRAINT funding_repayment_terms_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id)
);

CREATE TABLE public.onboarding_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  profile_id uuid,
  current_step character varying,
  is_completed boolean,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT onboarding_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT onboarding_sessions_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.payment_types (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid,
  payment_name character varying,
  provider jsonb,
  is_invoice_issued boolean,
  turnover character varying,
  payment_term character varying,
  customer_percentage character varying,
  created_at timestamp without time zone,
  updated_at timestamp without time zone,
  CONSTRAINT payment_types_pkey PRIMARY KEY (id),
  CONSTRAINT payment_types_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  email text,
  phone text,
  whatsapp_opt_in boolean,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.program_matches (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid,
  funding_program_id integer,
  match_score double precision,
  eligibility_gaps text,
  created_at timestamp without time zone,
  updated_at timestamp without time zone,
  CONSTRAINT program_matches_pkey PRIMARY KEY (id),
  CONSTRAINT program_matches_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id)
);

CREATE TABLE public.saved_programs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  program_id uuid,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT saved_programs_pkey PRIMARY KEY (id),
  CONSTRAINT saved_programs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT saved_programs_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id)
);
CREATE TABLE public.team_compliances (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid,
  team_size character varying,
  team_stage USER-DEFINED,
  owners_background jsonb,
  sars_status USER-DEFINED,
  vat_status USER-DEFINED,
  bbee_certification character varying,
  created_at timestamp without time zone,
  updated_at timestamp without time zone,
  demographics jsonb,
  financial_documents jsonb,
  CONSTRAINT team_compliances_pkey PRIMARY KEY (id),
  CONSTRAINT team_compliances_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id)
);

CREATE TABLE public.user_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  login_method text NOT NULL CHECK (login_method = ANY (ARRAY['email'::text, 'phone'::text])),
  email text,
  phone text,
  password_hash text NOT NULL,
  owner_full_name text NOT NULL,
  id_number text NOT NULL UNIQUE,
  gender text NOT NULL CHECK (gender = ANY (ARRAY['male'::text, 'female'::text, 'other'::text, 'prefer-not-to-say'::text])),
  race text NOT NULL CHECK (race = ANY (ARRAY['black'::text, 'coloured'::text, 'indian/asian'::text, 'white'::text, 'other'::text, 'prefer-not-to-say'::text])),
  disability_status text NOT NULL CHECK (disability_status = ANY (ARRAY['yes'::text, 'no'::text, 'prefer-not-to-say'::text])),
  business_name text NOT NULL,
  company_registration_number text,
  business_type text NOT NULL CHECK (business_type = ANY (ARRAY['sole-proprietor'::text, 'partnership'::text, 'pty-ltd'::text, 'cc'::text, 'npc'::text, 'cooperative'::text, 'other'::text])),
  industry text NOT NULL,
  business_registration_date date,
  years_in_business integer,
  physical_address text,
  website text,
  tax_number text,
  vat_number text,
  annual_revenue text NOT NULL CHECK (annual_revenue = ANY (ARRAY['under-100k'::text, '100k-500k'::text, '500k-1m'::text, '1m-5m'::text, '5m-10m'::text, '10m-50m'::text, 'over-50m'::text])),
  number_of_employees text NOT NULL CHECK (number_of_employees = ANY (ARRAY['1-5'::text, '6-10'::text, '11-20'::text, '21-50'::text, '51-100'::text, '101-250'::text, 'over-250'::text])),
  bee_level text CHECK (bee_level = ANY (ARRAY['level-1'::text, 'level-2'::text, 'level-3'::text, 'level-4'::text, 'level-5'::text, 'level-6'::text, 'level-7'::text, 'level-8'::text, 'not-certified'::text])),
  funding_amount_needed text NOT NULL CHECK (funding_amount_needed = ANY (ARRAY['under-100k'::text, '100k-500k'::text, '500k-1m'::text, '1m-5m'::text, '5m-10m'::text, '10m-50m'::text, 'over-50m'::text])),
  timeline text NOT NULL CHECK (timeline = ANY (ARRAY['immediately'::text, 'short-term'::text, 'medium-term'::text, 'long-term'::text, 'planning'::text])),
  purpose_of_funding text NOT NULL,
  previous_funding_history boolean NOT NULL DEFAULT false,
  previous_funding_details text,
  sectors ARRAY NOT NULL DEFAULT '{}'::text[],
  funding_types ARRAY NOT NULL DEFAULT '{}'::text[],
  profile_completed boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  dob date,
  funding_category text,
  funding_category_confidence double precision,
  funding_category_explanation text,
  postal_code text,
  use_of_funds text,
  CONSTRAINT user_profiles_pkey PRIMARY KEY (id),
  CONSTRAINT user_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);



-- SCRAPER Tables
CREATE TABLE public.scrape_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  source_url text NOT NULL,
  source_name text NOT NULL,
  programs_found integer DEFAULT 0,
  subprograms_found integer DEFAULT 0,
  status text NOT NULL CHECK (status = ANY (ARRAY['success'::text, 'error'::text, 'partial'::text])),
  error_message text,
  duration_seconds integer,
  started_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone,
  CONSTRAINT scrape_logs_pkey PRIMARY KEY (id)
);
CREATE TABLE public.scrape_runs (
  id integer NOT NULL DEFAULT nextval('scrape_runs_id_seq'::regclass),
  source_id integer,
  status character varying NOT NULL CHECK (status::text = ANY (ARRAY['pending'::character varying, 'running'::character varying, 'success'::character varying, 'partial'::character varying, 'failed'::character varying]::text[])),
  items_found integer DEFAULT 0,
  items_inserted integer DEFAULT 0,
  items_updated integer DEFAULT 0,
  error_message text,
  duration_seconds integer,
  started_at timestamp with time zone NOT NULL,
  completed_at timestamp with time zone,
  metadata jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT scrape_runs_pkey PRIMARY KEY (id),
  CONSTRAINT scrape_runs_source_id_fkey FOREIGN KEY (source_id) REFERENCES public.scrape_sources(id)
);
CREATE TABLE public.scrape_sources (
  id integer NOT NULL DEFAULT nextval('scrape_sources_id_seq'::regclass),
  name character varying NOT NULL,
  base_url character varying NOT NULL UNIQUE,
  domain character varying,
  is_active boolean DEFAULT true,
  scrape_frequency character varying,
  last_scraped_at timestamp with time zone,
  config jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT scrape_sources_pkey PRIMARY KEY (id)
);
CREATE TABLE public.scrape_templates (
  id integer NOT NULL DEFAULT nextval('scrape_templates_id_seq'::regclass),
  name character varying NOT NULL UNIQUE,
  description text,
  config jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT scrape_templates_pkey PRIMARY KEY (id)
);
CREATE TABLE public.scraped_items (
  id integer NOT NULL DEFAULT nextval('scraped_items_id_seq'::regclass),
  source_id integer NOT NULL,
  url character varying NOT NULL,
  slug character varying NOT NULL UNIQUE,
  title character varying NOT NULL,
  summary text,
  content_html text,
  content_text text,
  content_hash character varying,
  structured_data jsonb DEFAULT '{}'::jsonb,
  category character varying,
  tags ARRAY,
  is_active boolean DEFAULT true,
  is_valid boolean DEFAULT true,
  first_seen_at timestamp with time zone NOT NULL DEFAULT now(),
  last_scraped_at timestamp with time zone NOT NULL DEFAULT now(),
  last_updated_at timestamp with time zone,
  scrape_count integer DEFAULT 1,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  ai_enhanced boolean DEFAULT false,
  ai_confidence numeric,
  program_type character varying,
  funding_category character varying,
  age character varying,
  gender character varying,
  ethnicity character varying,
  desired_location character varying,
  application_process text,
  contact_email character varying,
  contact_phone character varying,
  eligibility text,
  funding_amount character varying,
  deadlines character varying,
  CONSTRAINT scraped_items_pkey PRIMARY KEY (id),
  CONSTRAINT scraped_items_source_id_fkey FOREIGN KEY (source_id) REFERENCES public.scrape_sources(id)
);
CREATE TABLE public.search_queries (
  id integer NOT NULL DEFAULT nextval('search_queries_id_seq'::regclass),
  query character varying NOT NULL,
  search_engine character varying DEFAULT 'google'::character varying,
  max_results integer DEFAULT 10,
  filters jsonb DEFAULT '{}'::jsonb,
  last_run_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT search_queries_pkey PRIMARY KEY (id)
);
CREATE TABLE public.item_changes (
  id integer NOT NULL DEFAULT nextval('item_changes_id_seq'::regclass),
  item_id integer NOT NULL,
  field_name character varying NOT NULL,
  old_value text,
  new_value text,
  changed_at timestamp with time zone DEFAULT now(),
  CONSTRAINT item_changes_pkey PRIMARY KEY (id),
  CONSTRAINT item_changes_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.scraped_items(id)
);
CREATE TABLE public.item_relationships (
  id integer NOT NULL DEFAULT nextval('item_relationships_id_seq'::regclass),
  parent_item_id integer NOT NULL,
  child_item_id integer NOT NULL,
  relationship_type character varying DEFAULT 'subitem'::character varying,
  order_position integer,
  CONSTRAINT item_relationships_pkey PRIMARY KEY (id),
  CONSTRAINT item_relationships_parent_item_id_fkey FOREIGN KEY (parent_item_id) REFERENCES public.scraped_items(id),
  CONSTRAINT item_relationships_child_item_id_fkey FOREIGN KEY (child_item_id) REFERENCES public.scraped_items(id)
);
CREATE TABLE public.discovered_sources (
  id integer NOT NULL DEFAULT nextval('discovered_sources_id_seq'::regclass),
  search_query_id integer,
  url character varying NOT NULL,
  title character varying,
  snippet text,
  domain character varying,
  discovered_at timestamp with time zone DEFAULT now(),
  status character varying DEFAULT 'pending'::character varying CHECK (status::text = ANY (ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying, 'scraped'::character varying]::text[])),
  reviewed_at timestamp with time zone,
  review_notes text,
  CONSTRAINT discovered_sources_pkey PRIMARY KEY (id),
  CONSTRAINT discovered_sources_search_query_id_fkey FOREIGN KEY (search_query_id) REFERENCES public.search_queries(id)
);