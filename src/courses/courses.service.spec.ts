import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

import { CoursesService } from './courses.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

describe('CoursesService', () => {
  let service: CoursesService;

  const prismaMock = {
    course: {
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
        CoursesService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<CoursesService>(CoursesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a course with instructorId', async () => {
      const createCourseDto = {
        title: 'Pemrograman NestJS Dasar',
        description: 'Belajar REST API',
        price: 100000,
      } as CreateCourseDto;

      const instructorId = 'instructor-123';

      const createdCourse = {
        id: 'course-123',
        ...createCourseDto,
        instructorId,
        instructor: {
          id: instructorId,
          name: 'Kevin',
          email: 'kevin@example.com',
        },
      };

      prismaMock.course.create.mockResolvedValue(createdCourse);

      const result = await service.create(createCourseDto, instructorId);

      expect(result).toEqual(createdCourse);

      expect(prismaMock.course.create).toHaveBeenCalledWith({
        data: {
          ...createCourseDto,
          instructorId,
        },
        include: {
          instructor: {
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

  describe('findAll', () => {
    it('should return all courses without filters', async () => {
      const courses = [
        {
          id: 'course-1',
          title: 'NestJS Dasar',
          description: 'Belajar NestJS',
          price: 100000,
          instructorId: 'instructor-1',
        },
      ];

      prismaMock.course.findMany.mockResolvedValue(courses);

      const result = await service.findAll();

      expect(result).toEqual(courses);

      expect(prismaMock.course.findMany).toHaveBeenCalledWith({
        where: {},
        include: {
          instructor: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    });

    it('should apply search, category, minPrice, and maxPrice filters', async () => {
      prismaMock.course.findMany.mockResolvedValue([]);

      await service.findAll(
        'NestJS',
        'Programming',
        50000,
        200000,
      );

      expect(prismaMock.course.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            {
              title: {
                contains: 'NestJS',
                mode: 'insensitive',
              },
            },
            {
              description: {
                contains: 'NestJS',
                mode: 'insensitive',
              },
            },
          ],
          category: {
            contains: 'Programming',
            mode: 'insensitive',
          },
          price: {
            gte: 50000,
            lte: 200000,
          },
        },
        include: {
          instructor: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    });

    it('should apply only minPrice filter', async () => {
      prismaMock.course.findMany.mockResolvedValue([]);

      await service.findAll(undefined, undefined, 50000);

      expect(prismaMock.course.findMany).toHaveBeenCalledWith({
        where: {
          price: {
            gte: 50000,
          },
        },
        include: {
          instructor: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    });

    it('should apply only maxPrice filter', async () => {
      prismaMock.course.findMany.mockResolvedValue([]);

      await service.findAll(undefined, undefined, undefined, 200000);

      expect(prismaMock.course.findMany).toHaveBeenCalledWith({
        where: {
          price: {
            lte: 200000,
          },
        },
        include: {
          instructor: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    });
  });

  describe('findOne', () => {
    it('should return a course when it exists', async () => {
      const course = {
        id: 'course-123',
        title: 'NestJS Dasar',
        description: 'Belajar NestJS',
        price: 100000,
        instructorId: 'instructor-123',
      };

      prismaMock.course.findUnique.mockResolvedValue(course);

      const result = await service.findOne('course-123');

      expect(result).toEqual(course);

      expect(prismaMock.course.findUnique).toHaveBeenCalledWith({
        where: { id: 'course-123' },
        include: {
          instructor: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    });

    it('should throw NotFoundException when course does not exist', async () => {
      prismaMock.course.findUnique.mockResolvedValue(null);

      await expect(service.findOne('missing-course')).rejects.toThrow(
        NotFoundException,
      );

      await expect(service.findOne('missing-course')).rejects.toThrow(
        'Kelas dengan ID "missing-course" tidak ditemukan',
      );
    });
  });

  describe('update', () => {
    it('should update a course when instructor owns it', async () => {
      const existingCourse = {
        id: 'course-123',
        title: 'NestJS Dasar',
        instructorId: 'instructor-123',
      };

      const updateCourseDto = {
        title: 'NestJS Lanjutan',
      } as UpdateCourseDto;

      const updatedCourse = {
        ...existingCourse,
        ...updateCourseDto,
      };

      prismaMock.course.findUnique.mockResolvedValue(existingCourse);
      prismaMock.course.update.mockResolvedValue(updatedCourse);

      const result = await service.update(
        'course-123',
        updateCourseDto,
        'instructor-123',
      );

      expect(result).toEqual(updatedCourse);

      expect(prismaMock.course.update).toHaveBeenCalledWith({
        where: { id: 'course-123' },
        data: updateCourseDto,
      });
    });

    it('should throw ForbiddenException when instructor does not own the course', async () => {
      const existingCourse = {
        id: 'course-123',
        title: 'NestJS Dasar',
        instructorId: 'owner-123',
      };

      prismaMock.course.findUnique.mockResolvedValue(existingCourse);

      await expect(
        service.update(
          'course-123',
          { title: 'Diubah' } as UpdateCourseDto,
          'different-instructor',
        ),
      ).rejects.toThrow(ForbiddenException);

      await expect(
        service.update(
          'course-123',
          { title: 'Diubah' } as UpdateCourseDto,
          'different-instructor',
        ),
      ).rejects.toThrow(
        'Anda tidak memiliki izin untuk mengubah kelas ini',
      );

      expect(prismaMock.course.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should delete a course when instructor owns it', async () => {
      const existingCourse = {
        id: 'course-123',
        title: 'NestJS Dasar',
        instructorId: 'instructor-123',
      };

      prismaMock.course.findUnique.mockResolvedValue(existingCourse);
      prismaMock.course.delete.mockResolvedValue(existingCourse);

      const result = await service.remove(
        'course-123',
        'instructor-123',
      );

      expect(result).toEqual({
        message: 'Kelas berhasil dihapus',
      });

      expect(prismaMock.course.delete).toHaveBeenCalledWith({
        where: { id: 'course-123' },
      });
    });

    it('should throw ForbiddenException when instructor does not own the course', async () => {
      const existingCourse = {
        id: 'course-123',
        title: 'NestJS Dasar',
        instructorId: 'owner-123',
      };

      prismaMock.course.findUnique.mockResolvedValue(existingCourse);

      await expect(
        service.remove('course-123', 'different-instructor'),
      ).rejects.toThrow(ForbiddenException);

      await expect(
        service.remove('course-123', 'different-instructor'),
      ).rejects.toThrow(
        'Anda tidak memiliki izin untuk menghapus kelas ini',
      );

      expect(prismaMock.course.delete).not.toHaveBeenCalled();
    });
  });
});