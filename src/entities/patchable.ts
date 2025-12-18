import { generate, observe, Observer } from "fast-json-patch";
import { defineMetadata, getMetadata } from "src/utils/meta-data";
import { Entity, PrimaryGeneratedColumn } from "typeorm";

export function toPatchJson(transformer: (val: any) => any) {
    return function (target: Patchable, propertyKey: string) {
        const classConstructor = target.constructor;
        defineMetadata(
            'chatwo:toPatchJson',
            transformer,
            classConstructor,
            propertyKey,
        );
    };
}

export class Patchable {
    @PrimaryGeneratedColumn()
    id: number;

    latestPatchJson: Observer<any> = observe({});

    toPatchJson() {
        let result: object = {};
        for (const key of Object.keys(this)) {
            const transformer = getMetadata('chatwo:toPatchJson', this.constructor, key) as ((val: any) => any) | undefined;
            if (transformer) {
                result[key] = transformer(this[key]);
            } else if (this[key] instanceof Patchable) {
                result[key] = this[key].toPatchJson();
            } else {
                result[key] = this[key];
            }
        }
        return result;
    }

    observer() {
        this.latestPatchJson = observe(this.toPatchJson());
        return this.latestPatchJson;
    }

    patch(observer: Observer<any> = this.latestPatchJson) {
        return generate(observer);
    }
}