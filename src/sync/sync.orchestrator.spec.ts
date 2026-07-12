import { Test } from '@nestjs/testing';
import { SyncOrchestrator } from './sync.orchestrator';
import { SyncProviderRegistry } from './sync-provider.registry';
import {
  CanonicalResource,
  ResourceType,
  SyncOperation,
} from './core/canonical-resource';
import { SyncEvent } from './core/sync-event';
import { SyncProvider } from './core/sync-provider.interface';

/**
 * These tests exercise the two properties the architecture promises:
 *  1. Events are routed ONLY to capability-matching providers.
 *  2. A failing provider never blocks the others (fault isolation).
 */
describe('SyncOrchestrator', () => {
  const makeProvider = (
    name: string,
    caps: SyncProvider['capabilities'],
    impl?: () => Promise<void>,
  ): jest.Mocked<SyncProvider> => ({
    name,
    capabilities: caps,
    sync: jest.fn(impl ?? (() => Promise.resolve())),
  });

  const listingCreated: SyncEvent = {
    operation: SyncOperation.CREATE,
    resource: {
      type: ResourceType.LISTING,
      id: 'listing_1',
      data: {
        title: 'Test',
        description: '',
        pricePerNight: 100,
        currency: '€',
        address: 'x',
        maxGuests: 2,
      },
      occurredAt: new Date('2026-07-12T00:00:00Z'),
    } as CanonicalResource,
  };

  async function buildWith(providers: SyncProvider[]) {
    const registry = {
      getProvidersFor: (type: ResourceType, op: SyncOperation) =>
        providers.filter((p) => (p.capabilities[type] ?? []).includes(op)),
    } as unknown as SyncProviderRegistry;

    const moduleRef = await Test.createTestingModule({
      providers: [
        SyncOrchestrator,
        { provide: SyncProviderRegistry, useValue: registry },
      ],
    }).compile();

    return moduleRef.get(SyncOrchestrator);
  }

  it('routes an event only to providers that declare the capability', async () => {
    const airbnb = makeProvider('Airbnb', {
      [ResourceType.LISTING]: [SyncOperation.CREATE],
    });
    const gmail = makeProvider('Gmail', {
      [ResourceType.MESSAGE]: [SyncOperation.CREATE],
    });

    const orchestrator = await buildWith([airbnb, gmail]);
    await orchestrator.handle(listingCreated);

    expect(airbnb.sync).toHaveBeenCalledWith(listingCreated);
    expect(gmail.sync).not.toHaveBeenCalled();
  });

  it('isolates failures — one provider throwing does not stop the others', async () => {
    const failing = makeProvider(
      'Flaky',
      { [ResourceType.LISTING]: [SyncOperation.CREATE] },
      () => Promise.reject(new Error('boom')),
    );
    const healthy = makeProvider('Healthy', {
      [ResourceType.LISTING]: [SyncOperation.CREATE],
    });

    const orchestrator = await buildWith([failing, healthy]);
    await expect(orchestrator.handle(listingCreated)).resolves.not.toThrow();

    expect(failing.sync).toHaveBeenCalled();
    expect(healthy.sync).toHaveBeenCalled(); // still ran despite the failure
  });
});
