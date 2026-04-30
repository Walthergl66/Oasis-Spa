import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentProfile } from '../auth/decorators/current-profile.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../common/enums/database.enums';
import type { User } from '../users/entities/user.entity';
import { ChatService } from './chat.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { UpdateChatDto } from './dto/update-chat.dto';
import { ChatOwnershipGuard } from './guards/chat-ownership.guard';

@ApiTags('Chat')
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER, UserRole.EMPLOYEE, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  create(@CurrentProfile() profile: User, @Body() createChatDto: CreateChatDto) {
    // Do not trust client-provided userId
    createChatDto.userId = profile.id;
    return this.chatService.create(createChatDto);
  }

  @Get()
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  findAll() {
    return this.chatService.findAll();
  }

  @Get('me')
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER, UserRole.EMPLOYEE, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  findMine(@CurrentProfile() profile: User) {
    return this.chatService.findMine(profile);
  }

  @Get(':id')
  @UseGuards(SupabaseAuthGuard, RolesGuard, ChatOwnershipGuard)
  @Roles(UserRole.CUSTOMER)
  @ApiBearerAuth()
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.chatService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(SupabaseAuthGuard, RolesGuard, ChatOwnershipGuard)
  @Roles(UserRole.CUSTOMER)
  @ApiBearerAuth()
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateChatDto: UpdateChatDto,
  ) {
    // Avoid user reassignment via public API
    delete (updateChatDto as any).userId;
    return this.chatService.update(id, updateChatDto);
  }

  @Delete(':id')
  @UseGuards(SupabaseAuthGuard, RolesGuard, ChatOwnershipGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.chatService.remove(id);
  }
}
