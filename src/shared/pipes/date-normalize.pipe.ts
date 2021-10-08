import { PipeTransform, Injectable } from '@nestjs/common';
import moment from 'moment';

@Injectable()
export class DateNormalizePipe implements PipeTransform<Date, Date> {
  public transform(value: Date): Date {
    if (!value) {
      return new Date();
    }
    return moment(value)
      .utcOffset(0)
      .set({ hour: 12, minute: 0, second: 0, millisecond: 0 })
      .toDate();
  }
}
