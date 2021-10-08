import { ConfigService } from '@nestjs/config';
import { CreateMailDto } from './../dto/mail.dto';
import * as nodemailer from 'nodemailer';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { MessageResponse } from 'src/shared/interfaces/message-response.interface';

@Injectable()
export class MailService {
  private readonly _transporter: nodemailer.Transporter;

  private readonly _user: string = this._configService.get('MAIL', '');

  public constructor(
    private readonly _httpService: HttpService,
    private readonly _configService: ConfigService,
  ) {
    this._transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: this._configService.get('MAIL', ''),
        pass: this._configService.get('MAIL_PASS', ''),
      },
    });
  }

  public async sendRegisterLink(email: string, token: string): Promise<void> {
    await this.sendDeeplinkMail(
      email,
      `For registration open this link from your phone ${await this.createShortLink(
        `?registerToken=${token}`,
      )}`,
    );
  }

  public async sendForgotPasswordLink(
    email: string,
    token: string,
  ): Promise<void> {
    await this.sendDeeplinkMail(
      email,
      `For change password open this link from your phone ${await this.createShortLink(
        `?forgotToken=${token}`,
      )}`,
    );
  }

  private async sendDeeplinkMail(email: string, text: string): Promise<void> {
    await this._transporter.sendMail({
      to: email,
      subject: 'JSDaddy - Register link',
      text,
      from: this._user,
    });
  }

  public async sendMail(mail: CreateMailDto): Promise<MessageResponse> {
    try {
      await this._transporter.sendMail({
        to: ['juncker8888@gmail.com', this._user, 'igornepipenko@gmail.com'],
        subject: 'JSDaddy',
        text: `Name:  ${mail.name}\nEmail: ${mail.email}\nText: ${mail.message}`,
        from: this._user,
      });
      return { message: 'Email sent successfully' };
    } catch (e) {
      throw new InternalServerErrorException(e);
    }
  }

  private async createShortLink(query: string): Promise<string> {
    try {
      const {
        data: { shortLink },
      } = (await this._httpService
        .post(
          'https://firebasedynamiclinks.googleapis.com/v1/shortLinks?key=AIzaSyCNL4nHTApAksYAAknrGMyZF5hBP2rkqIk',
          {
            dynamicLinkInfo: {
              domainUriPrefix: 'https://jsdaddy.page.link',
              link: `https://jsdaddy.io${query}`,
              androidInfo: {
                androidPackageName: 'com.example.company_id_new',
              },
              iosInfo: {
                iosBundleId: 'com.jsdaddy.company-id',
              },
            },
          },
        )
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .toPromise()) as any;
      return shortLink;
    } catch (e) {
      throw new InternalServerErrorException(e);
    }
  }
}
