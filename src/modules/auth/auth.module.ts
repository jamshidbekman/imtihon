import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import SmsLimiterService from './sms.limiter.service';
import { RedisService } from './redis.service';
import { SmsProviderService } from './sms.provider.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [UsersModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    SmsLimiterService,
    RedisService,
    SmsProviderService,
    UsersService,
    JwtService,
  ],
})
export class AuthModule {}
