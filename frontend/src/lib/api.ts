import type {
  CustomerBalance,
  EwityCustomer,
  CustomerLink,
  LoginCredentials,
  AuthToken,
  LinkCustomerRequest,
} from '../types'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://blvq-backend.crawlingsloth.space'

class ApiClient {
  private getAuthHeader(): Record<string, string> {
    const token = localStorage.getItem('token')
    if (token) {
      return { Authorization: `Bearer ${token}` }
    }
    return {}
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        detail: 'Request failed',
      }))
      throw new Error(error.detail || 'Request failed')
    }

    return response.json()
  }

  // Admin endpoints
  async login(credentials: LoginCredentials): Promise<AuthToken> {
    const token = await this.request<AuthToken>('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    })
    localStorage.setItem('token', token.access_token)
    return token
  }

  logout() {
    localStorage.removeItem('token')
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('token')
  }

  async searchCustomers(query: string, page = 1): Promise<{
    data: EwityCustomer[]
    pagination: any
  }> {
    return this.request(
      `/api/admin/customers/search?q=${encodeURIComponent(query)}&page=${page}`,
      {
        headers: this.getAuthHeader(),
      }
    )
  }

  async getAllCustomers(page = 1): Promise<{
    data: EwityCustomer[]
    pagination: any
  }> {
    return this.request(`/api/admin/customers/all?page=${page}`, {
      headers: this.getAuthHeader(),
    })
  }

  async linkCustomer(data: LinkCustomerRequest): Promise<CustomerLink> {
    return this.request('/api/admin/customers/link', {
      method: 'POST',
      headers: this.getAuthHeader(),
      body: JSON.stringify(data),
    })
  }

  async getCustomerLinks(): Promise<CustomerLink[]> {
    return this.request('/api/admin/customers/links', {
      headers: this.getAuthHeader(),
    })
  }

  async deleteCustomerLink(uuid: string): Promise<void> {
    return this.request(`/api/admin/customers/link/${uuid}`, {
      method: 'DELETE',
      headers: this.getAuthHeader(),
    })
  }

  async refreshCustomerData(): Promise<{
    success: boolean
    total?: number
    new?: number
    updated?: number
    error?: string
  }> {
    return this.request('/api/admin/customers/refresh', {
      method: 'POST',
      headers: this.getAuthHeader(),
    })
  }

  // Customer endpoints (public)
  async getCustomerBalance(uuid: string): Promise<CustomerBalance> {
    return this.request(`/api/customer/${uuid}`)
  }

  getQRCodeUrl(uuid: string): string {
    return `${API_BASE_URL}/api/customer/${uuid}/qr`
  }
}

export const api = new ApiClient()
