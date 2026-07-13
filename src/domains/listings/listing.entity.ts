import { PartialType } from '@nestjs/mapped-types';
import {
  IsInt,
  IsNotEmpty,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';

/**
 * The INTERNAL Listing entity — our own rich model. It is deliberately shaped
 * for our platform's needs and knows nothing about Airbnb or any other channel.
 */
export interface Listing {
  id: string;
  name: string;
  summary: string;
  nightlyRate: number;
  currency: string;
  street: string;
  city: string;
  country: string;
  sleeps: number;
  createdAt: Date;
}

/**
 * Validated input. The global ValidationPipe rejects requests that don't match
 * these rules with a 400 BEFORE any sync fan-out can fire — no more `undefined`
 * leaking into provider calls.
 */
export class CreateListingDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  summary: string;

  @IsPositive()
  nightlyRate: number;

  @IsString()
  @IsNotEmpty()
  currency: string;

  @IsString()
  @IsNotEmpty()
  street: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  country: string;

  @IsInt()
  @Min(1)
  sleeps: number;
}

/** Every field optional for partial updates — but still type-checked when present. */
export class UpdateListingDto extends PartialType(CreateListingDto) {}
