import { Request, Response, NextFunction } from 'express';
import { PaymentService } from '../services/PaymentService';
import { AppError } from '../middlewares/errorHandler';

const paymentService = new PaymentService();

export const initiateCheckout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderId, provider } = req.body;
    const userId = req.user!.id;

    const result = await paymentService.initializePayment(userId, orderId, provider);
    
    // Send client_secret (in rawResponse) to frontend for Stripe Elements
    res.status(201).json({
      paymentId: result.payment.id,
      clientSecret: result.payment.rawResponse?.['client_secret'], 
      ...result 
    });
  } catch (error) {
    next(error);
  }
};

export const handleStripeWebhook = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const signature = req.headers['stripe-signature'] as string;
    
    // req.body must be a Buffer here (configured in app.ts)
    await paymentService.processWebhook('stripe', signature, req.body);
    
    res.json({ received: true });
  } catch (error) {
    next(error);
  }
};

export const executeBkashPayment = async (req: Request, res: Response, next: NextFunction) => {
	try {
		// Frontend sends { paymentID } after redirection
		const { paymentID } = req.body; 
		
		if (!paymentID) throw new AppError(400, 'paymentID is required');

		const result = await paymentService.executePayment('bkash', paymentID);
		
		res.status(200).json({ status: 'success', data: result });
	} catch (error) {
		next(error);
	}
};

export const queryBkashPayment = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const { transactionId } = req.params;
		const result = await paymentService.queryPaymentStatus('bkash', transactionId);
		res.status(200).json(result);
	} catch (error) {
		next(error);
	}
}