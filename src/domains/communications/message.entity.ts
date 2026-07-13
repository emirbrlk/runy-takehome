import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

/**
 * The INTERNAL Message entity. Again, our own model — it has a `medium` and a
 * `conversationId` that mean something to us, not to any specific platform.
 */
export interface Message {
  id: string;
  medium: 'email' | 'chat';
  senderName: string;
  recipient: string;
  subject?: string;
  content: string;
  conversationId: string;
  createdAt: Date;
}

/** Validated input — rejected with a 400 before any sync fan-out fires. */
export class CreateMessageDto {
  @IsIn(['email', 'chat'])
  medium: 'email' | 'chat';

  @IsString()
  @IsNotEmpty()
  senderName: string;

  @IsString()
  @IsNotEmpty()
  recipient: string;

  @IsString()
  @IsOptional()
  subject?: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsNotEmpty()
  conversationId: string;
}
