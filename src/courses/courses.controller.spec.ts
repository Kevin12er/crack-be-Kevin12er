import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';

import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

describe('CoursesController', () => {
  let controller: CoursesController;

  const coursesServiceMock = {
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
      controllers: [CoursesController],
      providers: [
        {
          provide: CoursesService,
          useValue: coursesServiceMock,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(guardMock)
      .overrideGuard(RolesGuard)
      .useValue(guardMock)
      .compile();

    controller = module.get<CoursesController>(CoursesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a course', async () => {
      // Arrange
      const createCourseDto = {
        title: 'Pemrograman NestJS',
        description: 'Belajar NestJS dasar',
        price: 100000,
      };

      const request = {
        user: {
          userId: 'instructor-123',
        },
      };

      const createdCourse = {
        id: 'course-123',
        ...createCourseDto,
        instructorId: 'instructor-123',
      };

      coursesServiceMock.create.mockResolvedValue(createdCourse);

      // Act
      const result = await controller.create(createCourseDto, request);

      // Assert
      expect(result).toEqual(createdCourse);

      expect(coursesServiceMock.create).toHaveBeenCalledWith(
        createCourseDto,
        'instructor-123',
      );
    });
  });

  describe('findAll', () => {
    it('should return all courses', async () => {
      // Arrange
      const courses = [
        {
          id: 'course-1',
          title: 'Belajar NestJS',
          description: 'Belajar backend dengan NestJS',
          price: 100000,
        },
      ];

      coursesServiceMock.findAll.mockResolvedValue(courses);

      // Act
      const result = await controller.findAll();

      // Assert
      expect(result).toEqual(courses);

      expect(coursesServiceMock.findAll).toHaveBeenCalledWith(
        undefined,
        undefined,
        undefined,
        undefined,
      );
    });

    it('should pass filters to CoursesService with converted prices', async () => {
      // Arrange
      const courses = [
        {
          id: 'course-1',
          title: 'Belajar NestJS',
          description: 'Belajar backend',
          price: 100000,
        },
      ];

      coursesServiceMock.findAll.mockResolvedValue(courses);

      // Act
      const result = await controller.findAll(
        'NestJS',
        'Programming',
        '50000',
        '200000',
      );

      // Assert
      expect(result).toEqual(courses);

      expect(coursesServiceMock.findAll).toHaveBeenCalledWith(
        'NestJS',
        'Programming',
        50000,
        200000,
      );
    });
  });

  describe('findOne', () => {
    it('should return a course by id', async () => {
      // Arrange
      const course = {
        id: 'course-123',
        title: 'Belajar NestJS',
        description: 'Belajar backend dengan NestJS',
        price: 100000,
      };

      coursesServiceMock.findOne.mockResolvedValue(course);

      // Act
      const result = await controller.findOne('course-123');

      // Assert
      expect(result).toEqual(course);

      expect(coursesServiceMock.findOne).toHaveBeenCalledWith('course-123');
    });
  });

  describe('update', () => {
    it('should update a course', async () => {
      // Arrange
      const updateCourseDto = {
        title: 'NestJS Lanjutan',
        description: 'Belajar NestJS lebih dalam',
        price: 150000,
      };

      const request = {
        user: {
          userId: 'instructor-123',
        },
      };

      const updatedCourse = {
        id: 'course-123',
        ...updateCourseDto,
        instructorId: 'instructor-123',
      };

      coursesServiceMock.update.mockResolvedValue(updatedCourse);

      // Act
      const result = await controller.update(
        'course-123',
        updateCourseDto,
        request,
      );

      // Assert
      expect(result).toEqual(updatedCourse);

      expect(coursesServiceMock.update).toHaveBeenCalledWith(
        'course-123',
        updateCourseDto,
        'instructor-123',
      );
    });
  });

  describe('remove', () => {
    it('should remove a course', async () => {
      // Arrange
      const request = {
        user: {
          userId: 'instructor-123',
        },
      };

      const response = {
        message: 'Kelas berhasil dihapus',
      };

      coursesServiceMock.remove.mockResolvedValue(response);

      // Act
      const result = await controller.remove('course-123', request);

      // Assert
      expect(result).toEqual(response);

      expect(coursesServiceMock.remove).toHaveBeenCalledWith(
        'course-123',
        'instructor-123',
      );
    });
  });
});
