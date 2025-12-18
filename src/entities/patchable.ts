import { compare } from "fast-json-patch";
import { PrimaryGeneratedColumn } from "typeorm";

const PATCH_TRANSFORMER = Symbol('PATCH_TRANSFORMER');

export function TransformToPathJson(transformer: (val: any) => any) {
    return function (target: any, propertyKey: string) {
        Reflect.defineMetadata(
            PATCH_TRANSFORMER,
            transformer,
            target,
            propertyKey,
        );
    };
}

export function IgnoreInhJsonPath() {
    return TransformToPathJson(() => undefined);
}

export class Patchable {
    @PrimaryGeneratedColumn()
    id: number;

    @IgnoreInhJsonPath()
    snapShot: object = {};

    toJsonPatch() {
        let result: object = {};
        for (const key of Object.keys(this)) {
            const transformer = Reflect.getMetadata(PATCH_TRANSFORMER, this.constructor.prototype, key) as ((val: any) => any) | undefined;
            if (transformer) {
                result[key] = transformer(this[key]);
            } else if (this[key] instanceof Patchable) {
                result[key] = this[key].toJsonPatch();
            } else {
                result[key] = this[key];
            }
        }
        return result;
    }

    shot() {
        this.snapShot = this.toJsonPatch();
        return this.snapShot;
    }

    patch(before: object = this.snapShot) {
        const after = this.toJsonPatch();
        return compare(before, after, true);
    }
}