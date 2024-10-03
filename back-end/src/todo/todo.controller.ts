import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common'
import {
	ApiTags,
	ApiOperation,
	ApiResponse,
	ApiBody,
	ApiParam,
	ApiQuery,
} from '@nestjs/swagger'
import { TodoService } from './todo.service'
import { CreateTodoDto, UpdateTodoDto } from './dto/todo.dto'
import { Todo } from '../entities/todo.entity'

@ApiTags('todos')
@Controller('todos')
export class TodoController {
	constructor(private readonly todoService: TodoService) {}

	@Get()
	@ApiOperation({ summary: 'Get all todos' })
	@ApiResponse({ status: 200, description: 'Return all todos.', type: [Todo] })
	@ApiQuery({ name: 'userId', required: true, type: Number })
	async findAll(@Query('userId') userId: number): Promise<Todo[]> {
		return this.todoService.findAll(userId)
	}

	@Get(':id')
	@ApiOperation({ summary: 'Get a todo' })
	@ApiResponse({ status: 200, description: 'Return a todo.', type: Todo })
	@ApiParam({ name: 'id', type: 'number' })
	async findOne(@Param('id') id: number): Promise<Todo> {
		return this.todoService.findOne(id)
	}

	@Post()
	@ApiOperation({ summary: 'Create a todo' })
	@ApiResponse({
		status: 201,
		description: 'The todo has been successfully created.',
		type: Todo,
	})
	@ApiBody({ type: CreateTodoDto })
	async create(@Body() createTodoDto: CreateTodoDto): Promise<Todo> {
		return this.todoService.create(createTodoDto)
	}

	@Put(':id')
	@ApiOperation({ summary: 'Update a todo' })
	@ApiResponse({
		status: 200,
		description: 'The todo has been successfully updated.',
		type: Todo,
	})
	@ApiParam({ name: 'id', type: 'number' })
	@ApiBody({ type: UpdateTodoDto })
	async update(
		@Param('id') id: number,
		@Body() updateTodoDto: UpdateTodoDto
	): Promise<Todo> {
		return this.todoService.update(id, updateTodoDto)
	}

	@Delete(':id')
	@ApiOperation({ summary: 'Delete a todo' })
	@ApiResponse({ status: 200, description: 'The todo has been successfully deleted.' })
	@ApiParam({ name: 'id', type: 'number' })
	async remove(@Param('id') id: number): Promise<void> {
		return this.todoService.remove(id)
	}
}
