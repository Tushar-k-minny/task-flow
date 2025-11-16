import { z } from 'zod';

export const registerSchema = z.object({
  email: z.email('Please provide a valid email'),
  password: z
    .string()
    .trim()
    .min(6, 'Password must be at least 6 characters long'),
  name: z.string().trim().min(4, 'Name must be at least 4 characters long'),
});

export const loginSchema = z.object({
  email: z.email('Please provide a valid email'),
  password: z.string().trim().min(4, 'Password is too short'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});
