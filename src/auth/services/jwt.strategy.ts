import { Injectable, NotFoundException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { IUser } from '../interfaces/user.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  public constructor(private readonly _authService: AuthService) {
    super({
      ignoreExpiration: false,
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.SECRET,
    });
  }

  public async validate(payload: { email: string }): Promise<IUser | null> {
    const user: IUser | null = await this._authService.getUser(payload.email);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    delete user.password;
    return user;
  }
}
