import { ProductRepository } from '../repositories/ProductRepository';
import { createProductSchema, updateProductSchema } from '../dtos/product.schema';
import { AppError } from '../middlewares/errorHandler';
import { z } from 'zod';

export class ProductService {
  private productRepo = new ProductRepository();

  async createProduct(data: z.infer<typeof createProductSchema>) {
    //  Enforce Unique SKU
    const existing = await this.productRepo.findBySku(data.sku);
    if (existing) {
      throw new AppError(409, `Product with SKU ${data.sku} already exists`);
    }

    return this.productRepo.create(data);
  }

  async getProducts(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const { products, total } = await this.productRepo.findAll(skip, limit);

    return {
      data: products,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getProductById(id: string) {
    const product = await this.productRepo.findById(id);
    if (!product) throw new AppError(404, 'Product not found');
    return product;
  }

  async updateProduct(id: string, data: z.infer<typeof updateProductSchema>) {
    const product = await this.productRepo.findById(id);
    if (!product) throw new AppError(404, 'Product not found');

		
    if (data.sku && data.sku !== product.sku) {
      const skuExists = await this.productRepo.findBySku(data.sku);
      if (skuExists) throw new AppError(409, `SKU ${data.sku} is already taken`);
    }

    return this.productRepo.update(id, data);
  }

  async deleteProduct(id: string) {
    const product = await this.productRepo.findById(id);
    if (!product) throw new AppError(404, 'Product not found');
    
    return this.productRepo.delete(id);
  }
}