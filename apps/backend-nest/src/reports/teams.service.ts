import { Injectable } from '@nestjs/common';

@Injectable()
export class TeamsService {
  private buildAdaptiveCardPayload(body: any[]) {
    return {
      type: 'message',
      attachments: [
        {
          contentType: 'application/vnd.microsoft.card.adaptive',
          contentUrl: null,
          content: {
            $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
            type: 'AdaptiveCard',
            version: '1.2',
            msTeams: { width: 'Full' },
            body,
          },
        },
      ],
    };
  }

  private async postToWebhook(webhookUrl: string, payload: any): Promise<void> {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    if (responseText.includes('HTTP error 429')) {
      throw new Error('Rate limited by Teams. Please try again later.');
    }
  }

  async sendWeeklyReport(
    webhookUrl: string,
    summary: {
      pending: number;
      dueNext7Days: number;
      overdue: number;
    },
    tasks: Array<{
      complianceId: string;
      title: string;
      entity: string;
      dueDate: string;
      status: string;
      impact: string;
      owner: string;
      reviewer: string;
    }>,
  ): Promise<void> {
    const body: any[] = [
      {
        type: 'TextBlock',
        text: 'Kelp Compliance - Weekly Report',
        size: 'large',
        weight: 'bolder',
        color: 'accent',
      },
      {
        type: 'TextBlock',
        text: new Date().toLocaleDateString('en-IN', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        spacing: 'none',
        isSubtle: true,
      },
      {
        type: 'ColumnSet',
        separator: true,
        spacing: 'medium',
        columns: [
          {
            type: 'Column',
            width: 'stretch',
            items: [
              { type: 'TextBlock', text: 'Pending', size: 'small', isSubtle: true, horizontalAlignment: 'center' },
              { type: 'TextBlock', text: String(summary.pending), size: 'extraLarge', weight: 'bolder', color: 'warning', horizontalAlignment: 'center' },
            ],
          },
          {
            type: 'Column',
            width: 'stretch',
            items: [
              { type: 'TextBlock', text: 'Due (7 days)', size: 'small', isSubtle: true, horizontalAlignment: 'center' },
              { type: 'TextBlock', text: String(summary.dueNext7Days), size: 'extraLarge', weight: 'bolder', color: 'accent', horizontalAlignment: 'center' },
            ],
          },
          {
            type: 'Column',
            width: 'stretch',
            items: [
              { type: 'TextBlock', text: 'Overdue', size: 'small', isSubtle: true, horizontalAlignment: 'center' },
              { type: 'TextBlock', text: String(summary.overdue), size: 'extraLarge', weight: 'bolder', color: 'attention', horizontalAlignment: 'center' },
            ],
          },
        ],
      },
    ];

    if (tasks.length > 0) {
      body.push({
        type: 'TextBlock',
        text: 'Task Details',
        weight: 'bolder',
        spacing: 'large',
        separator: true,
      });

      // Table header
      body.push({
        type: 'ColumnSet',
        spacing: 'small',
        columns: [
          { type: 'Column', width: 3, items: [{ type: 'TextBlock', text: 'Task', weight: 'bolder', size: 'small' }] },
          { type: 'Column', width: 2, items: [{ type: 'TextBlock', text: 'Entity', weight: 'bolder', size: 'small' }] },
          { type: 'Column', width: 2, items: [{ type: 'TextBlock', text: 'Due Date', weight: 'bolder', size: 'small' }] },
          { type: 'Column', width: 2, items: [{ type: 'TextBlock', text: 'Owner', weight: 'bolder', size: 'small' }] },
          { type: 'Column', width: 1, items: [{ type: 'TextBlock', text: 'Impact', weight: 'bolder', size: 'small' }] },
        ],
      });

      // Table rows (max 10)
      tasks.slice(0, 10).forEach((task) => {
        body.push({
          type: 'ColumnSet',
          spacing: 'none',
          separator: true,
          columns: [
            { type: 'Column', width: 3, items: [{ type: 'TextBlock', text: `**${task.complianceId}** - ${task.title}`, size: 'small', wrap: true }] },
            { type: 'Column', width: 2, items: [{ type: 'TextBlock', text: task.entity, size: 'small', wrap: true }] },
            { type: 'Column', width: 2, items: [{ type: 'TextBlock', text: task.dueDate, size: 'small', color: 'attention', wrap: true }] },
            { type: 'Column', width: 2, items: [{ type: 'TextBlock', text: task.owner, size: 'small', wrap: true }] },
            { type: 'Column', width: 1, items: [{ type: 'TextBlock', text: task.impact, size: 'small', wrap: true }] },
          ],
        });
      });

      if (tasks.length > 10) {
        body.push({
          type: 'TextBlock',
          text: `...and ${tasks.length - 10} more tasks`,
          isSubtle: true,
          spacing: 'small',
        });
      }
    }

    const payload = this.buildAdaptiveCardPayload(body);
    await this.postToWebhook(webhookUrl, payload);
  }

  async testConnection(
    webhookUrl: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const body = [
        {
          type: 'TextBlock',
          text: 'Kelp Compliance',
          size: 'large',
          weight: 'bolder',
          color: 'accent',
        },
        {
          type: 'TextBlock',
          text: 'Webhook connection test successful!',
          spacing: 'small',
        },
        {
          type: 'FactSet',
          facts: [
            { title: 'Status', value: 'Connected' },
            { title: 'Tested at', value: new Date().toLocaleString('en-IN') },
          ],
        },
      ];

      const payload = this.buildAdaptiveCardPayload(body);
      await this.postToWebhook(webhookUrl, payload);
      return { success: true, message: 'Test message sent successfully' };
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to send test message: ${error.message}`,
      };
    }
  }
}
