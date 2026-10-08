import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';

import { ResultsService } from './results.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ResultsService', () => {
  let resultsService: ResultsService;

  const prismaMock = {
    $queryRaw: jest.fn<(...args: any[]) => Promise<any>>(),
    result: {
      findMany: jest.fn<(...args: any[]) => Promise<any>>(),
      upsert: jest.fn<(...args: any[]) => Promise<any>>(),
    },
    quizAttempt: {
      findMany: jest.fn<(...args: any[]) => Promise<any>>(),
    },
    quizQuestion: {
      findMany: jest.fn<(...args: any[]) => Promise<any>>(),
    },
    quizAnswer: {
      findMany: jest.fn<(...args: any[]) => Promise<any>>(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResultsService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    resultsService = module.get<ResultsService>(ResultsService);
  });

  it('should be defined', () => {
    expect(resultsService).toBeDefined();
  });

  describe('findAllForUser', () => {
    it('should return paginated results with joins and filters', async () => {
      // Arrange
      const studentId = 'student-123';

      const countRows = [{ total: 1 }];
      const rows = [
        {
          id: 'result-1',
          attemptId: 'attempt-1',
          score: 80,
          status: 'GRADED',
          createdAt: new Date('2024-10-08T10:30:00Z'),
          studentId,
          studentName: 'Ahmad Rizki',
          quizId: 'quiz-123',
          quizTitle: 'Kuis Trigonometri',
          courseId: 'course-123',
          courseTitle: 'Matematika SMK',
        },
      ];

      prismaMock.$queryRaw
        .mockResolvedValueOnce(countRows)
        .mockResolvedValueOnce(rows);

      // Act
      const result = await resultsService.findAllForUser(
        studentId,
        Role.STUDENT,
        { page: 1, limit: 20, search: 'Ahmad', mapel: 'Matematika' },
      );

      // Assert
      expect(result).toEqual({
        data: [
          {
            id: 'result-1',
            attemptId: 'attempt-1',
            score: 80,
            status: 'GRADED',
            createdAt: new Date('2024-10-08T10:30:00Z'),
            student: {
              id: studentId,
              name: 'Ahmad Rizki',
            },
            quiz: {
              id: 'quiz-123',
              title: 'Kuis Trigonometri',
              course: {
                id: 'course-123',
                title: 'Matematika SMK',
              },
            },
          },
        ],
        total: 1,
        page: 1,
        totalPages: 1,
      });

      expect(prismaMock.$queryRaw).toHaveBeenCalledTimes(2);
    });
  });

  describe('findByStudentId', () => {
    it('should throw ForbiddenException when student requests another student result', async () => {
      // Arrange
      const requestUserId = 'student-123';
      const requestedStudentId = 'student-456';

      // Act + Assert
      await expect(
        resultsService.findByStudentId(
          requestUserId,
          Role.STUDENT,
          requestedStudentId,
        ),
      ).rejects.toThrow(ForbiddenException);

      expect(prismaMock.result.findMany).not.toHaveBeenCalled();
    });

    it('should return own results when student requests their own results', async () => {
      // Arrange
      const studentId = 'student-123';

      const results = [
        {
          id: 'result-1',
          studentId,
          quizId: 'quiz-123',
          score: 90,
          passed: true,
          remarks: 'Lulus',
        },
      ];

      prismaMock.result.findMany.mockResolvedValue(results);

      // Act
      const result = await resultsService.findByStudentId(
        studentId,
        Role.STUDENT,
        studentId,
      );

      // Assert
      expect(result).toEqual(results);

      expect(prismaMock.result.findMany).toHaveBeenCalled();
    });
  });
});
