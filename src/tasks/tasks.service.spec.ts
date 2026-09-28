import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';

import { TasksService } from './tasks.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

describe('TasksService', () => {
  let service: TasksService;

const prismaMock = {
  task: {
    create: jest.fn<(...args: any[]) => Promise<any>>(),
    findMany: jest.fn<(...args: any[]) => Promise<any>>(),
    findUnique: jest.fn<(...args: any[]) => Promise<any>>(),
    update: jest.fn<(...args: any[]) => Promise<any>>(),
    delete: jest.fn<(...args: any[]) => Promise<any>>(),
  },
};

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a task', async () => {
      const createTaskDto = {
        title: 'Belajar Jest',
        description: 'Membuat unit test',
      } as CreateTaskDto;

      const userId = 'user-123';

      const createdTask = {
        id: 1,
        ...createTaskDto,
        userId,
      };

      prismaMock.task.create.mockResolvedValue(createdTask);

      const result = await service.create(createTaskDto, userId);

      expect(result).toEqual(createdTask);
      expect(prismaMock.task.create).toHaveBeenCalledWith({
        data: {
          ...createTaskDto,
          userId,
        },
      });
    });
  });

  describe('findAll', () => {
    it('should return all tasks', async () => {
      const tasks = [
        {
          id: 1,
          title: 'Task 1',
          description: 'Description 1',
          type: 'DAILY',
          isCompleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: 'user-1',
          user: {
            id: 'user-1',
            name: 'Kevin',
            email: 'kevin@example.com',
          },
        },
      ];

      prismaMock.task.findMany.mockResolvedValue(tasks);

      const result = await service.findAll();

      expect(result).toEqual(tasks);
      expect(prismaMock.task.findMany).toHaveBeenCalledWith({
        select: {
          id: true,
          title: true,
          description: true,
          type: true,
          isCompleted: true,
          createdAt: true,
          updatedAt: true,
          userId: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    });
  });

  describe('findOne', () => {
    it('should return a task when it exists', async () => {
      const task = {
        id: 1,
        title: 'Task 1',
        description: 'Description',
        userId: 'user-1',
      };

      prismaMock.task.findUnique.mockResolvedValue(task);

      const result = await service.findOne(1);

      expect(result).toEqual(task);
      expect(prismaMock.task.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should throw NotFoundException when task does not exist', async () => {
      prismaMock.task.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(
        NotFoundException,
      );

      await expect(service.findOne(999)).rejects.toThrow(
        'Task dengan ID 999 tidak ditemukan',
      );
    });
  });

  describe('update', () => {
    it('should update a task', async () => {
      const updateTaskDto = {
        title: 'Task Updated',
      } as UpdateTaskDto;

      const updatedTask = {
        id: 1,
        title: 'Task Updated',
      };

      prismaMock.task.update.mockResolvedValue(updatedTask);

      const result = await service.update(1, updateTaskDto);

      expect(result).toEqual(updatedTask);
      expect(prismaMock.task.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: updateTaskDto,
      });
    });

    it('should throw NotFoundException when Prisma returns P2025', async () => {
      prismaMock.task.update.mockRejectedValue({
        code: 'P2025',
      });

      await expect(
        service.update(999, { title: 'Updated' } as UpdateTaskDto),
      ).rejects.toThrow(NotFoundException);

      await expect(
        service.update(999, { title: 'Updated' } as UpdateTaskDto),
      ).rejects.toThrow('Task dengan ID 999 tidak ditemukan');
    });

    it('should rethrow unexpected errors', async () => {
      const error = new Error('Database error');

      prismaMock.task.update.mockRejectedValue(error);

      await expect(
        service.update(1, { title: 'Updated' } as UpdateTaskDto),
      ).rejects.toThrow('Database error');
    });
  });

  describe('remove', () => {
    it('should delete a task', async () => {
      const deletedTask = {
        id: 1,
        title: 'Task yang dihapus',
      };

      prismaMock.task.delete.mockResolvedValue(deletedTask);

      const result = await service.remove(1);

      expect(result).toEqual({
        message: 'Task dengan ID 1 berhasil dihapus',
        data: deletedTask,
      });

      expect(prismaMock.task.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should throw NotFoundException when Prisma returns P2025', async () => {
      prismaMock.task.delete.mockRejectedValue({
        code: 'P2025',
      });

      await expect(service.remove(999)).rejects.toThrow(
        NotFoundException,
      );

      await expect(service.remove(999)).rejects.toThrow(
        'Task dengan ID 999 tidak ditemukan',
      );
    });

    it('should rethrow unexpected errors', async () => {
      const error = new Error('Database error');

      prismaMock.task.delete.mockRejectedValue(error);

      await expect(service.remove(1)).rejects.toThrow(
        'Database error',
      );
    });
  });
});