import { MailService } from './../../mail/services/mail.service';
import { Tokens } from './../enums/token.enum';
import { MessageResponse } from './../../shared/interfaces/message-response.interface';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Model, Document } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { IUser } from '../interfaces/user.interface';
import { SignUpDto } from '../dto/signup.dto';
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';
import { LoginDto } from '../dto/login.dto';

@Injectable()
export class AuthService {
  public constructor(
    private readonly _mailService: MailService,
    @InjectModel('users')
    private readonly _userModel: Model<IUser & Document>, //  private readonly _config: ConfigService,
  ) {}

  public async generateForgotPasswordLink(
    email: string,
  ): Promise<MessageResponse> {
    await this.getUser(email);
    await this._mailService.sendForgotPasswordLink(
      email,
      this.createToken(email, Tokens.FORGOTPASS, { expiresIn: '1h' }),
    );
    return { message: 'Instructions has been sent on your email' };
  }

  public async setPasswordByLink(
    token: string,
    password: string,
  ): Promise<IUser | null> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payload: any = jwt.verify(token, process.env.SECRET ?? '');
    if (!payload.email || payload.type !== Tokens.FORGOTPASS) {
      throw new BadRequestException('Token invalid or expired');
    }
    const hash: string = await bcrypt.hash(password, 10);
    await this._userModel.updateOne(
      { email: payload.email },
      { $set: { password: hash } },
    );
    return this.getUser(payload.email);
  }

  public createToken(
    email: string,
    type: Tokens,
    options?: jwt.SignOptions,
  ): string {
    return jwt.sign({ email, type }, process.env.SECRET ?? 'secret', options);
  }

  public async createUser(
    createUserDto: SignUpDto & {
      accessToken: string;
      avatar: string;
      email: string;
    },
  ): Promise<IUser> {
    return await this._userModel.create(createUserDto);
  }

  public async getUser(email: string): Promise<IUser> {
    const [user] = await this._userModel.aggregate([
      { $match: { email } },
      {
        $group: {
          _id: '$_id',
          email: { $first: '$email' },
          avatar: { $first: '$avatar' },
          lastName: { $first: '$lastName' },
          name: { $first: '$name' },
          initialLogin: { $first: '$initialLogin' },
          position: { $first: '$position' },
          password: { $first: '$password' },
          accessToken: { $first: '$accessToken' },
          vacationCount: { $first: '$vacationCount' },
          endDate: { $first: '$endDate' },
        },
      },
    ]);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  public async signIn(loginUserDto: LoginDto): Promise<IUser> {
    const { email, password } = loginUserDto;
    const user: IUser = await this.getUser(email);
    if (user.endDate) {
      throw new BadRequestException('User is fired');
    }
    const matchPasswords: boolean = await bcrypt.compare(
      password,
      user?.password ?? '',
    );
    if (!matchPasswords) {
      throw new UnauthorizedException('Invalid email and/or password');
    }
    delete user?.password;
    return user;
  }

  public async preSignUp(email: string): Promise<MessageResponse> {
    const emailPattern: string = '@jsdaddy.io';

    if (!email.endsWith(emailPattern)) {
      throw new BadRequestException(`Allowed only with ${emailPattern} emails`);
    }
    const user: IUser | null = await this._userModel.findOne({ email });
    if (user) {
      throw new ConflictException('User already exists');
    }
    const token: string = this.createToken(email, Tokens.REGISTER, {
      expiresIn: '1h',
    });
    await this._mailService.sendRegisterLink(email, token);
    return {
      message: 'A link for further actions has been sent to your email',
    };
  }

  public async signUp(
    createUserDto: SignUpDto,
    avatar: string,
  ): Promise<IUser> {
    const payload: { email: string; type: Tokens } = jwt.verify(
      createUserDto.token,
      process.env.SECRET ?? '',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ) as any;
    const { email, type } = payload;
    if (!email || type !== Tokens.REGISTER) {
      throw new BadRequestException('Token invalid or expired');
    }
    const user: IUser | null = await this._userModel.findOne({
      email,
    });
    if (user) {
      throw new ConflictException('User already exists');
    }
    const hash: string = await bcrypt.hash(createUserDto.password, 10);
    const accessToken: string = this.createToken(email, Tokens.ACCESS);
    return this.createUser({
      ...createUserDto,
      accessToken,
      email,
      avatar,
      password: hash,
    });
  }
}
