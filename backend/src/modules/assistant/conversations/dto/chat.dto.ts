import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { MAX_USER_MESSAGE_LENGTH } from '../assistant-prompts.js';

export class SendMessageDto {
  @ApiPropertyOptional({
    description: 'ID de conversación existente; si se omite se crea una nueva',
  })
  @IsUUID('4')
  @IsOptional()
  conversationId?: string;

  @ApiProperty({
    example: 'Hola, quiero un masaje relajante mañana en la tarde',
    description: 'Mensaje del cliente al asistente (se sanea antes de procesar)',
  })
  @IsString()
  @IsNotEmpty({ message: 'El mensaje no puede estar vacío' })
  @MaxLength(MAX_USER_MESSAGE_LENGTH)
  message: string;
}

export class ChatReplyDto {
  @ApiProperty({ description: 'ID de la conversación (nueva o continuada)' })
  conversationId: string;

  @ApiProperty({ description: 'Respuesta del asistente en español' })
  reply: string;
}
