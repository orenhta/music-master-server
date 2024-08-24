import { GameStatus } from 'src/enums/game-status.enum';
import { EndRoundPlayerResponse } from 'src/types/end-round-response.type';
import { GameState } from 'src/types/game-state.type';

export const gameStateToEndRoundScore = (
  gameState: GameState<GameStatus.ROUND_IN_PROGRESS>,
): EndRoundPlayerResponse[] => {
  return Object.values(gameState.gamePlayers).map((player) => ({
    ...player,
    gainedScore: gameState.roundData.scores[player.userName] ?? 0,
  }));
};
