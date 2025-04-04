import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import AuthGuard from 'src/common/guards/auth.guard';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { TeacherGuard } from 'src/common/guards/teacher.guard';
export interface IRequest extends Request {
  userId: number;
}

@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Post('create')
  @UseGuards(TeacherGuard, AuthGuard)
  async create(@Body() createCourseDto: CreateCourseDto) {
    return await this.coursesService.create(createCourseDto);
  }

  @Get()
  @UseGuards(AuthGuard)
  async findAll(
    @Query() query: { page?: number; limit?: number; search?: string },
  ) {
    return await this.coursesService.findAll(query);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Headers('authorization') body: string,
  ) {
    const token = body.split(' ')[1];
    return await this.coursesService.findOne(id, token);
  }
}
