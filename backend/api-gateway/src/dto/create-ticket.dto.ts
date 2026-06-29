import { IsEnum, IsString, IsEmail, IsOptional } from 'class-validator';
import { TicketCategory, TicketPriority } from './ticket.enums';

export class CreateTicketDto {
  @IsString()
  asunto: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsEnum(TicketCategory)
  categoria: TicketCategory;

  @IsEnum(TicketPriority)
  @IsOptional()
  prioridad?: TicketPriority = TicketPriority.MEDIA;

  @IsString()
  solicitante_nombre: string;

  @IsEmail()
  solicitante_email: string;
}
