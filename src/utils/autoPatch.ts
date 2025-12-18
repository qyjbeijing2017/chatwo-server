import { DataSource, EntityManager } from "typeorm";
import { startTransaction } from "./transaction";
import { Patchable } from "src/entities/patchable";
import { Operation } from "fast-json-patch";
import { ChatwoLog } from "src/entities/log.entity";

export class AutoPatchManager {
    patchables: Set<Patchable> = new Set();
    constructor(readonly manager: EntityManager) { }

    async find(...args: Parameters<EntityManager['find']>) {
        const result = await this.manager.find(...args);
        for (const item of result) {
            if (item instanceof Patchable) {
                item.shot();
                console.log('observe', item);
            }
        }
        return result;
    }

    async findOne(...args: Parameters<EntityManager['findOne']>) {
        const result = await this.manager.findOne(...args);
        if (result instanceof Patchable) {
            result.shot();
            console.log('observe', result);
        }
        return result;
    }

    async save(...args: Parameters<EntityManager['save']>) {
        const result = await this.manager.save(...args);
        if(Array.isArray(result)) {
            for (const item of result) {
                if (item instanceof Patchable) {
                    this.patchables.add(item);
                    console.log('patchable', item);
                }
            }
        } else if (result instanceof Patchable) {
            this.patchables.add(result);
            console.log('patchable', result);
        }
        return result;
    }

    delete(...args: Parameters<EntityManager['delete']>) {
        return this.manager.delete(...args);
    }

    create(...args: Parameters<EntityManager['create']>) {
        console.log('create', ...args);
        return this.manager.create(...args);
    }
}

export async function autoPatch<T>(dataSource: DataSource, callback: (manager: EntityManager) => Promise<{ result: T, message: string, tags: string[] }>): Promise<T> {
    return startTransaction<T>(dataSource, async (manager) => {
        const autoPatchManager = new AutoPatchManager(manager);
        const { result, message, tags } = await callback(autoPatchManager as any as EntityManager);
        const data: {
            [key: string]: {
                id: number;
                ops: Operation[];
            }[]
        } = {};
        for (const patchable of autoPatchManager.patchables) {
            const ops = patchable.patch();
            console.log('patch ops', patchable, ops);
            if (ops.length > 0) {
                data[patchable.constructor.name] = data[patchable.constructor.name] || [];
                data[patchable.constructor.name].push({
                    id: patchable.id,
                    ops,
                });
                console.log('saving patchable', patchable, ops);
            }
        }
        const log = manager.create(ChatwoLog, {
            message,
            tags,
            data,
        });
        await manager.save(log);
        return result;
    });
}