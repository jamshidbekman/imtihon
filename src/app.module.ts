import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Interceptor } from './common/interceptors/interceptor';
import { AssignmentsModule } from './modules/assignments/assignments.module';
import { CoursesModule } from './modules/courses/courses.module';
import { SubmissionModule } from './modules/submission/submission.module';
import { UsersModule } from './modules/users/users.module';
import { configuration } from './common/config/configuration';
import { MailerModule } from '@nestjs-modules/mailer';

@Module({
  imports: [
    UsersModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV}`,
      load: [configuration],
    }),
    CoursesModule,
    AssignmentsModule,
    SubmissionModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        type: 'postgres',
        username: configService.get('DATABASE_USERNAME'),
        database: configService.get('DATABASE_NAME'),
        host: configService.get('DATABASE_HOST'),
        port: configService.get('DATABASE_PORT'),
        password: configService.get('DATABASE_PASSWORD'),
        autoLoadEntities: true,
        synchronize: true,
      }),
    }),
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        transport: {
          host: configService.get('SMTP_HOST'),
          auth: {
            user: configService.get('SMTP_USER'),
            pass: configService.get('SMTP_PASSWORD'),
          },
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: Interceptor,
    },
  ],
})
export class AppModule {}
