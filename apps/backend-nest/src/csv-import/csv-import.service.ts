import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MasterDataService } from '../master-data/master-data.service';
import { UsersService } from '../users/users.service';
import * as Papa from 'papaparse';

interface CsvRow {
  'Compliance Id': string;
  Title: string;
  'Name of Law': string;
  Department: string;
  'Operating Unit': string;
  Owner: string;
  Reviewer: string;
  'Current Due Date': string;
  Frequency: string;
  Status: string;
  Impact: string;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  data?: any;
}

@Injectable()
export class CsvImportService {
  constructor(
    private prisma: PrismaService,
    private masterDataService: MasterDataService,
    private usersService: UsersService,
  ) {}

  async parseAndValidate(
    fileContent: string,
    workspaceId: string,
    mode: 'preview' | 'commit',
    userId: string,
  ) {
    // Parse CSV
    const parseResult = Papa.parse<CsvRow>(fileContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
    });

    if (parseResult.errors.length > 0) {
      throw new BadRequestException('CSV parsing failed');
    }

    const rows = parseResult.data;

    if (rows.length === 0) {
      throw new BadRequestException('CSV file is empty');
    }

    // Validate headers
    const requiredHeaders = [
      'Compliance Id',
      'Title',
      'Name of Law',
      'Department',
      'Operating Unit',
      'Owner',
      'Reviewer',
      'Current Due Date',
      'Frequency',
      'Status',
      'Impact',
    ];

    const headers = Object.keys(rows[0]);
    const missingHeaders = requiredHeaders.filter((h) => !headers.includes(h));

    if (missingHeaders.length > 0) {
      throw new BadRequestException(
        `Missing required columns: ${missingHeaders.join(', ')}`,
      );
    }

    // Create import job
    const job = await this.prisma.csvImportJob.create({
      data: {
        workspaceId,
        uploadedBy: userId,
        fileName: `import_${Date.now()}.csv`,
        totalRows: rows.length,
        status: mode === 'preview' ? 'PREVIEW' : 'IN_PROGRESS',
        mode,
      },
    });

    // Validate and process each row
    const results = await Promise.all(
      rows.map((row, index) =>
        this.validateAndProcessRow(row, index + 1, workspaceId, job.id, mode),
      ),
    );

    const successCount = results.filter((r) => r.valid).length;
    const failedCount = results.filter((r) => !r.valid).length;

    // Update job
    await this.prisma.csvImportJob.update({
      where: { id: job.id },
      data: {
        successRows: successCount,
        failedRows: failedCount,
        status: mode === 'preview' ? 'PREVIEW' : 'COMPLETED',
        completedAt: mode === 'commit' ? new Date() : undefined,
      },
    });

