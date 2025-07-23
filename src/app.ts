import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Import middleware
import { errorHandler, requestLogger } from './middleware/validation';

// Import routes
import paymentRoutes from './routes/payments';
import subscriptionRoutes from './routes/subscriptions';
import transactionRoutes from './routes/transactions';

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    features: {
      llm: process.env.ENABLE_LLM === 'true',
      openai: !!process.env.OPENAI_API_KEY
    }
  });
});

// API routes
app.use('/api/v1', paymentRoutes);
app.use('/api/v1/subscriptions', subscriptionRoutes);
app.use('/api/v1/subscription-transactions', transactionRoutes);

// Root endpoint with API documentation
app.get('/', (req, res) => {
  res.json({
    name: 'Payment Gateway Proxy & Subscription Billing Simulator',
    version: '1.0.0',
    description: 'A lightweight backend API that simulates payment gateway routing and subscription billing with LLM-powered risk analysis',
    endpoints: {
      payments: {
        'POST /api/v1/charge': 'Process a payment charge with fraud detection',
        'GET /api/v1/transactions': 'Get all payment transactions with optional filtering',
        'GET /api/v1/transactions/:id': 'Get specific transaction by ID',
        'GET /api/v1/transactions/stats': 'Get payment transaction statistics'
      },
      subscriptions: {
        'POST /api/v1/subscriptions': 'Create a new recurring subscription',
        'GET /api/v1/subscriptions': 'Get all active subscriptions',
        'GET /api/v1/subscriptions/:donorId': 'Get subscription by donor ID',
        'DELETE /api/v1/subscriptions/:donorId': 'Cancel a subscription',
        'GET /api/v1/subscriptions/stats': 'Get subscription statistics'
      },
      transactions: {
        'GET /api/v1/subscription-transactions': 'Get all subscription transactions',
        'GET /api/v1/subscription-transactions/:donorId': 'Get transactions by donor'
      },
      system: {
        'GET /health': 'Health check endpoint'
      }
    },
    features: [
      'Fraud detection with configurable rules',
      'LLM-powered risk explanations',
      'Payment provider routing (Stripe/PayPal)',
      'Subscription billing with campaign analysis',
      'Background job processing for recurring charges',
      'Comprehensive validation and error handling',
      'Docker support',
      'TypeScript with strict type checking'
    ],
    documentation: {
      setup: 'See README.md for setup instructions',
      environment: 'Copy .env.example to .env and configure',
      testing: 'Run `npm test` for unit tests',
      docker: 'Run `npm run docker:build && npm run docker:run`'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: `The requested endpoint ${req.method} ${req.originalUrl} was not found`,
    availableEndpoints: '/api/v1/',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

export default app;