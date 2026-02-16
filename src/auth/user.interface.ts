import { Role } from './role.enum';

export interface User {
  id: number;
  email: string;
  password: string;
  role: Role;
}
