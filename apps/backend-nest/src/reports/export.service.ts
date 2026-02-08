import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ExportService {
  constructor(private prisma: PrismaService) {}

  /**
   * Generate compliance summary report data
   */
  async generateComplianceSummary(
    startDate?: Date,
    endDate?: Date,
  ): Promise<any[]> {
    const where: any = {};

    if (startDate && endDate) {
      where.dueDate = {
        gte: startDate,
        lte: endDate,
      };
    }

    const tasks = await this.prisma.complianceTask.findMany({
      where,
      select: {
        complianceId: true,
        title: true,
        description: true,
        status: true,
        impact: true,
        dueDate: true,
        completedAt: true,
        createdAt: true,
        entity: { select: { name: true } },
        department: { select: { name: true } },
        law: { select: { name: true } },
        owner: { select: { name: true, email: true } },
        reviewer: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return tasks.map((task) => ({
      'Compliance ID': task.complianceId,
      'Title': task.title,
      'Description': task.description || '',
      'Entity': task.entity.name,
      'Department': task.department.name,
      'Law': task.law.name,
      'Status': task.status,
      'Impact': task.impact || '',
      'Due Date': task.dueDate?.toISOString().split('T')[0] || '',
      'Completion Date': (task as any).completedAt?.toISOString().split('T')[0] || '',
      'Owner': task.owner.name,
      'Owner Email': task.owner.email,
      'Reviewer': task.reviewer.name,
      'Reviewer Email': task.reviewer.email,
      'Created At': task.createdAt.toISOString().split('T')[0],
    }));
  }

  /**
   * Generate department-wise compliance report
   */
  async generateDepartmentReport(): Promise<any[]> {
    const departments = await this.prisma.department.findMany({
      include: {
        complianceTasks: {
          select: {
            status: true,
            dueDate: true,
          },
        },
      },
    });

    const today = new Date();

    return departments.map((dept) => {
      const totalTasks = dept.complianceTasks.length;
      const completed = dept.complianceTasks.filter((t) => t.status === 'COMPLETED').length;
      const pending = dept.complianceTasks.filter((t) => t.status === 'PENDING').length;
      const skipped = dept.complianceTasks.filter((t) => t.status === 'SKIPPED').length;
      const overdue = dept.complianceTasks.filter(
        (t) => t.status === 'PENDING' && t.dueDate && t.dueDate < today,
      ).length;

      return {
        'Department': dept.name,
        'Total Tasks': totalTasks,
        'Completed': completed,
        'Pending': pending,
        'Skipped': skipped,
        'Overdue': overdue,
        'Compliance Rate': totalTasks > 0 ? `${Math.round((completed / totalTasks) * 100)}%` : '0%',
      };
    });
  }

  /**
   * Generate overdue tasks report
   */
  async generateOverdueReport(): Promise<any[]> {
    const today = new Date();

    const tasks = await this.prisma.complianceTask.findMany({
      where: {
        status: 'PENDING',
        dueDate: { lt: today },
      },
      select: {
        complianceId: true,
        title: true,
        impact: true,
        dueDate: true,
        entity: { select: { name: true } },
        department: { select: { name: true } },
        law: { select: { name: true } },
        owner: { select: { name: true, email: true } },
      },
      orderBy: { dueDate: 'asc' },
    });

    return tasks.map((task) => {
      const daysOverdue = task.dueDate
        ? Math.floor((today.getTime() - task.dueDate.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      return {
        'Compliance ID': task.complianceId,
        'Title': task.title,
        'Entity': task.entity.name,
        'Department': task.department.name,
        'Law': task.law.name,
        'Due Date': task.dueDate?.toISOString().split('T')[0] || '',
        'Days Overdue': daysOverdue,
        'Impact': task.impact || '',
        'Owner': task.owner.name,
        'Owner Email': task.owner.email,
      };
    });
  }

  /**
   * Convert data to CSV format
   */
  convertToCSV(data: any[]): string {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvRows = [];

    // Add header row
    csvRows.push(headers.join(','));

    // Add data rows
    for (const row of data) {
      const values = headers.map((header) => {
        const value = row[header];
        // Escape commas and quotes
        const escaped = ('' + value).replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
  }
}
