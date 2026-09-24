import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuizAttemptDto } from './dto/create-quiz-attempt.dto';
import { QuizAttemptStatus } from '@prisma/client';

@Injectable()
export class QuizAttemptsService {
  constructor(private readonly prisma: PrismaService) {}

  async findMyAttempts(studentId: string) {
    return this.prisma.quizAttempt.findMany({
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
  }

  async create(createQuizAttemptDto: CreateQuizAttemptDto, studentId: string) {
    const { quizId, answers = [] } = createQuizAttemptDto;

    // 1. Cek keberadaan Quiz beserta Pertanyaan & Opsi Jawaban
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: {
          include: {
            options: true,
          },
        },
      },
    });

    if (!quiz) {
      throw new NotFoundException('Quiz tidak ditemukan');
    }

    // 2. Cek atau Buat Enrollment Otomatis jika Belum Terdaftar
    let enrollment = await this.prisma.enrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId,
          courseId: quiz.courseId,
        },
      },
      select: { id: true },
    });

    if (!enrollment) {
      // Otomatis daftarkan siswa ke course kuis ini di PostgreSQL
      enrollment = await this.prisma.enrollment.create({
        data: {
          studentId,
          courseId: quiz.courseId,
        },
        select: { id: true },
      });
    }

    // 3. Hitung Skor & Evaluasi Jawaban
    let correctCount = 0;
    const totalQuestions = quiz.questions.length;

    // Cek apakah kuis ini mengandung soal ESSAY
    const hasEssay = quiz.questions.some(
      (q) => q.type === 'ESSAY' || !q.options || q.options.length === 0,
    );

    const answerDataToCreate = quiz.questions.map((question) => {
      const studentAns = answers.find((a) => a.questionId === question.id);
      let isCorrect = false;

      if (studentAns?.selectedOptionId) {
        const selectedOpt = question.options.find(
          (opt) => opt.id === studentAns.selectedOptionId,
        );
        if (selectedOpt && selectedOpt.isCorrect) {
          isCorrect = true;
          correctCount++;
        }
      }

      return {
        questionId: question.id,
        selectedOptionId: studentAns?.selectedOptionId || null,
        answerText: studentAns?.answerText || null,
        isCorrect,
      };
    });

    // Logika Skor & Status Penilaian
    let finalScore: number | null = null;
    let status: QuizAttemptStatus = QuizAttemptStatus.GRADED;

    if (hasEssay) {
      // Jika ADA ESSAY: Status diset SUBMITTED (menunggu evaluasi guru), skor diset null
      finalScore = null;
      status = QuizAttemptStatus.SUBMITTED;
    } else {
      // Jika MURNI PILIHAN GANDA: Dibulatkan (contoh: 66.666... jadi 67)
      finalScore =
        totalQuestions > 0
          ? Math.round((correctCount / totalQuestions) * 100)
          : 0;
      status = QuizAttemptStatus.GRADED;
    }

    const isPassed = finalScore !== null ? finalScore >= 75 : false;

    // 4. Simpan Attempt, Answers, dan Result secara Atomik (Transaction)
    return this.prisma.$transaction(async (tx) => {
      // Create Attempt
      const attempt = await tx.quizAttempt.create({
        data: {
          quizId: quiz.id,
          studentId,
          score: finalScore,
          status,
          submittedAt: new Date(),
          answers: {
            create: answerDataToCreate,
          },
        },
      });

      // Create Result
      const result = await tx.result.create({
        data: {
          attemptId: attempt.id,
          studentId,
          quizId: quiz.id,
          score: finalScore,
          passed: isPassed,
          remarks: hasEssay
            ? 'Menunggu Evaluasi Guru'
            : isPassed
            ? 'Lulus'
            : 'Remedial',
        },
      });

      return {
        ...attempt,
        result,
      };
    });
  }
}