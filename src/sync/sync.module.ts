import { Global, Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { SyncController } from './sync.controller';
import { SyncOrchestrator } from './sync.orchestrator';
import { SyncProviderRegistry } from './sync-provider.registry';
import { SyncPublisher } from './sync.publisher';
import { AirbnbProvider } from './providers/airbnb.provider';
import { GmailProvider } from './providers/gmail.provider';
import { SlackProvider } from './providers/slack.provider';

/**
 * The sync platform.
 *
 * `@Global` so any domain can inject `SyncPublisher` without re-importing.
 * `DiscoveryModule` powers the registry's auto-discovery of providers.
 *
 * Registering a new external platform is a ONE-LINE change here plus its file —
 * the orchestrator, registry, and every domain stay untouched.
 */
@Global()
@Module({
  imports: [DiscoveryModule],
  controllers: [SyncController],
  providers: [
    SyncProviderRegistry,
    SyncOrchestrator,
    SyncPublisher,
    // --- External platform providers ---
    AirbnbProvider,
    GmailProvider,
    SlackProvider,
  ],
  exports: [SyncPublisher],
})
export class SyncModule {}
