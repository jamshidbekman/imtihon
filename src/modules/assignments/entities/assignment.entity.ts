import { Course } from 'src/modules/courses/entities/course.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
@Entity({ name: 'assignments' })
export class Assignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column()
  title: string;
  @Column()
  description: string;
  @Column()
  dueDate: Date;
  @Column()
  maxScore: number;
  @ManyToOne(() => Course, (course) => course.id)
  courseId: Course;
  @CreateDateColumn()
  createdAt: Date;
}
