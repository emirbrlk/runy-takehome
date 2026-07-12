/**
 * The INTERNAL Listing entity — our own rich model. It is deliberately shaped
 * for our platform's needs and knows nothing about Airbnb or any other channel.
 */
export interface Listing {
  id: string;
  name: string;
  summary: string;
  nightlyRate: number; // stored in minor units? kept simple here
  currency: string;
  street: string;
  city: string;
  country: string;
  sleeps: number;
  createdAt: Date;
}

export interface CreateListingDto {
  name: string;
  summary: string;
  nightlyRate: number;
  currency: string;
  street: string;
  city: string;
  country: string;
  sleeps: number;
}

export type UpdateListingDto = Partial<CreateListingDto>;
