#!/usr/bin/env node
import { config } from '../config.js';
import { db, testConnection, initializeSchema } from '../lib/database.js';
import { hashPassword } from '../lib/auth.js';
import { ewityClient } from '../lib/ewity-client.js';

async function setup() {
  console.log('🔧 BLVQ Backend Setup\n');

  try {
    // Step 1: Test database connection
    console.log('1. Testing database connection...');
    await testConnection();

    // Step 2: Initialize schema
    console.log('\n2. Initializing database schema...');
    await initializeSchema();

    // Step 3: Create admin user
    console.log('\n3. Creating admin user...');
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'changeme123';

    // Check if admin already exists
    const existingAdmin = await db.getUserByUsername(adminUsername);

    if (existingAdmin) {
      console.log(`   ⚠ Admin user '${adminUsername}' already exists. Skipping.`);
    } else {
      const passwordHash = await hashPassword(adminPassword);
      const admin = await db.createUser(adminUsername, passwordHash, 'admin');
      console.log(`   ✓ Admin user created: ${admin.username}`);
      console.log(`   📝 Username: ${adminUsername}`);
      console.log(`   📝 Password: ${adminPassword}`);
      console.log(`   ⚠ IMPORTANT: Change the password after first login!`);
    }

    // Step 4: Ask about syncing customers
    console.log('\n4. Sync customers from Ewity API?');
    console.log('   This will fetch all customers from Ewity and store them in the database.');
    console.log('   It may take a few minutes depending on the number of customers.\n');

    const shouldSync = process.argv.includes('--sync-customers');

    if (shouldSync) {
      console.log('   Starting customer sync...');
      const result = await ewityClient.syncAllCustomersToDb();

      if (result.success) {
        console.log(`   ✓ Successfully synced ${result.total} customers`);
        console.log(`     - New: ${result.new}`);
        console.log(`     - Updated: ${result.updated}`);
      } else {
        console.log(`   ✗ Sync failed: ${result.error}`);
      }
    } else {
      console.log('   ⏭  Skipping customer sync');
      console.log('   💡 Run with --sync-customers flag to sync customers');
      console.log('   💡 Or use the /api/admin/customers/refresh endpoint');
    }

    console.log('\n✅ Setup complete!\n');
    console.log('Next steps:');
    console.log('1. Copy .env.example to .env and fill in your credentials');
    console.log('2. Run: npm run dev (for development)');
    console.log('3. Run: npm run build && npm start (for production)');
    console.log('4. API will be available at: http://localhost:8987\n');

  } catch (error) {
    console.error('\n❌ Setup failed:', error);
    process.exit(1);
  }

  process.exit(0);
}

// Run setup
setup();
