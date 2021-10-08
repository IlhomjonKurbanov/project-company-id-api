import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IFeedback } from '../interfaces/feedbacks.interface';
import { FeedbacksService } from '../services/feedbacks.service';

@ApiTags('feedbacks')
@Controller('feedbacks')
export class FeedbacksController {
  public constructor(private readonly _feedbacksService: FeedbacksService) {}

  @Get()
  public async findFeedbacks(): Promise<IFeedback[]> {
    return await this._feedbacksService.findFeedbacks();
  }
}
