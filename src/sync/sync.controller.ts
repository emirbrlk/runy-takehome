import { Controller, Get } from '@nestjs/common';
import { SyncProviderRegistry } from './sync-provider.registry';

/**
 * Diagnostics: exposes the live routing matrix — which platform handles which
 * resource + operation. Because it is derived from each provider's declared
 * capabilities, it is always accurate with zero manual upkeep.
 */
@Controller('sync')
export class SyncController {
  constructor(private readonly registry: SyncProviderRegistry) {}

  @Get('capabilities')
  capabilities() {
    return this.registry.all().map((provider) => ({
      provider: provider.name,
      capabilities: provider.capabilities,
    }));
  }
}
