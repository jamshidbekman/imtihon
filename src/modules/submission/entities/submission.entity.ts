import { Assignment } from 'src/modules/assignments/entities/assignment.entity';
import { User } from 'src/modules/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'submissions' })
export class Submission {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column({ nullable: true })
  description: string;
  @Column()
  fileUrl: string;
  @Column({ default: 'CHECKING' })
  status: string;
  @Column({ nullable: true })
  score: number;
  @ManyToOne(() => Assignment, (assignment) => assignment.id)
  assignmentId: Assignment;
  @ManyToOne(() => User, (user) => user.id)
  studentId: User;
  @CreateDateColumn()
  createdAt: Date;
}
