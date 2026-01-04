import { Order, Payment, User } from "../generated/prisma/client";

export interface PaymentInitiationResult {
  transactionId: string;
  redirectUrl?: string;
  rawResponse: any;
}

export interface PaymentVerificationResult {
  success: boolean;
  transactionId: string;
  rawResponse: any;
}

export interface WebhookResult {
  action: "IGNORE" | "SUCCESS" | "FAIL";
  transactionId: string;
  rawResponse: any;
}

export interface IPaymentStrategy {
  initiatePayment(
    order: Order,
    user: User,
    metadata?: any
  ): Promise<PaymentInitiationResult>;
  verifyOrExecute(
    payment: Payment,
    payload: any
  ): Promise<PaymentVerificationResult>;
  handleWebhook(signature: string, payload: any): Promise<WebhookResult>;

  checkStatus?(payment: Payment): Promise<PaymentVerificationResult>;
}
