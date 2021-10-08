import { SignUpDto } from './../dto/signup.dto';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, Document } from 'mongoose';
import { IUser } from '../interfaces/user.interface';
import { IProject } from 'src/project/interfaces/project.interface';
import { MessageResponse } from 'src/shared/interfaces/message-response.interface';

@Injectable()
export class UserService {
  public constructor(
    @InjectModel('users') private readonly _userModel: Model<IUser & Document>,
    @InjectModel('projects')
    private readonly _projectsModel: Model<IProject & Document>,
  ) {}

  public async createUser(user: SignUpDto): Promise<IUser> {
    const createdUser: IUser & Document = new this._userModel(user);
    return createdUser.save();
  }

  public async findUsers(): Promise<IUser[]> {
    return this._userModel.aggregate([
      {
        $lookup: {
          as: 'projects',
          foreignField: '_id',
          from: 'projects',
          localField: 'projects',
        },
      },
      { $unwind: { path: '$projects', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          as: 'activeProjects',
          foreignField: '_id',
          from: 'projects',
          localField: 'activeProjects',
        },
      },
      {
        $unwind: { path: '$activeProjects', preserveNullAndEmptyArrays: true },
      },
      {
        $group: {
          _id: '$_id',
          avatar: { $first: '$avatar' },
          lastName: { $first: '$lastName' },
          name: { $first: '$name' },
          endDate: { $first: '$endDate' },
          projects: { $push: '$projects' },
          activeProjects: { $push: '$activeProjects' },
        },
      },
      { $sort: { endDate: 1 } },
    ]);
  }

  public async getUsers(isNotFired: boolean): Promise<IUser[]> {
    const filterByUser: Record<string, unknown> = {
      endDate: { $exists: false },
    };

    return this._userModel.aggregate([
      { $match: isNotFired ? filterByUser : {} },
      { $sort: { endDate: 1 } },
      {
        $project: {
          name: 1,
          lastName: 1,
          avatar: 1,
          position: 1,
          endDate: 1,
        },
      },
    ]);
  }
  public async getManagement(): Promise<IUser[]> {
    return this._userModel.aggregate([
      { $match: { isShown: true } },
      {
        $project: {
          avatar: 1,
          skype: 1,
          email: 1,
          post: 1,
          fullName: { $concat: ['$name', ' ', '$lastName'] },
        },
      },
    ]);
  }

  public async addUserToTheProject(
    _id: Types.ObjectId,
    projectId: Types.ObjectId,
    isActive: boolean,
  ): Promise<Partial<IUser> | null> {
    let user: IUser | null = await this._userModel.findOne({ _id });
    if (user && user.hasOwnProperty('endDate')) {
      throw new BadRequestException('User is fired');
    }
    const match: Record<string, unknown> | Types.ObjectId = !isActive
      ? { $ne: projectId }
      : projectId;
    const push: Record<string, unknown> = isActive
      ? { activeProjects: projectId }
      : { activeProjects: projectId, projects: projectId };
    user = await this._userModel.findOneAndUpdate(
      { _id, activeProjects: { $ne: projectId }, projects: match },
      { $push: push },
    );
    if (user) {
      const { _id, name, lastName, avatar, position, endDate } = user;
      return { _id, name, lastName, avatar, position, endDate };
    }
    return null;
  }

