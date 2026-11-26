import type { UserDTO } from '@itsadate/shared';

/** Fixture people: Maya is the logged-in user on most screens, Panos the only admin. */
export const userFixtures: UserDTO[] = [
  { id: 'u-maya', name: 'Maya Chen', email: 'maya.chen@example.com', role: 'user' },
  { id: 'u-panos', name: 'Panos', email: 'panos@example.com', role: 'admin' },
  { id: 'u-jonah', name: 'Jonah Reyes', email: 'jonah.reyes@example.com', role: 'user' },
  { id: 'u-priya', name: 'Priya Natarajan', email: 'priya.natarajan@example.com', role: 'user' },
  { id: 'u-sam', name: 'Sam Okafor', email: 'sam.okafor@example.com', role: 'user' },
  { id: 'u-lena', name: 'Lena Brooks', email: 'lena.brooks@example.com', role: 'user' },
  { id: 'u-daniel', name: 'Daniel Okoye', email: 'daniel.okoye@example.com', role: 'user' },
  {
    id: 'u-maria',
    name: 'Maria Fernanda Castellanos-Villalobos y de la Cruz',
    email: 'mariafernanda.castellanos@example.com',
    role: 'user',
  },
];

export const mayaId = 'u-maya';
