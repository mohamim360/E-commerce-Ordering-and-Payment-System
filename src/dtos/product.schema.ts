import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(3),
  description: z.string().optional(),
  sku: z.string().min(3),
  price: z.number().min(0, "Price must be >= 0"),
  stock: z.number().int().min(0, "Stock must be >= 0"),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  categoryId: z.string().uuid().optional()

});

export const updateProductSchema = createProductSchema.partial();

export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
});