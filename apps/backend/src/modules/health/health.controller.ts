import { Controller, Get, ApiTags, ApiOperation } from '@nestjs/common';
import { HealthService } from './health.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Health check' })
  check() {
    return this.healthService.check();
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe' })
  ready() {
    return this.healthService.ready();
  }

  @Get('live')
  @ApiOperation({ summary: 'Liveness probe' })
  live() {
    return this.healthService.live();
  }
}
