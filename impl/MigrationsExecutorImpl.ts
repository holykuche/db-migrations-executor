import { readdir } from "fs/promises";
import { createHash } from "crypto";
import { readFileSync } from "fs";
import { resolve } from "path";

import { MigrationsExecutor, DatabaseClient } from "../api";
import { TableName, ColumnDataType } from "../enum";
import {
    IncompatibleMigrationsError,
    MigrationExecutionError,
    MigrationHistoryTableAlreadyExistsError,
    UnknownMigrationsError,
    UnsuccessfulMigrationsExistError,
} from "../error";
import { MigrationHistoryRecord, RecordsAndFilenames, RecordsAndFilenamesAndHashes } from "../dto";

export default class MigrationsExecutorImpl implements MigrationsExecutor {

    constructor(private readonly dbClient: DatabaseClient) {}

    execute(migrationsDirname: string): Promise<void> {
        return this.initializeMigrationHistoryTable()
            .then(() => console.log(`${ TableName.MigrationHistory } table successfully initialized`))
            .catch(reason => {
                if (reason instanceof MigrationHistoryTableAlreadyExistsError) {
                    console.log(reason.message);
                } else {
                    throw reason;
                }
            })
            .then(() => this.prepareRecords())
            .then(MigrationsExecutorImpl.validateSuccess)
            .then(records => MigrationsExecutorImpl.prepareFilenames(migrationsDirname, records))
            .then(MigrationsExecutorImpl.validateExistence)
            .then(recordsAndFilenames => MigrationsExecutorImpl.prepareHashes(migrationsDirname, recordsAndFilenames))
            .then(MigrationsExecutorImpl.validateHashes)
            .then(recordsAndFilenamesAndHashes => this.executeMigrations(migrationsDirname, recordsAndFilenamesAndHashes));
    }

    private async initializeMigrationHistoryTable() {
        return this.dbClient.isTableExists(TableName.MigrationHistory)
            .then(isExists => {
                if (isExists) {
                    throw new MigrationHistoryTableAlreadyExistsError();
                }

                return this.dbClient.createTable(TableName.MigrationHistory, {
                    columns: {
                        id: { type: ColumnDataType.Number, primary_key: true },
                        file_name: { type: ColumnDataType.String, required: true },
                        hash: { type: ColumnDataType.String, required: true },
                        success: { type: ColumnDataType.Boolean, required: true },
                        failure_reason: { type: ColumnDataType.String },
                    },
                    index_by: [ "file_name", "hash" ],
                });
            });
    }

    private async prepareRecords() {
        return this.dbClient.findAll<MigrationHistoryRecord>(TableName.MigrationHistory);
    }

    private static async prepareFilenames(migrationsDirname: string, records: MigrationHistoryRecord[]) {
        return readdir(migrationsDirname).then(filenames => ({ records, filenames }));
    }

    private static prepareHashes(dirname: string, recordsAndFilenames: RecordsAndFilenames) {
        return {
            ...recordsAndFilenames,
            hashes: recordsAndFilenames.filenames
                .reduce((hashes, filename) => ({
                    ...hashes,
                    [ filename ]: createHash("md5")
                        .update(readFileSync(resolve(dirname, filename)))
                        .digest("hex"),
                }), {} as Record<string, string>),
        };
    }

    private static validateSuccess(records: MigrationHistoryRecord[]) {
        const unsuccessfulRecords = records.filter(r => !r.success);
        if (unsuccessfulRecords.length) {
            throw new UnsuccessfulMigrationsExistError(unsuccessfulRecords);
        }

        return records;
    }

    private static validateExistence(recordsAndFilenames: RecordsAndFilenames) {
        const { records, filenames } = recordsAndFilenames;

        const unknownRecords = records.filter(r => !filenames.find(fn => r.file_name === fn));
        if (unknownRecords.length) {
            throw new UnknownMigrationsError(unknownRecords);
        }

        return recordsAndFilenames;
    }

    private static validateHashes(recordsAndFilenamesAndHashes: RecordsAndFilenamesAndHashes) {
        const { records, hashes } = recordsAndFilenamesAndHashes;

        const incompatibleRecords = records.filter(r => r.hash !== hashes[ r.file_name ]);
        if (incompatibleRecords.length) {
            throw new IncompatibleMigrationsError(incompatibleRecords);
        }

        return recordsAndFilenamesAndHashes;
    }

    private executeMigration(relativeFilename: string) {
        return import(/* webpackIgnore: true */ relativeFilename)
            .then(({ default: run }) => run(this.dbClient));
    }

    private async executeMigrations(dirname: string, recordsAndFilenamesAndHashes: RecordsAndFilenamesAndHashes) {
        const { records, filenames, hashes } = recordsAndFilenamesAndHashes;

        const sortedFilenames = filenames.sort((left, right) => left.localeCompare(right));

        for (const filename of sortedFilenames) {
            if (records.find(r => r.file_name === filename)) {
                console.log(`Migration ${ filename } was already applied`);
                return;
            }

            let failureReason = "";

            try {
                // todo: maybe there is a better solution for filepath resolving
                await this.executeMigration("file:\\\\" + resolve(dirname, filename));
                console.log(`New migration ${ filename } is successfully applied`);
            } catch (error) {
                if (error instanceof Error) {
                    failureReason = error.message;
                } else if (typeof error === "string") {
                    failureReason = error;
                } else {
                    failureReason = "Unknown reason";
                }
            }

            await this.dbClient.save<MigrationHistoryRecord>(TableName.MigrationHistory, {
                file_name: filename,
                hash: hashes[ filename ],
                success: !failureReason,
                failure_reason: failureReason,
            });

            if (failureReason) throw new MigrationExecutionError(filename, failureReason);
        }
    };

}