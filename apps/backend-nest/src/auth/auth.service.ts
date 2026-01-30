import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ConfidentialClientApplication } from '@azure/msal-node';
import { UsersService } from '../users/users.service';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  private msalClient: ConfidentialClientApplication;

  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
    private configService: ConfigService,
  ) {
    const clientId = this.configService.get<string>('MICROSOFT_CLIENT_ID');
    const clientSecret = this.configService.get<string>(
      'MICROSOFT_CLIENT_SECRET',
    );
    const tenantId = this.configService.get<string>('MICROSOFT_TENANT_ID');

    if (!clientId || !clientSecret || !tenantId) {
      throw new Error('Microsoft authentication configuration is missing');
    }

    this.msalClient = new ConfidentialClientApplication({
      auth: {
        clientId,
        authority: `https://login.microsoftonline.com/${tenantId}`,
        clientSecret,
      },
    });
  }

  getAuthUrl(): string {
    const redirectUri = this.configService.get<string>(
      'MICROSOFT_REDIRECT_URI',
    );

    return this.msalClient.getAuthCodeUrl({
      scopes: ['User.Read'],
      redirectUri,
    });
  }

  async handleCallback(
    code: string,
  ): Promise<{ accessToken: string; user: any }> {
    const redirectUri = this.configService.get<string>(
      'MICROSOFT_REDIRECT_URI',
    );

    try {
      // Exchange code for tokens
      const tokenResponse = await this.msalClient.acquireTokenByCode({
        code,
        scopes: ['User.Read'],
        redirectUri,
      });

      if (!tokenResponse || !tokenResponse.account) {
        throw new UnauthorizedException('Failed to acquire token');
      }

      const { account } = tokenResponse;
      const email = account.username;
      const name = account.name || email;
      const msOid = account.homeAccountId;

      // Get or create user
      const workspaceId = this.configService.get<string>(
        'DEFAULT_WORKSPACE_ID',
      );

      if (!workspaceId) {
        throw new Error('DEFAULT_WORKSPACE_ID not configured');
      }

      let user = await this.usersService.findByEmail(workspaceId, email);

      if (!user) {
        // Create new user with default role
        user = await this.usersService.create({
          workspaceId,
          email,
          name,
          msOid,
          role: 'task_owner', // Default role
        });
      } else {
        // Update existing user
        user = await this.usersService.update(user.id, {
          msOid,
          name,
          lastLoginAt: new Date(),
        });
      }

      // Generate JWT
      const payload: JwtPayload = {
        sub: user.id,
        email: user.email,
        workspaceId: user.workspaceId,
        role: user.role,
      };

      const accessToken = this.jwtService.sign(payload);

      return { accessToken, user };
    } catch (error) {
      console.error('Microsoft auth callback error:', error);
      throw new UnauthorizedException('Authentication failed');
    }
  }

  async validateUser(payload: JwtPayload): Promise<any> {
    const user = await this.usersService.findById(payload.sub);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    return user;
  }
}
