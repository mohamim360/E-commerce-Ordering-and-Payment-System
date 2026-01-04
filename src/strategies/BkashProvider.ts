import {
  IPaymentStrategy,
  PaymentInitiationResult,
  PaymentVerificationResult,
  WebhookResult,
} from "./PaymentStrategy";
import { AppError } from "../middlewares/errorHandler";
import { Order, Payment, User } from "../../generated/prisma/client";
import axios from "axios";

export class BkashProvider implements IPaymentStrategy {
  private baseUrl = process.env.BKASH_BASE_URL;
  private headers = {
    username: process.env.BKASH_USERNAME!,
    password: process.env.BKASH_PASSWORD!,
    app_key: process.env.BKASH_APP_KEY!,
    app_secret: process.env.BKASH_APP_SECRET!,
  };

  private async getToken(): Promise<string> {
    try {
      const { data } = await axios.post(
        `${this.baseUrl}/tokenized/checkout/token/grant`,
        {
          app_key: this.headers.app_key,
          app_secret: this.headers.app_secret,
        },
        {
          headers: {
            username: this.headers.username,
            password: this.headers.password,
          },
        }
      );
      return data.id_token;
    } catch (error) {
      throw new Error("Failed to grant bKash token");
    }
  }

  async initiatePayment(
    order: Order,
    user: User
  ): Promise<PaymentInitiationResult> {
    const token = await this.getToken();

    // bKash Create Payment API
    const { data } = await axios.post(
      `${this.baseUrl}/tokenized/checkout/create`,
      {
        mode: "0011",
        payerReference: user.id.substring(0, 10), // Limit length
        callbackURL: process.env.BKASH_CALLBACK_URL,
        amount: order.totalAmount.toString(),
        currency: "BDT",
        intent: "sale",
        merchantInvoiceNumber: order.id,
      },
      { headers: { Authorization: token, "X-APP-Key": this.headers.app_key } }
    );

    if (!data.paymentID || !data.bkashURL) {
      throw new AppError(500, `bKash Create Failed: ${data.statusMessage}`);
    }

    return {
      transactionId: data.paymentID,
      redirectUrl: data.bkashURL,
      rawResponse: data,
    };
  }

  // EXECUTE Payment

  async verifyOrExecute(payment: Payment): Promise<PaymentVerificationResult> {
    const token = await this.getToken();

    const { data } = await axios.post(
      `${this.baseUrl}/tokenized/checkout/execute`,
      { paymentID: payment.transactionId },
      { headers: { Authorization: token, "X-APP-Key": this.headers.app_key } }
    );

    if (data && data.transactionStatus === "Completed") {
      return {
        success: true,
        transactionId: data.paymentID,
        rawResponse: data,
      };
    }

    return {
      success: false,
      transactionId: payment.transactionId!,
      rawResponse: data,
    };
  }

  // QUERY Payment
  async checkStatus(payment: Payment): Promise<PaymentVerificationResult> {
    const token = await this.getToken();

    const { data } = await axios.get(
      `${this.baseUrl}/tokenized/checkout/payment/status`,
      {
        params: { paymentID: payment.transactionId },
        headers: { Authorization: token, "X-APP-Key": this.headers.app_key },
      }
    );

    const isSuccess = data.transactionStatus === "Completed";

    return {
      success: isSuccess,
      transactionId: payment.transactionId!,
      rawResponse: data,
    };
  }

  async handleWebhook(signature: string, payload: any): Promise<WebhookResult> {
    return { action: "IGNORE", transactionId: "", rawResponse: {} };
  }
}
