import { MailerService } from '@nestjs-modules/mailer';
import {
  BadRequestException,
  HttpException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { RedisService } from './redis.service';
import SmsLimiterService from './sms.limiter.service';
import { SmsProviderService } from './sms.provider.service';
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private redisService: RedisService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private smsLimiterService: SmsLimiterService,
    private smsProviderService: SmsProviderService,
    private mailService: MailerService,
  ) {}
  async register(createUserDto: CreateUserDto) {
    const findUser = await this.userRepository.findOne({
      where: [
        { email: createUserDto.email },
        {phoneNumber: createUserDto.phoneNumber}
      ],
    });
    if (findUser) throw new BadRequestException('user already exists');
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
    console.log(tempUser)
    console.log(otp)
    console.log(otp)
    console.log(phone_number)
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
    const customer = await this.userRepository.save(user);
    const token = await this.jwtService.signAsync(
      { user_id: customer.id },
      { expiresIn: '2h', secret: this.configService.get('JWT_SECRET_KEY') },
    );
    await this.redisService.delOtp(phone_number);
    await this.redisService.delTempUser(phone_number);
    await this.sendMailVerificationCode(user.email);
    return { token };
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
    await this.userRepository.update(
      { email: user.email },
      { isEmailVerified: true },
    );
    await this.redisService.delKey(tokenKey);
    await this.redisService.delKey(`email-tokens:${user.email}`);
    return {
      message: 'Email manzil tasdiqlandi. Endi tizimga kirishingiz mumkin.',
    };
  }
  async loginUser(email: string, password: string) {
    try {
      const findUser = await this.userRepository.findOne({
        where: { email: email },
      });
      if (!findUser)
        throw new UnauthorizedException("email yoki parol notog'ri");
      const comparePassword = await bcrypt.compare(password, findUser.password);
      if (!comparePassword)
        throw new UnauthorizedException("email yoki parol notog'ri");
      const refreshToken = this.jwtService.sign(
        { user_id: findUser.id },
        {
          expiresIn: '4h',
          secret: this.configService.get('JWT_SECRET_KEY'),
        },
      );
      const accessToken = this.jwtService.sign(
        { user_id: findUser.id },
        {
          expiresIn: '30m',
          secret: this.configService.get('JWT_SECRET_KEY'),
        },
      );
      const user = await this.userRepository.findOne({
        where: { email },
        select: [
          'id',
          'fullName',
          'phoneNumber',
          'email',
          'role',
          'isEmailVerified',
          'isPhoneVerified',
        ],
      });
      return {
        data: {
          accessToken,
          refreshToken,
          user: user,
        },
      };
    } catch (error) {
      throw new UnauthorizedException(error.message);
    }
  }
  async getProfile(user_id: number) {
    const findUser = await this.userRepository.findOne({
      where: {
        id: String(user_id),
      },
      select: [
        'id',
        'fullName',
        'email',
        'phoneNumber',
        'role',
        'createdAt',
        'updatedAt',
      ],
    });
    return { message: 'profil malumotingiz', data: findUser };
  }
  async updateProfile(body: UpdateUserDto, user_id: number) {
    const findUser = await this.userRepository.findOne({
      where: {
        id: String(user_id),
      },
    });
    const updateUser = await this.userRepository.update(String(findUser?.id), {
      ...body,
    });
    const user = await this.userRepository.findOne({
      where: { id: String(user_id) },
      select: ['id', 'fullName', 'phoneNumber', 'email', 'role', 'updatedAt'],
    });
    return {
      message: "Profil ma'lumotlari muvaffaqiyatli yangilandi",
      data: user,
    };
  }
}
