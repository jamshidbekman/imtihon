import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { RedisService } from './redis.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import SmsLimiterService from './sms.limiter.service';
import { SmsProviderService } from './sms.provider.service';
import { MailerService } from '@nestjs-modules/mailer';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { UpdateUserDto } from '../users/dto/update-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private redisService: RedisService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private smsLimiterService: SmsLimiterService,
    private smsProviderService: SmsProviderService,
    private mailService: MailerService,
    private readonly usersService: UsersService,
  ) {}

  async register(createUserDto: CreateUserDto) {
    const findUser = await this.usersService.findUser(
      createUserDto.email,
      createUserDto.phoneNumber,
    );
    if (findUser)
      throw new ConflictException(
        "Siz kiritgan email yoki telefon raqam bilan allaqachon ro'yxatdan o'tilgan",
      );
    const hashedPassword = await bcrypt.hash(createUserDto.password, 12);
    const otpPassword = this.redisService.generateOtpPassword();
    await this.smsLimiterService.sendSmsLimitChecking(
      createUserDto.phoneNumber,
    );
    await this.smsProviderService.login();
    const response = await this.smsProviderService.sendSms({
      phone_number: createUserDto.phoneNumber,
      otp: otpPassword,
    });
    if (response == 'waiting') {
      await this.redisService.setOtp(
        createUserDto.phoneNumber,
        otpPassword,
        65,
      );
      await this.smsLimiterService.trackSmsRequest(createUserDto.phoneNumber);
      await this.redisService.setTempUser({
        role: createUserDto?.role,
        email: createUserDto.email,
        fullName: createUserDto.fullName,
        phoneNumber: createUserDto.phoneNumber,
        password: hashedPassword,
      });
    }
  }
  
  async verifyCode(phone_number: string, code: string) {
    const tempUser = await this.redisService.getOtp(
      `temp_user:${phone_number}`,
    );
    const otp = await this.redisService.getOtp(`user:${phone_number}`);
    if (!tempUser || !otp) {
      throw new UnauthorizedException('invalid code');
    }
    if (code !== otp) {
      this.redisService.setIncrementKey(phone_number);
      const attemptCode = await this.redisService.getOtp(
        `attempts_user:${phone_number}`,
      );
      if (+(attemptCode as string) > 5) {
        throw new UnauthorizedException('to many attempts');
      }
      throw new UnauthorizedException('invalid code');
    }
    const user = JSON.parse(tempUser);
    const createUser = await this.usersService.createUser(user);
    const refreshToken = this.jwtService.sign(
      { user_id: createUser.id },
      {
        expiresIn: '3d',
        secret: this.configService.get('JWT_SECRET_KEY'),
      },
    );
    const accessToken = this.jwtService.sign(
      { user_id: createUser.id },
      {
        expiresIn: '2h',
        secret: this.configService.get('JWT_SECRET_KEY'),
      },
    );
    await this.redisService.delOtp(phone_number);
    await this.redisService.delTempUser(phone_number);
    await this.sendMailVerificationCode(user.email);
    return { accessToken, refreshToken };
  }

  async sendMailVerificationCode(email: string) {
    const link = await this.redisService.sendEmailVerificationCode(email);
    await this.mailService.sendMail({
      to: `${email}`,
      subject: `How to Send Emails with Nodemailer`,
      text: `Bu yerga bosib emailingizni tasdiqlang!
        ${link}`,
    });
  }

  async verifyEmail(token: string) {
    const tokenKey = `verification-email:${token}`;
    const email = await this.redisService.getKey(tokenKey);
    if (!email) throw new HttpException('email verification link expired', 410);
    const user = JSON.parse(email as string);
    await this.usersService.changeEmailVerificationStatus(user.email);
    await this.redisService.delKey(tokenKey);
    await this.redisService.delKey(`email-tokens:${user.email}`);
    return {
      message: 'Email manzil tasdiqlandi. Endi tizimga kirishingiz mumkin.',
    };
  }

  async loginUser(email: string, password: string) {
    try {
      const findUser = await this.usersService.getUserByEmail(email);
      if (!findUser)
        throw new UnauthorizedException("email yoki parol notog'ri");
      const comparePassword = await bcrypt.compare(password, findUser.password);
      if (!comparePassword)
        throw new UnauthorizedException("email yoki parol notog'ri");
      const refreshToken = this.jwtService.sign(
        { user_id: findUser.id },
        {
          expiresIn: '3d',
          secret: this.configService.get('JWT_SECRET_KEY'),
        },
      );
      const accessToken = this.jwtService.sign(
        { user_id: findUser.id },
        {
          expiresIn: '2h',
          secret: this.configService.get('JWT_SECRET_KEY'),
        },
      );
      const user = await this.usersService.getUserByEmail(email);
      return {
        accessToken,
        refreshToken,
        user: user,
        message: 'Tizimga kirdingiz',
      };
    } catch (error) {
      throw new UnauthorizedException(error.message);
    }
  }

  async getProfile(user_id: string) {
    const findUser = await this.usersService.getUserById(user_id);
    return { message: 'Sizning profil malumotlaringiz', data: findUser };
  }

  async updateProfile(body: UpdateUserDto, user_id: string) {
    const updateUser = await this.usersService.updateUser(user_id, body);
    return {
      message: "Profil ma'lumotlari muvaffaqiyatli yangilandi",
      data: updateUser,
    };
  }
}
