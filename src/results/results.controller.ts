import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ResultsListQueryDto } from './dto/results-list-query.dto';
import { ResultsService } from './results.service';

@ApiTags('Results')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.STUDENT, Role.INSTRUCTOR)
@Controller('results')
export class ResultsController {
  constructor(private readonly resultsService: ResultsService) {}

  @ApiOperation({ summary: 'Melihat daftar hasil quiz dengan pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'search', required: false, type: String, example: 'Ahmad' })
  @ApiQuery({
    name: 'mapel',
    required: false,
    type: String,
    example: 'Matematika',
  })
  @ApiResponse({ status: 200, description: 'Daftar result berhasil diambil.' })
  @Get()
  findAll(@Req() req: any, @Query() query: ResultsListQueryDto) {
    return this.resultsService.findAllForUser(
      req.user.userId,
      req.user.role,
      query,
    );
  }

  @ApiOperation({ summary: 'Melihat hasil quiz berdasarkan studentId' })
  @ApiParam({ name: 'studentId', description: 'ID student' })
  @ApiResponse({
    status: 200,
    description: 'Daftar result student berhasil diambil.',
  })
  @ApiResponse({
    status: 403,
    description: 'Student tidak boleh akses milik user lain.',
  })
  @Get(':studentId')
  findByStudentId(@Req() req: any, @Param('studentId') studentId: string) {
    return this.resultsService.findByStudentId(
      req.user.userId,
      req.user.role,
      studentId,
    );
  }
}