  public async addUserToTheProjectWithReturn(
    _id: Types.ObjectId,
    projectId: Types.ObjectId,
    isActive: boolean,
  ): Promise<Partial<IProject>> {
    let user: IUser | null = await this._userModel.findOne({ _id });
    if (user && user.hasOwnProperty('endDate')) {
      throw new BadRequestException('User is fired');
    }
    const match: Record<string, unknown> | Types.ObjectId = isActive
      ? projectId
      : { $ne: projectId };
    const push: Record<string, unknown> = isActive
      ? { activeProjects: projectId }
      : { activeProjects: projectId, projects: projectId };
    user = await this._userModel.findOneAndUpdate(
      { _id, activeProjects: { $ne: projectId }, projects: match },
      { $push: push },
    );

    const project: Partial<IProject> = (
      await this._projectsModel
        .aggregate([
          { $match: { _id: projectId } },
          {
            $lookup: {
              from: 'stacks',
              localField: 'stack',
              as: 'stack',
              foreignField: '_id',
            },
          },
          {
            $project: {
              _id: 1,
              name: 1,
              endDate: 1,
              startDate: 1,
              'stack._id': 1,
              'stack.name': 1,
            },
          },
        ])
        .exec()
    )[0];
    if (!project || !user) {
      throw new BadRequestException(
        'User or project doesnt exist / user already added to this project',
      );
    }
    return project;
  }

  public async removeUserFromActiveProject(
    _id: Types.ObjectId | null,
    projectId: Types.ObjectId,
  ): Promise<MessageResponse> {
    await this._userModel.updateMany(_id ? { _id } : {}, {
      $pull: { activeProjects: projectId },
    });
    return { message: 'User has been removed from active project' };
  }

