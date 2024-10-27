import { readdir } from "fs/promises";
import { createHash } from "crypto";
import { readFileSync } from "fs";
import { resolve } from "path";

import { MigrationsExecutor, DatabaseClient } from "../api";
import { ColumnDataType } from "../enum";
import {
    IncompatibleMigrationsError,
    MigrationExecutionError,
    MigrationHistoryTableAlreadyExistsError,
    UnknownMigrationsError,
    UnsuccessfulMigrationsExistError,
} from "../error";
import { MigrationHistoryRecord } from "../dto";

export default class MigrationsExecutorImpl implements MigrationsExecutor {

    constructor(private readonly dbClient: DatabaseClient) {}

    async execute(migrationsTableName: string, migrationsDirname: string): Promise<void> {
        try {
            await this.initializeMigrationHistoryTable(migrationsTableName);
            console.log(`${ migrationsTableName } table has been successfully initialized`);
        } catch (error) {
            if (error instanceof MigrationHistoryTableAlreadyExistsError) {
                console.log(error.message);
            } else {
                throw error;
            }
        }

        const records = await this.prepareRecords(migrationsTableName);
        await MigrationsExecutorImpl.validateSuccess(records);

        const fileNames = await MigrationsExecutorImpl.prepareFilenames(migrationsDirname);
        await MigrationsExecutorImpl.validateExistence(records, fileNames);

        const hashes = await MigrationsExecutorImpl.prepareHashes(migrationsDirname, fileNames);
        await MigrationsExecutorImpl.validateHashes(records, hashes);

        await this.executeMigrations(migrationsTableName, migrationsDirname, records, fileNames, hashes);
    }

    private async initializeMigrationHistoryTable(migrationsTableName: string) {
        if (await this.dbClient.isTableExists(migrationsTableName)) {
            throw new MigrationHistoryTableAlreadyExistsError(migrationsTableName);
        }

        await this.dbClient.createTable(migrationsTableName, {
            columns: {
                id: { type: ColumnDataType.Number, primary_key: true },
                file_name: { type: ColumnDataType.String, required: true },
                hash: { type: ColumnDataType.String, required: true },
                success: { type: ColumnDataType.Boolean, required: true },
                failure_reason: { type: ColumnDataType.String },
            },
            index_by: [ "file_name", "hash" ],
        });
    }

    private prepareRecords(migrationsTableName: string) {
        return this.dbClient.findAll<MigrationHistoryRecord>(migrationsTableName);
    }

    private static prepareFilenames(migrationsDirname: string) {
        return readdir(migrationsDirname);
    }

    private static prepareHashes(dirname: string, filenames: string[]) {
        return filenames
            .reduce((hashes, filename) => ({
                ...hashes,
                [ filename ]: createHash("md5")
                    .update(readFileSync(resolve(dirname, filename)))
                    .digest("hex"),
            }), {} as Record<string, string>)
    }

    private static validateSuccess(records: MigrationHistoryRecord[]) {
        const unsuccessfulRecords = records.filter(r => !r.success);
        if (unsuccessfulRecords.length) {
            throw new UnsuccessfulMigrationsExistError(unsuccessfulRecords);
        }
    }

    private static validateExistence(records: MigrationHistoryRecord[], filenames: string[]) {
        const unknownRecords = records.filter(r => !filenames.find(fn => r.file_name === fn));
        if (unknownRecords.length) {
            throw new UnknownMigrationsError(unknownRecords);
        }
    }

    private static validateHashes(records: MigrationHistoryRecord[], hashes: Record<string, string>) {
        const incompatibleRecords = records.filter(r => r.hash !== hashes[ r.file_name ]);
        if (incompatibleRecords.length) {
            throw new IncompatibleMigrationsError(incompatibleRecords);
        }
    }

    private executeMigration(relativeFilename: string) {
        return import(/* webpackIgnore: true */ relativeFilename)
            .then(({ default: run }) => run(this.dbClient));
    }

    private async executeMigrations(migrationsTableName: string,
                                    dirname: string,
                                    records: MigrationHistoryRecord[],
                                    filenames: string[],
                                    hashes: Record<string, string>) {
        const sortedFilenames = filenames.sort((left, right) => left.localeCompare(right));

        for (const filename of sortedFilenames) {
            if (records.find(r => r.file_name === filename)) {
                console.log(`Migration ${ filename } has been already applied`);
                return;
            }

            let failureReason = "";

            try {
                await this.executeMigration(resolve(dirname, filename));
                console.log(`New migration ${ filename } has been successfully applied`);
            } catch (error) {
                if (error instanceof Error) {
                    failureReason = error.message;
                } else if (typeof error === "string") {
                    failureReason = error;
                } else {
                    failureReason = "Unknown reason";
                }
            }

            await this.dbClient.save<MigrationHistoryRecord>(migrationsTableName, {
                file_name: filename,
                hash: hashes[ filename ],
                success: !failureReason,
                failure_reason: failureReason,
            });

            if (failureReason) throw new MigrationExecutionError(filename, failureReason);
        }
    };

}