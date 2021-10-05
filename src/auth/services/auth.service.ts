import { MessageResponse } from './../../shared/interfaces/message-response.interface';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { IUser } from '../interfaces/user.interface';
import { Document } from 'mongoose';
import { SignUpDto } from '../dto/signup.dto';
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';
import { LoginDto } from '../dto/login.dto';

@Injectable()
export class AuthService {
  public constructor(
    @InjectModel('users')
    private readonly _userModel: Model<IUser & Document>, //  private readonly _config: ConfigService,
  ) {}

  public async setPassword(
    email: string,
    uncryptedPassword: string,
  ): Promise<MessageResponse> {
    const password: string = await bcrypt.hash(uncryptedPassword, 10);
    await this._userModel.findOneAndUpdate(
      { email },
      { $set: { password, initialLogin: false } },
    );
    return { message: 'Password has been successfully changed' };
  }

  public async createToken(payload: SignUpDto): Promise<string> {
    return jwt.sign({ email: payload.email }, process.env.SECRET ?? 'secret');
  }

  public async createUser(
    createUserDto: SignUpDto & { accessToken: string },
  ): Promise<IUser> {
    return await this._userModel.create(createUserDto);
  }

  public async getUser(email: string): Promise<IUser | null> {
    return (
      await this._userModel.aggregate([
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
            endDate: { $first: '$endDate' },
          },
        },
      ])
    )[0];
  }

  public async signIn(loginUserDto: LoginDto): Promise<IUser> {
    const { email, password } = loginUserDto;
    const user: IUser | null = await this.getUser(email);
    if (
      !user ||
      (user && !(await bcrypt.compare(password, user.password ?? '')))
    ) {
      throw new UnauthorizedException('Invalid email and/or password');
    }
    if (user && user.endDate) {
      throw new BadRequestException('User is fired');
    }
    delete user.password;
    return user;
  }

  public async signUp(createUserDto: SignUpDto): Promise<IUser> {
    const { email, password } = createUserDto;
    const user: IUser<any> | null = await this.getUser(email);
    if (user) {
      throw new ConflictException('Invalid username or email already exists');
    }
    const hash: string = await bcrypt.hash(password, 10);
    const userForCreate: SignUpDto = {
      ...createUserDto,
      password: hash,
    };
    const accessToken: string = await this.createToken(userForCreate);
    const createdUser: IUser = await this.createUser({
      accessToken,
      ...userForCreate,
    });
    delete createdUser.password;
    return createdUser;
  }
}
