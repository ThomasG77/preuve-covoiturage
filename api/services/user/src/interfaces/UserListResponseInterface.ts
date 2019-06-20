import { PaginationInterface } from './PaginationInterface';
import { User } from '../entities/User';

export interface UserListResponseInterface {
  data: User[];
  metadata: { pagination: PaginationInterface };
}