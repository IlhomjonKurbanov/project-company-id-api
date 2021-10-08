import { SignUpDto } from './../dto/signup.dto';
import {
  Body,
  Controller,
  Post,
  UnauthorizedException,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from '../services/auth.service';
import { LoginDto } from '../dto/login.dto';
import { IUser } from '../interfaces/user.interface';
import { GetUser } from 'src/shared/decorators/get-user.decorator';
import { MessageResponse } from 'src/shared/interfaces/message-response.interface';
import { FileInterceptor } from '@nestjs/platform-express';
// import { RolesGuard } from 'src/shared/guards/roles.guard';
// import { Positions } from '../enums/positions.enum';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  public constructor(private readonly _authService: AuthService) {}

  @Post('pre-signup')
  public async preSignUp(
    @Body('email') email: string,
  ): Promise<MessageResponse> {
    return await this._authService.preSignUp(email);
  }

  @Post('signup')
  @UseInterceptors(FileInterceptor('avatar'))
  public async signUp(
    @Body() signUpDto: SignUpDto,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<IUser> {
    const user: IUser = await this._authService.signUp(
      signUpDto,
      file.filename,
    );
    return user;
  }

  @Post('signin')
  public async signIn(@Body() loginUserDto: LoginDto): Promise<IUser> {
    return this._authService.signIn(loginUserDto);
  }

  @Post('forgot-generate')
  public async forgotGenerate(
    @Body() { email }: { email: string },
  ): Promise<MessageResponse> {
    return this._authService.generateForgotPasswordLink(email);
  }

  @Post('forgot-change')
  public async forgotChangePassword(
    @Body() { password, token }: { password: string; token: string },
  ): Promise<IUser | null> {
    return this._authService.setPasswordByLink(token, password);
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
