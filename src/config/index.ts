import dotenv from 'dotenv';

dotenv.config();

export const config = {
  PORT: Number(process.env.PORT) || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL as string,
	JWT_SECRET: process.env.JWT_SECRET as string,
	JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN as string,
	SALT_ROUNDS: Number(process.env.SALT_ROUNDS) || 12,
};
