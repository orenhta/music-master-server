import { IsNotEmpty, IsString } from 'class-validator';
import { GameRelatedRequestDto } from './game-related-request.dto';

export class JoinGameRequestDto extends GameRelatedRequestDto {
  @IsString()
  @IsNotEmpty()
  playerName: string;
}
