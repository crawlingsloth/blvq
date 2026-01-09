import pg from 'pg';
import { config } from '../config.js';
import type { User, CustomerLink, Customer, CacheEntry } from '../types.js';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: config.databaseUrl,
  ssl: {
    rejectUnauthorized: false
  }
});

// Test connection
export async function testConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    console.log('✓ Database connection successful');
    return true;
  } catch (error) {
    console.error('✗ Database connection failed:', error);
    throw error;
  }
}

// Schema creation SQL
export const SCHEMA_SQL = `
-- Users table
CREATE TABLE IF NOT EXISTS blvq__users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'admin',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blvq_users_username ON blvq__users(username);

-- Customers table (cached Ewity data)
CREATE TABLE IF NOT EXISTS blvq__customers (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  mobile VARCHAR(50) NOT NULL,
  email VARCHAR(255),
  address TEXT,
  credit_limit NUMERIC(10, 2) DEFAULT 0,
  total_spent NUMERIC(10, 2) DEFAULT 0,
  outstanding_balance NUMERIC(10, 2) DEFAULT 0,
  data JSONB,
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blvq_customers_name ON blvq__customers(name);
CREATE INDEX IF NOT EXISTS idx_blvq_customers_mobile ON blvq__customers(mobile);
CREATE INDEX IF NOT EXISTS idx_blvq_customers_email ON blvq__customers(email);

-- Customer Links table
CREATE TABLE IF NOT EXISTS blvq__customer_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  ewity_customer_id VARCHAR(255) NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50) NOT NULL,
  created_by UUID NOT NULL REFERENCES blvq__users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_accessed TIMESTAMP WITH TIME ZONE,
  last_api_page INTEGER
);

CREATE INDEX IF NOT EXISTS idx_blvq_customer_links_uuid ON blvq__customer_links(uuid);
CREATE INDEX IF NOT EXISTS idx_blvq_customer_links_ewity_id ON blvq__customer_links(ewity_customer_id);

-- Cache table (replaces in-memory cache)
CREATE TABLE IF NOT EXISTS blvq__cache (
  key VARCHAR(255) PRIMARY KEY,
  value TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_blvq_cache_expires_at ON blvq__cache(expires_at);
`;

