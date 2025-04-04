import { IsDate, IsNotEmpty, IsNumber, IsString } from 'class-validator';
export class CreateAssignmentDto {
  @IsString()
  @IsNotEmpty()
  title: string;
  @IsString()
  @IsNotEmpty()
  description: string;
  @IsDate()
  @IsNotEmpty()
  dueDate: Date;
  @IsNumber()
  @IsNotEmpty()
  maxScore: number;
}
