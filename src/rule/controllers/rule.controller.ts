import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RuleService } from '../services/rule.service';
import { IRule } from '../interfaces/rule.interface';

@ApiTags('rule')
@Controller('rule')
export class RuleController {
  public constructor(private readonly ruleService: RuleService) {}

  @Get()
  public async findRules(): Promise<IRule[]> {
    return await this.ruleService.findRules();
  }
}
