import { IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SearchProfileDto {
  @ApiProperty({ example: '@instagram_user' })
  @IsString()
  @Matches(/^@?[a-zA-Z0-9_.]+$/, {
    message: 'Invalid Instagram username format',
  })
  username: string;
}

export class InstagramProfileResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  username: string;

  @ApiProperty()
  fullName: string;

  @ApiProperty()
  bio: string;

  @ApiProperty()
  profilePictureUrl: string;

  @ApiProperty()
  followers: number;

  @ApiProperty()
  following: number;

  @ApiProperty()
  postsCount: number;

  @ApiProperty()
  category: string;

  @ApiProperty()
  isVerified: boolean;

  @ApiProperty()
  profileUrl: string;

  @ApiProperty()
  scrapedAt: Date;
}

export class InstagramPostResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  caption: string;

  @ApiProperty()
  postUrl: string;

  @ApiProperty()
  mediaType: string;

  @ApiProperty()
  likes: number;

  @ApiProperty()
  comments: number;

  @ApiProperty()
  postedAt: Date;

  @ApiProperty()
  hashtags: string[];

  @ApiProperty()
  mediaUrl: string;
}
