import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';

import { QuizAttemptsService } from './quiz-attempts.service';
import { PrismaService } from '../prisma/prisma.service';

describe('QuizAttemptsService', () => {
    let tesKuis: QuizAttemptsService;

    const prismaMock = {
        quizAttempt: {
            findMany: jest.fn<(...args: any[]) => Promise<any>>(),
        },
        quiz: {
            findUnique: jest.fn<(...args: any[]) => Promise<any>>(),
        },
        enrollment: {
            findUnique: jest.fn<(...args: any[]) => Promise<any>>(),
            create: jest.fn<(...args: any[]) => Promise<any>>(),
        },
        $transaction: jest.fn(),
    };

    beforeEach(async () => {
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                QuizAttemptsService,
                {
                    provide: PrismaService,
                    useValue: prismaMock,
                },
            ],
        }).compile();

        tesKuis = module.get<QuizAttemptsService>(QuizAttemptsService);
    });

    it('should be defined', () => {
        expect(tesKuis).toBeDefined();
    });

    describe('findMyAttempts', () => {
        it('should find my attempts', async () => {
            // Arrange
            const studentId = 'user-123';

            const attempts = [
                {
                    id: 'attempt-1',
                    studentId: 'user-123',
                    quizId: 'quiz-123',
                    score: 80,
                },
            ];

            prismaMock.quizAttempt.findMany.mockResolvedValue(attempts);

            // Act
            const result = await tesKuis.findMyAttempts(studentId);

            // Assert
            expect(result).toEqual(attempts);

            expect(prismaMock.quizAttempt.findMany).toHaveBeenCalledWith({
                where: { studentId },
                include: {
                    quiz: {
                        select: {
                            id: true,
                            title: true,
                            courseId: true,
                            course: {
                                select: {
                                    id: true,
                                    title: true,
                                },
                            },
                        },
                    },
                    result: true,
                },
                orderBy: [{ createdAt: 'desc' }],
            });
        });
    });

    describe('create', () => {
        it('should throw NotFoundException when quiz does not exist', async () => {
            // Arrange
            const studentId = 'user-123';

            const createQuizAttemptDto = {
                quizId: 'quiz-123',
                answers: [],
            };

            prismaMock.quiz.findUnique.mockResolvedValue(null);

            // Act + Assert
            await expect(
                tesKuis.create(createQuizAttemptDto, studentId),
            ).rejects.toThrow(NotFoundException);

            await expect(
                tesKuis.create(createQuizAttemptDto, studentId),
            ).rejects.toThrow('Quiz tidak ditemukan');
        });
    });
});