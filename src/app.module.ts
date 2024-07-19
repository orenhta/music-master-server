import { Module } from '@nestjs/common';
import { GameClientModule } from './modules/game-client/game-client.module';
import { GameManagerModule } from './modules/game-manager/game-manager.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    GameClientModule,
    GameManagerModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
    }),
  ],
})
export class AppModule {}
