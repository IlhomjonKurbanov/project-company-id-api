import { IFacilities } from '../interfaces/facilities.interface';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Document } from 'mongoose';
@Injectable()
export class FacilitiesService {
  public constructor(
    @InjectModel('facilities')
    private readonly facilitiesModel: Model<IFacilities & Document>,
  ) {}

  public async findFacilities(): Promise<IFacilities[]> {
    return await this.facilitiesModel.aggregate([
      { $match: {} },
      {
        $project: {
          image: 1,
          name: 1,
          title: 1,
          text: 1,
        },
      },
    ]);
  }
  public async findFacility(facility: string): Promise<IFacilities> {
    const [service] = await this.facilitiesModel.aggregate([
      { $match: { name: facility } },
      {
        $lookup: {
          from: 'stacks',
          localField: 'stack',
          as: 'stack',
          foreignField: '_id',
        },
      },
      {
        $lookup: {
          from: 'feedbacks',
          localField: 'feedbacks',
          as: 'feedbacks',
          foreignField: '_id',
        },
      },
    ]);
    if (!service) {
      throw new NotFoundException('facility not found');
    }
    return service;
  }
}
