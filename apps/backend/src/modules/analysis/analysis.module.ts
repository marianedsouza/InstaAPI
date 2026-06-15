import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AnalysisService } from './analysis.service';
import { AnalysisController } from './analysis.controller';

@Module({
  imports: [PrismaModule],
  controllers: [AnalysisController],
  providers: [AnalysisService],
  exports: [AnalysisService],
})
export class AnalysisModule {}
