import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { RedisService } from './redis.service';
import SmsLimiterService from './sms.limiter.service';
import { SmsProviderService } from './sms.provider.service';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  providers: [
    UsersService,
    RedisService,
    SmsLimiterService,
    SmsProviderService,
    ConfigService,
    JwtService,
  ],
})
export class UsersModule {}
