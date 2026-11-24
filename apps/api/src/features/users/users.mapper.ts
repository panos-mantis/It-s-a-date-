import type { UserDTO } from '@itsadate/shared';
import type { UserDoc } from '../../models/user.js';

export function toUserDTO(doc: UserDoc): UserDTO {
  return { id: doc.id as string, name: doc.name, email: doc.email, role: doc.role };
}
