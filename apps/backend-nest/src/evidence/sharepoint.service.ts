import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from '@microsoft/microsoft-graph-client';
import { ClientSecretCredential } from '@azure/identity';

@Injectable()
export class SharePointService {
  private graphClient: Client;
  private siteId: string;
  private driveId: string;
  private baseFolderName: string;

  constructor(private configService: ConfigService) {
    this.initializeGraphClient();
  }

  private initializeGraphClient() {
    const tenantId = this.configService.get<string>('SHAREPOINT_TENANT_ID');
    const clientId = this.configService.get<string>('MICROSOFT_CLIENT_ID');
    const clientSecret = this.configService.get<string>(
      'MICROSOFT_CLIENT_SECRET',
    );

    this.siteId = this.configService.get<string>('SHAREPOINT_SITE_ID', '');
    this.driveId = this.configService.get<string>('SHAREPOINT_DRIVE_ID', '');
    this.baseFolderName = 'Compliance-Documents';

    if (!tenantId || !clientId || !clientSecret) {
      console.warn('SharePoint configuration is incomplete');
      return;
    }

    const credential = new ClientSecretCredential(
      tenantId,
      clientId,
      clientSecret,
    );

    this.graphClient = Client.initWithMiddleware({
      authProvider: {
        getAccessToken: async () => {
          const token = await credential.getToken(
            'https://graph.microsoft.com/.default',
          );
          return token.token;
        },
      },
    });
  }

  /**
   * Creates folder structure: Compliance-Documents/{Entity}/{Year}/{Month}/{ComplianceID}/
   */
  async ensureFolderPath(
    entityName: string,
    complianceId: string,
    date: Date = new Date(),
  ): Promise<string> {
    const year = date.getFullYear().toString();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');

    const pathSegments = [
      this.baseFolderName,
      entityName,
      year,
      month,
      complianceId,
    ];

    let currentPath = '';
    for (const segment of pathSegments) {
      currentPath = currentPath ? `${currentPath}/${segment}` : segment;
      await this.ensureFolderExists(currentPath);
    }

    return currentPath;
  }

  private async ensureFolderExists(folderPath: string): Promise<void> {
    try {
      // Check if folder exists
      await this.graphClient
        .api(`/drives/${this.driveId}/root:/${folderPath}`)
        .get();
    } catch (error: any) {
      if (error.statusCode === 404) {
        // Create folder
        const pathParts = folderPath.split('/');
        const folderName = pathParts.pop();
        const parentPath = pathParts.join('/');

        const parentRef = parentPath
          ? `/drives/${this.driveId}/root:/${parentPath}`
          : `/drives/${this.driveId}/root`;

        await this.graphClient.api(`${parentRef}/children`).post({
          name: folderName,
          folder: {},
          '@microsoft.graph.conflictBehavior': 'rename',
        });
      } else {
        throw error;
      }
    }
  }

  /**
   * Creates an upload session for large file uploads
   */
  async createUploadSession(
    folderPath: string,
    fileName: string,
  ): Promise<any> {
    const uploadUrl = `/drives/${this.driveId}/root:/${folderPath}/${fileName}:/createUploadSession`;

    const uploadSession = await this.graphClient.api(uploadUrl).post({
      item: {
        '@microsoft.graph.conflictBehavior': 'rename',
      },
    });

    return {
      uploadUrl: uploadSession.uploadUrl,
      expirationDateTime: uploadSession.expirationDateTime,
    };
  }

  /**
   * Gets file metadata after upload
   */
  async getFileMetadata(folderPath: string, fileName: string): Promise<any> {
    return await this.graphClient
      .api(`/drives/${this.driveId}/root:/${folderPath}/${fileName}`)
      .get();
  }

  /**
   * Deletes a file
   */
  async deleteFile(itemId: string): Promise<void> {
    await this.graphClient
      .api(`/drives/${this.driveId}/items/${itemId}`)
      .delete();
  }

  /**
   * Tests SharePoint connection
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      await this.graphClient.api(`/drives/${this.driveId}`).get();
      return { success: true, message: 'SharePoint connection successful' };
    } catch (error: any) {
      return {
        success: false,
        message: `SharePoint connection failed: ${error.message}`,
      };
    }
  }

  getSiteId(): string {
    return this.siteId;
  }

  getDriveId(): string {
    return this.driveId;
  }
}
