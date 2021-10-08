import { ITimelog } from 'src/timelogs/interfaces/timelog.interface';
import { IVacation } from 'src/vacations/interfaces/vacation.interface';
import { IBirthday } from './birthday.interface';
import { IHoliday } from './holiday.interface';

export interface LogByDateResponse {
  logs: LogByDate[];
  vacationAvailable?: number;
  sickAvailable?: number;
}

export type LogByDate = ITimelog | IVacation | IHoliday | IBirthday;
