import { Injectable } from '@nestjs/common';
import { AbstractSyncProvider } from '../core/abstract-sync-provider';
import {
  CanonicalListing,
  CanonicalResource,
  ResourceType,
  SyncOperation,
} from '../core/canonical-resource';
import { ProviderCapabilities } from '../core/sync-provider.interface';
import { RegisterSyncProvider } from '../core/sync-provider.decorator';

/**
 * Airbnb: a property platform. It cares about Listings only, across the full
 * create/update/delete lifecycle. It has nothing to say about Messages.
 */
@Injectable()
@RegisterSyncProvider()
export class AirbnbProvider extends AbstractSyncProvider {
  readonly name = 'Airbnb';

  readonly capabilities: ProviderCapabilities = {
    [ResourceType.LISTING]: [
      SyncOperation.CREATE,
      SyncOperation.UPDATE,
      SyncOperation.DELETE,
    ],
  };

  protected async onCreate(
    resource: CanonicalResource<ResourceType.LISTING>,
  ): Promise<void> {
    const listing = resource.data as CanonicalListing;
    // Real impl: POST https://api.airbnb.com/v2/listings  (mapped payload)
    this.logger.log(
      `[API →] Creating Airbnb listing "${listing.title}" @ ${listing.currency}${listing.pricePerNight}/night, sleeps ${listing.maxGuests} (internal id ${resource.id})`,
    );
  }

  protected async onUpdate(
    resource: CanonicalResource<ResourceType.LISTING>,
  ): Promise<void> {
    const listing = resource.data as CanonicalListing;
    // Real impl: PUT https://api.airbnb.com/v2/listings/{externalId}
    this.logger.log(
      `[API →] Updating Airbnb listing "${listing.title}" (internal id ${resource.id})`,
    );
  }

  protected async onDelete(
    resource: CanonicalResource<ResourceType.LISTING>,
  ): Promise<void> {
    // Real impl: DELETE https://api.airbnb.com/v2/listings/{externalId}
    this.logger.log(
      `[API →] De-listing Airbnb listing (internal id ${resource.id})`,
    );
  }
}
