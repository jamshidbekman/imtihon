import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  Res,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { Response } from 'express';
import { LoginUserDto } from './dto/login-user.dto';
import AuthGuard from 'src/common/guards/auth.guard';
import { UpdateUserDto } from '../users/dto/update-user.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    await this.authService.register(createUserDto);
    return {
      message:
        "Ro'yxatdan o'tish muvaffaqiyatli amalga oshirildi. Iltimos, telefoningizga yuborilgan kodni tasdiqlang.",
    };
  }

  @Post('verify-sms')
  @HttpCode(200)
  async verifySms(
    @Body() body: { phone_number: string; code: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken } = await this.authService.verifyCode(
      body.phone_number,
      body.code,
    );
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: true,
      maxAge: 2 * 60 * 60 * 1000,
    });
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: true,
      maxAge: 3 * 24 * 60 * 60 * 1000,
    });
    return {
      message:
        'Telefon raqam tasdiqlandi. Endi email manzilingizni tasdiqlashingiz kerak.',
    };
  }

  @Get('verify/email')
  async verifyEmail(@Query('token') token: string) {
    return await this.authService.verifyEmail(token);
  }

  @Post('login')
  @HttpCode(200)
  async loginUser(
    @Body() loginUserDto: LoginUserDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken, user, message } =
      await this.authService.loginUser(
        loginUserDto.email,
        loginUserDto.password,
      );
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: true,
      maxAge: 2 * 60 * 60 * 1000,
    });
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: true,
      maxAge: 3 * 24 * 60 * 60 * 1000,
    });
    return { user, message };
  }

  @Get('profile')
  @UseGuards(AuthGuard)
  async getProfile(@Req() req: any) {
    const user_id = req.userId;
    const data = await this.authService.getProfile(user_id);
    return data;
  }

  @Patch('profile')
  @UseGuards(AuthGuard)
  async updateProfile(@Body() updateUserDto: UpdateUserDto, @Req() req: any) {
    const user_id = req.userId;
    const data = await this.authService.updateProfile(updateUserDto, user_id);
    return data;
  }
}
