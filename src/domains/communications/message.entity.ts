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

export interface CreateMessageDto {
  medium: 'email' | 'chat';
  senderName: string;
  recipient: string;
  subject?: string;
  content: string;
  conversationId: string;
}
