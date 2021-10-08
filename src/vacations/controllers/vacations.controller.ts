import { DateNormalizePipe } from './../../shared/pipes/date-normalize.pipe';
import { Positions } from 'src/auth/enums/positions.enum';
import { ChangeStatusDto } from './../dto/change-status.dto';
import { IVacation } from 'src/vacations/interfaces/vacation.interface';
import { VacationsService } from './../services/vacations.service';
import {
  Controller,
  UseGuards,
  Post,
  Body,
  Put,
  Param,
  Get,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CreateVacationDto, VacationType } from '../dto/create-vacation.dto';
import { ParseObjectIdPipe } from 'src/shared/pipes/string-object-id.pipe';
import { Types } from 'mongoose';
import { RolesGuard } from 'src/shared/guards/roles.guard';
import { IUser } from 'src/auth/interfaces/user.interface';
import { GetUser } from 'src/shared/decorators/get-user.decorator';

@Controller('vacations')
@ApiTags('vacations')
export class VacationsController {
  public constructor(private readonly _vacationsService: VacationsService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post()
  public async createVacation(
    @GetUser() { _id: uid }: { _id: Types.ObjectId },
    @Body() createVacationDto: CreateVacationDto,
    @Body('date', DateNormalizePipe) date: Date,
  ): Promise<IVacation> {
    return await this._vacationsService.createVacation({
      ...createVacationDto,
      date,
      uid,
    });
  }

  @UseGuards(AuthGuard('jwt'), new RolesGuard(Positions.OWNER))
  @Put(':vacationId')
  public async changeStatus(
    @Body() changeStatusDto: ChangeStatusDto,
    @Param('vacationId', ParseObjectIdPipe) vacationId: Types.ObjectId,
    @GetUser() user: IUser,
  ): Promise<IVacation> {
    return await this._vacationsService.statusChange(
      vacationId,
      changeStatusDto,
      user,
    );
  }

  @UseGuards(AuthGuard('jwt'), new RolesGuard(Positions.OWNER))
  @Get('requests')
  public async getVacations(): Promise<IVacation[]> {
    return await this._vacationsService.getVacations();
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('count/:uid')
  public async availableCount(@Param('uid') uid: string): Promise<number> {
    return await this._vacationsService.availableCount(
      uid,
      VacationType.VacationPaid,
    );
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('sick/count/:uid')
  public async availableSickCount(@Param('uid') uid: string): Promise<number> {
    return await this._vacationsService.availableCount(
      uid,
      VacationType.SickPaid,
      5,
    );
  }
}
