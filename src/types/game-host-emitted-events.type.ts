import { EmittedEvent } from 'src/enums/emitted-events.enum';
import { EndRoundResponse } from './end-round-response.type';

export type GameHostEmittedEvents = {
  [EmittedEvent.BUZZER_GRANTED]: (arg: { playerName: string }) => void;
  [EmittedEvent.BUZZER_REVOKED]: (arg: {
    answeredBy: string;
    artist?: string;
    title?: string;
  }) => void;
  [EmittedEvent.PLAYER_JOINED]: (arg: { userName: string }) => void;
  [EmittedEvent.ROUND_ENDED]: (arg: EndRoundResponse) => void;
};
