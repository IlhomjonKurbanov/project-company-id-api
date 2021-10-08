import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { MailService } from './services/mail.service';
import { MailController } from './controllers/mail.controller';

@Module({
  controllers: [MailController],
  imports: [HttpModule, ConfigModule],
  exports: [MailService],
  providers: [MailService],
})
export class MailModule {}
