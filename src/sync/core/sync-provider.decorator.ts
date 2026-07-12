import { SetMetadata } from '@nestjs/common';

/**
 * Marker metadata key used by the registry to auto-discover providers.
 */
export const SYNC_PROVIDER_METADATA = 'runy:sync-provider';

/**
 * Decorate any class with `@RegisterSyncProvider()` and it becomes discoverable
 * by the SyncProviderRegistry at startup — no central list to maintain, no
 * manual wiring. This is what makes "add a platform = add a file" true.
 */
export const RegisterSyncProvider = (): ClassDecorator =>
  SetMetadata(SYNC_PROVIDER_METADATA, true);
