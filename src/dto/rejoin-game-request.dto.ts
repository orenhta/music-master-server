import { IsNotEmpty, IsString } from 'class-validator';
import { GameRelatedRequestDto } from './game-related-request.dto';

export class RejoinGameRequestDto extends GameRelatedRequestDto {
  @IsString()
  @IsNotEmpty()
  gameSecret: string;
}
