import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserModule } from './user/user.module';
import * as Joi from 'joi';
import { TypeOrmModule } from '@nestjs/typeorm';
import { envVariableKeys } from './common/constants/env.constant';
import { User } from './user/entiy/user.entity';
import { CacheModule } from '@nestjs/cache-manager';
import { ScheduleModule } from '@nestjs/schedule';
import { WinstonModule } from 'nest-winston';
import { AuthModule } from './auth/auth.module';
import * as winston from 'winston';
import { BearerTokenMiddleware } from './auth/middleware/bearer-token.middleware';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './auth/guard/auth.guard';
import { RBACGuard } from './auth/guard/rbac.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        ENV: Joi.string().required(),
        DB_TYPE: Joi.string().valid('postgres').required(),
        DB_HOST: Joi.string().required(),
        DB_PORT: Joi.number().required(),
        DB_USERNAME: Joi.string().required(),
        DB_PASSWORD: Joi.string().required(),
        DB_DATABASE: Joi.string().required(),
        HASH_ROUNDS: Joi.number().required(),
        ACCESS_TOKEN_SECRET: Joi.string().required(),
        REFRESH_TOKEN_SECRET: Joi.string().required(),
        GOOGLE_CLIENT_ID: Joi.string().required(),
        GOOGLE_CLIENT_SECRET: Joi.string().required(),
        GOOGLE_CALLBACK_URL: Joi.string().required(),
      }),
    }),
    //TypeOrmModule,
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        type: configService.get<'postgres'>(envVariableKeys.dbType),
        host: configService.get<string>(envVariableKeys.dbHost),
        port: configService.get<number>(envVariableKeys.dbPort),
        username: configService.get<string>(envVariableKeys.dbUsername),
        password: configService.get<string>(envVariableKeys.dbPassword),
        database: configService.get<string>(envVariableKeys.dbDatabase),
        entities: [User],
        synchronize: true,
      }),
      inject: [ConfigService],
    }),
    CacheModule.register({
      ttl: 0,
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    WinstonModule.forRoot({
      level: 'debug',
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize({
              all: true,
            }),
            winston.format.timestamp(),
            winston.format.printf(
              (info) =>
                `${info.timestamp} [${info.context}] ${info.level} ${info.message}`,
            ),
          ),
        }),
      ],
    }),
    UserModule,
    AuthModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: RBACGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(BearerTokenMiddleware)
      .exclude(
        {
          path: 'auth/login',
          method: RequestMethod.POST,
          version: '1',
        },
        {
          path: 'auth/register',
          method: RequestMethod.POST,
          version: '1',
        },
      )
      .forRoutes('*');
  }
}
