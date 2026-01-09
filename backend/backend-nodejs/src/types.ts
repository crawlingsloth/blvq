// Database Models
export interface User {
  id: string;
  username: string;
  password_hash: string;
  role: string;
  created_at: Date;
}

export interface CustomerLink {
  id: string;
  uuid: string;
  ewity_customer_id: string;
  customer_name: string;
  customer_phone: string;
  created_by: string;
  created_at: Date;
  last_accessed: Date | null;
  last_api_page: number | null;
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
  data: string;
  synced_at: Date;
}

// Cache entry in PostgreSQL
export interface CacheEntry {
  key: string;
  value: string;
  expires_at: Date;
}

// Request/Response Schemas
export interface LoginRequest {
  username: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface CustomerLinkRequest {
  ewity_customer_id: string;
}

export interface CustomerLinkResponse {
  uuid: string;
  customer_name: string;
  customer_phone: string;
  created_at: string;
}

export interface CustomerBalance {
  customer_id: string;
  name: string;
  mobile: string;
  credit_limit: number;
  total_spent: number;
  outstanding_balance: number;
  cached: boolean;
}

// Ewity API Types
export interface EwityCustomer {
  id: string;
  name: string;
  mobile: string;
  email?: string;
  address?: string;
  credit_limit?: number;
  creditLimit?: number;
  total_spent?: number;
  totalSpent?: number;
  outstanding_balance?: number;
  outstandingBalance?: number;
  total_outstanding?: number;
  [key: string]: any;
}

export interface EwityCustomersResponse {
  customers: EwityCustomer[];
  page: number;
  total_pages: number;
  total_count: number;
}

// JWT Payload
export interface JWTPayload {
  sub: string;
  role: string;
  exp?: number;
}

// Config
export interface Config {
  databaseUrl: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceRoleKey: string;
  jwtSecret: string;
  jwtAlgorithm: string;
  jwtExpiration: string;
  ewityApiBaseUrl: string;
  ewityApiToken: string;
  port: number;
  nodeEnv: string;
}
