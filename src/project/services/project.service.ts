import { ProjectStatus } from './../enums/project-status.enum';
import { Positions } from 'src/auth/enums/positions.enum';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Document, Types } from 'mongoose';
import { ProjectFilterDto } from '../dto/filter-projects.dto';
import {
  IFilterProject,
  IFilterProjects,
} from '../interfaces/filters.interface';
import { IProject } from '../interfaces/project.interface';
import { CreateProjectDto } from '../dto/project.dto';
import { IUser } from 'src/auth/interfaces/user.interface';

@Injectable()
export class ProjectService {
  public stackLookup: Record<string, unknown> = {
    $lookup: {
      from: 'stacks',
      localField: 'stack',
      as: 'stack',
      foreignField: '_id',
    },
  };
  public constructor(
    @InjectModel('projects')
    private readonly projectModel: Model<IProject & Document>,
    @InjectModel('users') private readonly _userModel: Model<IUser & Document>,
  ) {}

  public async findProjects(
    query: ProjectFilterDto,
    position: Positions,
  ): Promise<IProject[]> {
    const { stack, uid, isInternal, status } = query;
    let filterByUser: IFilterProjects = {};
    let filterByStack: IFilterProjects = {};
    let filterByActivity: IFilterProjects = {};
    let filterByInternal: IFilterProjects = {};
    let filterByStatus: IFilterProjects = {};
    if (uid) {
      filterByUser = { 'users._id': new Types.ObjectId(uid) };
    }
    if (stack) {
      filterByStack = { stack: new Types.ObjectId(stack) };
    }
    if (position === Positions.DEVELOPER) {
      filterByActivity = { isActivity: false };
    }

    if (isInternal) {
      filterByInternal = { isInternal: isInternal.toLowerCase() === 'true' };
    }
    if (status) {
      filterByStatus = { status };
    }
    return this.projectModel
      .aggregate([
        {
          $match: {
            ...filterByStack,
            ...filterByActivity,
            ...filterByInternal,
            ...filterByStatus,
          },
        },
        this.stackLookup,
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            as: 'users',
            foreignField: 'projects',
          },
        },
        {
          $match: filterByUser,
        },
        {
          $project: {
            _id: 1,
            name: 1,
            endDate: 1,
            startDate: 1,
            isActivity: 1,
            status: 1,
            isInternal: 1,
            'stack._id': 1,
            'stack.name': 1,
          },
        },
        {
          $sort: { endDate: 1, isInternal: 1, isActivity: 1 },
        },
      ])
      .exec();
  }
  public async findPortfolio(): Promise<any> {
    return await this.projectModel
      .aggregate([
        { $match: { isPortfolio: true } },
        {
          $project: {
            _id: 1,
            image: { $arrayElemAt: ['$images', 0] },
            techId: 1,
          },
        },
      ])
      .exec();
  }
  public async findPortfolioId(techId: string): Promise<any> {
    return await this.projectModel
      .aggregate([
        { $match: { techId } },
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
            localField: 'feedback',
            as: 'feedback',
            foreignField: '_id',
          },
        },
        {
          $project: {
            _id: 1,
            name: 1,
            images: 1,
            feedback: { $arrayElemAt: ['$feedback', 0] },
            stack: 1,
            description: 1,
          },
        },
      ])
      .exec();
  }

  public async archivateProject(
    _id: string,
    status: ProjectStatus,
  ): Promise<IProject | null> {
    return await this.projectModel.findOneAndUpdate(
      { _id: new Types.ObjectId(_id) },
      [
        {
          $set: {
            endDate: new Date(),
          },
        },
        { $set: { status } },
      ],
      { upsert: true, new: true },
    );
  }

  public async createProject(project: CreateProjectDto): Promise<IProject> {
    const { users, ...projectDtoWithoutUsers } = project;

    const createdProject: IProject & Document = new this.projectModel({
      ...projectDtoWithoutUsers,
      techId: projectDtoWithoutUsers.name.replace(/\W/g, '').toLowerCase(),
      status: ProjectStatus.ONGOING,
    });
    if (users) {
      await this.addUsersToTheProject(users, createdProject._id);
    }
    return createdProject.save();
  }
  public async addUsersToTheProject(
    ids: string[],
    projectId: Types.ObjectId,
  ): Promise<void> {
    for (const _id of ids) {
      await this._userModel.updateOne(
        {
          _id: new Types.ObjectId(_id),
          activeProjects: { $ne: projectId },
          projects: { $ne: projectId },
        },
        { $push: { activeProjects: projectId, projects: projectId } },
      );
    }
  }
  public async findById(id: string): Promise<IProject> {
    let filterById: Partial<IFilterProject> = {};
    if (id) {
      filterById = { _id: new Types.ObjectId(id) };
    }
    return (
      await this.projectModel
        .aggregate([
          { $match: filterById },
          {
            $lookup: {
              from: 'users',
              localField: '_id',
              as: 'history',
              foreignField: 'projects',
            },
          },
          this.stackLookup,
          {
            $lookup: {
              from: 'users',
              localField: '_id',
              as: 'onboard',
              foreignField: 'activeProjects',
            },
          },
          {
            $project: {
              _id: 1,
              name: 1,
              endDate: 1,
              isInternal: 1,
              industry: 1,
              customer: 1,
              startDate: 1,
              'onboard._id': 1,
              'onboard.name': 1,
              'onboard.lastName': 1,
              'onboard.position': 1,
              'onboard.avatar': 1,
              'onboard.endDate': 1,
              'history._id': 1,
              'history.name': 1,
              'history.lastName': 1,
              'history.position': 1,
              'history.endDate': 1,
              'history.avatar': 1,
              'stack._id': 1,
              'stack.name': 1,
            },
          },
          {
            $sort: { endDate: 1, isInternal: 1, isActivity: 1 },
          },
        ])
        .exec()
    )[0];
  }

  public async findAbsentProjects(id: string): Promise<any> {
    let filterById: Record<string, unknown> = {};
    if (id) {
      filterById = { 'users._id': { $ne: new Types.ObjectId(id) } };
    }
    return await this.projectModel
      .aggregate([
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            as: 'users',
            foreignField: 'projects',
          },
        },
        this.stackLookup,
        { $match: filterById },

        {
          $project: {
            _id: 1,
            name: 1,
            endDate: 1,
            startDate: 1,
            isInternal: 1,
            'stack._id': 1,
            'stack.name': 1,
          },
        },
        {
          $sort: { endDate: 1, isInternal: 1 },
        },
      ])
      .exec();
  }

  public async findProjectFor(
    userId: string,
    // eslint-disable-next-line @typescript-eslint/no-inferrable-types
    isActive: boolean = false,
  ): Promise<Partial<IProject>[]> {
    const _id: Types.ObjectId = new Types.ObjectId(userId);
    const article: string = isActive ? 'activeProjects' : 'projects';
    // tslint:disable-next-line:no-any
    const aggregate: any = await this._userModel.aggregate([
      { $match: { _id } },
      {
        $lookup: {
          as: article,
          foreignField: '_id',
          from: 'projects',
          localField: article,
        },
      },
      { $unwind: { path: '$' + article, preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$_id',
          [article]: {
            $push: {
              _id: '$' + article + '._id',
              name: '$' + article + '.name',
              endDate: '$' + article + '.endDate',
              isInternal: '$' + article + '.isInternal',
            },
          },
        },
      },
      {
        $sort: { endDate: 1, isInternal: 1 },
      },
    ]);
    aggregate[0][article].sort((a: IProject, b: IProject) =>
      a.endDate ? 1 : b.endDate ? -1 : 0,
    );
    aggregate[0][article].sort((a: IProject, b: IProject) =>
      a.isInternal ? 1 : b.isInternal ? -1 : 0,
    );
    return aggregate[0][article];
  }
}
