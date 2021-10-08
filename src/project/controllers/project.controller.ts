import { ParseObjectIdPipe } from './../../shared/pipes/string-object-id.pipe';
import { DateNormalizePipe } from './../../shared/pipes/date-normalize.pipe';
import { UserService } from './../../auth/services/user.service';
import { Positions } from './../../auth/enums/positions.enum';
import { ProjectStatus } from './../enums/project-status.enum';
import {
  Controller,
  Get,
  Body,
  Param,
  Post,
  Query,
  UseGuards,
  Put,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ProjectService } from '../services/project.service';
import { IProject } from '../interfaces/project.interface';
import { ProjectFilterDto } from '../dto/filter-projects.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/shared/guards/roles.guard';
import { CreateProjectDto } from '../dto/project.dto';
import { GetUser } from 'src/shared/decorators/get-user.decorator';
import { Types } from 'mongoose';

@ApiTags('projects')
@Controller('projects')
export class ProjectController {
  public constructor(
    private readonly projectService: ProjectService,
    private readonly _userService: UserService,
  ) {}

  @UseGuards(
    AuthGuard('jwt'),
    new RolesGuard({
      [Positions.OWNER]: [],
      [Positions.DEVELOPER]: ['uid', 'stack', 'isInternal', 'status'],
    }),
  )
  @Get()
  public async findProjects(
    @Query() query: ProjectFilterDto,
    @GetUser() { position }: { position: Positions },
  ): Promise<IProject[]> {
    return await this.projectService.findProjects(query, position);
  }

  @Get('portfolio/all')
  public async findPortfolio(): Promise<Partial<IProject>[]> {
    return await this.projectService.findPortfolio();
  }

  @Get('portfolio/id/:id')
  public async findPortfolioById(
    @Param('id') id: string,
  ): Promise<Partial<IProject>> {
    return await this.projectService.findPortfolioById(id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('/:id')
  public async findById(@Param('id') id: string): Promise<IProject> {
    return await this.projectService.findById(id);
  }

  @UseGuards(AuthGuard('jwt'), new RolesGuard(Positions.OWNER))
  @Post()
  public async createProject(
    @Body() createProjectDto: CreateProjectDto,
    @Body('startDate', DateNormalizePipe) startDate: Date,
  ): Promise<IProject> {
    return await this.projectService.createProject({
      ...createProjectDto,
      startDate,
    });
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('users/:uid')
  public async findProjectsFor(
    @Param('uid', ParseObjectIdPipe) uid: Types.ObjectId,
    @GetUser() { position }: { position: Positions },
  ): Promise<Partial<IProject>[]> {
    return await this.projectService.findProjectFor(
      uid,
      position === Positions.OWNER,
    );
  }

  @Get('absent/users/:uid')
  public async findAbsentProjects(
    @Param('uid', ParseObjectIdPipe) uid: Types.ObjectId,
  ): Promise<Partial<IProject>[]> {
    return await this.projectService.findAbsentProjects(uid);
  }

  @Put(':id/:status')
  public async archiveProject(
    @Param('id') id: string,
    @Param('status') status: ProjectStatus,
  ): Promise<IProject> {
    const project: IProject = await this.projectService.archivateProject(
      id,
      status,
    );
    await this._userService.removeUserFromActiveProject(null, project._id);
    return project;
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('active/users/:uid')
  public async findActiveProjectsFor(
    @Param('uid', ParseObjectIdPipe) uid: Types.ObjectId,
    @GetUser() { position }: { position: Positions },
  ): Promise<Partial<IProject>[]> {
    return await this.projectService.findProjectFor(
      uid,
      position === Positions.DEVELOPER,
    );
  }
}
