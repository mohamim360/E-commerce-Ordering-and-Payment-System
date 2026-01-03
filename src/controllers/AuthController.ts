import { Request, Response, NextFunction } from 'express';
import { registerSchema, loginSchema } from '../dtos/auth.schema';
import { AuthService, UserService } from '../services/AuthServices';

const authService = new AuthService();
const userService = new UserService();

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate Input
    const validatedData = registerSchema.parse(req.body);
    const result = await authService.register(validatedData);
    res.status(201).json(result);
  } catch (error) {
    next(error); // Passes Zod errors or AppErrors to global handler
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    const result = await authService.login(validatedData);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await userService.getUserById(req.user!.id);
        res.status(200).json(user);
    } catch (error) {
        next(error);
    }
};

export const getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const users = await userService.getAllUsers();
        res.status(200).json(users);
    } catch (error) {
        next(error);
    }
}