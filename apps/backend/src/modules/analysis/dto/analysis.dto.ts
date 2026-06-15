import { ApiProperty } from '@nestjs/swagger';

export class AnalysisResultDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  mainNiche: string;

  @ApiProperty()
  nicheConfidence: number;

  @ApiProperty()
  voiceTone: string;

  @ApiProperty()
  contentThemes: string[];

  @ApiProperty()
  engagementScore: number;

  @ApiProperty()
  growthPrognosis: string;

  @ApiProperty()
  strengths: string[];

  @ApiProperty()
  weaknesses: string[];

  @ApiProperty()
  opportunities: string[];

  @ApiProperty()
  threats: string[];

  @ApiProperty()
  recommendations: string[];

  @ApiProperty()
  analyzedAt: Date;
}
