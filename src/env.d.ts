declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production' | 'test';
    APP_NAME: string;
    VERSION: string;
    PORT: string;

    DB_HOST: string;
    DB_PORT: string;
    DB_USERNAME: string;
    DB_PASSWORD: string;
    DB_NAME: string;

    STORAGE_HOST: string;
    STORAGE_USERNAME: string;
    STORAGE_PASSWORD: string;
    STORAGE_FORCE_PATH_STYLE: string;
    STORAGE_SIGNATURE_VERSION: 'v2' | 'v4';
    STORAGE_SIZE_LIMIT: string;

    SAULT_ROUNDS: string;

    JWT_SECRET: string;
    JWT_EXPIRES_IN: string;

    NAKAMA_HOST: string;
    NAKAMA_PORT: string;
    NAKAMA_SERVER_KEY: string;
    NAKAMA_USE_SSL: string;
    NAKAMA_RUNTIME_KEY: string;
  }
}
