/* eslint-disable @typescript-eslint/no-explicit-any */
import { IBirthday } from './../interfaces/birthday.interface';
import { DateService } from './date.service';
import { InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';
import { Model, Types, Document } from 'mongoose';
import { FilterLogDto, LogType, VacationType } from '../dto/filter-log.dto';
import { IFilterLog } from '../interfaces/filters.interface';
import { IHoliday } from '../interfaces/holiday.interface';
import { ITimelog } from 'src/timelogs/interfaces/timelog.interface';
import { IVacation } from 'src/vacations/interfaces/vacation.interface';
import { IUser } from 'src/auth/interfaces/user.interface';
import { LogResponse } from '../interfaces/log-response.interface';
import { LogByDate } from '../interfaces/log-by-date-response.interface';

@Injectable()
export class LogService {
  private readonly _getUserLookUp: Record<string, unknown> = {
    $lookup: {
      as: 'user',
      foreignField: '_id',
      from: 'users',
      localField: 'uid',
    },
  };

  private readonly _getProjectLookUp: Record<string, unknown> = {
    $lookup: {
      as: 'project',
      foreignField: '_id',
      from: 'projects',
      localField: 'project',
    },
  };

  public constructor(
    @InjectModel('users')
    private readonly _usersModel: Model<IUser & Document>,
    @InjectModel('timelog')
    private readonly _timelogModel: Model<ITimelog & Document>,
    @InjectModel('vacations')
    private readonly _vacationModel: Model<IVacation & Document>,
    @InjectModel('holidays')
    private readonly _holidayModel: Model<IHoliday & Document>,
    private readonly _dateService: DateService,
  ) {}

  public async findLogs(filterLog: FilterLogDto): Promise<LogResponse> {
    const date: Date = new Date(filterLog.first);
    const lastDate: Date = this._dateService.getLastDate(
      new Date(filterLog.first),
    );
    let filterByProject: IFilterLog = {};
    let filterByUser: IFilterLog = {};
    let filterByType: IFilterLog = {};
    if (filterLog.type) {
      filterByType = { type: parseInt(VacationType[filterLog.type]) };
    }

    if (filterLog.project) {
      filterByProject = { project: new Types.ObjectId(filterLog.project) };
    }
    if (filterLog.uid) {
      filterByUser = { uid: new Types.ObjectId(filterLog.uid) };
    }

    let timelogs: ITimelog[] = [];
    let vacations: IVacation[] = [];
    let holidays: IHoliday[] = [];
    let birthdays: IBirthday[] = [];

    const aggregationMatch: Record<string, unknown> = this._matchPipe(
      filterByUser,
      filterByProject,
      filterByType,
      date,
      lastDate,
    );
    holidays = await this._getHolidaysByDate(date, lastDate);
    birthdays = await this._getBirthdaysByDate(date);
    birthdays = birthdays.map((item: IBirthday) => {
      item.date.setFullYear(date.getFullYear());
      return item;
    });

    if (
      filterLog.logType === LogType.Timelogs ||
      filterLog.logType === LogType.All
    ) {
      timelogs = await this._timelogModel.aggregate([
        {
          $match: aggregationMatch,
        },
        {
          $project: {
            date: 1,
            time: 1,
          },
        },
      ]);
    }
    if (
      filterLog.logType === LogType.Vacations ||
      filterLog.logType === LogType.All
    ) {
      vacations = await this._vacationModel.aggregate([
        {
          $match: aggregationMatch,
        },
        {
          $project: {
            date: 1,
            status: 1,
          },
        },
      ]);
    }
    let reducedLogs: any[] = [
      ...timelogs,
      ...vacations,
      ...holidays,
      ...birthdays,
    ];
    let vacationDays: number = 0;
    reducedLogs = reducedLogs.reduce((a: any, b: any) => {
      const { time, status, name, fullName } = b;
      const dateType: number = time
        ? 1
        : status
        ? 2
        : name
        ? 3
        : fullName
        ? 4
        : -1;

      a[b.date.toISOString()] = a[b.date.toISOString()] || [[], 0, [], 0];
      if (dateType === 4) {
        a[b.date.toISOString()][3] = 1;
      }
      if (dateType === 2) {
        a[b.date.toISOString()][1] += 1;
        vacationDays++;
      }
      if (dateType === 3) {
        a[b.date.toISOString()][2] = [...a[b.date.toISOString()][2], name];
      }
      if (dateType === 1) {
        a[b.date.toISOString()][0] = [
          ...a[b.date.toISOString()][0],
          this._dateService.sumTimeInMinutes([time]),
        ];
      }
      return a;
    }, {});

    const resultObj: any = {};

    let workedOut: number = 0;
    for (const key in reducedLogs) {
      let indexes: number[] = [];
      indexes.push(
        reducedLogs[key][0].length > 0 ? 1 : 0,
        (reducedLogs[key][1] > 0 ? 1 : 0) * 2,
        reducedLogs[key][2].length * 3,
        (reducedLogs[key][3] > 0 ? 1 : 0) * 4,
      );
      indexes = indexes.filter((x: number) => x).map((x: number) => x - 1);
      if (indexes.includes(0)) {
        const roundedTime: number =
          reducedLogs[key][0].reduce(
            (currTime: number, accTime: number) => currTime + accTime,
            0,
          ) / 60;
        const time: number = Math.round(roundedTime * 2) / 2;
        workedOut += roundedTime;
        reducedLogs[key][0] = time;
      }
      const indexType: string[] = [
        LogType.Timelogs,
        LogType.Vacations,
        LogType.Holidays,
        LogType.Birthdays,
      ];

      indexes.forEach((index: number) => {
        const str: string = indexType[index];
        resultObj[key] = resultObj[key] ?? [];
        resultObj[key][0] = {
          ...(resultObj[key][0] ?? {}),
          ...{ [str]: reducedLogs[key][index] },
        };
      });
    }
    const weekHours: number = this._dateService.getWeekDays(date) * 8;
    let holidaysHours: number = 0;
    if (holidays.length > 0) {
      holidaysHours =
        holidays.filter((holiday: IHoliday) => {
          return !this._dateService.checkIfWeekDays(new Date(holiday.date));
        }).length * 8;
    }
    const toBeWorkedOut: number = !filterByUser.uid
      ? 0
      : filterLog.uid
      ? this._dateService.hoursInMonth(date) -
        weekHours -
        holidaysHours -
        vacationDays * 8
      : 0;

    const overtime: number = !filterByUser.uid
      ? 0
      : workedOut > toBeWorkedOut && filterLog.uid
      ? (workedOut - toBeWorkedOut) * 1.5
      : workedOut - toBeWorkedOut;

    return {
      logs: resultObj,
      statistic:
        filterLog.logType === LogType.Vacations
          ? null
          : {
              workedOut: this._dateService.timeToString(workedOut),
              toBeWorkedOut: filterLog.project
                ? null
                : this._dateService.timeToString(toBeWorkedOut),
              overtime: filterLog.project
                ? null
                : this._dateService.timeToString(overtime),
            },
    };
  }

  public async findLogByDate(filterLog: FilterLogDto): Promise<LogByDate[]> {
    let filterByUser: Partial<IFilterLog> = {};
    let filterByType: Partial<IFilterLog> = {};
    let filterByProject: Partial<IFilterLog> = {};

    if (filterLog.type) {
      filterByType = { type: parseInt(VacationType[filterLog.type]) };
    }
    if (filterLog.project) {
      filterByProject = { project: new Types.ObjectId(filterLog.project) };
    }
    const date: Date = new Date(filterLog.first);
    const lastDate: Date = this._dateService.getNextDay(filterLog.first);

    if (filterLog.uid) {
      filterByUser = { uid: new Types.ObjectId(filterLog.uid) };
    }
    let timelogs: ITimelog[] = [];
    let vacations: IVacation[] = [];
    let holidays: IHoliday[] = [];
    let birthdays: IBirthday[] = [];
    holidays = await this._getHolidaysByDate(date, lastDate);

    if (
      filterLog.logType === LogType.All ||
      filterLog.logType === LogType.Timelogs
    ) {
      timelogs = await this._getTimelogsByDate(
        filterByUser,
        filterByProject,
        date,
        lastDate,
      );
    }

    if (
      filterLog.logType === LogType.All ||
      filterLog.logType === LogType.Vacations
    ) {
      vacations = await this._getVacationsByDate(
        filterByUser,
        filterByType,
        date,
        lastDate,
      );
    }

    if (
      filterLog.logType === LogType.All ||
      filterLog.logType === LogType.Birthdays
    ) {
      birthdays = await this._getBirthdaysByDate(date, true);
    }

    return [...timelogs, ...vacations, ...holidays, ...birthdays];
  }
  private async _getHolidaysByDate(
    date: Date,
    lastDate: Date,
  ): Promise<IHoliday[]> {
    return this._holidayModel
      .find({
        date: {
          $gte: date.toISOString(),
          $lt: lastDate.toISOString(),
        },
      })
      .lean()
      .exec();
  }

  private async _getBirthdaysByDate(
    _date: Date,
    _isSolo: boolean = false,
  ): Promise<IBirthday[]> {
    const soloFilter: { day?: number } = _isSolo
      ? { day: _date.getDate() }
      : {};
    return await this._usersModel.aggregate([
      { $match: { endDate: null } },
      {
        $project: {
          dob: 1,
          isActive: 1,
          name: 1,
          lastName: 1,
          month: { $month: '$dob' },
          day: { $dayOfMonth: '$dob' },
        },
      },
      {
        $match: {
          month: _date.getMonth() + 1,
          isActive: true,
          ...soloFilter,
        },
      },
      {
        $project: {
          date: '$dob',
          fullName: { $concat: ['$name', ' ', '$lastName'] },
        },
      },
    ]);
  }
  private async _getTimelogsByDate(
    filterByUser: IFilterLog,
    filterByProject: IFilterLog,
    date: Date,
    lastDate: Date,
  ): Promise<ITimelog[]> {
    return await this._timelogModel.aggregate([
      {
        $match: this._matchPipe(
          filterByUser,
          filterByProject,
          {},
          date,
          lastDate,
        ),
      },
      this._getUserLookUp,
      {
        $unwind: '$user',
      },
      this._getProjectLookUp,
      {
        $unwind: '$project',
      },
      this._getAttregationProject(),
    ]);
  }

  private async _getVacationsByDate(
    filterByUser: Partial<IFilterLog>,
    filterByType: Partial<IFilterLog>,
    date: Date,
    lastDate: Date,
  ): Promise<IVacation[]> {
    return await this._vacationModel.aggregate([
      {
        $match: this._matchPipe(filterByUser, {}, filterByType, date, lastDate),
      },
      this._getUserLookUp,
      {
        $unwind: '$user',
      },
      this._getAttregationProject('vacations'),
    ]);
  }

  private _getAttregationProject(type?: string): Record<string, unknown> {
    let $project: Record<string, unknown> = {
      _id: 1,
      'user._id': 1,
      'user.name': 1,
      'user.lastName': 1,
      'user.avatar': 1,
      'user.slack': 1,
      date: 1,
      desc: 1,
    };
    const forVacations: Record<string, unknown> = { status: 1, type: 1 };
    const forOther: Record<string, unknown> = {
      time: 1,
      'project._id': 1,
      'project.name': 1,
    };
    if (type === 'vacations') {
      $project = { ...$project, ...forVacations };
    } else {
      $project = { ...$project, ...forOther };
    }
    return { $project };
  }

  private _matchPipe(
    filterByUser: Partial<IFilterLog>,
    filterByProject: Partial<IFilterLog>,
    filterByType: Partial<IFilterLog>,
    date: Date,
    lastDate: Date,
  ): Record<string, unknown> {
    return {
      $and: [
        filterByUser,
        filterByProject,
        filterByType,
        {
          date: {
            $gte: date,
            $lt: lastDate,
          },
        },
      ],
    };
  }
}
