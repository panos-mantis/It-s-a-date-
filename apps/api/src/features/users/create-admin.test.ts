import { describe, expect, it } from 'vitest';
import { UserModel } from '../../models/user.js';
import { useTestDb } from '../../test/db.js';
import { createAdmin, passwordIssues } from './create-admin.js';

useTestDb();

describe('createAdmin', () => {
  it('creates a new admin with a normalised email, then reports unchanged', async () => {
    const created = await createAdmin({
      email: ' Owner@X.com ',
      name: 'Owner',
      password: 'long-enough-pw',
    });
    expect(created.action).toBe('created');
    expect(created.user.email).toBe('owner@x.com');
    expect(created.user.role).toBe('admin');
    expect((await createAdmin({ email: 'owner@x.com', name: 'Owner' })).action).toBe('unchanged');
  });

  it('promotes an existing user without touching the password', async () => {
    await UserModel.create({ name: 'Ana', email: 'ana@x.com', passwordHash: 'h' });
    expect((await createAdmin({ email: 'ANA@x.com', name: 'Ana' })).action).toBe('promoted');
    const ana = await UserModel.findOne({ email: 'ana@x.com' }).select('+passwordHash');
    expect(ana?.passwordHash).toBe('h');
    expect(ana?.role).toBe('admin');
  });

  it('rejects a new user without a valid password', async () => {
    await expect(createAdmin({ email: 'new@x.com', name: 'New' })).rejects.toThrow();
    await expect(
      createAdmin({ email: 'new@x.com', name: 'New', password: 'short' }),
    ).rejects.toThrow();
    expect(await UserModel.countDocuments({})).toBe(0);
  });
});

describe('passwordIssues', () => {
  it('explains a rejected password and accepts a good one', () => {
    expect(passwordIssues('short').length).toBeGreaterThan(0);
    expect(passwordIssues('long-enough-pw')).toEqual([]);
  });
});
