import prisma from '../database';
import { TaskStatus, type Prisma } from '../generated/prisma/client';
import { AppError } from '../middlewares/error.middleware';

interface CreateTaskData {
  title: string;
  description?: string;
  status?: TaskStatus;
}

interface UpdateTaskData {
  title?: string;
  description?: string;
  status?: TaskStatus;
}

interface GetTasksQuery {
  page?: number;
  limit?: number;
  status?: TaskStatus;
  search?: string;
}

export class TaskService {
  async createTask(userId: string, data: CreateTaskData) {
    const task = await prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        status: data.status || TaskStatus.PENDING,
        userId,
      },
    });

    return task;
  }

  async getTasks(userId: string, query: GetTasksQuery) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.TaskWhereInput = { userId };

    if (query.status) {
      where.status = query.status;
    }

    if (query.search) {
      where.title = {
        contains: query.search,
        mode: 'insensitive',
      };
    }

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.task.count({ where }),
    ]);

    return {
      tasks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getTaskById(userId: string, taskId: string) {
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        userId,
      },
    });

    if (!task) {
      throw new AppError(404, 'Task not found');
    }

    return task;
  }

  async updateTask(userId: string, taskId: string, data: UpdateTaskData) {
    const task = await this.getTaskById(userId, taskId);

    const updatedTask = await prisma.task.update({
      where: { id: task.id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.description !== undefined && {
          description: data.description,
        }),
        ...(data.status && { status: data.status }),
      },
    });

    return updatedTask;
  }

  async deleteTask(userId: string, taskId: string) {
    const task = await this.getTaskById(userId, taskId);

    await prisma.task.delete({
      where: { id: task.id },
    });

    return { message: 'Task deleted successfully' };
  }

  async toggleTaskStatus(userId: string, taskId: string) {
    const task = await this.getTaskById(userId, taskId);

    const newStatus =
      task.status === TaskStatus.COMPLETED
        ? TaskStatus.PENDING
        : TaskStatus.COMPLETED;

    const updatedTask = await prisma.task.update({
      where: { id: task.id },
      data: { status: newStatus },
    });

    return updatedTask;
  }
}
