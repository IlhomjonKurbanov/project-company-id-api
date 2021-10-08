import { IStack } from './../interfaces/stack.interface';
import { StackService } from './../services/stack.service';
import { Controller, Get, UseGuards, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('stack')
@Controller('stack')
export class StackController {
  public constructor(private readonly _stackService: StackService) {}

  @Get('')
  public async findStack(): Promise<IStack[]> {
    return await this._stackService.findStack();
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':uid')
  public async findStackByUid(@Param('uid') id: string): Promise<IStack[]> {
    return await this._stackService.findStackByUid(id);
  }
}
