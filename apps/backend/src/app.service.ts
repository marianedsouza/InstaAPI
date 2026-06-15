import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Welcome to InstaAPI - Instagram Profile Analysis Service';
  }

  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'InstaAPI Backend',
      version: '1.0.0',
    };
  }
}
