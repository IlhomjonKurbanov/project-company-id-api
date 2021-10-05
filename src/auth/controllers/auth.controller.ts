import {
  Body,
  Controller,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from '../services/auth.service';
import { LoginDto } from '../dto/login.dto';
import { IUser } from '../interfaces/user.interface';
import { SignUpDto } from '../dto/signup.dto';
import { GetUser } from 'src/shared/decorators/get-user.decorator';
import { MessageResponse } from 'src/shared/interfaces/message-response.interface';
// import { RolesGuard } from 'src/shared/guards/roles.guard';
// import { Positions } from '../enums/positions.enum';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  public constructor(private readonly _authService: AuthService) {}

  // @UseGuards(
  //   AuthGuard('jwt'),
  //   new RolesGuard({
  //     [Positions.OWNER]: [],
  //   }),
  // )
  @Post('signup')
  public async signUp(@Body() createUserDto: SignUpDto): Promise<IUser> {
    return this._authService.signUp(createUserDto);
  }

  @Post('signin')
  public async signIn(@Body() loginUserDto: LoginDto): Promise<IUser> {
    return this._authService.signIn(loginUserDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('set-password')
  public async setPassword(
    @Body('password') password: string,
    // tslint:disable-next-line:no-any
    @GetUser() { email }: { email: string },
  ): Promise<MessageResponse> {
    return this._authService.setPassword(email, password);
  }

  // TODO: post => get
  @UseGuards(AuthGuard('jwt'))
  @Post('checktoken')
  public async checkToken(@GetUser() user: IUser): Promise<IUser> {
    if (user.endDate) {
      throw new UnauthorizedException('User is fired');
    }
    return user;
  }
}
