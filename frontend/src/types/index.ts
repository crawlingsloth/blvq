export interface CustomerBalance {
  uuid: string
  customer_name: string
  customer_phone: string | null
  credit_limit: number
  total_outstanding: number
  total_spent: number
  loyalty_text: string | null
  last_updated: string
}

export interface EwityCustomer {
  id: number
  name: string | null
  mobile: string | null
  email: string | null
  credit_limit: number | null
  total_outstanding: number | null
  total_spent: number | null
}

export interface CustomerLink {
  id: string
  uuid: string
  ewity_customer_id: number
  customer_name: string | null
  customer_phone: string | null
  created_at: string
  last_accessed: string
}

export interface LoginCredentials {
  username: string
  password: string
}

export interface AuthToken {
  access_token: string
  token_type: string
}

export interface LinkCustomerRequest {
  ewity_customer_id: number
  customer_name?: string
  customer_phone?: string
}
