import { Request, Response, NextFunction } from 'express';
import { ProductService } from '../services/ProductService';
import { createProductSchema, updateProductSchema, paginationSchema } from '../dtos/product.schema';

const productService = new ProductService();

export const createProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = createProductSchema.parse(req.body);
    const product = await productService.createProduct(validatedData);
    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
};

export const getProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = paginationSchema.parse(req.query);
    const result = await productService.getProducts(page, limit);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getProductById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await productService.getProductById(req.params.id);
    res.status(200).json(product);
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = updateProductSchema.parse(req.body);
    const product = await productService.updateProduct(req.params.id, validatedData);
    res.status(200).json(product);
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await productService.deleteProduct(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};