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
    if (user.role === 'admin' && role !== 'admin' && (await usersRepository.countAdmins()) <= 1) {
      throw conflict("You can't remove the last admin");
    }
    const updated = await usersRepository.setRole(id, role);
    if (!updated) throw notFound('User not found');
    return toUserDTO(updated);
  },
};
