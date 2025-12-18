import { generate, observe, Observer } from "fast-json-patch";
import { defineMetadata, getMetadata } from "src/utils/meta-data";
import { PrimaryGeneratedColumn } from "typeorm";

export function ToPatchJson(transformer: (val: any) => any) {
    return function (target: Patchable, propertyKey: string) {
        defineMetadata(
            'chatwo:toPatchJson',
            transformer,
            target.constructor,
            propertyKey,
        );
    };
}

export function IgnorePatchJson() {
    return ToPatchJson(() => undefined);
}

export class Patchable {
    @PrimaryGeneratedColumn()
    id: number;

    @IgnorePatchJson()
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