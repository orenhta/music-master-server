import { applyDecorators, SetMetadata } from '@nestjs/common';
import { GameStatus } from 'src/enums/game-status.enum';

export function AllowedGameStatus(...gameStauses: GameStatus[]) {
  return applyDecorators(SetMetadata('AllowedGameStatuses', gameStauses));
}
