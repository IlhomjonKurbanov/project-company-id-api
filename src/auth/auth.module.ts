import { MailModule } from './../mail/mail.module';
import { VacationsService } from './../vacations/services/vacations.service';
import { UserController } from './controllers/user.controller';
import { AuthController } from './controllers/auth.controller';
import { SlackModule } from './../shared/slack.module';
import { projectSchema } from './../project/schemas/project.schema';
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AuthService } from './services/auth.service';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './services/jwt.strategy';
import { MongooseModule } from '@nestjs/mongoose';
import { userSchema } from './schemas/user.schema';
import { vacationSchema } from 'src/vacations/schemas/vacation.schema';
import { UserService } from './services/user.service';
import { MulterModule } from '@nestjs/platform-express';

@Module({
  controllers: [AuthController, UserController],
  exports: [AuthService, UserService],
  imports: [
    SlackModule,
    MailModule,
    MulterModule.register({
      dest: './upload',
    }),
    HttpModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    MongooseModule.forFeature([{ name: 'vacations', schema: vacationSchema }]),
    MongooseModule.forFeature([{ name: 'users', schema: userSchema }]),
    MongooseModule.forFeature([{ name: 'projects', schema: projectSchema }]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async () => ({
        secret: process.env.SECRET,
      }),
    }),
  ],
  providers: [UserService, AuthService, VacationsService, JwtStrategy],
})
export class AuthModule {}
