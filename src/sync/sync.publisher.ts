import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CanonicalResource, SyncOperation } from './core/canonical-resource';
import { SYNC_EVENT, SyncEvent } from './core/sync-event';

/**
 * The one door domains use to announce a change.
 *
 * Domains depend ONLY on this small surface — not on EventEmitter internals,
 * not on event-name strings, and certainly not on any external platform. That
 * keeps the dependency arrow pointing one way: domains → sync, never the reverse.
 */
@Injectable()
export class SyncPublisher {
  constructor(private readonly emitter: EventEmitter2) {}

  publish(operation: SyncOperation, resource: CanonicalResource): void {
    const event: SyncEvent = { operation, resource };
    this.emitter.emit(SYNC_EVENT, event);
  }
}
