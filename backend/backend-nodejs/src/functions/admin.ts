import { Router, Request, Response } from 'express';
import { db } from '../lib/database.js';
import { hashPassword, verifyPassword, createAccessToken, authenticateToken } from '../lib/auth.js';
import { ewityClient } from '../lib/ewity-client.js';
import type { LoginRequest, CustomerLinkRequest } from '../types.js';

const router = Router();

// Admin login endpoint
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body as LoginRequest;

    if (!username || !password) {
      res.status(400).json({ detail: 'Username and password required' });
      return;
    }

    const user = await db.getUserByUsername(username);

    if (!user || !(await verifyPassword(password, user.password_hash))) {
      res.status(401).json({
        detail: 'Incorrect username or password',
        headers: { 'WWW-Authenticate': 'Bearer' }
      });
      return;
    }

    if (user.role !== 'admin') {
      res.status(403).json({ detail: 'Not authorized' });
      return;
    }

    const accessToken = createAccessToken(user.id, user.role);

    res.json({
      access_token: accessToken,
      token_type: 'bearer',
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

// Search Ewity customers by name or phone
router.get('/customers/search', authenticateToken, async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string;
    const page = parseInt(req.query.page as string || '1', 10);

    if (!query || query.length < 2) {
      res.status(400).json({ detail: 'Query must be at least 2 characters' });
      return;
    }

    const result = await ewityClient.searchCustomers(query, page);
    res.json(result);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

// Get all Ewity customers (paginated)
router.get('/customers/all', authenticateToken, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string || '1', 10);
    const result = await ewityClient.getAllCustomers(page);
    res.json(result);
  } catch (error) {
    console.error('Get all customers error:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

// Link a customer to a UUID for balance checking
router.post('/customers/link', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { ewity_customer_id, customer_name, customer_phone } = req.body as CustomerLinkRequest & { customer_name: string; customer_phone: string };

    if (!ewity_customer_id || !customer_name || !customer_phone) {
      res.status(400).json({ detail: 'Missing required fields' });
      return;
    }

    // Check if customer already linked
    const allLinks = await db.getAllCustomerLinks();
    const existing = allLinks.find(link => link.ewity_customer_id === ewity_customer_id);

    if (existing) {
      res.status(400).json({ detail: 'Customer already linked' });
      return;
    }

    // Create new link
    const userId = (req as any).user.sub;
    const newLink = await db.createCustomerLink(
      ewity_customer_id,
      customer_name,
      customer_phone,
      userId
    );

    res.json({
      uuid: newLink.uuid,
      customer_name: newLink.customer_name,
      customer_phone: newLink.customer_phone,
      created_at: newLink.created_at.toISOString(),
    });
  } catch (error) {
    console.error('Link customer error:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

// Get all linked customers
router.get('/customers/links', authenticateToken, async (req: Request, res: Response) => {
  try {
    const links = await db.getAllCustomerLinks();
    res.json(links.map(link => ({
      uuid: link.uuid,
      customer_name: link.customer_name,
      customer_phone: link.customer_phone,
      created_at: link.created_at.toISOString(),
      ewity_customer_id: link.ewity_customer_id,
    })));
  } catch (error) {
    console.error('Get links error:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

// Remove a customer link
router.delete('/customers/link/:uuid', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { uuid } = req.params;
    const deleted = await db.deleteCustomerLinkByUuid(uuid);

    if (!deleted) {
      res.status(404).json({ detail: 'Link not found' });
      return;
    }

    res.json({ message: 'Link deleted successfully' });
  } catch (error) {
    console.error('Delete link error:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

// Manually trigger refresh of customer data from Ewity API
router.post('/customers/refresh', authenticateToken, async (req: Request, res: Response) => {
  try {
    const result = await ewityClient.syncAllCustomersToDb();
    res.json(result);
  } catch (error) {
    console.error('Refresh error:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

export default router;
