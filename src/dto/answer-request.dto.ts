import { IsNotEmpty, IsString } from 'class-validator';
import { GameRelatedRequestDto } from './game-related-request.dto';

export class AnswerRequestDto extends GameRelatedRequestDto {
  @IsString()
  @IsNotEmpty()
  answer: string;
}
