import { SetMetadata } from '@nestjs/common';
import { UserRole } from 'src/user/user.entity';

// 設定 metadata 讓 RolesGuard 可以使用 Reflector 讀取到
export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);
