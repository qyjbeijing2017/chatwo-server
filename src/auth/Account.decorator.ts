/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Client } from '@heroiclabs/nakama-js';

export const Account = createParamDecorator(
  (
    _d: unknown,
    ctx: ExecutionContext,
  ): Awaited<ReturnType<typeof Client.prototype.getAccount>> => {
    const request = ctx.switchToHttp().getRequest();
    const account = request['account'] as Awaited<
      ReturnType<typeof Client.prototype.getAccount>
    >;
    if (!account) {
      throw new UnauthorizedException('Account not found in request');
    }
    return account;
  },
);
