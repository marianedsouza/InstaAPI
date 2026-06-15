import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CacheModule } from '../cache/cache.module';
import { InstagramService } from './instagram.service';
import { InstagramController } from './instagram.controller';

@Module({
  imports: [PrismaModule, CacheModule],
  controllers: [InstagramController],
  providers: [InstagramService],
  exports: [InstagramService],
})
export class InstagramModule {}
