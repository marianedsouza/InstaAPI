import { Injectable, BadRequestException, Logger, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../cache/cache.service';
import { SearchProfileDto } from './dto/instagram.dto';
import axios from 'axios';

@Injectable()
export class InstagramService {
  private readonly logger = new Logger(InstagramService.name);
  private readonly apifyToken: string;
  private readonly instagramProfileActorId: string;
  private readonly instagramPostsActorId: string;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private cacheService: CacheService,
  ) {
    this.apifyToken = configService.get('APIFY_API_TOKEN');
    this.instagramProfileActorId = configService.get('APIFY_INSTAGRAM_PROFILE_ACTOR_ID');
    this.instagramPostsActorId = configService.get('APIFY_INSTAGRAM_POSTS_ACTOR_ID');

    if (!this.apifyToken) {
      this.logger.warn('APIFY_API_TOKEN not configured');
    }
  }

  async searchProfile(userId: string, searchDto: SearchProfileDto) {
    const { username } = searchDto;
    const cleanUsername = username.replace(/^@/, '');

    // Check cache
    const cached = await this.cacheService.get(`instagram:profile:${cleanUsername}`);
    if (cached) {
      this.logger.log(`Profile ${cleanUsername} found in cache`);
      return cached;
    }

    // Check if already in database
    const existingProfile = await this.prisma.instagramProfile.findUnique({
      where: { username: cleanUsername },
    });

    if (existingProfile) {
      // Update cache
      await this.cacheService.set(
        `instagram:profile:${cleanUsername}`,
        existingProfile,
        60 * 60 * 24, // 24 hours
      );
      return existingProfile;
    }

    // Fetch from Apify
    const profileData = await this.fetchProfileFromApify(cleanUsername);

    if (!profileData) {
      throw new BadRequestException('Profile not found on Instagram');
    }

    // Save to database
    const profile = await this.prisma.instagramProfile.create({
      data: {
        userId,
        instagramId: profileData.id,
        username: cleanUsername,
        fullName: profileData.fullName,
        bio: profileData.biography,
        profilePictureUrl: profileData.profilePictureUrl,
        followers: profileData.followers || 0,
        following: profileData.following || 0,
        postsCount: profileData.postsCount || 0,
        category: profileData.category,
        isVerified: profileData.isVerified || false,
        isBusinessAccount: profileData.isBusinessAccount || false,
        website: profileData.website,
        email: profileData.email,
        phone: profileData.phone,
        profileUrl: `https://instagram.com/${cleanUsername}`,
      },
    });

    // Cache the profile
    await this.cacheService.set(
      `instagram:profile:${cleanUsername}`,
      profile,
      60 * 60 * 24, // 24 hours
    );

    // Log audit
    await this.prisma.profileAuditLog.create({
      data: {
        profileId: profile.id,
        action: 'CREATE',
        changesAfter: JSON.stringify(profile),
        reason: 'Profile scraped via Apify',
      },
    });

    this.logger.log(`Profile created: ${cleanUsername}`);

    return profile;
  }

  async getPosts(userId: string, profileId: string, limit: number = 30) {
    // Check if profile exists and belongs to user
    const profile = await this.prisma.instagramProfile.findFirst({
      where: {
        id: profileId,
        userId,
      },
    });

    if (!profile) {
      throw new BadRequestException('Profile not found');
    }

    // Check cache
    const cached = await this.cacheService.get(`instagram:posts:${profileId}`);
    if (cached) {
      this.logger.log(`Posts for ${profile.username} found in cache`);
      return cached;
    }

    // Check if posts exist in database
    const existingPosts = await this.prisma.instagramPost.findMany({
      where: { profileId },
      orderBy: { postedAt: 'desc' },
      take: limit,
    });

    if (existingPosts.length > 0) {
      await this.cacheService.set(
        `instagram:posts:${profileId}`,
        existingPosts,
        60 * 60 * 12, // 12 hours
      );
      return existingPosts;
    }

    // Fetch from Apify
    const postsData = await this.fetchPostsFromApify(profile.username, limit);

    if (!postsData || postsData.length === 0) {
      return [];
    }

    // Save to database
    const posts = await Promise.all(
      postsData.map((post: any) =>
        this.prisma.instagramPost.create({
          data: {
            profileId,
            instagramPostId: post.id,
            caption: post.caption,
            postUrl: post.url,
            mediaType: post.mediaType,
            mediaUrl: post.mediaUrl,
            thumbnailUrl: post.thumbnailUrl,
            videoUrl: post.videoUrl,
            likes: post.likes || 0,
            comments: post.comments || 0,
            shares: post.shares || 0,
            saves: post.saves || 0,
            views: post.views,
            hashtags: this.extractHashtags(post.caption),
            mentions: this.extractMentions(post.caption),
            postedAt: new Date(post.timestamp),
          },
        }),
      ),
    );

    // Cache the posts
    await this.cacheService.set(
      `instagram:posts:${profileId}`,
      posts,
      60 * 60 * 12, // 12 hours
    );

    this.logger.log(`Fetched ${posts.length} posts for ${profile.username}`);

    return posts;
  }

  private async fetchProfileFromApify(username: string) {
    try {
      const response = await axios.post(
        `https://api.apify.com/v2/acts/${this.instagramProfileActorId}/runs`,
        {
          username: username.replace(/^@/, ''),
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apifyToken}`,
          },
        },
      );

      const runId = response.data.data.id;

      // Wait for actor to finish
      await this.waitForActorCompletion(runId);

      // Get the results
      const resultsResponse = await axios.get(
        `https://api.apify.com/v2/acts/${this.instagramProfileActorId}/runs/${runId}/dataset/items`,
        {
          headers: {
            'Authorization': `Bearer ${this.apifyToken}`,
          },
        },
      );

      const result = resultsResponse.data[0];

      if (!result) {
        return null;
      }

      return {
        id: result.id,
        fullName: result.fullName,
        biography: result.biography,
        profilePictureUrl: result.profilePictureUrl,
        followers: result.followersCount,
        following: result.followingCount,
        postsCount: result.postsCount,
        isVerified: result.isVerified,
        isBusinessAccount: result.isBusinessAccount,
        category: result.category,
        website: result.website,
        email: result.email,
        phone: result.phone,
      };
    } catch (error) {
      this.logger.error(`Error fetching profile from Apify: ${error.message}`);
      throw error;
    }
  }

  private async fetchPostsFromApify(username: string, limit: number) {
    try {
      const response = await axios.post(
        `https://api.apify.com/v2/acts/${this.instagramPostsActorId}/runs`,
        {
          username: username.replace(/^@/, ''),
          limit,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apifyToken}`,
          },
        },
      );

      const runId = response.data.data.id;

      // Wait for actor to finish
      await this.waitForActorCompletion(runId);

      // Get the results
      const resultsResponse = await axios.get(
        `https://api.apify.com/v2/acts/${this.instagramPostsActorId}/runs/${runId}/dataset/items`,
        {
          headers: {
            'Authorization': `Bearer ${this.apifyToken}`,
          },
        },
      );

      return resultsResponse.data;
    } catch (error) {
      this.logger.error(`Error fetching posts from Apify: ${error.message}`);
      throw error;
    }
  }

  private async waitForActorCompletion(runId: string, maxWaitTime: number = 300000) {
    const startTime = Date.now();
    const pollInterval = 5000; // 5 seconds

    while (Date.now() - startTime < maxWaitTime) {
      const response = await axios.get(
        `https://api.apify.com/v2/acts/runs/${runId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apifyToken}`,
          },
        },
      );

      const { status } = response.data.data;

      if (status === 'SUCCEEDED') {
        return true;
      }

      if (status === 'FAILED' || status === 'ABORTED') {
        throw new BadRequestException(`Actor run failed with status: ${status}`);
      }

      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }

    throw new BadRequestException('Actor run timeout');
  }

  private extractHashtags(text: string): string[] {
    if (!text) return [];
    const matches = text.match(/#\w+/g);
    return matches ? matches.map((tag) => tag.substring(1)) : [];
  }

  private extractMentions(text: string): string[] {
    if (!text) return [];
    const matches = text.match(/@\w+/g);
    return matches ? matches.map((mention) => mention.substring(1)) : [];
  }

  async getProfileByUsername(userId: string, username: string) {
    const profile = await this.prisma.instagramProfile.findFirst({
      where: {
        username: username.replace(/^@/, ''),
        userId,
      },
      include: {
        analysis: true,
        posts: {
          orderBy: { postedAt: 'desc' },
          take: 30,
        },
      },
    });

    if (!profile) {
      throw new BadRequestException('Profile not found');
    }

    return profile;
  }
}
