import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuizAttemptDto } from './dto/create-quiz-attempt.dto';
import { QuestionType, QuizAttemptStatus } from '@prisma/client';

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
      enrollment = await this.prisma.enrollment.create({
        data: {
          studentId,
          courseId: quiz.courseId,
        },
        select: { id: true },
      });
    }

    // 3. DETEKSI DUA ARAH (DATABASE & PAYLOAD JAWABAN SISWA)
    // A. Cek dari struktur kuis di database
    const hasEssayInDatabase = quiz.questions.some(
      (q) =>
        q.type === QuestionType.ESSAY ||
        String(q.type).toUpperCase() === 'ESSAY' ||
        !q.options ||
        q.options.length === 0,
    );

    // B. Cek dari jawaban yang dikirim siswa (apabila ada teks essay yang diisi)
    const hasEssayInAnswers = answers.some(
      (a) => a.answerText && a.answerText.trim().length > 0,
    );

    // Jika salah satu bernilai true, maka kuis ini adalah HYBRID / ESSAY
    const hasEssay = hasEssayInDatabase || hasEssayInAnswers;

    // 4. Evaluasi Jawaban Pilihan Ganda
    let correctCount = 0;
    const totalQuestions = quiz.questions.length;

    const answerDataToCreate = quiz.questions.map((question) => {
      const studentAns = answers.find((a) => a.questionId === question.id);
      let isCorrect = false;

      // Pilihan Ganda: cek kecocokan opsi
      if (studentAns?.selectedOptionId) {
        const selectedOpt = question.options.find(
          (opt) => opt.id === studentAns.selectedOptionId,
        );
        if (selectedOpt && selectedOpt.isCorrect) {
          isCorrect = true;
          correctCount++;
        }
      }

      const isQuestionEssay =
        question.type === QuestionType.ESSAY ||
        String(question.type).toUpperCase() === 'ESSAY' ||
        !question.options ||
        question.options.length === 0;

      return {
        questionId: question.id,
        selectedOptionId: studentAns?.selectedOptionId || null,
        answerText: studentAns?.answerText || null,
        isCorrect: isQuestionEssay ? null : isCorrect,
      };
    });

    // 5. Logika Skor & Status Penilaian
    let finalScore: number | null = null;
    let status: QuizAttemptStatus;
    let remarks: string;

    if (hasEssay) {
      // KUIS HYBRID / ESSAY: Status diset SUBMITTED, skor diset null
      finalScore = null;
      status = QuizAttemptStatus.SUBMITTED;
      remarks = 'Menunggu Evaluasi Guru';
    } else {
      // MURNI PILIHAN GANDA: Langsung GRADED
      finalScore =
        totalQuestions > 0
          ? Math.round((correctCount / totalQuestions) * 100)
          : 0;
      status = QuizAttemptStatus.GRADED;
      remarks = finalScore >= 75 ? 'Lulus' : 'Remedial';
    }

    const isPassed = finalScore !== null ? finalScore >= 75 : false;

    // Tambahkan log ini tepat sebelum periksa conditions/transaction:
console.log('--- DEBUG QUIZ ATTEMPT SUBMIT ---');
console.log('Quiz ID:', quizId);
console.log('Questions from DB:', JSON.stringify(quiz.questions, null, 2));
console.log('Answers Payload from FE:', JSON.stringify(answers, null, 2));
console.log('hasEssayInDatabase:', hasEssayInDatabase);
console.log('hasEssayInAnswers:', hasEssayInAnswers);
console.log('Calculated hasEssay:', hasEssay);
console.log('---------------------------------');

    // 6. Simpan Attempt, Answers, dan Result secara Atomik (Transaction)
    return this.prisma.$transaction(async (tx) => {
      const attempt = await tx.quizAttempt.create({
        data: {
          quizId: quiz.id,
          studentId,
          score: finalScore,
          status: status,
          submittedAt: new Date(),
          answers: {
            create: answerDataToCreate,
          },
        },
      });

      const result = await tx.result.create({
        data: {
          attemptId: attempt.id,
          studentId,
          quizId: quiz.id,
          score: finalScore,
          passed: isPassed,
          remarks: remarks,
        },
      });

      return {
        ...attempt,
        result,
      };
    });
  }
}