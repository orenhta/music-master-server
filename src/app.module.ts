import { Module, ValidationPipe } from '@nestjs/common';
import { GameClientModule } from './modules/game-client/game-client.module';
import { GameManagerModule } from './modules/game-manager/game-manager.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { APP_PIPE } from '@nestjs/core';

@Module({
  imports: [
    GameClientModule,
    GameManagerModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
    }),
  ],
  providers: [
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        transform: true,
        transformOptions: {
          excludeExtraneousValues: true,
        },
      }),
    },
  ],
})
export class AppModule {}
