import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PrismaService } from '../prisma/prisma.service';
import { AnalysisResultDto } from './dto/analysis.dto';

@Injectable()
export class AnalysisService {
  private readonly logger = new Logger(AnalysisService.name);
  private genAI: GoogleGenerativeAI;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    const apiKey = this.configService.get('GEMINI_API_KEY');
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
    }
  }

  async analyzeProfile(profileId: string): Promise<AnalysisResultDto> {
    this.logger.log(`Starting analysis for profile ${profileId}`);

    try {
      // Get profile with posts
      const profile = await this.prisma.instagramProfile.findUnique({
        where: { id: profileId },
        include: {
          posts: {
            orderBy: { postedAt: 'desc' },
            take: 30,
          },
        },
      });

      if (!profile) {
        throw new Error('Profile not found');
      }

      // Prepare analysis prompt
      const analysisPrompt = this.buildAnalysisPrompt(profile);

      // Call Gemini API
      const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
      const result = await model.generateContent(analysisPrompt);
      const response = result.response;
      const analysisText = response.text();

      // Parse response
      const analysis = this.parseGeminiResponse(analysisText);

      // Calculate metrics
      const metrics = this.calculateMetrics(profile);

      // Combine analysis with metrics
      const completeAnalysis: any = {
        mainNiche: analysis.mainNiche || 'General',
        nicheConfidence: analysis.nicheConfidence || 0.7,
        voiceTone: analysis.voiceTone || 'Unknown',
        contentThemes: analysis.contentThemes || [],
        targetAudience: analysis.targetAudience || [],
        postingFrequency: metrics.postingFrequency,
        optimalPostingDayOfWeek: analysis.optimalPostingDay || 'Monday',
        optimalPostingHour: analysis.optimalPostingHour || 10,
        engagementLevel: metrics.engagementLevel,
        engagementScore: metrics.engagementScore,
        audienceGrowthRate: metrics.audienceGrowthRate,
        mainArchetypes: analysis.mainArchetypes || [],
        positioningStrategy: analysis.positioningStrategy || 'To be determined',
        strengths: analysis.strengths || [],
        weaknesses: analysis.weaknesses || [],
        opportunities: analysis.opportunities || [],
        threats: analysis.threats || [],
        growthPrognosis: analysis.growthPrognosis || 'STEADY_GROWTH',
        growthPredictedMonths: analysis.growthPredictedMonths || 6,
        riskFactors: analysis.riskFactors || [],
        recommendations: analysis.recommendations || [],
        contentRecommendations: analysis.contentRecommendations || [],
        fullAnalysis: analysisText,
        analysisJson: analysis,
        confidence: 0.85,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      };

      // Save to database
      const dbAnalysis = await this.prisma.instagramAnalysis.upsert({
        where: { profileId },
        update: completeAnalysis,
        create: {
          profileId,
          ...completeAnalysis,
        },
      });

      // Update profile last analysis date
      await this.prisma.instagramProfile.update({
        where: { id: profileId },
        data: { lastAnalysisAt: new Date() },
      });

      this.logger.log(`Analysis completed for profile ${profileId}`);

      return dbAnalysis as AnalysisResultDto;
    } catch (error) {
      this.logger.error(`Error analyzing profile: ${error.message}`);
      throw error;
    }
  }

  private buildAnalysisPrompt(profile: any): string {
    const postsText = profile.posts
      .map(
        (post: any) =>
          `Post dated ${post.postedAt}: "${post.caption}" - ${post.likes} likes, ${post.comments} comments`,
      )
      .join('\n');

    return `
Analyze this Instagram profile comprehensively:

Profile: @${profile.username}
Name: ${profile.fullName}
Bio: ${profile.bio}
Followers: ${profile.followers}
Following: ${profile.following}
Posts: ${profile.postsCount}
Verified: ${profile.isVerified}
Business Account: ${profile.isBusinessAccount}
Category: ${profile.category}

Recent Posts:
${postsText}

Please provide a detailed analysis in JSON format with the following structure:
{
  "mainNiche": "primary content niche",
  "nicheConfidence": 0.85,
  "voiceTone": "brand voice tone",
  "contentThemes": ["theme1", "theme2"],
  "targetAudience": ["CREATOR", "ENTREPRENEUR", "INFLUENCER"],
  "postingFrequency": 3.2,
  "optimalPostingDay": "Monday",
  "optimalPostingHour": 10,
  "engagementLevel": "HIGH",
  "mainArchetypes": ["archetype1", "archetype2"],
  "positioningStrategy": "strategic positioning",
  "strengths": ["strength1", "strength2"],
  "weaknesses": ["weakness1"],
  "opportunities": ["opportunity1"],
  "threats": ["threat1"],
  "growthPrognosis": "STEADY_GROWTH",
  "growthPredictedMonths": 6,
  "riskFactors": ["risk1"],
  "recommendations": ["rec1", "rec2"],
  "contentRecommendations": ["content_rec1"]
}
    `;
  }

  private parseGeminiResponse(response: string): any {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return this.getDefaultAnalysis();
    } catch (error) {
      this.logger.warn('Failed to parse Gemini response', error);
      return this.getDefaultAnalysis();
    }
  }

  private calculateMetrics(profile: any) {
    let totalLikes = 0;
    let totalComments = 0;

    profile.posts.forEach((post: any) => {
      totalLikes += post.likes || 0;
      totalComments += post.comments || 0;
    });

    const avgLikes = profile.posts.length > 0 ? totalLikes / profile.posts.length : 0;
    const avgComments = profile.posts.length > 0 ? totalComments / profile.posts.length : 0;
    const engagementScore = Math.min(
      100,
      ((avgLikes + avgComments * 2) / profile.followers) * 10000 || 0,
    );

    let engagementLevel = 'LOW';
    if (engagementScore > 60) engagementLevel = 'VERY_HIGH';
    else if (engagementScore > 40) engagementLevel = 'HIGH';
    else if (engagementScore > 20) engagementLevel = 'MEDIUM';
    else if (engagementScore > 5) engagementLevel = 'LOW';
    else engagementLevel = 'VERY_LOW';

    const postingFrequency = profile.posts.length / 4; // per week (assuming recent 4 weeks)

    return {
      engagementScore: Math.round(engagementScore),
      engagementLevel,
      postingFrequency: parseFloat(postingFrequency.toFixed(2)),
      audienceGrowthRate: 5.2, // Example default
    };
  }

  private getDefaultAnalysis() {
    return {
      mainNiche: 'Lifestyle',
      nicheConfidence: 0.5,
      voiceTone: 'Friendly',
      contentThemes: [],
      targetAudience: [],
      postingFrequency: 3,
      optimalPostingDay: 'Monday',
      optimalPostingHour: 10,
      mainArchetypes: [],
      strengths: [],
      weaknesses: [],
      opportunities: [],
      threats: [],
      recommendations: [],
      contentRecommendations: [],
    };
  }

  async getAnalysis(profileId: string) {
    const analysis = await this.prisma.instagramAnalysis.findUnique({
      where: { profileId },
    });

    if (!analysis) {
      throw new Error('Analysis not found');
    }

    // Check if analysis is expired
    if (analysis.expiresAt < new Date()) {
      // Trigger re-analysis
      return this.analyzeProfile(profileId);
    }

    return analysis;
  }
}
