import {
  IPaymentStrategy,
  PaymentInitiationResult,
  PaymentVerificationResult,
  WebhookResult,
} from "./PaymentStrategy";
import Stripe from "stripe";
import { Order, Payment, User } from "../../generated/prisma/client";

export class StripeProvider implements IPaymentStrategy {
  private stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  }

  async initiatePayment(
    order: Order,
    user: User
  ): Promise<PaymentInitiationResult> {
    // 1. Convert Decimal to Cents (Integers only)
    const amountInCents = Math.round(Number(order.totalAmount) * 100);

    // 2. Create Payment Intent
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: amountInCents,
      currency: "usd",
      metadata: {
        orderId: order.id,
        userId: user.id,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return {
      transactionId: paymentIntent.id,
      rawResponse: paymentIntent as any,
      // For Stripe, we usually pass client_secret to frontend
      // We can map this to redirectUrl or a custom field in a real app
      redirectUrl: "",
    };
  }

  // Used for manual verification if webhook fails
  async verifyOrExecute(payment: Payment): Promise<PaymentVerificationResult> {
    const intent = await this.stripe.paymentIntents.retrieve(
      payment.transactionId!
    );

    if (intent.status === "succeeded") {
      return { success: true, transactionId: intent.id, rawResponse: intent };
    }
    return { success: false, transactionId: intent.id, rawResponse: intent };
  }

  // Handles Signature Verification and Event Parsing
  async handleWebhook(
    signature: string,
    rawBody: Buffer
  ): Promise<WebhookResult> {
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err: any) {
      throw new Error(`Webhook Signature Verification Failed: ${err.message}`);
    }

    switch (event.type) {
      case "payment_intent.succeeded": {
        const intent = event.data.object as Stripe.PaymentIntent;
        return {
          action: "SUCCESS",
          transactionId: intent.id,
          rawResponse: event,
        };
      }
      case "payment_intent.payment_failed": {
        const intent = event.data.object as Stripe.PaymentIntent;
        return {
          action: "FAIL",
          transactionId: intent.id,
          rawResponse: event,
        };
      }
      default:
        return { action: "IGNORE", transactionId: "", rawResponse: event };
    }
  }
}
