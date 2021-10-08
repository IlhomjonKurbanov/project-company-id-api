import { IFacilities } from '../interfaces/facilities.interface';
import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { FacilitiesService } from '../services/facilities.service';

@ApiTags('facilities')
@Controller('facilities')
export class FacilitiesController {
  public constructor(private readonly _facilitiesService: FacilitiesService) {}

  @Get(':facility')
  public async findFacility(
    @Param('facility') name: string,
  ): Promise<IFacilities> {
    return await this._facilitiesService.findFacility(name);
  }

  @Get()
  public async findFacilities(): Promise<IFacilities[]> {
    return await this._facilitiesService.findFacilities();
  }
}
