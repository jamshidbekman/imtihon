import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/modules/users/entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class TeacherGuard implements CanActivate {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const request = context.switchToHttp().getRequest();
      const token = request.headers['authorization'].split(' ')[1];
      const { user_id } = this.jwtService.verify(token, {
        secret: this.configService.get('JWT_SECRET_KEY'),
      });
      const findUser = await this.userRepository.findOne({
        where: {
          id: user_id,
        },
      });
      if (findUser?.role === 'student') {
        throw new ForbiddenException('ruxsat etilmagan');
      }
      return true;
    } catch (error) {
      return false;
    }
  }
}
