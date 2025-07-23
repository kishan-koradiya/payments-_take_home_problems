import { Router, Request, Response } from 'express';
import { SubscriptionService } from '../services/subscriptionService';
import { validateParams } from '../middleware/validation';
import { donorIdSchema } from '../validation/schemas';

const router = Router();
const subscriptionService = new SubscriptionService();

/**
 * GET /transactions - Get all subscription transactions
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const transactions = subscriptionService.getTransactions();
    res.status(200).json({
      transactions,
      count: transactions.length
    });
  } catch (error) {
    console.error('Error fetching subscription transactions:', error);
    res.status(500).json({
      error: 'Failed to fetch subscription transactions',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /transactions/:donorId - Get transactions for a specific donor
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
      
      const transactions = subscriptionService.getTransactionsByDonor(donorId);
      
      res.status(200).json({
        donorId,
        transactions,
        count: transactions.length
      });
    } catch (error) {
      console.error('Error fetching donor transactions:', error);
      res.status(500).json({
        error: 'Failed to fetch donor transactions',
        timestamp: new Date().toISOString()
      });
    }
  }
);

export default router;