  public async getUser(_id: string): Promise<IUser | null> {
    return await this._userModel.findOne({ _id: new Types.ObjectId(_id) });
  }
  public async archivateUser(_id: string): Promise<IUser> {
    const user: IUser | null = await this._userModel.findOneAndUpdate(
      { _id: new Types.ObjectId(_id) },
      [{ $set: { endDate: new Date() } }, { $set: { activeProjects: [] } }],
      { new: true },
    );
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  public async findUsersByStack(_sid: string): Promise<Partial<IUser>[]> {
    return await this._userModel.aggregate([
      {
        $lookup: {
          as: 'projects',
          foreignField: '_id',
          from: 'projects',
          localField: 'projects',
        },
      },
      { $match: { 'projects.stack': new Types.ObjectId(_sid) } },

      {
        $project: {
          _id: 1,
          name: 1,
          endDate: 1,
          lastName: 1,
        },
      },
      { $sort: { endDate: 1 } },
    ]);
  }

  public async findUser(_id: string): Promise<IUser<IProject[]>> {
    const [user] = await this._userModel.aggregate([
      { $match: { _id: new Types.ObjectId(_id) } },
      {
        $lookup: {
          as: 'projects',
          foreignField: '_id',
          from: 'projects',
          localField: 'projects',
        },
      },

      { $unwind: { path: '$projects', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'stacks',
          localField: 'projects.stack',
          as: 'projects.stack',
          foreignField: '_id',
        },
      },
      {
        $unwind: {
          path: '$projects.stack',
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $group: {
          _id: {
            _id: '$_id',
            projectId: '$projects._id',
          },
          name: { $first: '$name' },
          avatar: { $first: '$avatar' },
          lastName: { $first: '$lastName' },
          position: { $first: '$position' },
          phone: { $first: '$phone' },
          skype: { $first: '$skype' },
          slack: { $first: '$slack' },
          dob: { $first: '$dob' },
          github: { $first: '$github' },
          englishLevel: { $first: '$englishLevel' },
          email: { $first: '$email' },
          activeProjects: { $first: '$activeProjects' },
          project: {
            $first: {
              _id: '$projects._id',
              name: '$projects.name',
              startDate: '$projects.startDate',
              endDate: '$projects.endDate',
              isInternal: '$projects.isInternal',
            },
          },

          stack: { $push: '$projects.stack' },
        },
      },
      {
        $sort: {
          'projects.endDate': 1,
        },
      },
      {
        $group: {
          _id: '$_id._id',
          name: { $first: '$name' },
          avatar: { $first: '$avatar' },
          lastName: { $first: '$lastName' },
          position: { $first: '$position' },
          phone: { $first: '$phone' },
          skype: { $first: '$skype' },
          slack: { $first: '$slack' },
          dob: { $first: '$dob' },
          github: { $first: '$github' },
          englishLevel: { $first: '$englishLevel' },
          email: { $first: '$email' },
          activeProjects: { $first: '$activeProjects' },
          projects: {
            $push: {
              _id: '$project._id',
              name: '$project.name',
              startDate: '$project.startDate',
              endDate: '$project.endDate',
              isInternal: '$project.isInternal',
              stack: '$stack',
            },
          },
        },
      },

      {
        $lookup: {
          as: 'activeProjects',
          foreignField: '_id',
          from: 'projects',
          localField: 'activeProjects',
        },
      },

      {
        $unwind: {
          path: '$activeProjects',
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $lookup: {
          from: 'stacks',
          localField: 'activeProjects.stack',
          as: 'activeProjects.stack',
          foreignField: '_id',
        },
      },
      {
        $unwind: {
          path: '$activeProjects.stack',
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $group: {
          _id: {
            _id: '$_id',
            activeProjectId: '$activeProjects._id',
          },
          name: { $first: '$name' },
          avatar: { $first: '$avatar' },
          lastName: { $first: '$lastName' },
          position: { $first: '$position' },
          phone: { $first: '$phone' },
          skype: { $first: '$skype' },
          slack: { $first: '$slack' },
          dob: { $first: '$dob' },
          github: { $first: '$github' },
          englishLevel: { $first: '$englishLevel' },
          email: { $first: '$email' },
          activeProjects: {
            $first: {
              _id: '$activeProjects._id',
              name: '$activeProjects.name',
              startDate: '$activeProjects.startDate',
              endDate: '$activeProjects.endDate',
              isInternal: '$activeProjects.isInternal',
            },
          },
          projects: {
            $first: '$projects',
          },

          stack: { $push: '$activeProjects.stack' },
        },
      },
      {
        $sort: {
          'activeProjects.endDate': 1,
        },
      },
      {
        $group: {
          _id: '$_id._id',
          name: { $first: '$name' },
          avatar: { $first: '$avatar' },
          lastName: { $first: '$lastName' },
          position: { $first: '$position' },
          phone: { $first: '$phone' },
          skype: { $first: '$skype' },
          slack: { $first: '$slack' },
          dob: { $first: '$dob' },
          github: { $first: '$github' },
          englishLevel: { $first: '$englishLevel' },
          email: { $first: '$email' },
          projects: { $first: '$projects' },
          activeProjects: {
            $push: {
              _id: '$activeProjects._id',
              name: '$activeProjects.name',
              startDate: '$activeProjects.startDate',
              endDate: '$activeProjects.endDate',
              isInternal: '$activeProjects.isInternal',
              stack: '$stack',
            },
          },
        },
      },
    ]);

    user.activeProjects?.sort((a: IProject, b: IProject) =>
      a.isInternal ? 1 : b.isInternal ? -1 : 0,
    );
    user.projects?.sort((a: IProject, b: IProject) =>
      a.isInternal ? 1 : b.isInternal ? -1 : 0,
    );
    user.activeProjects?.sort((a: IProject, b: IProject) =>
      a.endDate ? 1 : b.endDate ? -1 : 0,
    );
    user.projects?.sort((a: IProject, b: IProject) =>
      a.endDate ? 1 : b.endDate ? -1 : 0,
    );

    return user;
  }

  public async findUsersFor(
    projectId: string,
    isActive = false,
  ): Promise<Partial<IUser>[]> {
    const _id: Types.ObjectId = new Types.ObjectId(projectId);
    const match: Record<string, unknown> = {
      $match: isActive
        ? { endDate: null, projects: { $ne: _id } }
        : { endDate: null, projects: _id },
    };
    const users: Partial<IUser>[] = await this._userModel.aggregate([
      match,
      {
        $project: {
          _id: 1,
          name: 1,
          lastName: 1,
        },
      },
    ]);
    return users;
  }
}
