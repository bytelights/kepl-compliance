import { Injectable } from '@nestjs/common';

export interface AdaptiveCardSection {
  type: string;
  text?: string;
  size?: string;
  weight?: string;
}

export interface AdaptiveCard {
  type: string;
  version: string;
  body: any[];
}

@Injectable()
export class TeamsService {
  async sendMessage(webhookUrl: string, message: string): Promise<void> {
    const payload = {
      type: 'message',
      text: message,
    };

    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  }

  async sendAdaptiveCard(
    webhookUrl: string,
    card: AdaptiveCard,
  ): Promise<void> {
    const payload = {
      type: 'message',
      attachments: [
        {
          contentType: 'application/vnd.microsoft.card.adaptive',
          content: card,
        },
      ],
    };

    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  }

  createWeeklyReportCard(
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
  ): AdaptiveCard {
    const card: AdaptiveCard = {
      type: 'AdaptiveCard',
      version: '1.4',
      body: [
        {
          type: 'TextBlock',
          text: '📊 Weekly Compliance Report',
          size: 'large',
          weight: 'bolder',
        },
        {
          type: 'TextBlock',
          text: new Date().toLocaleDateString(),
          spacing: 'none',
          isSubtle: true,
        },
        {
          type: 'FactSet',
          facts: [
            { title: '⏳ Pending Tasks:', value: summary.pending.toString() },
            {
              title: '📅 Due Next 7 Days:',
              value: summary.dueNext7Days.toString(),
            },
            { title: '🔴 Overdue Tasks:', value: summary.overdue.toString() },
          ],
        },
      ],
    };

    if (tasks.length > 0) {
      card.body.push({
        type: 'TextBlock',
        text: '📋 Task Details',
        weight: 'bolder',
        spacing: 'medium',
      });

      tasks.slice(0, 10).forEach((task) => {
        card.body.push({
          type: 'Container',
          separator: true,
          items: [
            {
              type: 'TextBlock',
              text: `**${task.complianceId}** - ${task.title}`,
              wrap: true,
            },
            {
              type: 'FactSet',
              facts: [
                { title: 'Entity:', value: task.entity },
                { title: 'Due Date:', value: task.dueDate },
                { title: 'Status:', value: task.status },
                { title: 'Impact:', value: task.impact },
                { title: 'Owner:', value: task.owner },
              ],
            },
          ],
        });
      });

      if (tasks.length > 10) {
        card.body.push({
          type: 'TextBlock',
          text: `...and ${tasks.length - 10} more tasks`,
          isSubtle: true,
        });
      }
    }

    return card;
  }

  async testConnection(
    webhookUrl: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      await this.sendMessage(
        webhookUrl,
        '✅ Teams webhook connection test successful!',
      );
      return { success: true, message: 'Test message sent successfully' };
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to send test message: ${error.message}`,
      };
    }
  }
}
