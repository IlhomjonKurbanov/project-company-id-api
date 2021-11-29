import { MessageResponse } from './../../shared/interfaces/message-response.interface';
import { ChangeTimelogDto } from './../dto/change-timelog.dto';
import { CreateTimelogDto } from './../dto/create-timelog.dto';
import { InjectModel } from '@nestjs/mongoose';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Model, Document, Types } from 'mongoose';
import { ITimelog } from './../interfaces/timelog.interface';

@Injectable()
export class TimelogsService {
  public constructor(
    @InjectModel('timelog')
    private readonly _timelogModel: Model<ITimelog & Document>,
  ) {}

  public async createTimelog(
    createTimelogDto: CreateTimelogDto & {
      uid: Types.ObjectId;
      project: Types.ObjectId;
    },
  ): Promise<ITimelog> {
    if (new Date(createTimelogDto.date).getMonth() < new Date().getMonth()) {
      throw new BadRequestException("You can't track time on past month");
    }
    return await this._timelogModel.create(createTimelogDto);
  }

  public async findTimelog(id: string): Promise<ITimelog> {
    const timelog: ITimelog | null = await this._timelogModel
      .findOne({ _id: new Types.ObjectId(id) })
      .lean()
      .exec();
    if (!timelog) {
      throw new NotFoundException('Timelog not found');
    }
    return timelog;
  }
  public async changeTimelog(
    id: string,
    changeTimelogDto: ChangeTimelogDto,
  ): Promise<ITimelog> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { date, ...dto } = changeTimelogDto;
    const timelog: ITimelog | null = await this._timelogModel
      .findOneAndUpdate(
        { _id: new Types.ObjectId(id) },
        { $set: dto },
        { new: true },
      )
      .lean()
      .exec();
    if (!timelog) {
      throw new NotFoundException('Timelog not found');
    }
    return timelog;
  }
  public async deleteTimelog(id: string): Promise<MessageResponse> {
    await this._timelogModel
      .deleteOne({ _id: new Types.ObjectId(id) })
      .lean()
      .exec();
    return { message: 'Timelog successfully deleted' };
  }
}
