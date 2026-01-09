import { config } from '../config.js';
import { db } from './database.js';
import { cache } from './cache.js';
import type { EwityCustomer, EwityCustomersResponse, Customer } from '../types.js';

export class EwityClient {
  private baseUrl: string;
  private headers: Record<string, string>;

  constructor() {
    this.baseUrl = config.ewityApiBaseUrl;
    this.headers = {
      'Authorization': `Bearer ${config.ewityApiToken}`,
    };
  }

  private async get(endpoint: string, params?: Record<string, any>): Promise<any> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, String(value));
      });
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: this.headers,
    });

    if (!response.ok) {
      throw new Error(`Ewity API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  async getCustomer(customerId: string): Promise<EwityCustomer | null> {
    try {
      // Check local database first
      const customer = await db.getCustomerById(customerId);

      if (customer) {
        // Return customer data from local database
        return {
          id: customer.id,
          name: customer.name,
          mobile: customer.mobile,
          email: customer.email || undefined,
          address: customer.address || undefined,
          credit_limit: customer.credit_limit,
          creditLimit: customer.credit_limit,
          total_spent: customer.total_spent,
          totalSpent: customer.total_spent,
          total_outstanding: customer.outstanding_balance,
          outstandingBalance: customer.outstanding_balance,
        };
      }

      // If not in local database, fetch from API
      console.log(`Customer ${customerId} not in local DB, fetching from API...`);
      const data = await this.get('/customers', { page: 1 });
      const customers = data?.data || [];

      for (const customerData of customers) {
        if (customerData.id === customerId) {
          // Store in database for future use
          await db.upsertCustomer({
            id: customerId,
            name: customerData.name,
            mobile: customerData.mobile,
            email: customerData.email,
            address: customerData.address,
            credit_limit: customerData.credit_limit,
            total_spent: customerData.total_spent,
            outstanding_balance: customerData.total_outstanding,
            data: JSON.stringify(customerData),
          });
          return customerData;
        }
      }

      return null;
    } catch (error) {
      console.error(`Error fetching customer ${customerId}:`, error);
      return null;
    }
  }

  async searchCustomers(query: string, page: number = 1): Promise<EwityCustomersResponse> {
    try {
      // Search in local database
      const customers = await db.searchCustomers(query, 50);

      // Convert to API format
      const data = customers.map(customer => ({
        id: customer.id,
        name: customer.name,
        mobile: customer.mobile,
        email: customer.email || undefined,
        address: customer.address || undefined,
        creditLimit: customer.credit_limit,
        totalSpent: customer.total_spent,
        outstandingBalance: customer.outstanding_balance,
      }));

      // Simple pagination
      const pageSize = 20;
      const startIdx = (page - 1) * pageSize;
      const endIdx = startIdx + pageSize;
      const paginatedData = data.slice(startIdx, endIdx);

      return {
        customers: paginatedData,
        page,
        total_pages: Math.ceil(data.length / pageSize),
        total_count: data.length,
      };
    } catch (error) {
      console.error('Error searching customers:', error);
      return {
        customers: [],
        page,
        total_pages: 0,
        total_count: 0,
      };
    }
  }

  async getAllCustomers(page: number = 1): Promise<any> {
    const cacheKey = `customers:page:${page}`;

    // Check cache first
    const cached = await cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const data = await this.get('/customers', { page, pageSize: 20 });
      await cache.set(cacheKey, data, 300); // Cache for 5 minutes
      return data;
    } catch (error) {
      console.error('Error fetching customers:', error);
      return { data: [], pagination: {} };
    }
  }

  async syncAllCustomersToDb(): Promise<{ success: boolean; total?: number; new?: number; updated?: number; error?: string }> {
    try {
      console.log('🔄 Syncing customers from Ewity API...');

      let syncedCount = 0;
      let updatedCount = 0;
      let page = 1;
      let totalPages = 1;

      // Fetch all pages
      while (page <= totalPages) {
        console.log(`  Fetching page ${page}...`);

        const data = await this.get('/customers', { page });
        const customers = data?.data || [];
        const pagination = data?.pagination || {};

        // Update total pages from first response
        if (page === 1) {
          totalPages = pagination.lastPage || 1;
          const totalCustomers = pagination.total || 0;
          console.log(`  Found ${totalPages} pages (${totalCustomers} total customers)`);
        }

        // Process customers from this page
        for (const customerData of customers) {
          const customerId = customerData.id;
          if (!customerId) {
            continue;
          }

          // Check if customer exists
          const existing = await db.getCustomerById(customerId);

          await db.upsertCustomer({
            id: customerId,
            name: customerData.name,
            mobile: customerData.mobile,
            email: customerData.email,
            address: customerData.address,
            credit_limit: customerData.credit_limit,
            total_spent: customerData.total_spent,
            outstanding_balance: customerData.total_outstanding,
            data: JSON.stringify(customerData),
          });

          if (existing) {
            updatedCount++;
          } else {
            syncedCount++;
          }
        }

        console.log(`  ✓ Processed page ${page}/${totalPages}`);
        page++;
      }

      const total = syncedCount + updatedCount;
      console.log(`✓ Synced ${total} customers (${syncedCount} new, ${updatedCount} updated)`);

      return {
        success: true,
        total,
        new: syncedCount,
        updated: updatedCount,
      };
    } catch (error) {
      console.error('❌ Error syncing customers:', error);
      return {
        success: false,
        error: String(error),
      };
    }
  }
}

export const ewityClient = new EwityClient();
