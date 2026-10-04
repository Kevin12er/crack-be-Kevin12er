import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
  Delete,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateQuizQuestionDto } from './dto/create-quiz-question.dto';
import { QuizQuestionsService } from './quiz-questions.service';

@ApiTags('Quiz Questions')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('quiz-questions')
export class QuizQuestionsController {
  constructor(private readonly quizQuestionsService: QuizQuestionsService) {}

  // Create
  @ApiOperation({ summary: 'Membuat soal quiz (Khusus Instructor)' })
  @ApiResponse({ status: 201, description: 'Soal quiz berhasil dibuat.' })
  @ApiResponse({
    status: 403,
    description: 'Akses ditolak (hanya instructor).',
  })
  @ApiResponse({ status: 404, description: 'Quiz tidak ditemukan.' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.INSTRUCTOR)
  @Post()
  create(@Body() createQuizQuestionDto: CreateQuizQuestionDto) {
    return this.quizQuestionsService.create(createQuizQuestionDto);
  }

  // Findall quiz
  @ApiOperation({ summary: 'Mengambil semua soal quiz' })
  @ApiResponse({
    status: 200,
    description: 'Semua soal quiz berhasil diambil.',
  })
  @Get()
  findAll() {
    return this.quizQuestionsService.findAll();
  }

  // FindQuiz by id
  @ApiOperation({ summary: 'Mengambil daftar soal berdasarkan quizId' })
  @ApiParam({ name: 'quizId', description: 'ID quiz' })
  @ApiResponse({ status: 200, description: 'Daftar soal berhasil diambil.' })
  @Get('quiz/:quizId')
  findByQuizId(@Param('quizId') quizId: string) {
    return this.quizQuestionsService.findByQuizId(quizId);
  }

  // Remove Quiz
  @ApiOperation({ summary: 'Hapus soal berdasarkan ID (Khusus Instructor)' })
  @ApiResponse({ status: 200, description: 'Soal berhasil dihapus.' })
  @ApiResponse({ status: 404, description: 'Soal tidak ditemukan.' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.INSTRUCTOR)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.quizQuestionsService.remove(id);
  }
}
