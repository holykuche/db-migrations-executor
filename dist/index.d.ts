declare module "db-migrations-executor"
{
	export { DatabaseClient, MigrationsExecutor } from "./src/api";
	export { MigrationsExecutorImpl } from "./src/impl";

	import { TableDefinition } from "../dto";
	export default interface DatabaseClient {
	    createTable<T extends object>(tableName: string, definition: TableDefinition<T>): Promise<void>;
	    dropTable(tableName: string): Promise<void>;
	    isTableExists(tableName: string): Promise<boolean>;
	    find<T extends object, K extends keyof T>(tableName: string, key: K, value: T[K]): Promise<T>;
	    findMany<T extends object, K extends keyof T>(tableName: string, key: K, value: T[K]): Promise<T[]>;
	    findAll<T extends object>(tableName: string): Promise<T[]>;
	    save<T extends object>(tableName: string, entity: T): Promise<T>;
	    delete<T extends object, K extends keyof T>(tableName: string, key: K, value: T[K]): Promise<void>;
	}

	export default interface MigrationsExecutor {
	    execute(migrationsTableName: string, migrationsDirname: string): Promise<void>;
	}

	export { default as MigrationsExecutor } from "./MigrationsExecutor";
	export { default as DatabaseClient } from "./DatabaseClient";

	import { ColumnDataType } from "../enum";
	export default interface ColumnDefinition {
	    type: ColumnDataType;
	    required?: boolean;
	    primary_key?: boolean;
	}

	export default interface MigrationHistoryRecord {
	    id?: number;
	    file_name: string;
	    hash: string;
	    success: boolean;
	    failure_reason?: string;
	}

	import ColumnDefinition from "./ColumnDefinition";
	export default interface TableDefinition<T extends object> {
	    columns: Record<keyof T, ColumnDefinition>;
	    index_by?: (keyof T)[];
	}

	export { default as MigrationHistoryRecord } from "./MigrationHistoryRecord";
	export { default as ColumnDefinition } from "./ColumnDefinition";
	export { default as TableDefinition } from "./TableDefinition";

	enum ColumnDataType {
	    Number = "Number",
	    String = "String",
	    Boolean = "Boolean"
	}
	export default ColumnDataType;

	export { default as ColumnDataType } from "./ColumnDataType";

	import { MigrationHistoryRecord } from "../dto";
	export default abstract class ExistingRecordsError extends Error {
	    protected constructor(description: string, records: MigrationHistoryRecord[]);
	    private static formatRecords;
	    private static formatRecord;
	}

	import { MigrationHistoryRecord } from "../dto";
	import ExistingRecordsError from "./ExistingRecordsError";
	export default class IncompatibleMigrationsError extends ExistingRecordsError {
	    constructor(incompatibleRecords: MigrationHistoryRecord[]);
	}

	export default class MigrationExecutionError extends Error {
	    constructor(name: string, reason: string);
	}

	export default class MigrationHistoryTableAlreadyExistsError extends Error {
	    constructor(migrationsTableName: string);
	}

	import { MigrationHistoryRecord } from "../dto";
	import ExistingRecordsError from "./ExistingRecordsError";
	export default class UnknownMigrationsError extends ExistingRecordsError {
	    constructor(unknownRecords: MigrationHistoryRecord[]);
	}

	import { MigrationHistoryRecord } from "../dto";
	import ExistingRecordsError from "./ExistingRecordsError";
	export default class UnsuccessfulMigrationsError extends ExistingRecordsError {
	    constructor(unsuccessfulRecords: MigrationHistoryRecord[]);
	}

	export { default as MigrationHistoryTableAlreadyExistsError } from "./MigrationHistoryTableAlreadyExistsError";
	export { default as UnsuccessfulMigrationsExistError } from "./UnsuccessfulMigrationsError";
	export { default as UnknownMigrationsError } from "./UnknownMigrationsError";
	export { default as IncompatibleMigrationsError } from "./IncompatibleMigrationsError";
	export { default as MigrationExecutionError } from "./MigrationExecutionError";

	import { MigrationsExecutor, DatabaseClient } from "../api";
	export default class MigrationsExecutorImpl implements MigrationsExecutor {
	    private readonly dbClient;
	    constructor(dbClient: DatabaseClient);
	    execute(migrationsTableName: string, migrationsDirname: string): Promise<void>;
	    private initializeMigrationHistoryTable;
	    private prepareRecords;
	    private static prepareFilenames;
	    private static prepareHashes;
	    private static validateSuccess;
	    private static validateExistence;
	    private static validateHashes;
	    private executeMigration;
	    private executeMigrations;
	}

	export { default as MigrationsExecutorImpl } from "./MigrationsExecutorImpl";

}