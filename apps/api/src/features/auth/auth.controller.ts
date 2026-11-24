import type { RequestHandler } from 'express';
import type { LoginInput, RegisterInput } from '@itsadate/shared';
import type { Env } from '../../config/env.js';
import { unauthorized } from '../../lib/errors.js';
import { toUserDTO } from '../users/users.mapper.js';
import { usersRepository } from '../users/users.repository.js';
import { authService } from './auth.service.js';
import { clearSessionCookie, setSessionCookie, signSession } from './session.js';

export function authController(env: Env) {
  const register: RequestHandler = async (_req, res) => {
    const user = await authService.register(res.locals.validated.body as RegisterInput);
    setSessionCookie(res, signSession({ userId: user.id as string, role: user.role }, env), env);
    res.status(201).json(toUserDTO(user));
  };

  const login: RequestHandler = async (_req, res) => {
    const user = await authService.login(res.locals.validated.body as LoginInput);
    setSessionCookie(res, signSession({ userId: user.id as string, role: user.role }, env), env);
    res.json(toUserDTO(user));
  };

  const logout: RequestHandler = (_req, res) => {
    clearSessionCookie(res, env);
    res.status(204).end();
  };

  const me: RequestHandler = async (_req, res) => {
    const user = res.locals.auth && (await usersRepository.findById(res.locals.auth.userId));
    if (!user) throw unauthorized();
    res.json(toUserDTO(user));
  };

  return { register, login, logout, me };
}
