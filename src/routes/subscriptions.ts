import { Router, Request, Response } from 'express';
import { SubscriptionService } from '../services/subscriptionService';
import { validateBody, validateParams } from '../middleware/validation';
import { 
  enhancedSubscriptionRequestSchema,
  donorIdSchema 
} from '../validation/schemas';

const router = Router();
const subscriptionService = new SubscriptionService();

/**
 * POST /subscriptions - Create a new subscription
 */
router.post('/', 
  validateBody(enhancedSubscriptionRequestSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      // Check if donor already has an active subscription
      const existing = subscriptionService.getSubscriptionByDonorId(req.body.donorId);
      if (existing && existing.isActive) {
        res.status(409).json({
          error: 'Donor already has an active subscription',
          existingSubscription: existing,
          timestamp: new Date().toISOString()
        });
        return;
      }

      const subscription = await subscriptionService.createSubscription(req.body);
      res.status(201).json(subscription);
    } catch (error) {
      console.error('Error creating subscription:', error);
      res.status(500).json({
        error: 'Failed to create subscription',
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * GET /subscriptions - Get all active subscriptions
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const subscriptions = subscriptionService.getActiveSubscriptions();
    res.status(200).json({
      subscriptions,
      count: subscriptions.length
    });
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    res.status(500).json({
      error: 'Failed to fetch subscriptions',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /subscriptions/:donorId - Get subscription by donor ID
 */
router.get('/:donorId',
  validateParams(donorIdSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { donorId } = req.params;
      if (!donorId) {
        res.status(400).json({
          error: 'Donor ID is required',
          timestamp: new Date().toISOString()
        });
        return;
      }
      
      const subscription = subscriptionService.getSubscriptionByDonorId(donorId);
      
      if (!subscription) {
        res.status(404).json({
          error: 'Subscription not found',
          timestamp: new Date().toISOString()
        });
        return;
      }
      
      res.status(200).json(subscription);
    } catch (error) {
      console.error('Error fetching subscription:', error);
      res.status(500).json({
        error: 'Failed to fetch subscription',
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * DELETE /subscriptions/:donorId - Cancel a subscription
 */
router.delete('/:donorId',
  validateParams(donorIdSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { donorId } = req.params;
      if (!donorId) {
        res.status(400).json({
          error: 'Donor ID is required',
          timestamp: new Date().toISOString()
        });
        return;
      }
      
      const cancelled = subscriptionService.cancelSubscription(donorId);
      
      if (!cancelled) {
        res.status(404).json({
          error: 'Subscription not found',
          timestamp: new Date().toISOString()
        });
        return;
      }
      
      res.status(200).json({
        message: 'Subscription cancelled successfully',
        donorId,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      res.status(500).json({
        error: 'Failed to cancel subscription',
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * GET /subscriptions/stats - Get subscription statistics
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = subscriptionService.getSubscriptionStats();
    res.status(200).json(stats);
  } catch (error) {
    console.error('Error fetching subscription stats:', error);
    res.status(500).json({
      error: 'Failed to fetch subscription statistics',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /subscriptions/process-charges - Manually trigger charge processing
 */
router.post('/process-charges', async (req: Request, res: Response): Promise<void> => {
  try {
    if (process.env.NODE_ENV === 'production') {
      res.status(403).json({
        error: 'Manual charge processing is not allowed in production',
        timestamp: new Date().toISOString()
      });
      return;
    }
    
    await subscriptionService.triggerChargeProcessing();
    res.status(200).json({
      message: 'Charge processing triggered successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error processing charges:', error);
    res.status(500).json({
      error: 'Failed to process charges',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;