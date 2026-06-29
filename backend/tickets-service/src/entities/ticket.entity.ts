import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum TicketCategory {
  REDES = 'redes',
  HARDWARE = 'hardware',
  SOFTWARE = 'software',
}

export enum TicketPriority {
  BAJA = 'baja',
  MEDIA = 'media',
  ALTA = 'alta',
  CRITICA = 'critica',
}

export enum TicketStatus {
  ABIERTO = 'abierto',
  ASIGNADO = 'asignado',
  EN_PROGRESO = 'en_progreso',
  RESUELTO = 'resuelto',
  CERRADO = 'cerrado',
  SIN_ASIGNAR = 'sin_asignar',
}

@Entity('tickets')
export class Ticket {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  asunto: string;

  @Column('text', { nullable: true })
  descripcion: string;

  @Column({ type: 'enum', enum: TicketCategory, default: TicketCategory.SOFTWARE })
  categoria: TicketCategory;

  @Column({ type: 'enum', enum: TicketPriority, default: TicketPriority.MEDIA })
  prioridad: TicketPriority;

  @Column({ type: 'enum', enum: TicketStatus, default: TicketStatus.ABIERTO })
  estado: TicketStatus;

  @Column({ nullable: true })
  solicitante_email: string;

  @Column({ nullable: true })
  solicitante_nombre: string;

  @Column('uuid', { nullable: true })
  agente_id: string;

  @Column({ nullable: true })
  agente_nombre: string;

  @CreateDateColumn()
  creado_en: Date;

  @UpdateDateColumn()
  actualizado_en: Date;

  @Column({ nullable: true })
  resuelto_en: Date;
}
