import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMasterDataDto } from './dto/create-master-data.dto';
import { UpdateMasterDataDto } from './dto/update-master-data.dto';

type MasterDataType =
  | 'entities'
  | 'departments'
  | 'laws'
  | 'compliances_master';

@Injectable()
export class MasterDataService {
  constructor(private prisma: PrismaService) {}

  private getModel(type: MasterDataType) {
    const models = {
      entities: this.prisma.entity,
      departments: this.prisma.department,
      laws: this.prisma.law,
      compliances_master: this.prisma.complianceMaster,
    };
    return models[type];
  }

  async findAll(type: MasterDataType, workspaceId: string) {
    const model = this.getModel(type);
    return model.findMany({
      where: { workspaceId },
      orderBy: { name: 'asc' },
    });
  }

  async findById(type: MasterDataType, id: string) {
    const model = this.getModel(type);
    const item = await model.findUnique({ where: { id } });

    if (!item) {
      throw new NotFoundException(`${type} not found`);
    }

    return item;
  }

  async findByName(type: MasterDataType, workspaceId: string, name: string) {
    const model = this.getModel(type);
    return model.findUnique({
      where: {
        workspaceId_name: {
          workspaceId,
          name,
        },
      },
    });
  }

  async create(
    type: MasterDataType,
    workspaceId: string,
    createDto: CreateMasterDataDto,
  ) {
    // Check for duplicates
    const existing = await this.findByName(type, workspaceId, createDto.name);
    if (existing) {
      throw new ConflictException(`${type} with this name already exists`);
    }

    const model = this.getModel(type);
    return model.create({
      data: {
        workspaceId,
        name: createDto.name,
      },
    });
  }

  async update(
    type: MasterDataType,
    id: string,
    workspaceId: string,
    updateDto: UpdateMasterDataDto,
  ) {
    await this.findById(type, id);

    // Check if new name conflicts
    if (updateDto.name) {
      const existing = await this.findByName(type, workspaceId, updateDto.name);
      if (existing && existing.id !== id) {
        throw new ConflictException(`${type} with this name already exists`);
      }
    }

    const model = this.getModel(type);
    return model.update({
      where: { id },
      data: { name: updateDto.name },
    });
  }

  async delete(type: MasterDataType, id: string) {
    await this.findById(type, id);

    try {
      const model = this.getModel(type);
      return await model.delete({ where: { id } });
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
  async findOrCreate(type: MasterDataType, workspaceId: string, name: string) {
    let item = await this.findByName(type, workspaceId, name);

    if (!item) {
      item = await this.create(type, workspaceId, { name });
    }

    return item;
  }
}
