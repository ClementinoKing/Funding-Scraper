-- Enable required extension
create extension if not exists "pgcrypto";

------------------------------------------------------------
-- ENUM TYPES
------------------------------------------------------------

create type scrape_status as enum ('pending', 'success', 'error');
create type login_method_enum as enum ('email', 'phone', 'google', 'apple', 'other');
create type gender_enum as enum ('Male', 'Female', 'Other', 'Prefer not to say');
create type race_enum as enum ('Black', 'White', 'Coloured', 'Indian/Asian', 'Other', 'Prefer not to say');
create type disability_status_enum as enum ('Yes', 'No', 'Prefer not to say');
create type business_type_enum as enum ('sole-proprietor', 'partnership', 'pty-ltd', 'cc', 'npc', 'cooperative', 'other');
create type revenue_range as enum ('under-100k', '100k-500k', '500k-1m', '1m-5m', '5m-10m','10m-50m','over-50m');
create type employees_enum as enum ('1-5', '6-10', '11-20', '20+');
create type bee_level_enum as enum ('Level 1', 'Level 2', 'Level 3', 'Level 4', 'Level 5', 'Level 6', 'Level 7', 'Level 8', 'Not Certified');
create type timeline_enum as enum ('immediately', 'short-term', 'medium-term', 'long-term','planning');

------------------------------------------------------------
-- TABLE: programs
------------------------------------------------------------

create table programs (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    summary text,
    source text not null,
    eligibility text,
    funding_amount text,
    deadlines text,
    contact_email text,
    contact_phone text,
    application_process text,
    sectors text,
    slug text unique,
    source_domain text,
    is_active boolean default true,
    created_at timestamp default now(),
    updated_at timestamp default now(),
    last_scraped_at timestamp
);

------------------------------------------------------------
-- TABLE: subprograms
------------------------------------------------------------

create table subprograms (
    id uuid primary key default gen_random_uuid(),
    parent_program_id uuid references programs(id) on delete cascade,
    name text not null,
    summary text,
    source text not null,
    eligibility text,
    funding_amount text,
    deadlines text,
    contact_email text,
    contact_phone text,
    application_process text,
    sectors text,
    slug text,
    source_domain text,
    created_at timestamp default now(),
    updated_at timestamp default now()
);

------------------------------------------------------------
-- TABLE: saved_programs
------------------------------------------------------------

create table saved_programs (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade,
    program_id uuid references programs(id) on delete cascade,
    subprogram_id uuid references subprograms(id) on delete set null,
    notes text,
    created_at timestamp default now()
);

------------------------------------------------------------
-- TABLE: scrape_logs
------------------------------------------------------------

create table scrape_logs (
    id uuid primary key default gen_random_uuid(),
    source_url text not null,
    source_name text not null,
    programs_found integer default 0,
    subprograms_found integer default 0,
    status scrape_status,
    error_message text,
    duration_seconds integer,
    started_at timestamp default now(),
    completed_at timestamp
);

------------------------------------------------------------
-- TABLE: user_profiles
------------------------------------------------------------

create table user_profiles (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade,
    login_method login_method_enum,
    email text,
    phone text,
    password_hash text,
    owner_full_name text,
    id_number text unique,
    gender gender_enum,
    race race_enum,
    disability_status disability_status_enum,
    business_name text,
    company_registration_number text,
    business_type business_type_enum,
    industry text,
    business_registration_date date,
    years_in_business integer,
    physical_address text,
    website text,
    tax_number text,
    vat_number text,
    annual_revenue revenue_range,
    number_of_employees employees_enum,
    bee_level bee_level_enum,
    funding_amount_needed revenue_range,
    timeline timeline_enum,
    purpose_of_funding text,
    previous_funding_history boolean,
    previous_funding_details text,
    sectors text[],
    funding_types text[],
    profile_completed boolean,
    created_at timestamp default now(),
    updated_at timestamp default now()
);
