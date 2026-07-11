import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserDto } from '../../users/dto/create-user.dto';
import { LoginDto } from '../dto/login.dto';
import { comparePass } from '../../../common/utils/hashpass';
import { UserService } from '../../users/service/users.service';
import { SessionService } from './session.service';
@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly sessionService: SessionService,
  ) {}

  async register(dto: CreateUserDto) {
    const existingUser = await this.userService.findByEmail(dto.email);

    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    return this.userService.create(dto);
  }

  async login(dto: LoginDto) {
    const user = await this.userService.findByEmail(dto.email);

    if (!user) {
      throw new UnauthorizedException(
        'Invalid email or password',
      );
    }

    const passwordValid = await comparePass(
      dto.password,
      user.passwordHash,
    );

    if (!passwordValid) {
      throw new UnauthorizedException(
        'Invalid email or password',
      );
    }

    const session = await this.sessionService.create(user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      session,
    };
  }
}