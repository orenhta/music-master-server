import { IsBoolean, IsNotEmpty } from "class-validator";

export class CreateGameRequestDto {
    @IsBoolean()
    isTimeBasedScore: boolean;

    @IsBoolean()
    isPunishmentScoreAllowed: boolean;

    @IsBoolean()
    isBuzzerTwiceAllowed: boolean;
}