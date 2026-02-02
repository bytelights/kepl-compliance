import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MasterDataService } from '../master-data/master-data.service';
import { UsersService } from '../users/users.service';
import * as Papa from 'papaparse';
import { TaskStatus, TaskFrequency, TaskImpact } from '@prisma/client';

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
        this.validateAndProcessRow(row, index + 1, job.id, mode),
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

    // Fetch the job with all rows for preview
    const jobWithRows = await this.prisma.csvImportJob.findUnique({
      where: { id: job.id },
      include: {
        rows: {
          orderBy: { rowNumber: 'asc' },
          take: mode === 'preview' ? 100 : undefined, // Limit preview to 100 rows for performance
        },
        uploader: { select: { name: true, email: true } },
      },
    });

    return {
      jobId: job.id,
      totalRows: rows.length,
      successRows: successCount,
      failedRows: failedCount,
      job: jobWithRows,
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
        row['Operating Unit'].trim(),
      );

      const department = await this.masterDataService.findOrCreate(
        'departments',
        row['Department'].trim(),
      );

      const law = await this.masterDataService.findOrCreate(
        'laws',
        row['Name of Law'].trim(),
      );

      // Find owner and reviewer (must exist)
      const owner = await this.usersService.findByEmail(row['Owner'].trim());

      if (!owner) {
        errors.push(`Owner email not found: ${row['Owner']}`);
      }

      const reviewer = await this.usersService.findByEmail(
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
          complianceId_entityId: {
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

  private mapFrequency(value: string): TaskFrequency | undefined {
    const map: Record<string, TaskFrequency> = {
      daily: TaskFrequency.DAILY,
      weekly: TaskFrequency.WEEKLY,
      monthly: TaskFrequency.MONTHLY,
      quarterly: TaskFrequency.QUARTERLY,
      'half-yearly': TaskFrequency.HALF_YEARLY,
      yearly: TaskFrequency.YEARLY,
      'one-time': TaskFrequency.ONE_TIME,
    };
    return value ? map[value.toLowerCase()] : undefined;
  }

  private mapImpact(value: string): TaskImpact | undefined {
    const map: Record<string, TaskImpact> = {
      low: TaskImpact.LOW,
      medium: TaskImpact.MEDIUM,
      high: TaskImpact.HIGH,
      critical: TaskImpact.CRITICAL,
    };
    return value ? map[value.toLowerCase()] : undefined;
  }

  private mapStatus(value: string): TaskStatus {
    const map: Record<string, TaskStatus> = {
      pending: TaskStatus.PENDING,
      completed: TaskStatus.COMPLETED,
      skipped: TaskStatus.SKIPPED,
    };
    return value ? map[value.toLowerCase()] || TaskStatus.PENDING : TaskStatus.PENDING;
  }

  async getImportJobs() {
    return this.prisma.csvImportJob.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        uploader: { select: { name: true, email: true } },
      },
    });
  }

  async getImportJobDetails(jobId: string) {
    return this.prisma.csvImportJob.findUnique({
      where: { id: jobId },
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
