import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column({ unique: true })
  fullName: string;
  @Column({ unique: true })
  email: string;
  @Column()
  password: string;
  @Column({ unique: true })
  phoneNumber: string;
  @Column({ enum: ['student', 'teacher'], nullable: true, default: 'student' })
  role: string;
  @Column({ default: false, nullable: true })
  isEmailVerified: boolean;
  @Column({ default: false, nullable: true })
  isPhoneVerified: boolean;
  @CreateDateColumn()
  createdAt: Date;
  @UpdateDateColumn()
  updatedAt: Date;
}
