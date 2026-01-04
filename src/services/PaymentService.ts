import { StripeProvider } from "../strategies/StripeProvider";
import { BkashProvider } from "../strategies/BkashProvider";
import { IPaymentStrategy } from "../strategies/PaymentStrategy";
import { OrderService } from "./OrderService";
import { AppError } from "../middlewares/errorHandler";
import { prisma } from "../lib/prisma";
import { PaymentProvider } from "../../generated/prisma/enums";
import { Prisma } from "../../generated/prisma/client";

export class PaymentService {
  private orderService = new OrderService();

  //  Factory Method
  private getProvider(providerName: string): IPaymentStrategy {
    switch (providerName.toLowerCase()) {
      case "stripe":
        return new StripeProvider();
      case "bkash":
        return new BkashProvider();
      default:
        throw new AppError(400, `Unsupported provider: ${providerName}`);
    }
  }

  //  Initiate
  async initializePayment(
    userId: string,
    orderId: string,
    providerName: string
  ) {
    const provider = this.getProvider(providerName);

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true }, // Assuming relation exists
    });

    if (!order) throw new AppError(404, "Order not found");
    if (order.userId !== userId) throw new AppError(403, "Forbidden");
    if (order.status !== "PENDING")
      throw new AppError(400, "Order is not pending");

    // Execute Strategy
    // Prisma enum mapping
    const dbProvider = providerName.toUpperCase() as PaymentProvider;

    const result = await provider.initiatePayment(order, order.user);

    // Persist Payment Record
    const payment = await prisma.payment.create({
      data: {
        orderId: order.id,
        amount: order.totalAmount,
        provider: dbProvider,
        transactionId: result.transactionId,
        rawResponse: result.rawResponse,
        status: "PENDING",
      },
    });

    return { payment, redirectUrl: result.redirectUrl };
  }

  // Verify / Execute
  async verifyPayment(paymentId: string, payload: any) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    });
    if (!payment) throw new AppError(404, "Payment not found");

    const provider = this.getProvider(payment.provider.toLowerCase());

    // Execute Strategy Verification
    const result = await provider.verifyOrExecute(payment, payload);

    if (result.success) {
      //  Update Payment Table
      await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: "SUCCESS",
          rawResponse: result.rawResponse,
        },
      });

      //  Finalize Order (Stock Reduction)
      // This calls the method from the previous prompt
      await this.orderService.processPaymentSuccess(payment.orderId);

      return { status: "SUCCESS" };
    } else {
      await prisma.payment.update({
        where: { id: paymentId },
        data: { status: "FAILED", rawResponse: result.rawResponse },
      });
      return { status: "FAILED" };
    }
  }

  // New Query Method
  async queryPaymentStatus(providerName: string, transactionId: string) {
    const payment = await prisma.payment.findUnique({
      where: { transactionId },
    });

    if (!payment) throw new AppError(404, "Payment transaction not found");

    const provider = this.getProvider(providerName);

    if (!provider.checkStatus) {
      throw new AppError(400, "Provider does not support status query");
    }

    const result = await provider.checkStatus(payment);

    // Sync DB state with Query result if mismatched
    if (result.success && payment.status !== "SUCCESS") {
      // Self-healing: Update DB if Query says it's actually paid
      await this.executePayment(providerName, transactionId);
    }

    return result;
  }

  async transitionToSuccess(
    paymentId: string,
    transactionId: string,
    rawResponse: any
  ) {
    return prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({ where: { id: paymentId } });

      if (!payment) throw new AppError(404, "Payment not found");

      if (payment.status === "SUCCESS") {
        console.log(
          `[Idempotency] Payment ${paymentId} already SUCCESS. Ignoring.`
        );
        return payment;
      }

      if (payment.status === "FAILED") {
        throw new AppError(409, "Cannot transition FAILED payment to SUCCESS");
      }

      const updatedPayment = await tx.payment.update({
        where: { id: paymentId },
        data: {
          status: "SUCCESS",
          transactionId: transactionId,
          rawResponse: rawResponse ?? payment.rawResponse,
        },
      });

      await this.processOrderSuccessInsideTx(tx, payment.orderId);

      return updatedPayment;
    });
  }

  private async processOrderSuccessInsideTx(
    tx: Prisma.TransactionClient,
    orderId: string
  ) {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    // Order Idempotency
    if (!order || order.status === "PAID") return;

    const sortedItems = [...order.items].sort((a, b) =>
      a.productId.localeCompare(b.productId)
    );

    for (const item of sortedItems) {
      const res = await tx.product.updateMany({
        where: { id: item.productId, stock: { gte: item.quantity } },
        data: { stock: { decrement: item.quantity } },
      });
      if (res.count === 0)
        throw new AppError(409, `Out of stock: ${item.productId}`);
    }

    await tx.order.update({
      where: { id: orderId },
      data: { status: "PAID" },
    });
  }

  async transitionToFailed(paymentId: string, rawResponse: any) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    });
    if (!payment) return;

    // Idempotency
    if (payment.status === "FAILED" || payment.status === "SUCCESS") return;

    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: "FAILED",
        rawResponse: rawResponse ?? payment.rawResponse,
      },
    });
  }

  async processWebhook(
    providerName: string,
    signature: string,
    rawBody: Buffer
  ) {
    const provider = this.getProvider(providerName);

    //  Verify
    let result;
    try {
      result = await provider.handleWebhook(signature, rawBody);
    } catch (error) {
      console.error(`Webhook Signature Error: ${(error as Error).message}`);
      return { received: false };
    }

    if (result.action === "IGNORE") return { received: true };

    // Lookup Payment
    const payment = await prisma.payment.findUnique({
      where: { transactionId: result.transactionId },
    });

    if (!payment) {
      console.warn(`Orphaned transaction: ${result.transactionId}`);
      return { received: true };
    }

    //  Delegate to State Machine
    if (result.action === "SUCCESS") {
      await this.transitionToSuccess(
        payment.id,
        result.transactionId,
        result.rawResponse
      );
    } else if (result.action === "FAIL") {
      await this.transitionToFailed(payment.id, result.rawResponse);
    }

    return { received: true };
  }

  async executePayment(providerName: string, paymentIdOrTrxId: string) {
    const payment = await prisma.payment.findFirst({
      where: {
        OR: [{ id: paymentIdOrTrxId }, { transactionId: paymentIdOrTrxId }],
      },
    });

    if (!payment) throw new AppError(404, "Payment not found");

    // Fast Idempotency Check (Read-only)
    if (payment.status === "SUCCESS") return payment;

    const provider = this.getProvider(providerName);
    const result = await provider.verifyOrExecute(payment, {});

    if (result.success) {
      return this.transitionToSuccess(
        payment.id,
        result.transactionId,
        result.rawResponse
      );
    } else {
      await this.transitionToFailed(payment.id, result.rawResponse);
      throw new AppError(400, "Payment execution failed at provider");
    }
  }
}
