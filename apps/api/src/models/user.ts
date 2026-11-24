import { model, Schema, type HydratedDocument } from 'mongoose';
import { ROLES, type Role } from '@itsadate/shared';

export interface IUser {
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, default: 'user' },
  },
  { timestamps: true },
);

export type UserDoc = HydratedDocument<IUser>;
export const UserModel = model<IUser>('User', userSchema, 'users');
