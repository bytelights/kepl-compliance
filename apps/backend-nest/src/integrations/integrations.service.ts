import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class IntegrationsService {
  private algorithm = 'aes-256-cbc';
  private encryptionKey: Buffer;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    const key = this.configService.get<string>('ENCRYPTION_KEY');
    if (key) {
      this.encryptionKey = Buffer.from(key.padEnd(32, '0').slice(0, 32));
    }
  }

  private encrypt(text: string): string {
    if (!this.encryptionKey) return text;

    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      this.algorithm,
      this.encryptionKey,
      iv,
    );
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  private decrypt(text: string): string {
    if (!this.encryptionKey) return text;

    const parts = text.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = parts[1];
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      this.encryptionKey,
      iv,
    );
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  async setConfig(
    keyName: string,
    value: string,
    encrypt = false,
  ): Promise<void> {
    const finalValue = encrypt ? this.encrypt(value) : value;

    await this.prisma.config.upsert({
      where: { keyName },
      update: { value: finalValue, active: true },
      create: { keyName, value: finalValue, active: true },
    });
  }

  async getConfig(keyName: string, decrypt = false): Promise<string | null> {
    const config = await this.prisma.config.findUnique({
      where: { keyName },
    });

    if (!config || !config.active) return null;

    return decrypt ? this.decrypt(config.value) : config.value;
  }

  // SharePoint config
  async updateSharePointConfig(config: {
    tenantId?: string;
    siteId: string;
    driveId: string;
    baseFolderName?: string;
  }) {
    await Promise.all([
      config.tenantId && this.setConfig('sharepoint_tenant_id', config.tenantId),
      this.setConfig('sharepoint_site_id', config.siteId),
      this.setConfig('sharepoint_drive_id', config.driveId),
      this.setConfig(
        'sharepoint_base_folder_name',
        config.baseFolderName || 'Compliance-Documents',
      ),
    ].filter(Boolean));
  }

  async getSharePointConfig() {
    const [tenantId, siteId, driveId, baseFolderName] = await Promise.all([
      this.getConfig('sharepoint_tenant_id'),
      this.getConfig('sharepoint_site_id'),
      this.getConfig('sharepoint_drive_id'),
      this.getConfig('sharepoint_base_folder_name'),
    ]);

    return {
      tenantId: tenantId || '',
      siteId: siteId || '',
      driveId: driveId || '',
      baseFolderName: baseFolderName || 'Compliance-Documents',
    };
  }

  // Teams config
  async updateTeamsConfig(config: {
    webhookUrl: string;
    channelName?: string;
    sendDailySummary?: boolean;
    alertOverdue?: boolean;
    notifyCompletion?: boolean;
    weeklyReports?: boolean;
    weeklyReportDay?: number;
    weeklyReportTime?: string;
    timezone?: string;
  }) {
    await Promise.all(
      [
        this.setConfig('teams_webhook_url', config.webhookUrl, true),
        config.channelName && this.setConfig('teams_channel_name', config.channelName),
        this.setConfig('teams_send_daily_summary', String(config.sendDailySummary ?? false)),
        this.setConfig('teams_alert_overdue', String(config.alertOverdue ?? false)),
        this.setConfig('teams_notify_completion', String(config.notifyCompletion ?? false)),
        this.setConfig('teams_weekly_reports', String(config.weeklyReports ?? false)),
        config.weeklyReportDay !== undefined &&
          this.setConfig(
            'weekly_report_day_of_week',
            config.weeklyReportDay.toString(),
          ),
        config.weeklyReportTime &&
          this.setConfig('weekly_report_time_hhmm', config.weeklyReportTime),
        config.timezone && this.setConfig('timezone', config.timezone),
      ].filter(Boolean),
    );
  }

  async getTeamsConfig() {
    const [
      webhookUrl,
      channelName,
      sendDailySummary,
      alertOverdue,
      notifyCompletion,
      weeklyReports,
      dayOfWeek,
      time,
      timezone,
    ] = await Promise.all([
      this.getConfig('teams_webhook_url', true),
      this.getConfig('teams_channel_name'),
      this.getConfig('teams_send_daily_summary'),
      this.getConfig('teams_alert_overdue'),
      this.getConfig('teams_notify_completion'),
      this.getConfig('teams_weekly_reports'),
      this.getConfig('weekly_report_day_of_week'),
      this.getConfig('weekly_report_time_hhmm'),
      this.getConfig('timezone'),
    ]);

    return {
      webhookUrl: webhookUrl || '',
      channelName: channelName || '',
      sendDailySummary: sendDailySummary === 'true',
      alertOverdue: alertOverdue === 'true',
      notifyCompletion: notifyCompletion === 'true',
      weeklyReports: weeklyReports === 'true',
      weeklyReportDay: dayOfWeek ? parseInt(dayOfWeek) : 1,
      weeklyReportTime: time || '09:00',
      timezone: timezone || 'UTC',
    };
  }
}
