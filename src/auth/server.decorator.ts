import { SetMetadata } from '@nestjs/common';

export const IS_SERVER_KEY = 'isServer';
export const Server = () => SetMetadata(IS_SERVER_KEY, true);
