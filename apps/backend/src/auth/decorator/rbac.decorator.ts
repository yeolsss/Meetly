import { Reflector } from '@nestjs/core';
import { Role } from '../../user/entiy/user.entity';

export const RBAC = Reflector.createDecorator<Role>();
