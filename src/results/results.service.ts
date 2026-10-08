import { ForbiddenException, Injectable } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type ResultsListQuery = {
  page?: number | string;
  limit?: number | string;
  search?: string;
  mapel?: string;
};

type ResultRow = {
  id: string;
  attemptId: string;
  score: number | null;
  status: string | null;
  createdAt: Date;
  studentId: string;
  studentName: string | null;
  quizId: string;
  quizTitle: string;
  courseId: string;
  courseTitle: string;
};

type ResultListItem = {
  id: string;
  attemptId: string;
  score: number | null;
  status: string | null;
  createdAt: Date;
  student: {
    id: string;
    name: string | null;
  };
  quiz: {
    id: string;
    title: string;
    course: {
      id: string;
      title: string;
    };
  };
};

type PaginatedResultList = {
  data: ResultListItem[];
  total: number;
  page: number;
  totalPages: number;
};

@Injectable()
export class ResultsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllForUser(
    userId: string,
    role: Role,
    query: ResultsListQuery = {},
  ): Promise<PaginatedResultList> {
    const { page, limit, offset, search, mapel } =
      this.normalizePagination(query);
    const whereClause = this.buildResultsWhereClause(
      userId,
      role,
      search,
      mapel,
    );

    const [totalRow, dataRows] = await Promise.all([
      this.prisma.$queryRaw<
        Array<{ total: bigint | number | string }>
      >(Prisma.sql`
        SELECT COUNT(DISTINCT result."id") AS total
        FROM "Result" result
        LEFT JOIN "User" student ON student."id" = result."studentId"
        LEFT JOIN "Quiz" quiz ON quiz."id" = result."quizId"
        LEFT JOIN "Course" course ON course."id" = quiz."courseId"
        LEFT JOIN "QuizAttempt" attempt ON attempt."id" = result."attemptId"
        ${whereClause}
      `),
      this.prisma.$queryRaw<ResultRow[]>(Prisma.sql`
        SELECT
          result."id" AS "id",
          result."attemptId" AS "attemptId",
          result."score" AS "score",
          COALESCE(attempt."status", 'GRADED') AS "status",
          result."createdAt" AS "createdAt",
          student."id" AS "studentId",
          student."name" AS "studentName",
          quiz."id" AS "quizId",
          quiz."title" AS "quizTitle",
          course."id" AS "courseId",
          course."title" AS "courseTitle"
        FROM "Result" result
        LEFT JOIN "User" student ON student."id" = result."studentId"
        LEFT JOIN "Quiz" quiz ON quiz."id" = result."quizId"
        LEFT JOIN "Course" course ON course."id" = quiz."courseId"
        LEFT JOIN "QuizAttempt" attempt ON attempt."id" = result."attemptId"
        ${whereClause}
        ORDER BY result."createdAt" DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `),
    ]);

    const total = Number(totalRow[0]?.total ?? 0);

    return {
      data: dataRows.map((row) => this.mapResultRow(row)),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findByStudentId(requestUserId: string, role: Role, studentId: string) {
    const prismaClient = this.prisma as unknown as Record<string, any>;

    if (role === Role.STUDENT && requestUserId !== studentId) {
      throw new ForbiddenException(
        'Student hanya boleh melihat result miliknya sendiri',
      );
    }

    if (role === Role.STUDENT) {
      return prismaClient['result'].findMany({
        where: { studentId },
        include: {
          quiz: {
            select: { id: true, title: true, courseId: true },
          },
          attempt: {
            select: {
              id: true,
              status: true,
              startedAt: true,
              submittedAt: true,
            },
          },
        },
        orderBy: [{ createdAt: 'desc' }],
      });
    }

    return prismaClient['result'].findMany({
      where: {
        studentId,
        quiz: {
          course: {
            instructorId: requestUserId,
          },
        },
      },
      include: {
        student: {
          select: { id: true, name: true, email: true },
        },
        quiz: {
          select: { id: true, title: true, courseId: true },
        },
        attempt: {
          select: {
            id: true,
            status: true,
            startedAt: true,
            submittedAt: true,
          },
        },
      },
      orderBy: [{ createdAt: 'desc' }],
    });
  }

  private normalizePagination(query: ResultsListQuery) {
    const parsedPage = Number(query.page ?? 1);
    const parsedLimit = Number(query.limit ?? 20);

    const page =
      Number.isFinite(parsedPage) && parsedPage > 0
        ? Math.floor(parsedPage)
        : 1;
    const limit =
      Number.isFinite(parsedLimit) && parsedLimit > 0
        ? Math.floor(parsedLimit)
        : 20;

    return {
      page,
      limit,
      offset: (page - 1) * limit,
      search: query.search?.trim() || undefined,
      mapel: query.mapel?.trim() || undefined,
    };
  }

  private buildResultsWhereClause(
    userId: string,
    role: Role,
    search?: string,
    mapel?: string,
  ) {
    const clauses: Prisma.Sql[] = [];

    if (role === Role.STUDENT) {
      clauses.push(Prisma.sql`result."studentId" = ${userId}`);
    } else {
      clauses.push(Prisma.sql`course."instructorId" = ${userId}`);
    }

    if (search) {
      clauses.push(Prisma.sql`student."name" ILIKE ${`%${search}%`}`);
    }

    if (mapel) {
      clauses.push(Prisma.sql`course."title" = ${mapel}`);
    }

    return Prisma.sql`WHERE ${Prisma.join(clauses, ' AND ')}`;
  }

  private mapResultRow(row: ResultRow): ResultListItem {
    return {
      id: row.id,
      attemptId: row.attemptId,
      score: row.score,
      status: row.status,
      createdAt: row.createdAt,
      student: {
        id: row.studentId,
        name: row.studentName,
      },
      quiz: {
        id: row.quizId,
        title: row.quizTitle,
        course: {
          id: row.courseId,
          title: row.courseTitle,
        },
      },
    };
  }
}
