import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateMasterDataDto } from './dto/update-master-data.dto';

type MasterDataType =
  | 'entities'
  | 'departments'
  | 'laws'
  | 'compliances_master';

@Injectable()
export class MasterDataService {
  constructor(private prisma: PrismaService) {}

  async findAll(type: MasterDataType) {
    switch (type) {
      case 'entities':
        return this.prisma.entity.findMany({ orderBy: { name: 'asc' } });
      case 'departments':
        return this.prisma.department.findMany({ orderBy: { name: 'asc' } });
      case 'laws':
        return this.prisma.law.findMany({ orderBy: { name: 'asc' } });
      case 'compliances_master':
        return this.prisma.complianceMaster.findMany({
          orderBy: { title: 'asc' },
          include: { law: true, department: true },
        });
    }
  }

  async findById(type: MasterDataType, id: string) {
    let item;
    switch (type) {
      case 'entities':
        item = await this.prisma.entity.findUnique({ where: { id } });
        break;
      case 'departments':
        item = await this.prisma.department.findUnique({ where: { id } });
        break;
      case 'laws':
        item = await this.prisma.law.findUnique({ where: { id } });
        break;
      case 'compliances_master':
        item = await this.prisma.complianceMaster.findUnique({
          where: { id },
          include: { law: true, department: true },
        });
        break;
    }

    if (!item) {
      throw new NotFoundException(`${type} not found`);
    }

    return item;
  }

  async findByName(type: MasterDataType, name: string) {
    switch (type) {
      case 'entities':
        return this.prisma.entity.findUnique({ where: { name } });
      case 'departments':
        return this.prisma.department.findUnique({ where: { name } });
      case 'laws':
        return this.prisma.law.findUnique({ where: { name } });
      case 'compliances_master':
        return this.prisma.complianceMaster.findUnique({ where: { name } });
    }
  }

  async create(type: MasterDataType, createDto: any) {
    // For compliances_master, validate differently
    if (type === 'compliances_master') {
      // Validate compliance master specific fields
      if (
        !createDto.name ||
        !createDto.title ||
        !createDto.lawId ||
        !createDto.departmentId ||
        !createDto.complianceId
      ) {
        throw new BadRequestException(
          'Missing required fields for compliance master',
        );
      }

      try {
        return await this.prisma.complianceMaster.create({
          data: {
            complianceId: createDto.complianceId,
            name: createDto.name,
            title: createDto.title,
            description: createDto.description,
            lawId: createDto.lawId,
            departmentId: createDto.departmentId,
            frequency: createDto.frequency,
            impact: createDto.impact,
          },
          include: {
            law: true,
            department: true,
          },
        });
      } catch (error: any) {
        console.error(`Error creating compliance master:`, error);
        if (error?.code === 'P2002') {
          throw new ConflictException(
            `Compliance master with this name already exists`,
          );
        }
        throw error;
      }
    }

    // For simple master data (entities, departments, laws)
    if (!createDto.name || !createDto.name.trim()) {
      throw new BadRequestException('Name cannot be empty');
    }

    const trimmedName = createDto.name.trim();

    // Check for duplicates
    const existing = await this.findByName(type, trimmedName);
    if (existing) {
      throw new ConflictException(`${type} with this name already exists`);
    }

    try {
      switch (type) {
        case 'entities':
          return await this.prisma.entity.create({
            data: { name: trimmedName },
          });
        case 'departments':
          return await this.prisma.department.create({
            data: { name: trimmedName },
          });
        case 'laws':
          return await this.prisma.law.create({ data: { name: trimmedName } });
        default:
          throw new BadRequestException(`Unknown master data type: ${type}`);
      }
    } catch (error: any) {
      console.error(`Error creating ${type}:`, error);
      if (error?.code === 'P2002') {
        throw new ConflictException(
          `${type} with name "${trimmedName}" already exists`,
        );
      }
      throw error;
    }
  }

  async update(
    type: MasterDataType,
    id: string,
    updateDto: UpdateMasterDataDto,
  ) {
    await this.findById(type, id);

    // Check if new name conflicts
    if (updateDto.name) {
      const existing = await this.findByName(type, updateDto.name);
      if (existing && (existing as any).id !== id) {
        throw new ConflictException(`${type} with this name already exists`);
      }
    }

    switch (type) {
      case 'entities':
        return this.prisma.entity.update({
          where: { id },
          data: { name: updateDto.name },
        });
      case 'departments':
        return this.prisma.department.update({
          where: { id },
          data: { name: updateDto.name },
        });
      case 'laws':
        return this.prisma.law.update({
          where: { id },
          data: { name: updateDto.name },
        });
      case 'compliances_master':
        return this.prisma.complianceMaster.update({
          where: { id },
          data: updateDto,
          include: {
            law: true,
            department: true,
          },
        });
    }
  }

  async delete(type: MasterDataType, id: string) {
    await this.findById(type, id);

    try {
      switch (type) {
        case 'entities':
          return await this.prisma.entity.delete({ where: { id } });
        case 'departments':
          return await this.prisma.department.delete({ where: { id } });
        case 'laws':
          return await this.prisma.law.delete({ where: { id } });
        case 'compliances_master':
          return await this.prisma.complianceMaster.delete({ where: { id } });
      }
    } catch (error: any) {
      // Check if item is in use (foreign key constraint)
      if (error.code === 'P2003') {
        throw new BadRequestException(
          `Cannot delete ${type} because it is being used by tasks`,
        );
      }
      throw error;
    }
  }

  // Utility for CSV import - creates if doesn't exist
  async findOrCreate(type: MasterDataType, name: string) {
    let item = await this.findByName(type, name);

    if (!item) {
      item = await this.create(type, { name });
    }

    return item;
  }
}
