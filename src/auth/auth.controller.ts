import { Controller, Get, Headers, Post, Res, UnauthorizedException } from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private getCookieOptions() {
    const isLocalFrontend = (process.env.FRONTEND_ORIGIN ?? 'http://localhost:3000').includes('localhost');

    return {
      httpOnly: true,
      sameSite: isLocalFrontend ? ('lax' as const) : ('none' as const),
      secure: !isLocalFrontend,
      path: '/',
      maxAge: 1000 * 60 * 60 * 24 * 30,
    };
  }

  @Post('guest')
  async guestLogin(@Res({ passthrough: true }) response: Response) {
    const result = await this.authService.loginAsGuest();
    response.cookie('able-space.token', result.token, this.getCookieOptions());
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
  async logout(@Res({ passthrough: true }) response: Response, @Headers('cookie') cookie?: string) {
    const token = cookie?.match(/(?:^|;\s*)able-space\.token=([^;]+)/)?.[1];

    if (token) {
      await this.authService.logout(decodeURIComponent(token));
    }

    response.clearCookie('able-space.token', this.getCookieOptions());
    return { ok: true };
  }
}
