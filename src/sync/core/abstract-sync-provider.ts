import { Logger } from '@nestjs/common';
import { CanonicalResource, SyncOperation } from './canonical-resource';
import { ProviderCapabilities, SyncProvider } from './sync-provider.interface';
import { SyncEvent } from './sync-event';

/**
 * Optional convenience base class.
 *
 * It turns the single `sync()` entrypoint into an operation-specific template
 * (`onCreate` / `onUpdate` / `onDelete`) so each provider only overrides the
 * hooks for operations it actually declared in `capabilities`. The orchestrator
 * guarantees a provider is only ever called for operations it supports, so the
 * default `unsupported` hooks should never fire in practice — they exist as a
 * loud safety net.
 */
export abstract class AbstractSyncProvider implements SyncProvider {
  abstract readonly name: string;
  abstract readonly capabilities: ProviderCapabilities;

  protected readonly logger = new Logger(this.constructor.name);

  async sync(event: SyncEvent): Promise<void> {
    const { operation, resource } = event;
    switch (operation) {
      case SyncOperation.CREATE:
        return this.onCreate(resource);
      case SyncOperation.UPDATE:
        return this.onUpdate(resource);
      case SyncOperation.DELETE:
        return this.onDelete(resource);
      default:
        return this.unsupported(operation, resource);
    }
  }

  protected onCreate(resource: CanonicalResource): Promise<void> {
    return this.unsupported(SyncOperation.CREATE, resource);
  }
  protected onUpdate(resource: CanonicalResource): Promise<void> {
    return this.unsupported(SyncOperation.UPDATE, resource);
  }
  protected onDelete(resource: CanonicalResource): Promise<void> {
    return this.unsupported(SyncOperation.DELETE, resource);
  }

  private unsupported(
    operation: SyncOperation,
    resource: CanonicalResource,
  ): Promise<void> {
    this.logger.warn(
      `${this.name} was routed a ${operation} on ${resource.type} but has no handler for it — check capabilities.`,
    );
    return Promise.resolve();
  }
}
