import type { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    name: string;
    email: string | null;
    isGuest: boolean;
  };
  authToken?: string;
}