    return {
      jobId: job.id,
      totalRows: rows.length,
      successRows: successCount,
      failedRows: failedCount,
      errors: results
        .filter((r) => !r.valid)
        .map((r, _i) => ({
          rowNumber: results.indexOf(r) + 1,
          errors: r.errors,
        })),
    };
  }

  private async validateAndProcessRow(
    row: CsvRow,
    rowNumber: number,
    workspaceId: string,
    jobId: string,
    mode: 'preview' | 'commit',
  ): Promise<ValidationResult> {
    const errors: string[] = [];

    try {
      // Validate required fields
      if (!row['Compliance Id']?.trim()) {
        errors.push('Compliance Id is required');
      }
      if (!row['Title']?.trim()) {
        errors.push('Title is required');
      }
      if (!row['Name of Law']?.trim()) {
        errors.push('Name of Law is required');
      }
      if (!row['Department']?.trim()) {
        errors.push('Department is required');
      }
      if (!row['Operating Unit']?.trim()) {
        errors.push('Operating Unit is required');
      }
      if (!row['Owner']?.trim()) {
        errors.push('Owner is required');
      }
      if (!row['Reviewer']?.trim()) {
        errors.push('Reviewer is required');
      }

      if (errors.length > 0) {
        await this.createJobRow(
          jobId,
          rowNumber,
          false,
          errors.join('; '),
          row,
        );
        return { valid: false, errors };
      }

      // Auto-create or find master data
      const entity = await this.masterDataService.findOrCreate(
        'entities',
        workspaceId,
        row['Operating Unit'].trim(),
      );

      const department = await this.masterDataService.findOrCreate(
        'departments',
        workspaceId,
        row['Department'].trim(),
      );

      const law = await this.masterDataService.findOrCreate(
        'laws',
        workspaceId,
        row['Name of Law'].trim(),
      );

      // Find owner and reviewer (must exist)
      const owner = await this.usersService.findByEmail(
        workspaceId,
        row['Owner'].trim(),
      );

      if (!owner) {
        errors.push(`Owner email not found: ${row['Owner']}`);
      }

      const reviewer = await this.usersService.findByEmail(
        workspaceId,
        row['Reviewer'].trim(),
      );

      if (!reviewer) {
        errors.push(`Reviewer email not found: ${row['Reviewer']}`);
      }

      if (errors.length > 0) {
        await this.createJobRow(
          jobId,
          rowNumber,
          false,
          errors.join('; '),
          row,
        );
        return { valid: false, errors };
      }

      // Check for duplicates
      const existing = await this.prisma.complianceTask.findUnique({
        where: {
          workspaceId_complianceId_entityId: {
            workspaceId,
            complianceId: row['Compliance Id'].trim(),
            entityId: entity!.id,
          },
        },
      });

      if (existing) {
        errors.push(
          'Duplicate: Task with this Compliance ID and Entity already exists',
        );
        await this.createJobRow(
          jobId,
          rowNumber,
          false,
          errors.join('; '),
          row,
        );
        return { valid: false, errors };
      }

      // If preview mode, just validate
      if (mode === 'preview') {
        await this.createJobRow(jobId, rowNumber, true, null, row);
        return { valid: true, errors: [] };
      }

      // Commit mode: create task
      const taskData = {
        workspaceId,
        complianceId: row['Compliance Id'].trim(),
        title: row['Title'].trim(),
        lawId: law!.id,
        departmentId: department!.id,
        entityId: entity!.id,
        ownerId: owner!.id,
        reviewerId: reviewer!.id,
        frequency: this.mapFrequency(row['Frequency']),
        impact: this.mapImpact(row['Impact']),
        status: this.mapStatus(row['Status']),
        dueDate: row['Current Due Date']
          ? new Date(row['Current Due Date'])
          : undefined,
      };

      await this.prisma.complianceTask.create({ data: taskData });
      await this.createJobRow(jobId, rowNumber, true, null, row);

      return { valid: true, errors: [], data: taskData };
    } catch (error: any) {
      const errorMsg = `Unexpected error: ${error.message}`;
      await this.createJobRow(jobId, rowNumber, false, errorMsg, row);
      return { valid: false, errors: [errorMsg] };
    }
  }

  private async createJobRow(
    jobId: string,
    rowNumber: number,
    success: boolean,
    errorMsg: string | null,
    rowData: any,
  ) {
    await this.prisma.csvImportJobRow.create({
      data: {
        jobId,
        rowNumber,
        success,
        errorMsg,
        rowData,
      },
    });
  }

  private mapFrequency(value: string): string | undefined {
    const map: Record<string, string> = {
      daily: 'DAILY',
      weekly: 'WEEKLY',
      monthly: 'MONTHLY',
      quarterly: 'QUARTERLY',
      'half-yearly': 'HALF_YEARLY',
      yearly: 'YEARLY',
      'one-time': 'ONE_TIME',
    };
    return value ? map[value.toLowerCase()] : undefined;
  }

  private mapImpact(value: string): string | undefined {
    const map: Record<string, string> = {
      low: 'LOW',
      medium: 'MEDIUM',
      high: 'HIGH',
      critical: 'CRITICAL',
    };
    return value ? map[value.toLowerCase()] : undefined;
  }

  private mapStatus(value: string): string {
    const map: Record<string, string> = {
      pending: 'PENDING',
      completed: 'COMPLETED',
      skipped: 'SKIPPED',
    };
    return value ? map[value.toLowerCase()] || 'PENDING' : 'PENDING';
  }

  async getImportJobs(workspaceId: string) {
    return this.prisma.csvImportJob.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
      include: {
        uploader: { select: { name: true, email: true } },
      },
    });
  }

  async getImportJobDetails(jobId: string, workspaceId: string) {
    return this.prisma.csvImportJob.findFirst({
      where: { id: jobId, workspaceId },
      include: {
        uploader: { select: { name: true, email: true } },
        rows: {
          where: { success: false },
          orderBy: { rowNumber: 'asc' },
        },
      },
    });
  }
}
