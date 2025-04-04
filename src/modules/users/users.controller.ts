import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { throwError } from 'rxjs';
import { IRequest } from '../courses/courses.controller';
import AuthGuard from 'src/common/guards/auth.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    await this.usersService.register(createUserDto);
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
    const { token } = await this.usersService.verifyCode(
      body.phone_number,
      body.code,
    );
    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
    });
    return {
      message:
        'Telefon raqam tasdiqlandi. Endi email manzilingizni tasdiqlashingiz kerak.',
    };
  }
  @Get('verify/email')
  async verifyEmail(@Query('token') token: string) {
    return await this.usersService.verifyEmail(token);
  }

  @Post('login')
  @HttpCode(200)
  async loginUser(@Body() loginUserDto: LoginUserDto) {
    const { data } = await this.usersService.loginUser(
      loginUserDto.email,
      loginUserDto.password,
    );
    return { data };
  }
  @Get('profile')
  @UseGuards(AuthGuard)
  async getProfile(@Req() req: IRequest) {
    const user_id = req.userId;
    const data = await this.usersService.getProfile(user_id);
    return data;
  }
  @Patch('profile')
  @UseGuards(AuthGuard)
  async updateProfile(
    @Body() updateUserDto: UpdateUserDto,
    @Req() req: IRequest,
  ) {
    const user_id = req.userId;
    const data = await this.usersService.updateProfile(updateUserDto, user_id);
    return data;
  }
}
