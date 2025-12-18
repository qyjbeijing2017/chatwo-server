import { DataSource, EntityManager } from "typeorm";

export async function startTransaction<T>(dataSource: DataSource, callback: (manager: EntityManager) => Promise<T>): Promise<T> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
        const result = await callback(queryRunner.manager);
        await queryRunner.commitTransaction();
        await queryRunner.release();
        return result;
    } catch (error) {
        await queryRunner.rollbackTransaction();
        await queryRunner.release();
        throw error;
    }
}