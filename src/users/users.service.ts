import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';


@Injectable()
export class UsersService {
    constructor (private readonly prisma: PrismaService) {}


    async updateProfile(userId: string, dto: UpdateUserDto) {
        return this.prisma.user.update({
            where: {
                id: userId,
            },
            data: {
                name: dto.name,
                email: dto.email,
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                updatedAt: true,
            },
        });
    }

}
