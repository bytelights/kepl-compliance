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

    try {
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
    } catch (error) {
      console.error('Error initializing graph client:', error);
      throw error;
    }
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

    console.log('[SharePoint] ensureFolderPath segments:', pathSegments, 'driveId:', this.driveId);

    let currentPath = '';
    for (const segment of pathSegments) {
      currentPath = currentPath ? `${currentPath}/${segment}` : segment;
      await this.ensureFolderExists(currentPath);
    }

    return currentPath;
  }

  private async ensureFolderExists(folderPath: string): Promise<void> {
    try {
      const checkUrl = `/drives/${this.driveId}/root:/${folderPath}`;
      console.log('[SharePoint] Checking folder:', checkUrl);
      await this.graphClient.api(checkUrl).get();
    } catch (error: any) {
      if (error.statusCode === 404) {
        // Create folder
        const pathParts = folderPath.split('/');
        const folderName = pathParts.pop();
        const parentPath = pathParts.join('/');

        // Path-based addressing requires closing colon before /children
        const parentRef = parentPath
          ? `/drives/${this.driveId}/root:/${parentPath}:/children`
          : `/drives/${this.driveId}/root/children`;

        console.log('[SharePoint] Creating folder:', folderName, 'at:', parentRef);
        await this.graphClient.api(parentRef).post({
          name: folderName,
          folder: {},
          '@microsoft.graph.conflictBehavior': 'rename',
        });
      } else {
        console.error('[SharePoint] ensureFolderExists error:', error.statusCode, error.code, error.message, error.body);
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
    console.log('[SharePoint] createUploadSession URL:', uploadUrl);

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
   * Uploads a file buffer to SharePoint (server-side, avoids CORS).
   * Uses simple PUT for files <= 4MB, chunked upload session for larger files.
   */
  async uploadFileBuffer(
    folderPath: string,
    fileName: string,
    buffer: Buffer,
    fileSize: number,
  ): Promise<{ id: string; webUrl: string }> {
    if (fileSize <= 4 * 1024 * 1024) {
      // Small file: simple PUT
      const putUrl = `/drives/${this.driveId}/root:/${folderPath}/${fileName}:/content`;
      console.log('[SharePoint] Simple PUT upload:', putUrl, `(${fileSize} bytes)`);
      return await this.graphClient
        .api(putUrl)
        .putStream(buffer);
    }

    // Large file: chunked upload via upload session
    console.log('[SharePoint] Chunked upload for:', fileName, `(${fileSize} bytes)`);
    const session = await this.createUploadSession(folderPath, fileName);
    const chunkSize = 327680 * 10; // 3.2 MB chunks
    let offset = 0;
    let result: any;

    while (offset < fileSize) {
      const end = Math.min(offset + chunkSize, fileSize);
      const chunk = buffer.subarray(offset, end);

      result = await fetch(session.uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Length': chunk.length.toString(),
          'Content-Range': `bytes ${offset}-${end - 1}/${fileSize}`,
        },
        body: new Uint8Array(chunk),
      }).then((r) => r.json());

      offset = end;
    }

    return result;
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
