import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { TicketStatus, TicketPriority, TicketCategory } from '../entities/ticket.entity';

export class UpdateTicketDto {
  @IsOptional()
  @IsString()
  asunto?: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsEnum(TicketCategory)
  categoria?: TicketCategory;

  @IsOptional()
  @IsEnum(TicketPriority)
  prioridad?: TicketPriority;

  @IsOptional()
  @IsEnum(TicketStatus)
  estado?: TicketStatus;

  @IsOptional()
  @IsUUID()
  agente_id?: string;

  @IsOptional()
  @IsString()
  agente_nombre?: string;
}
