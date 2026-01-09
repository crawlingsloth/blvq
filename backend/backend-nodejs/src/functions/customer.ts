import { Router, Request, Response } from 'express';
import QRCode from 'qrcode';
import { db } from '../lib/database.js';
import { ewityClient } from '../lib/ewity-client.js';
import { config } from '../config.js';

const router = Router();

// Get customer balance by UUID (public endpoint)
router.get('/:uuid', async (req: Request, res: Response) => {
  try {
    const { uuid } = req.params;

    // Find the link
    const link = await db.getCustomerLinkByUuid(uuid);

    if (!link) {
      res.status(404).json({ detail: 'Customer not found' });
      return;
    }

    // Update last accessed
    await db.updateCustomerLinkAccess(uuid);

    // Fetch FRESH customer data directly from Ewity API (bypass database cache)
    let customerData: any = null;
    let foundPage: number | null = null;

    try {
      // If we have a cached page number, check that page first
      if (link.last_api_page) {
        console.log(`Checking cached page ${link.last_api_page} for customer ${link.ewity_customer_id}`);
        const data = await ewityClient.getAllCustomers(link.last_api_page);
        const customers = data?.data || [];

        for (const c of customers) {
          if (c.id === link.ewity_customer_id) {
            customerData = c;
            foundPage = link.last_api_page;
            console.log(`✓ Found on cached page ${foundPage}`);
            break;
          }
        }
      }

      // If not found on cached page, search all pages (max 14 pages)
      if (!customerData) {
        console.log('Customer not on cached page, searching all pages...');
        for (let page = 1; page <= 14; page++) {
          // Skip the cached page since we already checked it
          if (page === link.last_api_page) {
            continue;
          }

          const data = await ewityClient.getAllCustomers(page);
          const customers = data?.data || [];

          for (const c of customers) {
            if (c.id === link.ewity_customer_id) {
              customerData = c;
              foundPage = page;
              console.log(`✓ Found customer on page ${page}`);
              break;
            }
          }

          if (customerData) {
            break;
          }
        }
      }

      // Update cached page number if found
      if (foundPage && foundPage !== link.last_api_page) {
        await db.updateCustomerLinkAccess(uuid, foundPage);
        console.log(`Updated cached page to ${foundPage}`);
      }
    } catch (error) {
      console.error('Error fetching fresh data:', error);
    }

    // Final fallback to database if API search fails
    if (!customerData) {
      console.log('Could not find in API, using database cache');
      customerData = await ewityClient.getCustomer(link.ewity_customer_id);
    }

    if (!customerData) {
      res.status(404).json({ detail: 'Customer data not available' });
      return;
    }

    // Return balance info
    res.json({
      uuid: link.uuid,
      customer_name: customerData.name || link.customer_name || 'Unknown',
      customer_phone: customerData.mobile || link.customer_phone,
      credit_limit: customerData.credit_limit || 0,
      total_outstanding: customerData.total_outstanding || customerData.outstandingBalance || 0,
      total_spent: customerData.total_spent || customerData.totalSpent || 0,
      loyalty_text: customerData.loyalty_text || null,
      last_updated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Get balance error:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

// Generate QR code for customer UUID
router.get('/:uuid/qr', async (req: Request, res: Response) => {
  try {
    const { uuid } = req.params;

    // Verify link exists
    const link = await db.getCustomerLinkByUuid(uuid);

    if (!link) {
      res.status(404).json({ detail: 'Customer not found' });
      return;
    }

    // Generate QR code
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const url = `${frontendUrl}/balance/${uuid}`;

    const qrCodeBuffer = await QRCode.toBuffer(url, {
      errorCorrectionLevel: 'L',
      type: 'png',
      width: 300,
      margin: 4,
    });

    res.setHeader('Content-Type', 'image/png');
    res.send(qrCodeBuffer);
  } catch (error) {
    console.error('QR code error:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

export default router;
