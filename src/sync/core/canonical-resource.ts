/**
 * The Canonical (Anti-Corruption) layer.
 *
 * Internal domains do NOT expose their raw entities to external platforms.
 * Instead, every syncable thing is normalized into a `CanonicalResource`.
 *
 * Why this matters:
 *  - Providers depend on ONE stable shape, not on N internal domain models.
 *  - Internal domains can refactor freely without breaking any integration.
 *  - Adding a new external platform never requires touching a domain.
 *
 * This is the contract that decouples "our data" from "their platforms".
 */

/** The kinds of internal data that can be synchronized. */
export enum ResourceType {
  LISTING = 'listing',
  MESSAGE = 'message',
}

/** What happened to the resource. Maps cleanly onto external CRUD APIs. */
export enum SyncOperation {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
}

/** Normalized shape of a Listing, independent of the internal Listing entity. */
export interface CanonicalListing {
  title: string;
  description: string;
  pricePerNight: number;
  currency: string;
  address: string;
  maxGuests: number;
}

/** Normalized shape of a Message, independent of the internal Message entity. */
export interface CanonicalMessage {
  channel: string; // e.g. "email", "chat"
  from: string;
  to: string;
  subject?: string;
  body: string;
  threadId?: string;
}

/** Maps a ResourceType to its canonical payload shape. */
export interface CanonicalDataMap {
  [ResourceType.LISTING]: CanonicalListing;
  [ResourceType.MESSAGE]: CanonicalMessage;
}

/**
 * A self-describing envelope that travels across the sync boundary.
 * `id` is our internal id; providers keep their own id mapping if needed.
 */
export interface CanonicalResource<T extends ResourceType = ResourceType> {
  type: T;
  id: string;
  data: CanonicalDataMap[T];
  occurredAt: Date;
}
