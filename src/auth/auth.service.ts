import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { EmailService } from '../email/email.service';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomBytes, createHash } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new BadRequestException('Email sudah digunakan');
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(dto.password, saltRounds);

    const verificationToken = randomBytes(32).toString('hex');
    const hashedVerificationToken = createHash('sha256')
      .update(verificationToken)
      .digest('hex');

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        name: dto.name,
        role: Role.STUDENT,
        emailVerifyToken: hashedVerificationToken,
        emailVerifyExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
      },
    });

    const verificationUrl = `https://www.learnbridge.fun/verify-email?token=${verificationToken}`;

    await this.emailService.sendVerificationEmail(user.email, verificationUrl);

    const {
      password: _password,
      emailVerifyToken: _token,
      emailVerifyExpiresAt: _expiresAt,
      ...result
    } = user;

    return {
      message: 'Registrasi berhasil',
      user: result,
    };
  }

  async verifyEmail(token: string) {
    const hashedToken = createHash('sha256').update(token).digest('hex');

    const user = await this.prisma.user.findUnique({
      where: {
        emailVerifyToken: hashedToken,
      },
    });

    if (!user) {
      throw new BadRequestException('Token verifikasi tidak valid');
    }

    if (!user.emailVerifyExpiresAt || user.emailVerifyExpiresAt < new Date()) {
      throw new BadRequestException('Token verifikasi sudah kedaluwarsa');
    }

    const verifiedUser = await this.prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        emailVerified: true,
        emailVerifyToken: null,
        emailVerifyExpiresAt: null,
      },
    });

    const payload = {
      sub: verifiedUser.id,
      email: verifiedUser.email,
      role: verifiedUser.role,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    const {
      password: _password,
      emailVerifyToken: _token,
      emailVerifyExpiresAt: _expiresAt,
      ...userResult
    } = verifiedUser;

    return {
      message: 'Email berhasil diverifikasi',
      access_token: accessToken,
      user: userResult,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Email atau password salah');
    }

    if (!user.password) {
      throw new UnauthorizedException('Email atau password salah');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Email atau password salah');
    }

    if (!user.emailVerified) {
      throw new UnauthorizedException('Email belum diverifikasi');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    const {
      password: _password,
      emailVerifyToken: _token,
      emailVerifyExpiresAt: _expiresAt,
      ...userResult
    } = user;

    return {
      message: 'Login berhasil',
      access_token: accessToken,
      user: userResult,
    };
  }

  async loginWithGoogle(googleUser: {
    googleId: string;
    email: string;
    name?: string;
  }) {
    let user = await this.prisma.user.findUnique({
      where: {
        googleId: googleUser.googleId,
      },
    });

    if (!user) {
      const userByEmail = await this.prisma.user.findUnique({
        where: {
          email: googleUser.email,
        },
      });

      if (userByEmail) {
        if (userByEmail.role !== Role.STUDENT) {
          throw new UnauthorizedException(
            'Login dengan Google hanya tersedia untuk akun siswa',
          );
        }

        user = await this.prisma.user.update({
          where: {
            id: userByEmail.id,
          },
          data: {
            googleId: googleUser.googleId,
          },
        });
      } else {
        user = await this.prisma.user.create({
          data: {
            googleId: googleUser.googleId,
            email: googleUser.email,
            name: googleUser.name,
            password: null,
            emailVerified: true,
            role: Role.STUDENT,
          },
        });
      }
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    const {
      password: _password,
      emailVerifyToken: _token,
      emailVerifyExpiresAt: _expiresAt,
      ...userResult
    } = user;

    return {
      message: 'Login Google berhasil',
      access_token: accessToken,
      user: userResult,
    };
  }
}
