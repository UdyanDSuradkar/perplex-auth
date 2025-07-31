import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export interface User {
  id: string;
  email: string;
  password_hash?: string;
  name?: string;
  avatar_url?: string;
  role: string;
  created_at: string;
}

export interface OAuthAccount {
  id: string;
  user_id: string;
  provider: string;
  provider_id: string;
  access_token?: string;
  refresh_token?: string;
  token_expiry?: string;
  created_at: string;
}
