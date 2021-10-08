import { SlackService } from './services/slack.service';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';

@Module({
  exports: [SlackService],
  imports: [HttpModule],
  providers: [SlackService],
})
export class SlackModule {}
