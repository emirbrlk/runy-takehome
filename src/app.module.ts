import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { SyncModule } from './sync/sync.module';
import { ListingsModule } from './domains/listings/listings.module';
import { CommunicationsModule } from './domains/communications/communications.module';
import { DemoModule } from './demo/demo.module';

@Module({
  imports: [
    // Decouples domains from providers: domains emit, the orchestrator listens.
    EventEmitterModule.forRoot({ wildcard: true }),

    // The sync platform (global) — providers + orchestrator + registry.
    SyncModule,

    // Internal business domains.
    ListingsModule,
    CommunicationsModule,

    // Optional startup demonstration (safe to remove).
    DemoModule,
  ],
})
export class AppModule {}
