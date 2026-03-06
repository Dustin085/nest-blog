import { User } from 'src/user/user.entity';

export type SafeUser = Omit<User, 'password'>;
