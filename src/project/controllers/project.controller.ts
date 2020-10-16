import {
  Controller,
  HttpStatus,
  Get,
  Res,
  Body,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ProjectService } from '../services/project.service';
import { CreateProjectDto } from 'src/rule/dto/rule.dto';
import { Response, Request } from 'express';
import { IProject } from '../interfaces/project.interface';
import { ProjectFilterDto } from '../dto/filter-projects.dto';
import { IUser } from 'scripts/interfaces/user.interface';
import { Roles } from 'src/auth/enums/role.enum';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('projects')
@Controller('projects')
export class ProjectController {
  public constructor(private readonly projectService: ProjectService) {}

  @ApiOperation({
    summary: 'Find all projects.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Found projects',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Record not found',
  })
  @UseGuards(AuthGuard('jwt'))
  @Get()
  public async findProjects(
    @Res() res: Response,
    @Req() req: Request,
    @Query() query: ProjectFilterDto,
  ): Promise<Response> {
    try {
      const { role } = req.user as IUser;
      const projects: IProject[] = await this.projectService.findProjects(
        query,
        role === 'admin' ? Roles.ADMIN : Roles.USER,
      );
      return res.status(HttpStatus.OK).json({ data: projects, error: null });
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ data: null, error });
    }
  }

  @ApiOperation({
    summary: 'Find projects by uid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Found project',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Record not found',
  })
  @UseGuards(AuthGuard('jwt'))
  @Get('/:id')
  public async findById(
    @Res() res: Response,
    @Param('id') id: string,
  ): Promise<Response> {
    try {
      const project: IProject = await this.projectService.findById(id);
      return res.status(HttpStatus.OK).json({ data: project, error: null });
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ data: null, error });
    }
  }

  @ApiOperation({
    summary: 'Create new project',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Success add project',
  })
  @UseGuards(AuthGuard('jwt'))
  @Post()
  public async createProject(
    @Body() project: CreateProjectDto,
  ): Promise<IProject> {
    return this.projectService.createProject(project);
  }
}