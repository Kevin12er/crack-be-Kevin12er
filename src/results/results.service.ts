import { ForbiddenException, Injectable } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type ResultsListQuery = {
  page?: number | string;
  limit?: number | string;
  sort?: string;
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
};

type ResultStats = {
  total: number;
  passed: number;
  pending: number;
  lastUpdated: string;
};

@Injectable()
export class ResultsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllForUser(
    userId: string,
    role: Role,
    query: ResultsListQuery = {},
  ): Promise<PaginatedResultList> {
    const { limit, offset, search, mapel, orderDirection } =
      this.normalizePagination(query);
    const whereClause = this.buildResultsWhereClause(
      userId,
      role,
      search,
      mapel,
    );

    const dataRows = await this.prisma.$queryRaw<ResultRow[]>(Prisma.sql`
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
        ORDER BY result."createdAt" ${Prisma.raw(orderDirection)}
        LIMIT ${limit}
        OFFSET ${offset}
      `);

    return {
      data: dataRows.map((row) => this.mapResultRow(row)),
    };
  }

  async getStatsForUser(userId: string, role: Role): Promise<ResultStats> {
    const whereClause = this.buildScopeWhereClause(userId, role);

    const rows = await this.prisma.$queryRaw<
      Array<{
        total: bigint | number | string;
        passed: bigint | number | string;
        pending: bigint | number | string;
        lastUpdated: Date | string | null;
      }>
    >(Prisma.sql`
      SELECT
        COUNT(DISTINCT result."studentId") AS total,
        COUNT(DISTINCT CASE
          WHEN result."score" >= 75 AND attempt."status" = 'GRADED'
          THEN result."studentId"
        END) AS passed,
        COUNT(DISTINCT CASE
          WHEN attempt."status" = 'SUBMITTED' OR result."score" IS NULL
          THEN result."studentId"
        END) AS pending,
        MAX(result."updatedAt") AS "lastUpdated"
      FROM "Result" result
      LEFT JOIN "User" student ON student."id" = result."studentId"
      LEFT JOIN "Quiz" quiz ON quiz."id" = result."quizId"
      LEFT JOIN "Course" course ON course."id" = quiz."courseId"
      LEFT JOIN "QuizAttempt" attempt ON attempt."id" = result."attemptId"
      ${whereClause}
    `);

    const row = rows[0];
    return {
      total: Number(row?.total ?? 0),
      passed: Number(row?.passed ?? 0),
      pending: Number(row?.pending ?? 0),
      lastUpdated: new Date(row?.lastUpdated ?? Date.now()).toISOString(),
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
    const parsedLimit = Number(query.limit ?? 10);
    const sort = (query.sort ?? 'recent').toLowerCase();

    const page =
      Number.isFinite(parsedPage) && parsedPage > 0
        ? Math.floor(parsedPage)
        : 1;
    const limit =
      Number.isFinite(parsedLimit) && parsedLimit > 0
        ? Math.floor(parsedLimit)
        : 10;

    return {
      page,
      limit,
      offset: (page - 1) * limit,
      orderDirection: sort === 'recent' ? ('DESC' as const) : ('DESC' as const),
      search: query.search?.trim() || undefined,
      mapel: query.mapel?.trim() || undefined,
    };
  }

  private buildScopeWhereClause(userId: string, role: Role) {
    if (role === Role.STUDENT) {
      return Prisma.sql`WHERE result."studentId" = ${userId}`;
    }

    return Prisma.sql`WHERE course."instructorId" = ${userId}`;
  }

  private buildResultsWhereClause(
    userId: string,
    role: Role,
    search?: string,
    mapel?: string,
  ) {
    const clauses: Prisma.Sql[] = [];

    clauses.push(
      role === Role.STUDENT
        ? Prisma.sql`result."studentId" = ${userId}`
        : Prisma.sql`course."instructorId" = ${userId}`,
    );

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
