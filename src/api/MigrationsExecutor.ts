export default interface MigrationsExecutor {

    execute(migrationsTableName: string, migrationsDirname: string): Promise<void>;

}