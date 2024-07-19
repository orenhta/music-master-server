import { IsNotEmpty, IsString } from 'class-validator';

export class GameRelatedRequestDto {
  @IsString()
  @IsNotEmpty()
  gameId: string;
}
