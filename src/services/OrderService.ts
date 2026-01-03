import { AppError } from '../middlewares/errorHandler';
import { createOrderSchema } from '../dtos/order.schema';
import { z } from 'zod';
import { prisma } from '../lib/prisma';


export class OrderService {
  
  //  Create Pending Order (Deterministic Totals)
  async createOrder(userId: string, data: z.infer<typeof createOrderSchema>) {
    
    // Fetch all products involved to get REAL prices (Security)
    const productIds = data.items.map(i => i.productId);
    const products = await prisma.product.findMany({
      where: { 
        id: { in: productIds },
        status: 'ACTIVE' 
      }
    });

    if (products.length !== productIds.length) {
      throw new AppError(400, 'One or more products are invalid or inactive');
    }

    // Map for O(1) access
    const productMap = new Map(products.map(p => [p.id, p]));

    let totalAmount = 0;
    const orderItemsData: { productId: string; quantity: number; price: any }[] = [];

    // deterministic calculation loop
    for (const item of data.items) {
      const product = productMap.get(item.productId)!;
      
      // Calculate item subtotal using server-side price
      // Note: In JS, consider using a library like 'decimal.js' for high precision math.
      // For this example, we treat number carefully or rely on Prisma Decimal casting.
      const price = Number(product.price); 
      const subtotal = price * item.quantity;
      
      totalAmount += subtotal;

      orderItemsData.push({
        productId: item.productId,
        quantity: item.quantity,
        price: product.price // Store snapshot
      });
    }

    // Single Transaction: Create Order + Items
    const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const subtotal = totalAmount;
    const order = await prisma.$transaction(async (tx) => {
      return tx.order.create({
        data: {
          userId,
          orderNumber,
          subtotal,
          totalAmount: totalAmount, 
          status: 'PENDING',
          items: {
            createMany: { 
              data: orderItemsData.map(item => ({
                productId: item.productId,
                quantity: item.quantity,
                price: item.price,
                subtotal: Number(item.price) * item.quantity,
                productName: productMap.get(item.productId)?.name || '',
                productSku: productMap.get(item.productId)?.sku || ''
              }))
            }
          }
        },
        include: { items: true }
      });
    });

    return order;
  }

  // 2. Safe Stock Reduction (To be called after Payment Webhook)
  async finalizePayment(orderId: string) {
    return prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true }
      });

      if (!order || order.status !== 'PENDING') {
        throw new AppError(400, 'Order invalid or already processed');
      }

      // Decrement Stock
      for (const item of order.items) {
        // ATOMIC UPDATE:
        // We update ONLY IF stock >= quantity.
        // This acts as a Row Lock preventing oversell/race conditions.
        const updated = await tx.product.updateMany({
          where: { 
            id: item.productId,
            stock: { gte: item.quantity } // Guard clause
          },
          data: { 
            stock: { decrement: item.quantity } 
          }
        });

        if (updated.count === 0) {
          throw new AppError(409, `Product ${item.productId} is out of stock`);
          // Transaction automatically rolls back here
        }
      }

      // Update Order Status
      return tx.order.update({
        where: { id: orderId },
        data: { status: 'PAID' }
      });
    });
  }

  async getOrders(userId: string | null, isAdmin: boolean) {
    const where = isAdmin ? {} : { userId: userId! };
    return prisma.order.findMany({
        where,
        include: { items: true },
        orderBy: { createdAt: 'desc' }
    });
  }

  async getOrderById(orderId: string, userId: string, isAdmin: boolean) {
      const order = await prisma.order.findUnique({
          where: { id: orderId },
          include: { items: true }
      });
      
      if (!order) throw new AppError(404, 'Order not found');
      
      // Ownership check
      if (!isAdmin && order.userId !== userId) {
          throw new AppError(403, 'Forbidden');
      }
      return order;
  }
}