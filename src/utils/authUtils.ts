import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import { User } from "../generated/prisma/client";
import { config } from "../config";

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, config.SALT_ROUNDS);
};

export const comparePassword = async (
  plain: string,
  hashed: string
): Promise<boolean> => {
  return bcrypt.compare(plain, hashed);
};

export const generateToken = (user: User): string => {
  return jwt.sign(
    { id: user.id, role: user.role },
    config.JWT_SECRET as string,
    { expiresIn: config.JWT_EXPIRES_IN as SignOptions["expiresIn"] }
  );
};

export const verifyToken = (token: string): any => {
  return jwt.verify(token, config.JWT_SECRET as string)
};
