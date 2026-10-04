import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuizQuestionDto } from './dto/create-quiz-question.dto';

@Injectable()
export class QuizQuestionsService {
  constructor(private readonly prisma: PrismaService) {}

  // Create
  async create(createQuizQuestionDto: CreateQuizQuestionDto) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: createQuizQuestionDto.quizId },
      select: { id: true, title: true },
    });

    if (!quiz) {
      throw new NotFoundException('Quiz tidak ditemukan');
    }

    const prismaClient = this.prisma as unknown as Record<string, any>;

    return prismaClient['quizQuestion'].create({
      data: {
        quizId: createQuizQuestionDto.quizId,
        question: createQuizQuestionDto.question,
        type: createQuizQuestionDto.type,
      },
      include: {
        quiz: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });
  }

  // findall 
  async findAll() {
    const prismaClient = this.prisma as unknown as Record<string, any>;

    return prismaClient['quizQuestion'].findMany({
      include: {
        quiz: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: [{ createdAt: 'asc' }],
    });
  }

  // findQuiz
  async findByQuizId(quizId: string) {
    const prismaClient = this.prisma as unknown as Record<string, any>;

    return prismaClient['quizQuestion'].findMany({
      where: { quizId },
      include: {
        quiz: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: [{ createdAt: 'asc' }],
    });
  }

  //Delete
  async remove(id: string) {
    // 1. Cek apakah soal ada di database
    const question = await this.prisma.quizQuestion.findUnique({
      where: { id },
    });

    if (!question) {
      throw new NotFoundException('Soal tidak ditemukan');
    }

    // 2. Hapus opsi jawaban terkait terlebih dahulu (jika relational cascade belum di DB)
    await this.prisma.quizOption.deleteMany({
      where: { questionId: id },
    });

    // 3. Hapus pertanyaan
    await this.prisma.quizQuestion.delete({
      where: { id },
    });

    return { message: 'Soal beserta opsinya berhasil dihapus' };
  }
}
