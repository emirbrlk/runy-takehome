import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DiscoveryService, Reflector } from '@nestjs/core';
import { ResourceType, SyncOperation } from './core/canonical-resource';
import { SYNC_PROVIDER_METADATA } from './core/sync-provider.decorator';
import { SyncProvider } from './core/sync-provider.interface';

/**
 * Discovers every `@RegisterSyncProvider()` in the DI container at startup and
 * answers the only question the orchestrator ever asks:
 *
 *   "Given this resource type + operation, who can handle it?"
 *
 * Routing is pure data (each provider's `capabilities`), so there is no central
 * switch statement and no coupling between the registry and any concrete
 * platform. New providers light up automatically.
 */
@Injectable()
export class SyncProviderRegistry implements OnModuleInit {
  private readonly logger = new Logger(SyncProviderRegistry.name);
  private readonly providers: SyncProvider[] = [];

  constructor(
    private readonly discovery: DiscoveryService,
    private readonly reflector: Reflector,
  ) {}

  onModuleInit(): void {
    for (const wrapper of this.discovery.getProviders()) {
      const { instance, metatype } = wrapper;
      if (!instance || !metatype) continue;

      const isSyncProvider = this.reflector.get<boolean>(
        SYNC_PROVIDER_METADATA,
        metatype,
      );
      if (isSyncProvider) {
        this.providers.push(instance as SyncProvider);
      }
    }

    this.logger.log(
      `Registered ${this.providers.length} sync provider(s): ` +
        this.providers.map((p) => p.name).join(', '),
    );
  }

  /** All providers whose capabilities cover this resource type + operation. */
  getProvidersFor(type: ResourceType, operation: SyncOperation): SyncProvider[] {
    return this.providers.filter((provider) =>
      (provider.capabilities[type] ?? []).includes(operation),
    );
  }

  /** Exposed for diagnostics / the capabilities endpoint. */
  all(): readonly SyncProvider[] {
    return this.providers;
  }
}
