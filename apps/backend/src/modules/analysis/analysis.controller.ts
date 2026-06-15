import { Controller, Post, Get, Param, UseGuards, Request, ApiTags, ApiOperation, ApiResponse } from '@nestjs/common';
import { AnalysisService } from './analysis.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AnalysisResultDto } from './dto/analysis.dto';

@ApiTags('Analysis')
@Controller('analysis')
@UseGuards(JwtAuthGuard)
export class AnalysisController {
  constructor(private analysisService: AnalysisService) {}

  @Post(':profileId/analyze')
  @ApiOperation({ summary: 'Trigger AI analysis for a profile' })
  @ApiResponse({ status: 200, description: 'Analysis completed', type: AnalysisResultDto })
  async analyzeProfile(@Param('profileId') profileId: string) {
    return this.analysisService.analyzeProfile(profileId);
  }

  @Get(':profileId/analysis')
  @ApiOperation({ summary: 'Get profile analysis results' })
  @ApiResponse({ status: 200, description: 'Analysis retrieved', type: AnalysisResultDto })
  async getAnalysis(@Param('profileId') profileId: string) {
    return this.analysisService.getAnalysis(profileId);
  }
}
