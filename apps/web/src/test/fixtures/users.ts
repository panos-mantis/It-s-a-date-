import type { UserDTO } from '@itsadate/shared';

/** Fixture people: Maya is the logged-in user on most screens, Panos the only admin. */
export const userFixtures: UserDTO[] = [
  {
    id: '64c000000000000000000001',
    name: 'Maya Chen',
    email: 'maya.chen@example.com',
    role: 'user',
  },
  { id: '64c000000000000000000002', name: 'Panos', email: 'panos@example.com', role: 'admin' },
  {
    id: '64c000000000000000000003',
    name: 'Jonah Reyes',
    email: 'jonah.reyes@example.com',
    role: 'user',
  },
  {
    id: '64c000000000000000000004',
    name: 'Priya Natarajan',
    email: 'priya.natarajan@example.com',
    role: 'user',
  },
  {
    id: '64c000000000000000000005',
    name: 'Sam Okafor',
    email: 'sam.okafor@example.com',
    role: 'user',
  },
  {
    id: '64c000000000000000000006',
    name: 'Lena Brooks',
    email: 'lena.brooks@example.com',
    role: 'user',
  },
  {
    id: '64c000000000000000000007',
    name: 'Daniel Okoye',
    email: 'daniel.okoye@example.com',
    role: 'user',
  },
  {
    id: '64c000000000000000000008',
    name: 'Maria Fernanda Castellanos-Villalobos y de la Cruz',
    email: 'mariafernanda.castellanos@example.com',
    role: 'user',
  },
];

export const mayaId = userFixtures[0]!.id;
