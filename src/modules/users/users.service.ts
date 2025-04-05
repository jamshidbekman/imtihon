import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  async findUser(email: string, phoneNumber: string) {
    const findUser = await this.userRepository.findOne({
      where: [{ email: email }, { phoneNumber: phoneNumber }],
    });

    return findUser;
  }

  async getUserByEmail(email: string) {
    const user = await this.userRepository.findOne({ where: { email: email } });

    return user;
  }

  async getUserById(id: string) {
    const user = await this.userRepository.findOne({ where: { id: id } });

    return user;
  }

  async createUser(createUserDto: CreateUserDto) {
    const findUser = await this.findUser(
      createUserDto.email,
      createUserDto.phoneNumber,
    );

    if (findUser)
      throw new ConflictException(
        "Siz kiritgan email yoki telefon raqam bilan allaqachon ro'yxatdan o'tilgan",
      );

    const user = this.userRepository.create(createUserDto);
    const createUser = await this.userRepository.save(user);

    return createUser;
  }

  async changeEmailVerificationStatus(email: string) {
    await this.userRepository.update(
      { email: email },
      { isEmailVerified: true },
    );
  }

  async updateUser(user_id: string, data: UpdateUserDto) {
    const findUser = await this.getUserById(user_id);

    if (!findUser) throw new BadRequestException('User topilmadi');

    await this.userRepository.update(String(findUser?.id), {
      ...data,
    });
    const user = await this.userRepository.findOne({
      where: { id: String(user_id) },
      select: ['id', 'fullName', 'phoneNumber', 'email', 'role', 'updatedAt'],
    });

    return user;
  }
}
