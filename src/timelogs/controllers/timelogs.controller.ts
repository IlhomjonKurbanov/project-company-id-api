import { DateNormalizePipe } from './../../shared/pipes/date-normalize.pipe';
import { GetUser } from './../../shared/decorators/get-user.decorator';
import { ChangeTimelogDto } from './../dto/change-timelog.dto';
import { ParseObjectIdPipe } from './../../shared/pipes/string-object-id.pipe';
import { CreateTimelogDto } from './../dto/create-timelog.dto';
import {
  Controller,
  UseGuards,
  Post,
  Body,
  Param,
  Get,
  Put,
  Delete,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TimelogsService } from '../services/timelogs.service';
import { AuthGuard } from '@nestjs/passport';
import { Types } from 'mongoose';
import { ITimelog } from '../interfaces/timelog.interface';
import { MessageResponse } from 'src/shared/interfaces/message-response.interface';

@Controller('timelogs')
@ApiTags('timelogs')
export class TimelogsController {
  public constructor(private readonly _timelogsService: TimelogsService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post(':project')
  public async createTimelog(
    @GetUser() { _id: uid }: { _id: Types.ObjectId },
    @Body() createTimelogDto: CreateTimelogDto,
    @Body('date', DateNormalizePipe) date: Date,
    @Param('project', ParseObjectIdPipe) project: Types.ObjectId,
  ): Promise<ITimelog> {
    return await this._timelogsService.createTimelog({
      ...createTimelogDto,
      date,
      uid,
      project,
    });
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':timelogId')
  public async findTimelog(
    @Param('timelogId') timelogId: string,
  ): Promise<ITimelog> {
    return await this._timelogsService.findTimelog(timelogId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Put(':timelogId')
  public async changeTimelog(
    @Param('timelogId') timelogId: string,
    @Body() changeTimelogDto: ChangeTimelogDto,
  ): Promise<ITimelog> {
    return await this._timelogsService.changeTimelog(
      timelogId,
      changeTimelogDto,
    );
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':timelogId')
  public async deleteTimelog(
    @Param('timelogId') timelogId: string,
  ): Promise<MessageResponse> {
    return await this._timelogsService.deleteTimelog(timelogId);
  }
}
