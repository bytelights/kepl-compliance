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
      system: {
        loggerOptions: {
          loggerCallback: (level, message, containsPii) => {
            if (containsPii) return;
            console.log('MSAL:', message);
          },
          piiLoggingEnabled: false,
          logLevel: 3,
        },
      },
    });
  }

  async getAuthUrl(): Promise<string> {
    const redirectUri = this.configService.get<string>(
      'MICROSOFT_REDIRECT_URI',
    );

    if (!redirectUri) {
      throw new Error('MICROSOFT_REDIRECT_URI not configured');
    }

    return this.msalClient.getAuthCodeUrl({
      scopes: ['User.Read'],
      redirectUri,
      // Enable PKCE (required by Azure AD)
      responseMode: 'query',
    });
  }

  async handleCallback(
    code: string,
  ): Promise<{ accessToken: string; user: any }> {
    const redirectUri = this.configService.get<string>(
      'MICROSOFT_REDIRECT_URI',
    );

    if (!redirectUri) {
      throw new Error('MICROSOFT_REDIRECT_URI not configured');
    }

    try {
      // Exchange code for tokens with PKCE
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

      // Only allow users that already exist in the database
      const user = await this.usersService.findByEmail(email);

      if (!user) {
        throw new UnauthorizedException(
          'Access denied. Your account is not registered in the system. Please contact your administrator.',
        );
      }

      if (!user.isActive) {
        throw new UnauthorizedException(
          'Your account has been deactivated. Please contact your administrator.',
        );
      }

      // Update user details on login
      await this.usersService.update(user.id, {
        msOid,
        name,
        lastLoginAt: new Date(),
      });

      // Generate JWT
      const payload: JwtPayload = {
        sub: user.id,
        email: user.email,
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

  /**
   * DEV ONLY - Find or create a dev user for quick testing
   */
  async findOrCreateDevUser(email: string, role: string = 'ADMIN'): Promise<any> {
    let user = await this.usersService.findByEmail(email);

    // Map frontend role names to database role names
    const roleMap: Record<string, 'admin' | 'reviewer' | 'task_owner'> = {
      'ADMIN': 'admin',
      'REVIEWER': 'reviewer',
      'TASK_OWNER': 'task_owner',
    };

    const dbRole: 'admin' | 'reviewer' | 'task_owner' = roleMap[role] || 'admin';
    const userName = role === 'ADMIN' ? 'Dev Admin' : 
                     role === 'REVIEWER' ? 'Dev Reviewer' : 
                     'Dev Task Owner';

    if (!user) {
      user = await this.usersService.create({
        email,
        name: userName,
        msOid: 'dev-oid-' + Date.now(),
        role: dbRole,
      });
    } else if (user.role !== dbRole) {
      // Update name only (role updates should be done through user management)
      user = await this.usersService.update(user.id, {
        name: userName,
      });
      // Manually update role field for dev purposes
      user.role = dbRole;
    }

    return user;
  }
}
