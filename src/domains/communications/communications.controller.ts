import { Body, Controller, Get, Post } from '@nestjs/common';
import { CommunicationsService } from './communications.service';
import { CreateMessageDto } from './message.entity';

@Controller('messages')
export class CommunicationsController {
  constructor(private readonly communications: CommunicationsService) {}

  @Get()
  findAll() {
    return this.communications.findAll();
  }

  @Post()
  send(@Body() dto: CreateMessageDto) {
    return this.communications.send(dto);
  }
}
