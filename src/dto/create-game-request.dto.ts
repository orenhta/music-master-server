import { IsBoolean, IsNotEmpty } from "class-validator";

export class CreateGameRequestDto {
    @IsNotEmpty()
    @IsBoolean()
    isTimeBasedScore: boolean;

    @IsNotEmpty()
    @IsBoolean()
    isPunishmentScoreAllowed: boolean;

    @IsNotEmpty()
    @IsBoolean()
    allowBuzzerTwice: boolean;
}