import { LogByDate } from './../interfaces/log-by-date-response.interface';
import { DateNormalizePipe } from './../../shared/pipes/date-normalize.pipe';
import { VacationsService } from './../../vacations/services/vacations.service';
import { FilterLogDto, LogType, VacationType } from './../dto/filter-log.dto';
import { ApiTags } from '@nestjs/swagger';
import { Controller, Get, UseGuards, Query, Param } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { LogService } from '../services/log.service';
import { RolesGuard } from 'src/shared/guards/roles.guard';
import { Positions } from 'src/auth/enums/positions.enum';
import { LogResponse } from '../interfaces/log-response.interface';
import { LogByDateResponse } from '../interfaces/log-by-date-response.interface';

@ApiTags('logs')
@Controller('logs')
export class LogController {
  public constructor(
    private readonly _logService: LogService,
    private readonly _vacationService: VacationsService,
  ) {}

  @UseGuards(
    AuthGuard('jwt'),
    new RolesGuard({ [Positions.OWNER]: [], [Positions.DEVELOPER]: ['uid'] }),
  )
  @Get(':first/:logType')
  public async findLogs(
    @Param('first', DateNormalizePipe) first: Date,
    @Param('logType') logType: LogType,
    @Query() query: FilterLogDto,
  ): Promise<LogResponse> {
    return await this._logService.findLogs({
      ...query,
      logType,
      first,
    });
  }

  @UseGuards(
    AuthGuard('jwt'),
    new RolesGuard({ [Positions.OWNER]: [], [Positions.DEVELOPER]: ['uid'] }),
  )
  @Get('solo/:first/:logType')
  public async findLogsByDate(
    @Param('first', DateNormalizePipe) first: Date,
    @Param('logType') logType: LogType,
    @Query() query: FilterLogDto,
  ): Promise<LogByDateResponse> {
    const logs: LogByDate[] = await this._logService.findLogByDate({
      ...query,
      first,
      logType,
    });
    const result: LogByDateResponse = { logs };
    if (query.uid) {
      result.vacationAvailable = await this._vacationService.availableCount(
        query.uid,
        VacationType.VacationPaid,
      );
      result.sickAvailable = await this._vacationService.availableCount(
        query.uid,
        VacationType.SickPaid,
        5,
      );
    }
    return result;
  }
}
