import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { SYNC_EVENT } from './core/sync-event';
import type { SyncEvent } from './core/sync-event';
import { SyncProvider } from './core/sync-provider.interface';
import { SyncProviderRegistry } from './sync-provider.registry';

/**
 * The heart of the fan-out.
 *
 * It listens for the single generic `SYNC_EVENT`, asks the registry which
 * providers care, and dispatches to each of them. Key properties:
 *
 *  - Fault isolation: one provider throwing NEVER blocks the others
 *    (Promise.allSettled), because a Gmail outage must not stop the Airbnb sync.
 *  - No coupling: it knows nothing about Airbnb/Gmail/Slack — only the interface.
 *  - Extensible: retries, dead-letter queues, and idempotency keys would slot in
 *    around `dispatch()` without changing domains or providers.
 */
@Injectable()
export class SyncOrchestrator {
  private readonly logger = new Logger(SyncOrchestrator.name);

  constructor(private readonly registry: SyncProviderRegistry) {}

  @OnEvent(SYNC_EVENT)
  async handle(event: SyncEvent): Promise<void> {
    const { operation, resource } = event;
    const providers = this.registry.getProvidersFor(resource.type, operation);

    if (providers.length === 0) {
      this.logger.debug(
        `No provider syncs ${operation} on ${resource.type} (${resource.id}) — skipping.`,
      );
      return;
    }

    this.logger.log(
      `Fanning out ${operation} on ${resource.type} (${resource.id}) → ` +
        providers.map((p) => p.name).join(', '),
    );

    const results = await Promise.allSettled(
      providers.map((provider) => this.dispatch(provider, event)),
    );

    // Surface failures without letting them cascade.
    results.forEach((result, i) => {
      if (result.status === 'rejected') {
        this.logger.error(
          `Provider "${providers[i].name}" failed to sync ${resource.type} (${resource.id}): ${result.reason}`,
        );
      }
    });
  }

  private async dispatch(
    provider: SyncProvider,
    event: SyncEvent,
  ): Promise<void> {
    // A natural seam for cross-cutting concerns: retry/backoff, idempotency
    // keys, per-provider rate limiting, metrics/tracing.
    await provider.sync(event);
  }
}
