import { Request, Response, NextFunction } from 'express';
import { OrderService } from '../services/OrderService';
import { createOrderSchema } from '../dtos/order.schema';

const orderService = new OrderService();

export const createOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = createOrderSchema.parse(req.body);
    // req.user is guaranteed by authMiddleware
    const order = await orderService.createOrder(req.user!.id, validatedData);
    res.status(201).json(order);
  } catch (err) { next(err); }
};

export const getOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const isAdmin = req.user!.role === 'ADMIN';
    const orders = await orderService.getOrders(req.user!.id, isAdmin);
    res.json(orders);
  } catch (err) { next(err); }
};

export const getOrderById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const isAdmin = req.user!.role === 'ADMIN';
        const order = await orderService.getOrderById(req.params.id, req.user!.id, isAdmin);
        res.json(order);
    } catch(err) { next(err); }
}