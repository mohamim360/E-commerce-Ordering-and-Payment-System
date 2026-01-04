import { prisma } from '../lib/prisma';
import { CategoryService } from './CategoryService';

export class RecommendationService {
  private categoryService = new CategoryService();

  async getRecommendations(productId: string) {
    // 1. Get the product to find its category
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { categoryId: true, id: true }
    });

    const categoryId = product?.categoryId;

    if (!product || !categoryId) {
      return []; 
    }

    // 2. Get all category IDs in the subtree (DFS)
    // This includes the current category and all sub-categories
    const categoryIds = await this.categoryService.getSubtreeIds(categoryId);

    // 3. Fetch products in these categories (excluding current product)
    // Limit to 10 for recommendations
    const recommendations = await prisma.product.findMany({
      where: {
        categoryId: { in: categoryIds },
        id: { not: product.id },
        status: 'ACTIVE'
      },
      take: 10,
      orderBy: { stock: 'desc' } // Simple heuristic: recommend items in stock
    });

    return recommendations;
  }
}