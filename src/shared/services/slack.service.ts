import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class SlackService {
  public constructor(private readonly _http: HttpService) {}
  public async sendMessage(channel: string, message: string): Promise<boolean> {
    if (!process.env.BOT_TOKEN) {
      return false;
    }
    try {
      await this._http
        .post(
          'https://slack.com/api/chat.postMessage',
          { channel, text: `>>>${message}` },
          {
            responseType: 'json',
            timeout: 5000,
            headers: {
              Authorization: `Bearer ${process.env.BOT_TOKEN}`,
            },
          },
        )
        .toPromise();
      return true;
    } catch (e) {
      throw new InternalServerErrorException(e);
    }
  }
}
