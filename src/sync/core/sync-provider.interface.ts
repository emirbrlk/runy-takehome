import { ResourceType, SyncOperation } from './canonical-resource';
import { SyncEvent } from './sync-event';

/**
 * Capability declaration.
 *
 * Each provider states, in data, exactly which resource types and operations
 * it can handle. The orchestrator reads this to route events — nobody has to
 * write `if (platform === 'airbnb')` branching anywhere.
 *
 *   { [ResourceType.LISTING]: [CREATE, UPDATE, DELETE] }
 */
export type ProviderCapabilities = Partial<
  Record<ResourceType, SyncOperation[]>
>;

/**
 * The Strategy interface every external platform implements.
 *
 * This is the seam of the whole system: internal code talks to `SyncProvider`,
 * never to Airbnb/Gmail/Slack directly. Adding a platform = one new class that
 * implements this interface and is decorated as a provider.
 */
export interface SyncProvider {
  /** Human-readable id, used for logging and routing diagnostics. */
  readonly name: string;

  /** What this provider is able (and willing) to sync. */
  readonly capabilities: ProviderCapabilities;

  /**
   * Perform the sync for a single event.
   * In a real system this maps canonical -> platform payload and calls the API.
   * Here it console.logs the action it *would* take.
   */
  sync(event: SyncEvent): Promise<void>;
}
