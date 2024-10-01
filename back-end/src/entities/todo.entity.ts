import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  ManyToMany,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinTable,
} from 'typeorm';
import { User } from './user.entity';
import { Tag } from './tag.entity';
import { Project } from './project.entity';
import { Reminder } from './reminder.entity';

@Entity()
export class Todo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  text: string;

  @Column({ default: false })
  completed: boolean;

  @Column({ nullable: true })
  completedAt: Date;

  @ManyToOne(() => User, (user) => user.todos)
  user: User;

  @ManyToMany(() => Tag, (tag) => tag.todos)
  @JoinTable()
  tags: Tag[];

  @ManyToOne(() => Project, (project) => project.todos)
  project: Project;

  @OneToMany(() => Reminder, (reminder) => reminder.todo)
  reminders: Reminder[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
