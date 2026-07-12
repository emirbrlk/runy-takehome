import { Injectable } from '@nestjs/common';
import { AbstractSyncProvider } from '../core/abstract-sync-provider';
import {
  CanonicalMessage,
  CanonicalResource,
  ResourceType,
  SyncOperation,
} from '../core/canonical-resource';
import { ProviderCapabilities } from '../core/sync-provider.interface';
import { RegisterSyncProvider } from '../core/sync-provider.decorator';

/**
 * Gmail: a communications platform. It only handles outbound Messages, and only
 * on create (you send an email; you don't "update" or "delete" a sent one).
 * This asymmetry is exactly why capabilities are per-operation, not per-resource.
 */
@Injectable()
@RegisterSyncProvider()
export class GmailProvider extends AbstractSyncProvider {
  readonly name = 'Gmail';

  readonly capabilities: ProviderCapabilities = {
    [ResourceType.MESSAGE]: [SyncOperation.CREATE],
  };

  protected async onCreate(
    resource: CanonicalResource<ResourceType.MESSAGE>,
  ): Promise<void> {
    const message = resource.data as CanonicalMessage;
    // Real impl: gmail.users.messages.send({ raw: <mapped MIME> })
    this.logger.log(
      `[API →] Sending email to ${message.to} — "${message.subject ?? '(no subject)'}": ${message.body}`,
    );
  }
}
