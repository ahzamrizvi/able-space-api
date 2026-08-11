import { Controller, Get, Headers, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('guest')
  guestLogin() {
    return this.authService.loginAsGuest();
  }

  @Get('me')
  async me(@Headers('authorization') authorization?: string) {
    if (!authorization?.startsWith('Bearer ')) {
      return null;
    }

    return this.authService.getCurrentUser(authorization.slice(7).trim());
  }
}
