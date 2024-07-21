import { EmittedEvents } from 'src/enums/emitted-events.enum';
import { EndRoundResponse } from './end-round-response.type';

export type GameHostEmittedEvents = {
  [EmittedEvents.BUZZER_GRANTED]: (arg: { playerName: string }) => void;
  [EmittedEvents.BUZZER_REVOKED]: (arg: {
    answeredBy: string;
    artist?: string;
    title?: string;
  }) => void;
  [EmittedEvents.PLAYER_JOINED]: (arg: { userName: string }) => void;
  [EmittedEvents.ROUND_ENDED]: (arg: EndRoundResponse) => void;
};
