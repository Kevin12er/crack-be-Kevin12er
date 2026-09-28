import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';

import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

describe('TasksController', () => {
  let controller: TasksController;

  const tasksServiceMock = {
    create: jest.fn<(...args: any[]) => Promise<any>>(),
    findAll: jest.fn<(...args: any[]) => Promise<any>>(),
    findOne: jest.fn<(...args: any[]) => Promise<any>>(),
    update: jest.fn<(...args: any[]) => Promise<any>>(),
    remove: jest.fn<(...args: any[]) => Promise<any>>(),
  };

  const guardMock = {
    canActivate: jest.fn(() => true),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TasksController],
      providers: [
        {
          provide: TasksService,
          useValue: tasksServiceMock,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(guardMock)
      .compile();

    controller = module.get<TasksController>(TasksController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call TasksService.create with DTO and userId', async () => {
      const createTaskDto = {
        title: 'Task Baru',
      } as CreateTaskDto;

      const request = {
        user: {
          userId: 'user-123',
        },
      };

      const createdTask = {
        id: 1,
        title: 'Task Baru',
        userId: 'user-123',
      };

      tasksServiceMock.create.mockResolvedValue(createdTask);

      const result = await controller.create(createTaskDto, request);

      expect(result).toEqual(createdTask);
      expect(tasksServiceMock.create).toHaveBeenCalledWith(
        createTaskDto,
        'user-123',
      );
    });
  });

  describe('findAll', () => {
    it('should call TasksService.findAll', async () => {
      const tasks = [{ id: 1, title: 'Task 1' }];

      tasksServiceMock.findAll.mockResolvedValue(tasks);

      const result = await controller.findAll();

      expect(result).toEqual(tasks);
      expect(tasksServiceMock.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should call TasksService.findOne', async () => {
      const task = {
        id: 1,
        title: 'Task 1',
      };

      tasksServiceMock.findOne.mockResolvedValue(task);

      const result = await controller.findOne(1);

      expect(result).toEqual(task);
      expect(tasksServiceMock.findOne).toHaveBeenCalledWith(1);
    });
  });

  describe('update', () => {
    it('should call TasksService.update', async () => {
      const updateTaskDto = {
        title: 'Task Updated',
      } as UpdateTaskDto;

      const updatedTask = {
        id: 1,
        title: 'Task Updated',
      };

      tasksServiceMock.update.mockResolvedValue(updatedTask);

      const result = await controller.update(1, updateTaskDto);

      expect(result).toEqual(updatedTask);
      expect(tasksServiceMock.update).toHaveBeenCalledWith(
        1,
        updateTaskDto,
      );
    });
  });

  describe('remove', () => {
    it('should call TasksService.remove', async () => {
      const response = {
        message: 'Task dengan ID 1 berhasil dihapus',
      };

      tasksServiceMock.remove.mockResolvedValue(response);

      const result = await controller.remove(1);

      expect(result).toEqual(response);
      expect(tasksServiceMock.remove).toHaveBeenCalledWith(1);
    });
  });
});