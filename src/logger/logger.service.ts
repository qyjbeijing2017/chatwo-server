import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { promises as fs } from 'fs';
import { join } from 'path';

export interface LogKeyFilters {
    context?: (value: string) => boolean;
    level?: (value: string) => boolean;
    timestamp?: (value: string) => boolean;
    [key: string]: ((value: string | number | boolean | string[] | number[] | boolean[]) => boolean) | LogKeyFilters | undefined;
}

export interface LogSearchOptions {
    filters?: LogKeyFilters;
    limit?: number;
    skip?: number;
}

@Injectable()
export class LoggerService {
    constructor(private readonly configService: ConfigService<NodeJS.ProcessEnv>,) { }

    async search(options: LogSearchOptions) {
        const logDir = this.configService.get<string>('LOG_DIR', 'logs');
        const logDirPath = join(process.cwd(), logDir);
        const limit = options.limit ?? 100;
        const skip = options.skip ?? 0;

        const files = await fs.readdir(logDirPath).catch(() => [] as string[]);
        const logFiles = files
            .filter((file) => file.toLowerCase().endsWith('.log'))
            .sort()
            .reverse();

        const results: Record<string, unknown>[] = [];
        let skipped = 0;

        for (const file of logFiles) {
            const filePath = join(logDirPath, file);
            const content = await fs.readFile(filePath, 'utf8').catch(() => '');
            if (!content) {
                continue;
            }

            const lines = content.split(/\r?\n/);
            for (let i = lines.length - 1; i >= 0; i -= 1) {
                const line = lines[i].trim();
                if (!line) {
                    continue;
                }

                const entry = this.parseJsonLine(line);
                if (!entry) {
                    continue;
                }

                if (!this.matchesFilters(entry, options.filters)) {
                    continue;
                }

                if (skipped < skip) {
                    skipped += 1;
                    continue;
                }

                results.push(entry);
                if (results.length >= limit) {
                    return results;
                }
            }
        }

        return results;
    }

    async simpleSearch(keywords: string[], options: { limit?: number, skip?: number } = {}) {
        const logDir = this.configService.get<string>('LOG_DIR', 'logs');
        const logDirPath = join(process.cwd(), logDir);
        const limit = options.limit ?? 100;
        const skip = options.skip ?? 0;
        const files = await fs.readdir(logDirPath).catch(() => [] as string[]);
        const logFiles = files
            .filter((file) => file.toLowerCase().endsWith('.log'))
            .sort()
            .reverse();
        const results: Record<string, unknown>[] = [];
        let skipped = 0;
        for (const file of logFiles) {
            const filePath = join(logDirPath, file);
            const content = await fs.readFile(filePath, 'utf8').catch(() => '');
            if (!content) {
                continue;
            }
            const lines = content.split(/\r?\n/);
            for (let i = lines.length - 1; i >= 0; i -= 1) {
                const line = lines[i].trim();
                if (!line) {
                    continue;
                }
                if (!keywords.some((keyword) => line.includes(keyword))) {
                    continue;
                }
                const entry = this.parseJsonLine(line);
                if (!entry) {
                    continue;
                }
                if (skipped < skip) {
                    skipped += 1;
                    continue;
                }
                results.push(entry);
                if (results.length >= limit) {
                    return results;
                }
            }
        }
        return results;
    }

    private parseJsonLine(line: string): Record<string, unknown> | null {
        try {
            const parsed = JSON.parse(line) as Record<string, unknown>;
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                return parsed;
            }
        } catch {
            return null;
        }

        return null;
    }

    private matchesFilters(entry: Record<string, unknown>, filters?: LogKeyFilters): boolean {
        if (!filters) {
            return true;
        }

        for (const [key, filter] of Object.entries(filters)) {
            if (!filter) {
                continue;
            }

            const value = entry[key];

            if (typeof filter === 'function') {
                if (!filter(value as string | number | boolean | string[] | number[] | boolean[])) {
                    return false;
                }
                continue;
            }

            if (typeof filter === 'object' && filter !== null && !Array.isArray(filter)) {
                if (!value || typeof value !== 'object' || Array.isArray(value)) {
                    return false;
                }

                if (!this.matchesFilters(value as Record<string, unknown>, filter as LogKeyFilters)) {
                    return false;
                }
                continue;
            }

            return false;
        }

        return true;
    }
}