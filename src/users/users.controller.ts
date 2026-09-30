import {
  Body,
  Controller,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';

import { ApiBearerAuth } from '@nestjs/swagger';

import type { Request } from 'express';

import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('users')
@ApiBearerAuth('JWT-auth')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  updateProfile(
    @Req() req: Request,
    @Body() dto: UpdateUserDto,
  ) {
    const userId = (req.user as { userId: string }).userId;

    return this.usersService.updateProfile(userId, dto);
  }
}