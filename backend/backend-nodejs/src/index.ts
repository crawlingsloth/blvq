import express from 'express';
import { config } from './config.js';
import { testConnection } from './lib/database.js';
import adminRouter from './functions/admin.js';
import customerRouter from './functions/customer.js';

const app = express();

// Middleware
app.use(express.json());

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }

  next();
});

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'BLVQ Backend API',
    version: '2.0.0',
    environment: config.nodeEnv,
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mount routers
app.use('/api/admin', adminRouter);
app.use('/api/customer', customerRouter);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    detail: 'Internal server error',
    error: config.nodeEnv === 'development' ? err.message : undefined,
  });
});

// Start server
async function startServer() {
  try {
    // Test database connection
    await testConnection();

    // Start listening
    app.listen(config.port, () => {
      console.log(`🚀 Server running on port ${config.port}`);
      console.log(`   Environment: ${config.nodeEnv}`);
      console.log(`   API: http://localhost:${config.port}`);
      console.log(`   Health: http://localhost:${config.port}/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Only start server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer();
}

export { app };
