import { Injectable } from '@nestjs/common';
import { SyncPublisher } from '../../sync/sync.publisher';
import {
  CanonicalMessage,
  CanonicalResource,
  ResourceType,
  SyncOperation,
} from '../../sync/core/canonical-resource';
import { CreateMessageDto, Message } from './message.entity';

/**
 * Owns internal Message data. Structurally identical to ListingsService — which
 * is the point: every new domain follows the same tiny recipe (write → map to
 * canonical → publish) and instantly participates in the sync system.
 */
@Injectable()
export class CommunicationsService {
  private readonly store = new Map<string, Message>();
  private seq = 0;

  constructor(private readonly sync: SyncPublisher) {}

  send(dto: CreateMessageDto): Message {
    const message: Message = {
      id: `msg_${++this.seq}`,
      ...dto,
      createdAt: new Date('2026-07-12T00:00:00Z'),
    };
    this.store.set(message.id, message);
    this.sync.publish(SyncOperation.CREATE, this.toCanonical(message));
    return message;
  }

  findAll(): Message[] {
    return [...this.store.values()];
  }

  /** Anti-corruption boundary: internal Message -> canonical shape. */
  private toCanonical(
    message: Message,
  ): CanonicalResource<ResourceType.MESSAGE> {
    const data: CanonicalMessage = {
      channel: message.medium,
      from: message.senderName,
      to: message.recipient,
      subject: message.subject,
      body: message.content,
      threadId: message.conversationId,
    };
    return {
      type: ResourceType.MESSAGE,
      id: message.id,
      data,
      occurredAt: new Date('2026-07-12T00:00:00Z'),
    };
  }
}
