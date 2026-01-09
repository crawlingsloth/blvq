import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export function getSupabaseClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

  return createClient(supabaseUrl, supabaseKey);
}

export interface User {
  id: string;
  username: string;
  password_hash: string;
  role: string;
  created_at: string;
}

export interface Customer {
  id: string;
  name: string;
  mobile: string;
  email: string | null;
  address: string | null;
  credit_limit: number;
  total_spent: number;
  outstanding_balance: number;
  data: any;
  synced_at: string;
}

export interface CustomerLink {
  id: string;
  uuid: string;
  ewity_customer_id: string;
  customer_name: string;
  customer_phone: string;
  created_by: string;
  created_at: string;
  last_accessed: string | null;
  last_api_page: number | null;
}
