import { UserRole } from 'src/user/user.entity';

export interface JwtUser {
  id: number;
  email: string;
  role: UserRole;
}

export interface JwtUserWithRefreshToken extends JwtUser {
  refreshToken: string;
}
