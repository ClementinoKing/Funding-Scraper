import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import path from "node:path";
import { existsSync } from "node:fs";

// Load environment variables from .env file
// Use process.cwd() which is the project root when running via npm scripts
const envPath = path.resolve(process.cwd(), ".env");

// Load .env file
const result = config({ path: envPath });

if (result.error) {
  console.warn("[db] Warning: Could not load .env file:", result.error.message);
  console.warn("[db] Attempted path:", envPath);
}

// Try to load from process.env (Vite prefixes with VITE_)
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const ai_provider = process.env.AI_PROVIDER || "openai";
const openai_key = process.env.OPENAI_API_KEY || "";
const groq_key = process.env.GROQ_API_KEY || "";


if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[db] Environment variables not found:')
  console.error('[db] VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL ? 'found' : 'missing')
  console.error('[db] VITE_SUPABASE_ANON_KEY:', process.env.VITE_SUPABASE_ANON_KEY ? 'found' : 'missing')
  console.error('[db] .env file path:', envPath)
  console.error('[db] .env file exists:', existsSync(envPath))
  console.error('[db] Current working directory:', process.cwd())
  throw new Error('Missing Supabase environment variables. Please check .env file.')
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export {
  supabase,
  ai_provider,
  openai_key,
  groq_key,
};