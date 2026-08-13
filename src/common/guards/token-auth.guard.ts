import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthenticatedRequest } from '../interfaces/auth-request.interface';

@Injectable()
export class TokenAuthGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const cookie = request.headers.cookie;
    const token = cookie?.match(/(?:^|;\s*)able-space\.token=([^;]+)/)?.[1];

    if (!token) {
      throw new UnauthorizedException('Missing authorization token');
    }

    const session = await this.prisma.session.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!session || session.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('Invalid or expired session');
    }

    request.user = {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      isGuest: session.user.isGuest,
    };

    return true;
  }
}
