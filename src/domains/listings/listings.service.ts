import { Injectable, NotFoundException } from '@nestjs/common';
import { SyncPublisher } from '../../sync/sync.publisher';
import {
  CanonicalListing,
  CanonicalResource,
  ResourceType,
  SyncOperation,
} from '../../sync/core/canonical-resource';
import {
  CreateListingDto,
  Listing,
  UpdateListingDto,
} from './listing.entity';

/**
 * Owns internal Listing data (in-memory store for the challenge).
 *
 * Its ONLY relationship to the outside world is: after every write, it maps the
 * internal entity to a `CanonicalResource` and hands it to `SyncPublisher`.
 * It does not know Airbnb or Slack exist. That is the whole point.
 */
@Injectable()
export class ListingsService {
  private readonly store = new Map<string, Listing>();
  private seq = 0;

  constructor(private readonly sync: SyncPublisher) {}

  create(dto: CreateListingDto): Listing {
    const listing: Listing = {
      id: `listing_${++this.seq}`,
      ...dto,
      createdAt: new Date('2026-07-12T00:00:00Z'),
    };
    this.store.set(listing.id, listing);
    this.sync.publish(SyncOperation.CREATE, this.toCanonical(listing));
    return listing;
  }

  update(id: string, dto: UpdateListingDto): Listing {
    const existing = this.mustFind(id);
    const updated: Listing = { ...existing, ...dto };
    this.store.set(id, updated);
    this.sync.publish(SyncOperation.UPDATE, this.toCanonical(updated));
    return updated;
  }

  remove(id: string): void {
    const existing = this.mustFind(id);
    this.store.delete(id);
    this.sync.publish(SyncOperation.DELETE, this.toCanonical(existing));
  }

  findAll(): Listing[] {
    return [...this.store.values()];
  }

  private mustFind(id: string): Listing {
    const listing = this.store.get(id);
    if (!listing) throw new NotFoundException(`Listing ${id} not found`);
    return listing;
  }

  /**
   * The anti-corruption boundary: internal Listing -> canonical shape.
   * If our internal model changes, this mapper absorbs the change and every
   * downstream platform stays untouched.
   */
  private toCanonical(
    listing: Listing,
  ): CanonicalResource<ResourceType.LISTING> {
    const data: CanonicalListing = {
      title: listing.name,
      description: listing.summary,
      pricePerNight: listing.nightlyRate,
      currency: listing.currency,
      address: `${listing.street}, ${listing.city}, ${listing.country}`,
      maxGuests: listing.sleeps,
    };
    return {
      type: ResourceType.LISTING,
      id: listing.id,
      data,
      occurredAt: new Date('2026-07-12T00:00:00Z'),
    };
  }
}
