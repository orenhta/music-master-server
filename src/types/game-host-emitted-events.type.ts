import { EmittedEvent } from 'src/enums/emitted-events.enum';
import { EndRoundResponse } from './end-round-response.type';
import { Player } from './player.type';
import { AnswerReport } from './answer-report.type';

export type GameHostEmittedEvents = {
  [EmittedEvent.BUZZER_GRANTED]: (arg: { playerName: string }) => void;
  [EmittedEvent.BUZZER_REVOKED]: (arg: AnswerReport) => void;
  [EmittedEvent.PLAYER_JOINED]: (arg: { userName: string }) => void;
  [EmittedEvent.ROUND_ENDED]: (arg: EndRoundResponse) => void;
  [EmittedEvent.PLAYER_DISCONNECTED]: (arg: Player) => void;
};
