import { Injectable } from '@nestjs/common';
import { AbstractSyncProvider } from '../core/abstract-sync-provider';
import {
  CanonicalListing,
  CanonicalMessage,
  CanonicalResource,
  ResourceType,
  SyncOperation,
} from '../core/canonical-resource';
import { ProviderCapabilities } from '../core/sync-provider.interface';
import { RegisterSyncProvider } from '../core/sync-provider.decorator';

/**
 * Slack: an internal-ops platform. It spans BOTH domains — it relays new
 * Messages to a channel AND posts a heads-up when a new Listing goes live.
 *
 * This provider is the proof that the model is genuinely many-to-many: one
 * platform can subscribe to multiple resource types, and one resource (a new
 * listing) can fan out to multiple platforms (Airbnb + Slack).
 */
@Injectable()
@RegisterSyncProvider()
export class SlackProvider extends AbstractSyncProvider {
  readonly name = 'Slack';

  readonly capabilities: ProviderCapabilities = {
    [ResourceType.MESSAGE]: [SyncOperation.CREATE],
    [ResourceType.LISTING]: [SyncOperation.CREATE],
  };

  protected async onCreate(resource: CanonicalResource): Promise<void> {
    // One provider, two resource types — branch on the self-describing envelope.
    if (resource.type === ResourceType.MESSAGE) {
      const message = resource.data as CanonicalMessage;
      // Real impl: chat.postMessage({ channel, text })
      this.logger.log(
        `[API →] Posting to #comms: new message from ${message.from} — "${message.body}"`,
      );
      return;
    }

    if (resource.type === ResourceType.LISTING) {
      const listing = resource.data as CanonicalListing;
      // Real impl: chat.postMessage({ channel: '#listings', text })
      this.logger.log(
        `[API →] Posting to #listings: 🏠 new listing "${listing.title}" is live (${listing.currency}${listing.pricePerNight}/night)`,
      );
    }
  }
}
