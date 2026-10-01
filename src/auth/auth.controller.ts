import {
  Body,
  Controller,
  Query,
  HttpCode,
  HttpStatus,
  Post,
  Get,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { Role } from '@prisma/client';
import { Request as ExpressRequest } from 'express';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Registrasi pengguna baru (Student/Instructor)' })
  @ApiResponse({ status: 201, description: 'Pengguna berhasil terdaftar' })
  @ApiResponse({ status: 400, description: 'Input data tidak valid' })
  @ApiResponse({ status: 409, description: 'Email sudah terdaftar' })
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @ApiOperation({
    summary: 'login pengguna untuk mendapatkan JWT Access Token',
  })
  @ApiResponse({
    status: 201,
    description: 'Berhasil Login, mengembalikan access token',
  })
  @ApiResponse({ status: 401, description: 'Email atau password salah' })
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleLogin() {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  googleCallback(@Request() req: ExpressRequest & { user: any }) {
    return this.authService.loginWithGoogle(req.user);
  }

  @ApiOperation({ summary: 'Verifikasi email pengguna' })
  @ApiResponse({
    status: 200,
    description: 'Email berhasil diverifikasi dan JWT diterbitkan.',
  })
  @ApiResponse({
    status: 400,
    description: 'Token tidak valid atau sudah kedaluwarsa.',
  })
  @Get('verify-email')
  verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  //Rute private (hanya bisa diakses jika memiliki token yang valid)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Mengambil profil pengguna yang sedang login' })
  @ApiResponse({ status: 200, description: 'Data profil berhasil diambil.' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized / Token tidak valid.',
  })
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req: ExpressRequest & { user: any }) {
    return {
      message: 'Akses rute terproteksi berhasil!',
      user: req.user,
    };
  }

  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Dashboard khusus pengguna dengan role INSTRUCTOR' })
  @ApiResponse({
    status: 200,
    description: 'Akses dashboard instructor berhasil.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden (Hanya Instructor).' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.INSTRUCTOR)
  @Get('instructor-only')
  getInstructorDashboard(@Request() req: ExpressRequest & { user: any }) {
    return {
      message: 'Selamat datang di dashboard Guru',
      user: req.user,
    };
  }
}
