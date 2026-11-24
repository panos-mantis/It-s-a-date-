import type { AdminUserQuery, Paginated, Role, UserDTO } from '@itsadate/shared';
import { conflict, notFound } from '../../lib/errors.js';
import { toUserDTO } from '../users/users.mapper.js';
import { usersRepository } from '../users/users.repository.js';

export const adminUsersService = {
  async list(query: AdminUserQuery): Promise<Paginated<UserDTO>> {
    const { items, total } = await usersRepository.list(query);
    return { items: items.map(toUserDTO), page: query.page, pageSize: query.pageSize, total };
  },

  async setRole(id: string, role: Role): Promise<UserDTO> {
    const user = await usersRepository.findById(id);
    if (!user) throw notFound('User not found');
    const updated = await usersRepository.setRole(id, role);
    if (!updated) throw notFound('User not found');
    // Demote first, then recount: a check-then-act would let two admins demote each other
    // at once. If no admin is left, restore this user. Under a race both requests may be
    // refused and both admins stay, which is the safe failure.
    if (user.role === 'admin' && role !== 'admin' && (await usersRepository.countAdmins()) === 0) {
      await usersRepository.setRole(id, 'admin');
      throw conflict("You can't remove the last admin");
    }
    return toUserDTO(updated);
  },
};
