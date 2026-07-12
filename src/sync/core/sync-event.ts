import { CanonicalResource, SyncOperation } from './canonical-resource';

/**
 * The single event name every domain publishes and the orchestrator listens to.
 *
 * Domains emit ONE generic event rather than platform-specific ones. They have
 * no idea who (if anyone) is listening — that is the orchestrator's job to route.
 */
export const SYNC_EVENT = 'sync.resource.changed';

/** The payload carried on every sync event. */
export interface SyncEvent {
  operation: SyncOperation;
  resource: CanonicalResource;
}
