import { Module } from '@nestjs/common';
import { GameClientModule } from './modules/game-client/game-client.module';
import { GameManagerModule } from './modules/game-manager/game-manager.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule.forRoot(), GameClientModule, GameManagerModule],
})
export class AppModule {}
