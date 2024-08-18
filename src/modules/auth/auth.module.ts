import { Module } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { ConfigModule } from "@nestjs/config";
import { spotifyConfig } from "src/config/spotify.config";

@Module({
    imports: [ConfigModule.forFeature(spotifyConfig)],
    controllers : [AuthController],
    providers: [AuthService]
  })
  export class AuthModule {}