import { CreateMailDto } from './../dto/mail.dto';
import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { MailService } from '../services/mail.service';
import { MessageResponse } from 'src/shared/interfaces/message-response.interface';

@ApiTags('mail')
@Controller('mail')
export class MailController {
  public constructor(private readonly _mailService: MailService) {}

  @Post()
  public async sendMail(@Body() mail: CreateMailDto): Promise<MessageResponse> {
    return await this._mailService.sendMail(mail);
  }
}