export async function initializeSchema(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(SCHEMA_SQL);
    console.log('✓ Database schema initialized');
  } catch (error) {
    console.error('✗ Failed to initialize schema:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Database query helpers
export const db = {
  // Generic query
  async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    const result = await pool.query(sql, params);
    return result.rows;
  },

  async queryOne<T = any>(sql: string, params: any[] = []): Promise<T | null> {
    const result = await pool.query(sql, params);
    return result.rows[0] || null;
  },

  // Users
  async createUser(username: string, passwordHash: string, role: string = 'admin'): Promise<User> {
    const sql = `
      INSERT INTO blvq__users (username, password_hash, role)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const result = await this.queryOne<User>(sql, [username, passwordHash, role]);
    if (!result) throw new Error('Failed to create user');
    return result;
  },

  async getUserByUsername(username: string): Promise<User | null> {
    const sql = 'SELECT * FROM blvq__users WHERE username = $1';
    return await this.queryOne<User>(sql, [username]);
  },

  async getUserById(id: string): Promise<User | null> {
    const sql = 'SELECT * FROM blvq__users WHERE id = $1';
    return await this.queryOne<User>(sql, [id]);
  },

  // Customers
  async upsertCustomer(customer: Omit<Customer, 'synced_at'>): Promise<Customer> {
    const sql = `
      INSERT INTO blvq__customers (id, name, mobile, email, address, credit_limit, total_spent, outstanding_balance, data)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        mobile = EXCLUDED.mobile,
        email = EXCLUDED.email,
        address = EXCLUDED.address,
        credit_limit = EXCLUDED.credit_limit,
        total_spent = EXCLUDED.total_spent,
        outstanding_balance = EXCLUDED.outstanding_balance,
        data = EXCLUDED.data,
        synced_at = NOW()
      RETURNING *
    `;
    const result = await this.queryOne<Customer>(sql, [
      customer.id,
      customer.name,
      customer.mobile,
      customer.email,
      customer.address,
      customer.credit_limit,
      customer.total_spent,
      customer.outstanding_balance,
      customer.data,
    ]);
    if (!result) throw new Error('Failed to upsert customer');
    return result;
  },

  async getCustomerById(id: string): Promise<Customer | null> {
    const sql = 'SELECT * FROM blvq__customers WHERE id = $1';
    return await this.queryOne<Customer>(sql, [id]);
  },

  async searchCustomers(query: string, limit: number = 50): Promise<Customer[]> {
    const sql = `
      SELECT * FROM blvq__customers
      WHERE name ILIKE $1 OR mobile ILIKE $1
      ORDER BY name
      LIMIT $2
    `;
    return await this.query<Customer>(sql, [`%${query}%`, limit]);
  },

  async getAllCustomers(page: number = 1, pageSize: number = 50): Promise<{ customers: Customer[], total: number }> {
    const offset = (page - 1) * pageSize;

    const [customers, countResult] = await Promise.all([
      this.query<Customer>(
        'SELECT * FROM blvq__customers ORDER BY name LIMIT $1 OFFSET $2',
        [pageSize, offset]
      ),
      this.queryOne<{ count: string }>(
        'SELECT COUNT(*) as count FROM blvq__customers'
      )
    ]);

    return {
      customers,
      total: parseInt(countResult?.count || '0', 10)
    };
  },

  // Customer Links
  async createCustomerLink(
    ewityCustomerId: string,
    customerName: string,
    customerPhone: string,
    createdBy: string
  ): Promise<CustomerLink> {
    const sql = `
      INSERT INTO blvq__customer_links (ewity_customer_id, customer_name, customer_phone, created_by)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const result = await this.queryOne<CustomerLink>(sql, [ewityCustomerId, customerName, customerPhone, createdBy]);
    if (!result) throw new Error('Failed to create customer link');
    return result;
  },

  async getCustomerLinkByUuid(uuid: string): Promise<CustomerLink | null> {
    const sql = 'SELECT * FROM blvq__customer_links WHERE uuid = $1';
    return await this.queryOne<CustomerLink>(sql, [uuid]);
  },

  async getAllCustomerLinks(): Promise<CustomerLink[]> {
    const sql = 'SELECT * FROM blvq__customer_links ORDER BY created_at DESC';
    return await this.query<CustomerLink>(sql);
  },

  async deleteCustomerLinkByUuid(uuid: string): Promise<boolean> {
    const sql = 'DELETE FROM blvq__customer_links WHERE uuid = $1';
    const result = await pool.query(sql, [uuid]);
    return (result.rowCount || 0) > 0;
  },

  async updateCustomerLinkAccess(uuid: string, lastApiPage?: number): Promise<void> {
    const sql = `
      UPDATE blvq__customer_links
      SET last_accessed = NOW(), last_api_page = COALESCE($2, last_api_page)
      WHERE uuid = $1
    `;
    await pool.query(sql, [uuid, lastApiPage]);
  },

  // Cache
  async getCacheValue(key: string): Promise<string | null> {
    const sql = 'SELECT value FROM blvq__cache WHERE key = $1 AND expires_at > NOW()';
    const result = await this.queryOne<{ value: string }>(sql, [key]);
    return result?.value || null;
  },

  async setCacheValue(key: string, value: string, ttlSeconds: number): Promise<void> {
    const sql = `
      INSERT INTO blvq__cache (key, value, expires_at)
      VALUES ($1, $2, NOW() + INTERVAL '${ttlSeconds} seconds')
      ON CONFLICT (key) DO UPDATE SET
        value = EXCLUDED.value,
        expires_at = EXCLUDED.expires_at
    `;
    await pool.query(sql, [key, value]);
  },

  async deleteCacheValue(key: string): Promise<void> {
    const sql = 'DELETE FROM blvq__cache WHERE key = $1';
    await pool.query(sql, [key]);
  },

  async cleanExpiredCache(): Promise<number> {
    const sql = 'DELETE FROM blvq__cache WHERE expires_at <= NOW()';
    const result = await pool.query(sql);
    return result.rowCount || 0;
  },
};
