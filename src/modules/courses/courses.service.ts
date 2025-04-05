import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { CreateCourseDto } from './dto/create-course.dto';
import { Course } from './entities/course.entity';
import { log } from 'util';

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}
  async create(createCourseDto: CreateCourseDto) {
    const findCourses = await this.courseRepository.findOne({
      where: { title: createCourseDto.title },
    });
    if (findCourses) throw new BadRequestException('kurs allaqachon mavjud');
    const newCourse = this.courseRepository.create(createCourseDto);
    const createCourse = await this.courseRepository.save(newCourse);
    return { message: 'Kurs muvaffaqiyatli yaratildi', data: createCourse };
  }

  async findAll(query: { page?: number; limit?: number; search?: string }) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const search = query.search || '';
    const courses = await this.courseRepository.findAndCount({
      where: search
        ? [
            { title: ILike(`%${search}%`) },
            { description: ILike(`%${search}%`) },
          ]
        : {},
      take: limit,
      skip: (page - 1) * limit,
      order: { createdAt: 'DESC' },
    });

    return {
      message: 'Kurslar royxati',
      data: {
        courses,
      },
    };
  }
  async findOne(id: string) {
    const course = await this.courseRepository.findOne({
      where: { id: id },
    });

    if (!course) {
      throw new NotFoundException(`Bu id boyicha kurs topilmadi`);
    }

    return { data: course };
  }
}
