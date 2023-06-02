export default class MigrationHistoryTableAlreadyExistsError extends Error {

    constructor(migrationsTableName: string) {
        super(`${ migrationsTableName } table already exists`);
        Object.setPrototypeOf(this, MigrationHistoryTableAlreadyExistsError.prototype);
    }


}
