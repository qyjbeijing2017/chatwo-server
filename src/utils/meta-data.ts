export const metaData = new Map<any, { [key: string]: any }>();


export function defineMetadata(key: string, value: any, target: any, propertyKey: string = '_classMetaData') {
    const meta = metaData.get(target) || {};
    meta[propertyKey] = meta[propertyKey] || {};
    meta[propertyKey][key] = value;
    metaData.set(target, meta);
}

export function getMetadata(key: string, target: any, propertyKey: string = '_classMetaData'): any {
    const meta = metaData.get(target);
    return meta?.[propertyKey]?.[key];
}

export function hasMetadata(key: string, target: any, propertyKey: string = '_classMetaData'): boolean {
    const meta = metaData.get(target);
    return meta?.[propertyKey]?.hasOwnProperty(key) || false;
}