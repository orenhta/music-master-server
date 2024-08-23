import { EndRoundPlayerRespnse } from 'src/types/end-round-response.type';
import { GameState, RoundData } from 'src/types/game-state.type';

export const gameStateToEndRoundScore = (
  gameState: GameState,
): EndRoundPlayerRespnse[] => {
  const roundScores = (gameState.roundData as RoundData).scores;
  return Object.values(gameState.gamePlayers).map((player) => ({
    ...player,
    gainedScore:
      roundScores && roundScores[player.userName]
        ? roundScores[player.userName]
        : 0,
  }));
};
