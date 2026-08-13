import { Controller, Get, Headers, Post, Res, UnauthorizedException } from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('guest')
  async guestLogin(@Res({ passthrough: true }) response: Response) {
    const result = await this.authService.loginAsGuest();
    response.cookie('able-space.token', result.token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 1000 * 60 * 60 * 24 * 30,
    });
    return { user: result.user };
  }

  @Get('me')
  async me(@Headers('cookie') cookie?: string) {
    const token = cookie?.match(/(?:^|;\s*)able-space\.token=([^;]+)/)?.[1];

    if (!token) {
      throw new UnauthorizedException('Missing authorization token');
    }

    return this.authService.getCurrentUser(decodeURIComponent(token));
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie('able-space.token', { path: '/' });
    return { ok: true };
  }
}
