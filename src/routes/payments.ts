import { Router, Request, Response } from 'express';
import { PaymentService } from '../services/paymentService';
import { validateBody, validateQuery, validateParams } from '../middleware/validation';
import { 
  enhancedChargeRequestSchema, 
  transactionQuerySchema,
  transactionIdSchema 
} from '../validation/schemas';

const router = Router();
const paymentService = new PaymentService();

/**
 * POST /charge - Process a payment charge
 */
router.post('/charge', 
  validateBody(enhancedChargeRequestSchema),
  async (req: Request, res: Response) => {
    try {
      const result = await paymentService.processCharge(req.body);
      res.status(200).json(result);
    } catch (error) {
      console.error('Error processing charge:', error);
      res.status(500).json({
        error: 'Failed to process charge',
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * GET /transactions - Get all transactions with optional filtering
 */
router.get('/transactions',
  validateQuery(transactionQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const filters = req.query;
      const transactions = paymentService.getFilteredTransactions(filters);
      
      res.status(200).json({
        transactions,
        count: transactions.length,
        filters: filters
      });
    } catch (error) {
      console.error('Error fetching transactions:', error);
      res.status(500).json({
        error: 'Failed to fetch transactions',
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * GET /transactions/:id - Get specific transaction by ID
 */
router.get('/transactions/:id',
  validateParams(transactionIdSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({
          error: 'Transaction ID is required',
          timestamp: new Date().toISOString()
        });
        return;
      }
      
      const transaction = paymentService.getTransactionById(id);
      
      if (!transaction) {
        res.status(404).json({
          error: 'Transaction not found',
          timestamp: new Date().toISOString()
        });
        return;
      }
      
      res.status(200).json(transaction);
    } catch (error) {
      console.error('Error fetching transaction:', error);
      res.status(500).json({
        error: 'Failed to fetch transaction',
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * GET /transactions/stats - Get transaction statistics
 */
router.get('/transactions/stats', async (req: Request, res: Response) => {
  try {
    const stats = paymentService.getTransactionStats();
    res.status(200).json(stats);
  } catch (error) {
    console.error('Error fetching transaction stats:', error);
    res.status(500).json({
      error: 'Failed to fetch transaction statistics',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * DELETE /transactions - Clear all transactions (useful for testing)
 */
router.delete('/transactions', async (req: Request, res: Response): Promise<void> => {
  try {
    if (process.env.NODE_ENV === 'production') {
      res.status(403).json({
        error: 'This operation is not allowed in production',
        timestamp: new Date().toISOString()
      });
      return;
    }
    
    paymentService.clearTransactions();
    res.status(200).json({
      message: 'All transactions cleared',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error clearing transactions:', error);
    res.status(500).json({
      error: 'Failed to clear transactions',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;