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
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../common/interfaces/jwt-payload.interface';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {}

  @Get('microsoft/login')
  async microsoftLogin(@Res() res: Response) {
    try {
      const authUrl = await this.authService.getAuthUrl();
      res.redirect(authUrl);
    } catch (error) {
      console.error('Login redirect error:', error);
      throw new UnauthorizedException('Failed to initiate login');
    }
  }

  @Get('microsoft/callback')
  async microsoftCallback(@Query('code') code: string, @Res() res: Response) {
    if (!code) {
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
}
