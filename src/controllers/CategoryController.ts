import { Request, Response, NextFunction } from 'express';
import { CategoryService } from '../services/CategoryService';
import { RecommendationService } from '../services/RecommendationService';

const categoryService = new CategoryService();
const recommendationService = new RecommendationService();

// Categories

export const createCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const category = await categoryService.createCategory(req.body);
    res.status(201).json(category);
  } catch (err) { next(err); }
};

export const getSubtree = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Debug endpoint to see DFS results
        const ids = await categoryService.getSubtreeIds(req.params.id);
        res.json(ids);
    } catch (err) { next(err); }
}

// Recommendations

export const getProductRecommendations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params; // Product id
    const recommendations = await recommendationService.getRecommendations(id);
    res.json(recommendations);
  } catch (err) { next(err); }
};