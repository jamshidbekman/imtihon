import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsUUID,
} from 'class-validator';

enum Status {
  'SUBMITTED',
  'CHECKING',
  'RETURNED',
}
export class CreateSubmissionDto {
  @IsString()
  description: string;
  @IsString()
  @IsNotEmpty()
  fileUrl: string;
  @IsEnum(Status)
  status: string;
  @IsNumber()
  score: number;
  @IsUUID()
  assignmentId: string;
  @IsUUID()
  studentId: string;
}
