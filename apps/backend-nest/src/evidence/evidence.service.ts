import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SharePointService } from './sharepoint.service';
import { CreateUploadSessionDto } from './dto/create-upload-session.dto';
import { CompleteUploadDto } from './dto/complete-upload.dto';

@Injectable()
export class EvidenceService {
  constructor(
    private prisma: PrismaService,
    private sharePointService: SharePointService,
  ) {}

  async createUploadSession(
    taskId: string,
    userId: string,
    createDto: CreateUploadSessionDto,
  ) {
    // Get task to get entity and compliance ID
    const task = await this.prisma.complianceTask.findUnique({
      where: { id: taskId },
      include: { entity: true },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Ensure folder structure exists
    const folderPath = await this.sharePointService.ensureFolderPath(
      task.entity.name,
      task.complianceId,
    );

    // Create upload session
    const uploadSession = await this.sharePointService.createUploadSession(
      folderPath,
      createDto.fileName,
    );

    return {
      uploadSessionId: uploadSession.uploadUrl.split('?')[0], // Use base URL as ID
      uploadUrl: uploadSession.uploadUrl,
      expiresAt: uploadSession.expirationDateTime,
      chunkSizeBytes: 327680, // 320 KB chunks (recommended by Microsoft)
      siteId: this.sharePointService.getSiteId(),
      driveId: this.sharePointService.getDriveId(),
      targetPath: folderPath,
    };
  }

  async completeUpload(
    taskId: string,
    userId: string,
    completeDto: CompleteUploadDto,
  ) {
    // Verify task exists
    const task = await this.prisma.complianceTask.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Check for duplicate (idempotency)
    const existing = await this.prisma.evidenceFile.findUnique({
      where: {
        taskId_itemId: {
          taskId,
          itemId: completeDto.itemId,
        },
      },
    });

    if (existing) {
      return existing; // Already uploaded
    }

    // Create evidence record
    const evidence = await this.prisma.evidenceFile.create({
      data: {
        taskId,
        uploadedBy: userId,
        itemId: completeDto.itemId,
        webUrl: completeDto.webUrl,
        name: completeDto.name,
        sizeBytes: completeDto.sizeBytes,
        mimeType: completeDto.mimeType,
        siteId: completeDto.siteId,
        driveId: completeDto.driveId,
        path: completeDto.path,
      },
    });

    return evidence;
  }

  /**
   * Single endpoint: accepts a file, uploads to SharePoint, records in DB.
   * This avoids CORS issues from browser → SharePoint direct uploads.
   */
  async uploadFile(
    taskId: string,
    userId: string,
    file: Express.Multer.File,
  ) {
    const task = await this.prisma.complianceTask.findUnique({
      where: { id: taskId },
      include: { entity: true },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // 1. Ensure folder structure
    const folderPath = await this.sharePointService.ensureFolderPath(
      task.entity.name,
      task.complianceId,
    );

    // 2. Upload file to SharePoint via the Graph API (server-side, no CORS)
    const uploadedItem = await this.sharePointService.uploadFileBuffer(
      folderPath,
      file.originalname,
      file.buffer,
      file.size,
    );

    // 3. Record evidence in DB
    const siteId = this.sharePointService.getSiteId();
    const driveId = this.sharePointService.getDriveId();

    // Idempotency check
    const existing = await this.prisma.evidenceFile.findUnique({
      where: { taskId_itemId: { taskId, itemId: uploadedItem.id } },
    });
    if (existing) return existing;

    return this.prisma.evidenceFile.create({
      data: {
        taskId,
        uploadedBy: userId,
        itemId: uploadedItem.id,
        webUrl: uploadedItem.webUrl,
        name: file.originalname,
        sizeBytes: file.size,
        mimeType: file.mimetype || 'application/octet-stream',
        siteId,
        driveId,
        path: folderPath,
      },
    });
  }

  async findAll(taskId: string) {
    return this.prisma.evidenceFile.findMany({
      where: { taskId },
      orderBy: { uploadedAt: 'desc' },
    });
  }

  async delete(
    evidenceId: string,
    userId: string,
    userRole: string,
  ) {
    const evidence = await this.prisma.evidenceFile.findUnique({
      where: { id: evidenceId },
      include: { task: true },
    });

    if (!evidence) {
      throw new NotFoundException('Evidence not found');
    }

    // Permission check
    if (userRole === 'task_owner') {
      // Task owner can delete only if task is PENDING and they uploaded it
      if (evidence.task.status !== 'PENDING') {
        throw new ForbiddenException(
          'Cannot delete evidence from completed or skipped task',
        );
      }
      if (evidence.uploadedBy !== userId) {
        throw new ForbiddenException('You can only delete your own evidence');
      }
    }
    // Admin can delete any evidence (no additional checks)

    // Delete from SharePoint
    try {
      await this.sharePointService.deleteFile(evidence.itemId);
    } catch (error) {
      console.error('Failed to delete file from SharePoint:', error);
      // Continue with DB deletion even if SharePoint deletion fails
    }

    // Delete from database
    await this.prisma.evidenceFile.delete({ where: { id: evidenceId } });
  }
}
