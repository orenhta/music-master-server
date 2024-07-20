import { IsNotEmpty, IsString } from 'class-validator';

export class AnswerRequestDto {
  @IsString()
  @IsNotEmpty()
  answer: string;
}
