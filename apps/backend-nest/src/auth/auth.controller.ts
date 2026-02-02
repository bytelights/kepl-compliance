import {
  Controller,
  Get,
  Query,
  Res,
  UseGuards,
  UnauthorizedException,
  Post,
} from '@nestjs/common';
import type { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../common/interfaces/jwt-payload.interface';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
    private jwtService: JwtService,
  ) {}

  @Get('microsoft/login')
  async microsoftLogin(@Res() res: Response) {
    try {
      console.log('🔵 Starting Microsoft login flow...');
      console.log('🔵 Config check:', {
        clientId: this.configService.get('MICROSOFT_CLIENT_ID'),
        tenantId: this.configService.get('MICROSOFT_TENANT_ID'),
        redirectUri: this.configService.get('MICROSOFT_REDIRECT_URI'),
        hasSecret: !!this.configService.get('MICROSOFT_CLIENT_SECRET'),
      });
      
      const authUrl = await this.authService.getAuthUrl();
      console.log('🔵 Generated auth URL:', authUrl);
      console.log('🔵 About to redirect...');
      
      // Set no-cache headers to prevent caching
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      return res.redirect(302, authUrl);
    } catch (error) {
      console.error('❌ Login redirect error:', error);
      throw new UnauthorizedException('Failed to initiate login');
    }
  }

  @Get('microsoft/callback')
  async microsoftCallback(@Query('code') code: string, @Query() allParams: any, @Res() res: Response) {
    console.log('🔵 Callback received');
    console.log('🔵 Code:', code);
    console.log('🔵 All query params:', allParams);
    
    if (!code) {
      console.error('❌ No authorization code provided');
      throw new UnauthorizedException('Authorization code not provided');
    }

    try {
      const { accessToken } = await this.authService.handleCallback(code);

      // Set httpOnly cookie
      res.cookie('access_token', accessToken, {
        httpOnly: true,
        secure: this.configService.get('NODE_ENV') === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      // Redirect to frontend
      const frontendUrl = this.configService.get<string>('FRONTEND_URL');
      res.redirect(`${frontendUrl}/dashboard`);
    } catch (error) {
      console.error('Callback error:', error);
      const frontendUrl = this.configService.get<string>('FRONTEND_URL');
      res.redirect(`${frontendUrl}/login?error=auth_failed`);
    }
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  getCurrentUser(@CurrentUser() user: JwtPayload) {
    return {
      success: true,
      data: {
        id: user.sub,
        email: user.email,
        role: user.role,
      },
    };
  }

  @Post('logout')
  @UseGuards(AuthGuard('jwt'))
  logout(@Res() res: Response) {
    res.clearCookie('access_token');
    res.json({ success: true, message: 'Logged out successfully' });
  }

  /**
   * DEV ONLY - Quick login bypass for UI testing
   */
  @Get('dev/login')
  async devLogin(@Res() res: Response) {
    if (this.configService.get('NODE_ENV') === 'production') {
      throw new UnauthorizedException('Dev login not available in production');
    }

    try {
      // Create or get dev user
      const user = await this.authService.findOrCreateDevUser('dev@test.com');
      
      // Generate JWT token using injected JwtService
      const payload: JwtPayload = {
        sub: user.id,
        email: user.email,
        role: user.role,
      };

      const accessToken = this.jwtService.sign(payload);

      // Set httpOnly cookie
      res.cookie('access_token', accessToken, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      // Redirect to dashboard
      const frontendUrl = this.configService.get<string>('FRONTEND_URL');
      res.redirect(`${frontendUrl}/dashboard`);
    } catch (error) {
      console.error('Dev login error:', error);
      const frontendUrl = this.configService.get<string>('FRONTEND_URL');
      res.redirect(`${frontendUrl}/login?error=dev_login_failed`);
    }
  }
}
