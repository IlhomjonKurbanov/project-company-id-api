import { VacationsService } from './../../vacations/services/vacations.service';
import { Positions } from 'src/auth/enums/positions.enum';
import { Types } from 'mongoose';
import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  ParseBoolPipe,
  Delete,
  Put,
  Res,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { UserService } from '../services/user.service';
import { AuthGuard } from '@nestjs/passport';
import { ParseObjectIdPipe } from 'src/shared/pipes/string-object-id.pipe';
import { IUser } from '../interfaces/user.interface';
import { IProject } from 'src/project/interfaces/project.interface';
import { RolesGuard } from 'src/shared/guards/roles.guard';
import { VacationType } from 'src/vacations/dto/create-vacation.dto';
import { MessageResponse } from 'src/shared/interfaces/message-response.interface';
import { GetUser } from 'src/shared/decorators/get-user.decorator';
import { Response } from 'express';

@ApiTags('user')
@Controller('user')
export class UserController {
  public constructor(
    private readonly _userService: UserService,
    private readonly _vacationService: VacationsService,
  ) {}

  @UseGuards(AuthGuard('jwt'), new RolesGuard(Positions.OWNER))
  @Post(':uid/projects/:projectId/:isActive')
  public async addUserToProject(
    @Param('uid', ParseObjectIdPipe) uid: Types.ObjectId,
    @Param('isActive', ParseBoolPipe) isActive: boolean,
    @Param('projectId', ParseObjectIdPipe) projectId: Types.ObjectId,
  ): Promise<Partial<IUser> | null> {
    return await this._userService.addUserToTheProject(
      uid,
      projectId,
      isActive,
    );
  }

  @Get('avatar/:uid')
  public async getAvatar(
    @Param('uid') avatar: string,
    @Res() res: Response,
  ): Promise<void> {
    return res.sendFile(avatar, {
      root: 'upload',
    });
  }

  @UseGuards(AuthGuard('jwt'), new RolesGuard(Positions.OWNER))
  @Post(':uid/projects-return/:projectId/:isActive')
  public async addUserToProjectWithReturn(
    @Param('uid', ParseObjectIdPipe) uid: Types.ObjectId,
    @Param('isActive', ParseBoolPipe) isActive: boolean,
    @Param('projectId', ParseObjectIdPipe) projectId: Types.ObjectId,
  ): Promise<Partial<IProject>> {
    return await this._userService.addUserToTheProjectWithReturn(
      uid,
      projectId,
      isActive,
    );
  }

  @UseGuards(AuthGuard('jwt'), new RolesGuard(Positions.OWNER))
  @Delete(':uid/active-project/:projectId')
  public async removeUserFromActiveProject(
    @Param('uid', ParseObjectIdPipe) uid: Types.ObjectId,
    @Param('projectId', ParseObjectIdPipe) projectId: Types.ObjectId,
  ): Promise<MessageResponse> {
    return this._userService.removeUserFromActiveProject(uid, projectId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('all/:isnotfired')
  public async findUsers(
    @GetUser() { position }: { position: Positions },
    @Param('isnotfired', ParseBoolPipe) isNotFired: boolean,
  ): Promise<IUser[]> {
    return this._userService.getUsers(
      position === Positions.DEVELOPER || isNotFired,
    );
  }

  @Get(':id')
  public async findUser(
    @Param('id') id: string,
  ): Promise<
    IUser<IProject[]> & { sickAvailable: number; vacationAvailable: number }
  > {
    const user: IUser<IProject[]> = await this._userService.findUser(id);
    const vacationAvailable: number =
      await this._vacationService.availableCount(id, VacationType.VacationPaid);
    const sickAvailable: number = await this._vacationService.availableCount(
      id,
      VacationType.SickPaid,
      5,
    );
    return { ...user, vacationAvailable, sickAvailable };
  }

  @Get('management/all')
  public async findManagement(): Promise<IUser[]> {
    return await this._userService.getManagement();
  }

  @Get('stack/:sid')
  public async findUsersByStack(
    @Param('sid') id: string,
  ): Promise<Partial<IUser>[]> {
    return await this._userService.findUsersByStack(id);
  }

  @Put(':id')
  public async archiveUser(@Param('id') id: string): Promise<IUser> {
    return await this._userService.archivateUser(id);
  }

  @Get('projects/:pid')
  public async findUsersFor(
    @Param('pid') pid: string,
  ): Promise<Partial<IUser>[]> {
    return await this._userService.findUsersFor(pid);
  }

  @Get('absent/projects/:pid')
  public async findAbsentUsersFor(
    @Param('pid') pid: string,
  ): Promise<Partial<IUser>[]> {
    return await this._userService.findUsersFor(pid, true);
  }
}
