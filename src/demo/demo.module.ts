import { Module } from '@nestjs/common';
import { DemoService } from './demo.service';
import { ListingsModule } from '../domains/listings/listings.module';
import { CommunicationsModule } from '../domains/communications/communications.module';

@Module({
  imports: [ListingsModule, CommunicationsModule],
  providers: [DemoService],
})
export class DemoModule {}
