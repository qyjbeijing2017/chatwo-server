/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { NakamaService } from 'src/nakama/nakama.service';
import { IS_PUBLIC_KEY } from './public.decorator';
import { IS_SERVER_KEY } from './server.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly nakamaService: NakamaService,
    private reflector: Reflector,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      // 💡 See this condition
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException();
    }

    const isServer = this.reflector.getAllAndOverride<boolean>(IS_SERVER_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isServer) {
      if (token === process.env.NAKAMA_RUNTIME_KEY) {
        return true;
      } else {
        throw new UnauthorizedException();
      }
    }
    
    try {
      const session = this.nakamaService.getSession(token);
      const account = await this.nakamaService.getAccount(session);
      request['account'] = account;
    } catch {
      throw new UnauthorizedException();
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
