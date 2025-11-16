import { Request, Response, NextFunction } from 'express';
import { TaskService } from '../services/task.services';

const taskService = new TaskService();

declare global{
    namespace Express{
        interface Request{
            user:{
                userId:string;
            }
        }
    }
}

export class TaskController {
  async createTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user.userId;
      const task = await taskService.createTask(userId, req.body);
      res.status(201).json({
        success: true,
        message: 'Task created successfully',
        data: task,
      });
    } catch (error) {
      next(error);
    }
  }

  async getTasks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user.userId;
      const result = await taskService.getTasks(userId, req.query);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getTaskById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user.userId;
      const { id } = req.params;
      const task = await taskService.getTaskById(userId, id);
      res.status(200).json({
        success: true,
        data: task,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user.userId;
      const { id } = req.params;
      const task = await taskService.updateTask(userId, id, req.body);
      res.status(200).json({
        success: true,
        message: 'Task updated successfully',
        data: task,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user.userId;
      const { id } = req.params;
      const result = await taskService.deleteTask(userId, id);
      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  async toggleTaskStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user.userId;
      const { id } = req.params;
      const task = await taskService.toggleTaskStatus(userId, id);
      res.status(200).json({
        success: true,
        message: 'Task status toggled successfully',
        data: task,
      });
    } catch (error) {
      next(error);
    }
  }
}
