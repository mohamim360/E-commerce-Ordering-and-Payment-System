import { registerSchema, loginSchema } from '../dtos/auth.schema';
import { hashPassword, comparePassword, generateToken } from '../utils/authUtils';
import { AppError } from '../middlewares/errorHandler'; 
import { z } from 'zod';
import { UserRepository } from '../repositories/UserRepository';

export class AuthService {
  private userRepo: UserRepository;

  constructor() {
    this.userRepo = new UserRepository();
  }

  async register(data: z.infer<typeof registerSchema>) {
    // Check existence of user
    const existingUser = await this.userRepo.findByEmail(data.email);
    if (existingUser) {
      throw new AppError(409, 'User already exists');
    }

    //  Hash Password
    const hashedPassword = await hashPassword(data.password);

    const { name = '', ...rest } = data;

    //  Persist
    const newUser = await this.userRepo.create({
        ...rest,
        name,
        password: hashedPassword,
    });

    //  Generate Token
    const token = generateToken(newUser);

    const { password, ...userWithoutPassword } = newUser;
    return { user: userWithoutPassword, token };
  }

  async login(data: z.infer<typeof loginSchema>) {
    const user = await this.userRepo.findByEmail(data.email);
    
  
    if (!user || !(await comparePassword(data.password, user.password))) {
      throw new AppError(401, 'Invalid credentials');
    }

    const token = generateToken(user);
    const { password, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
  }
}

export class UserService {
    private userRepo = new UserRepository();
    
    async getAllUsers() {
        return this.userRepo.findAll();
    }
    
    async getUserById(id: string) {
        const user = await this.userRepo.findById(id);
        if(!user) throw new AppError(404, 'User not found');
        const { password, ...cleanUser } = user;
        return cleanUser;
    }
}