import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import * as Joi from 'joi'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { HealthModule } from './health/health.module'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Todo } from './entities/todo.entity'
import { User } from './entities/user.entity'
import { Tag } from './entities/tag.entity'
import { Project } from './entities/project.entity'
import { Reminder } from './entities/reminder.entity'
import { TodoModule } from './todo/todo.module'

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			validationSchema: Joi.object({
				NODE_ENV: Joi.string()
					.valid('development', 'production', 'test')
					.default('development'),
				PORT: Joi.number().default(3000),
				DATABASE_URL: Joi.string().required(),
			}),
		}),
		TypeOrmModule.forRoot({
			type: 'mysql',
			host: process.env.DATABASE_HOST || 'localhost',
			port: parseInt(process.env.DATABASE_PORT, 10) || 3306,
			username: process.env.DATABASE_USERNAME || 'root',
			password: process.env.DATABASE_PASSWORD || 'yun',
			database: process.env.DATABASE_NAME || 'todo',
			synchronize: true,
			logging: true,
			entities: [Todo, User, Tag, Project, Reminder],
			poolSize: 10,
			connectorPackage: 'mysql2',
		}),
		HealthModule,
		TodoModule,
	],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule {}
