import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Todo } from '../entities/todo.entity'
import { CreateTodoDto, UpdateTodoDto } from './dto/todo.dto'
import { Equal } from 'typeorm'

@Injectable()
export class TodoService {
	constructor(
		@InjectRepository(Todo)
		private todoRepository: Repository<Todo>
	) {}

	async findAll(userId: number): Promise<Todo[]> {
		return this.todoRepository.find({
			where: {
				user: { id: Equal(userId) },
			},
		})
	}

	async findOne(id: number): Promise<Todo> {
		const todo = await this.todoRepository.findOne({ where: { id } })
		if (!todo) {
			throw new NotFoundException(`Todo with ID "${id}" not found`)
		}
		return todo
	}

	async create(createTodoDto: CreateTodoDto): Promise<Todo> {
		const todo = this.todoRepository.create(createTodoDto)
		return this.todoRepository.save(todo)
	}

	async update(id: number, updateTodoDto: UpdateTodoDto): Promise<Todo> {
		const todo = await this.findOne(id)
		Object.assign(todo, updateTodoDto)
		return this.todoRepository.save(todo)
	}

	async remove(id: number): Promise<void> {
		const result = await this.todoRepository.delete(id)
		if (result.affected === 0) {
			throw new NotFoundException(`Todo with ID "${id}" not found`)
		}
	}
}
