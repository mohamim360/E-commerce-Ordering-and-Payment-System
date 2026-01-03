import { CategoryRepository } from '../repositories/CategoryRepository';
import redis from '../utils/redis';
import { AppError } from '../middlewares/errorHandler';

const CACHE_KEY = 'category_tree:adjacency';

export class CategoryService {
  private categoryRepo = new CategoryRepository();

  private async getAdjacencyList(): Promise<Record<string, string[]>> {
    // Checking Redis
    const cached = await redis.get(CACHE_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
    const categories = await this.categoryRepo.findAll();

    //  Build Adjacency List
    const adjList: Record<string, string[]> = {};
    categories.forEach((cat) => {
        // Ensure entry exists for every ID
        if (!adjList[cat.id]) adjList[cat.id] = [];
        
        // Add to parent's list
        if (cat.parentId) {
            if (!adjList[cat.parentId]) adjList[cat.parentId] = [];
            adjList[cat.parentId].push(cat.id);
        }
    });

    //  Write to Redis (TTL 1 hour)
    await redis.set(CACHE_KEY, JSON.stringify(adjList), 'EX', 3600);
    
    return adjList;
  }

  // DFS ALGORITHM
   
  async getSubtreeIds(rootId: string): Promise<string[]> {
    const adjList = await this.getAdjacencyList();
    
    // Check if category exists in our map
    if (!adjList[rootId] && !Object.values(adjList).flat().includes(rootId)) {
			throw new AppError(404, `Category with ID '${rootId}' not found`);

    }

    const result: string[] = [];
    const stack: string[] = [rootId];

    // Iterative DFS
    while (stack.length > 0) {
      const current = stack.pop()!;
      result.push(current);

      const children = adjList[current];
      if (children) {
        // Push children to stack
        children.forEach(child => stack.push(child));
      }
    }

    return result;
  }

  // Mutations (Invalidate Cache) 

  async createCategory(data: any) {
    const result = await this.categoryRepo.create(data);
    await redis.del(CACHE_KEY); // Invalidate
    return result;
  }

  async updateCategory(id: string, data: any) {
    const result = await this.categoryRepo.update(id, data);
    await redis.del(CACHE_KEY); // Invalidate
    return result;
  }

  async deleteCategory(id: string) {
    const result = await this.categoryRepo.delete(id);
    await redis.del(CACHE_KEY); // Invalidate
    return result;
  }
}