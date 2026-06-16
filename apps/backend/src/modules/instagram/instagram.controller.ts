import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Controller, Post, Get, Param, Body, UseGuards, Request, Query, HttpCode } from '@nestjs/common';
import { InstagramService } from './instagram.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SearchProfileDto, InstagramProfileResponseDto, InstagramPostResponseDto } from './dto/instagram.dto';

@ApiTags('Profiles')
@Controller('instagram')
@UseGuards(JwtAuthGuard)
export class InstagramController {
  constructor(private instagramService: InstagramService) {}

  @Post('search')
  @HttpCode(200)
  @ApiOperation({ summary: 'Search for Instagram profile' })
  @ApiResponse({ status: 200, description: 'Profile found', type: InstagramProfileResponseDto })
  async searchProfile(@Request() req: any, @Body() searchDto: SearchProfileDto) {
    return this.instagramService.searchProfile(req.user.id, searchDto);
  }

  @Get(':profileId/posts')
  @ApiOperation({ summary: 'Get posts from a profile' })
  @ApiResponse({ status: 200, description: 'Posts retrieved', type: [InstagramPostResponseDto] })
  async getPosts(
    @Request() req: any,
    @Param('profileId') profileId: string,
    @Query('limit') limit: number = 30,
  ) {
    return this.instagramService.getPosts(req.user.id, profileId, limit);
  }

  @Get(':username')
  @ApiOperation({ summary: 'Get profile by username' })
  @ApiResponse({ status: 200, description: 'Profile retrieved', type: InstagramProfileResponseDto })
  async getProfile(@Request() req: any, @Param('username') username: string) {
    return this.instagramService.getProfileByUsername(req.user.id, username);
  }
}
