const EWITY_API_BASE_URL = Deno.env.get('EWITY_API_BASE_URL') || 'https://api.ewitypos.com/v1';
const EWITY_API_TOKEN = Deno.env.get('EWITY_API_TOKEN') || '';

export async function ewityGet(endpoint: string, params?: Record<string, any>): Promise<any> {
  const url = new URL(`${EWITY_API_BASE_URL}${endpoint}`);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, String(value));
    });
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${EWITY_API_TOKEN}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Ewity API error: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

export async function getAllCustomers(page: number = 1): Promise<any> {
  return await ewityGet('/customers', { page, pageSize: 20 });
}
