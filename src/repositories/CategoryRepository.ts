import { Category, Prisma } from "../generated/prisma/client";
import { prisma } from "../lib/prisma";

export class CategoryRepository {
  async create(data: Prisma.CategoryCreateInput): Promise<Category> {
    return prisma.category.create({ data });
  }

  async findAll(): Promise<{ id: string; parentId: string | null }[]> {
    return prisma.category.findMany({
      select: { id: true, parentId: true },
    });
  }

  async findById(id: string): Promise<Category | null> {
    return prisma.category.findUnique({
      where: { id },
      include: { children: true },
    });
  }

  async update(
    id: string,
    data: Prisma.CategoryUpdateInput
  ): Promise<Category> {
    return prisma.category.update({ where: { id }, data });
  }

  async delete(id: string): Promise<Category> {
    return prisma.category.delete({ where: { id } });
  }
}
