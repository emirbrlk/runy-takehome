import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ListingsService } from './listings.service';
import { CreateListingDto, UpdateListingDto } from './listing.entity';

/**
 * Thin HTTP surface so a reviewer can trigger the sync flow with curl.
 * Each write returns the entity AND (via logs) fans out to the right platforms.
 */
@Controller('listings')
export class ListingsController {
  constructor(private readonly listings: ListingsService) {}

  @Get()
  findAll() {
    return this.listings.findAll();
  }

  @Post()
  create(@Body() dto: CreateListingDto) {
    return this.listings.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateListingDto) {
    return this.listings.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id') id: string) {
    this.listings.remove(id);
  }
}
