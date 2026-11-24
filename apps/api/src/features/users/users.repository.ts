import type { Role } from '@itsadate/shared';
import { UserModel, type UserDoc } from '../../models/user.js';

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const usersRepository = {
  findById(id: string): Promise<UserDoc | null> {
    return UserModel.findById(id).exec();
  },

  findByEmail(email: string, opts: { withPassword?: boolean } = {}): Promise<UserDoc | null> {
    const query = UserModel.findOne({ email: email.trim().toLowerCase() });
    if (opts.withPassword) query.select('+passwordHash');
    return query.exec();
  },

  create(input: {
    name: string;
    email: string;
    passwordHash: string;
    role?: Role;
  }): Promise<UserDoc> {
    return UserModel.create(input);
  },

  setRole(id: string, role: Role): Promise<UserDoc | null> {
    return UserModel.findByIdAndUpdate(id, { role }, { new: true }).exec();
  },

  countAdmins(): Promise<number> {
    return UserModel.countDocuments({ role: 'admin' }).exec();
  },

  async list(opts: {
    q?: string;
    page: number;
    pageSize: number;
  }): Promise<{ items: UserDoc[]; total: number }> {
    const q = opts.q?.trim();
    const filter = q
      ? {
          $or: [
            { name: { $regex: escapeRegex(q), $options: 'i' } },
            { email: { $regex: escapeRegex(q), $options: 'i' } },
          ],
        }
      : {};
    const [items, total] = await Promise.all([
      UserModel.find(filter)
        .sort({ createdAt: -1, _id: -1 })
        .skip((opts.page - 1) * opts.pageSize)
        .limit(opts.pageSize)
        .exec(),
      UserModel.countDocuments(filter).exec(),
    ]);
    return { items, total };
  },
};
