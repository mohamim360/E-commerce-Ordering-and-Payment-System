import { Prisma, Product } from "../generated/prisma/client";
import { prisma } from "../lib/prisma";


export class ProductRepository {
  async create(data: Prisma.ProductCreateInput): Promise<Product> {
    return prisma.product.create({ data });
  }

  async findById(id: string): Promise<Product | null> {
    return prisma.product.findUnique({ where: { id } });
  }

  async findBySku(sku: string): Promise<Product | null> {
    return prisma.product.findUnique({ where: { sku } });
  }

  // Return data + total count for pagination 
  async findAll(skip: number, take: number) {
    const [products, total] = await prisma.$transaction([
      prisma.product.findMany({
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count(),
    ]);
    return { products, total };
  }

  async update(id: string, data: Prisma.ProductUpdateInput): Promise<Product> {
    return prisma.product.update({ where: { id }, data });
  }

  async delete(id: string): Promise<Product> {
    return prisma.product.delete({ where: { id } });
  }
}