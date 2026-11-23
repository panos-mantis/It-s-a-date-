import { z } from 'zod';

const emailSchema = z.string().trim().toLowerCase().pipe(z.email());

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(50),
  email: emailSchema,
  password: z
    .string()
    .min(8)
    .max(72)
    // bcrypt limit is 72 bytes, not characters.
    .refine((p) => new TextEncoder().encode(p).length <= 72, { message: 'Password is too long' }),
});

// Login is deliberately lenient: the legacy backend validated nothing on register, so existing
// accounts may have non-standard emails or long passwords and must keep logging in.
export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().min(1).max(254),
  password: z.string().min(1).max(1024),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
