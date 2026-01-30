import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(workspaceId: string) {
    return this.prisma.user.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByEmail(workspaceId: string, email: string) {
    return this.prisma.user.findUnique({
      where: {
        workspaceId_email: {
          workspaceId,
          email,
        },
      },
    });
  }

  async create(data: CreateUserDto) {
    // Check if user already exists
    const existingUser = await this.findByEmail(data.workspaceId, data.email);

    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    return this.prisma.user.create({
      data: {
        workspaceId: data.workspaceId,
        email: data.email,
        name: data.name,
        role: data.role || 'task_owner',
        msOid: data.msOid,
        isActive: true,
      },
    });
  }

  async update(id: string, data: UpdateUserDto) {
    await this.findById(id); // Check if exists

    return this.prisma.user.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.msOid && { msOid: data.msOid }),
        ...(data.lastLoginAt && { lastLoginAt: data.lastLoginAt }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });
  }

  async updateRole(id: string, updateRoleDto: UpdateUserRoleDto) {
    // Verify user exists
    await this.findById(id);

    // Validate role
    const validRoles = ['admin', 'reviewer', 'task_owner'];
    if (!validRoles.includes(updateRoleDto.role)) {
      throw new BadRequestException('Invalid role');
    }

    return this.prisma.user.update({
      where: { id },
      data: { role: updateRoleDto.role },
    });
  }
}
