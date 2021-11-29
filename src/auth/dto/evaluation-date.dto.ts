import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsNumber } from 'class-validator';

export class EvaluationDateDto {
  @IsDateString()
  @IsNotEmpty()
  @ApiProperty()
  public date!: string;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty()
  public salary!: number;
}
