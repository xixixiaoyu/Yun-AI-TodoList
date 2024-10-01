import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Todo } from './todo.entity';

@Entity()
export class Reminder {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  reminderTime: Date;

  @Column({ default: false })
  isCompleted: boolean;

  @ManyToOne(() => Todo, (todo) => todo.reminders)
  todo: Todo;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
