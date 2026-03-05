export async function findOneAsync<T>(array: T[], predicate: (item: T, index: number) => Promise<boolean>): Promise<T | null> {
    for (let index = 0; index < array.length; index++) {
        const item = array[index];
        if (await predicate(item, index)) {
            return item;
        }
    }
    return null;
}

export async function findAsync<T>(array: T[], predicate: (item: T, index: number) => Promise<boolean>): Promise<T[]> {
    const result: T[] = [];
    for (let index = 0; index < array.length; index++) {
        const item = array[index];
        if (await predicate(item, index)) {
            result.push(item);
        }
    }
    return result;
}

export async function mapAsync<T, U>(array: T[], mapper: (item: T, index: number) => Promise<U>): Promise<U[]> {
    const result: U[] = [];
    for (let index = 0; index < array.length; index++) {
        const item = array[index];
        result.push(await mapper(item, index));
    }
    return result;
}

export async function filterAsync<T>(array: T[], predicate: (item: T, index: number) => Promise<boolean>): Promise<T[]> {
    const result: T[] = [];
    for (let index = 0; index < array.length; index++) {
        const item = array[index];
        if (await predicate(item, index)) {
            result.push(item);
        }
    }
    return result;
}
