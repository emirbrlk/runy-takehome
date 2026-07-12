import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ListingsService } from '../domains/listings/listings.service';
import { CommunicationsService } from '../domains/communications/communications.service';

/**
 * Runs a scripted scenario once the app is up, so a reviewer sees the whole
 * fan-out in the console without needing to fire any requests. Delete this
 * module and the app still works exactly the same — it is pure demonstration.
 */
@Injectable()
export class DemoService implements OnApplicationBootstrap {
  private readonly logger = new Logger('Demo');

  constructor(
    private readonly listings: ListingsService,
    private readonly communications: CommunicationsService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    // Give Nest a tick to finish wiring before we narrate.
    await new Promise((r) => setImmediate(r));

    this.banner('SCENARIO 1 — New listing created → fans out to Airbnb + Slack');
    const listing = this.listings.create({
      name: 'Sunny Loft in Lisbon',
      summary: 'Bright top-floor loft, 5 min from the river.',
      nightlyRate: 120,
      currency: '€',
      street: 'Rua da Prata 42',
      city: 'Lisbon',
      country: 'Portugal',
      sleeps: 4,
    });

    this.banner('SCENARIO 2 — Listing price updated → Airbnb only (Slack ignores updates)');
    this.listings.update(listing.id, { nightlyRate: 135 });

    this.banner('SCENARIO 3 — Guest email sent → fans out to Gmail + Slack');
    this.communications.send({
      medium: 'email',
      senderName: 'Host Team',
      recipient: 'guest@example.com',
      subject: 'Your booking is confirmed',
      content: 'Check-in is at 3pm. See you soon!',
      conversationId: 'conv_1',
    });

    this.banner('SCENARIO 4 — Listing removed → Airbnb de-lists (Slack ignores deletes)');
    this.listings.remove(listing.id);

    this.logger.log('Demo complete. Try the REST API — see README.md.');
  }

  private banner(text: string): void {
    this.logger.log('');
    this.logger.log(`──────── ${text} ────────`);
  }
}
